require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const app = express();
const PORT = process.env.PORT || 5000;

const prisma = new PrismaClient();

// ================= TWILIO =================
const client =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= LIVE DATA =================
let latestData = {
  sensors: [0, 0, 0, 0, 0, 0],
  position: "Waiting for ESP32...",
  movementCount: 0,
  vibrationActive: false,
  motorsEnabled: false,
  immobileForSec: 0,
};

let logs = [{ time: "Start", event: "System initialized" }];

const NOISE_FLOOR = 30;
const MOVEMENT_DELTA_THRESHOLD = 55;
const POSITION_MIN_ACTIVE = 35;
const IMMOBILE_ALERT_SEC = 120;

let baselineSensors = null;
let previousAdjustedSensors = [0, 0, 0, 0, 0, 0];
let lastMovementAt = Date.now();

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSensorPayload(body = {}) {
  const hasArray = Array.isArray(body.sensors) && body.sensors.length >= 6;
  const hasUpper = ["S1", "S2", "S3", "S4", "S5", "S6"].every((k) => body[k] !== undefined);
  const hasLower = ["s1", "s2", "s3", "s4", "s5", "s6"].every((k) => body[k] !== undefined);

  if (hasArray) {
    return body.sensors.slice(0, 6).map((v) => toNumber(v));
  }

  if (hasUpper) {
    return [body.S1, body.S2, body.S3, body.S4, body.S5, body.S6].map((v) => toNumber(v));
  }

  if (hasLower) {
    return [body.s1, body.s2, body.s3, body.s4, body.s5, body.s6].map((v) => toNumber(v));
  }

  return null;
}

function updateBaseline(rawSensors) {
  if (!baselineSensors) {
    baselineSensors = rawSensors.slice();
    return;
  }

  for (let i = 0; i < 6; i++) {
    // Adapt baseline slowly only when value is near current baseline.
    if (rawSensors[i] <= baselineSensors[i] + 120) {
      baselineSensors[i] = baselineSensors[i] * 0.98 + rawSensors[i] * 0.02;
    }
  }
}

function adjustSensors(rawSensors) {
  return rawSensors.map((raw, i) => {
    const base = baselineSensors ? baselineSensors[i] : 0;
    const adjustedRaw = Math.max(0, raw - base - NOISE_FLOOR);
    // Map 12-bit ADC (0-4095) into dashboard-friendly 0-1023 scale.
    return Math.min(1023, Math.round(adjustedRaw / 4));
  });
}

function detectPosition(sensors) {
  const left = sensors[1] + sensors[4];
  const center = sensors[0] + sensors[3];
  const right = sensors[2] + sensors[5];
  const maxSide = Math.max(left, center, right);

  if (maxSide < POSITION_MIN_ACTIVE) {
    return "No pressure";
  }

  if (left >= center && left >= right) return "Left";
  if (right >= center && right >= left) return "Right";
  return "Center";
}

function updateDerivedMetrics(adjustedSensors, nextPosition) {
  const now = Date.now();
  const delta = adjustedSensors.reduce(
    (sum, value, i) => sum + Math.abs(value - previousAdjustedSensors[i]),
    0,
  );
  const positionChanged =
    nextPosition !== latestData.position &&
    nextPosition !== "No pressure" &&
    latestData.position !== "Waiting for ESP32...";

  if (delta >= MOVEMENT_DELTA_THRESHOLD || positionChanged) {
    latestData.movementCount += 1;
    lastMovementAt = now;
  }

  latestData.immobileForSec = Math.max(0, Math.floor((now - lastMovementAt) / 1000));
  latestData.vibrationActive = latestData.motorsEnabled && latestData.immobileForSec >= IMMOBILE_ALERT_SEC;
  previousAdjustedSensors = adjustedSensors.slice();
}

function applyIncomingSensorData(body = {}) {
  const normalizedSensors = normalizeSensorPayload(body);

  if (normalizedSensors) {
    updateBaseline(normalizedSensors);
    const adjustedSensors = adjustSensors(normalizedSensors);
    const inferredPosition = body.position || detectPosition(adjustedSensors);

    latestData = {
      ...latestData,
      ...body,
      sensors: adjustedSensors,
      rawSensors: normalizedSensors,
      position: inferredPosition,
    };

    updateDerivedMetrics(adjustedSensors, inferredPosition);
    return;
  }

  latestData = {
    ...latestData,
    ...body,
    sensors: latestData.sensors,
  };
}

// ================= AUTH =================

// REGISTER
app.post("/api/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phone, password: hashedPassword, role },
    });

    if (client && process.env.NEW_USER_NOTIFY_TO) {
      try {
        await client.messages.create({
          body: `
🚨 New User Registered

👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
🛡 Role: ${role}
`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.NEW_USER_NOTIFY_TO,
        });
      } catch (e) {
        console.log("Twilio failed:", e.message);
      }
    }

    res.json({ message: "User registered", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔐 CHECK HASHED PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ADMIN OVERRIDE
    if (user.role !== "admin" && user.role !== role) {
      return res.status(403).json({
        message: `This account is ${user.role}, not ${role}`,
      });
    }

    res.json({ message: "Login success", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET USERS
app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  res.json(users);
});

// DELETE USER
app.delete("/api/users/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= OTP SYSTEM =================
let otpStore = {};

// SEND OTP
app.post("/api/send-otp", (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  console.log(`🔐 OTP for ${email}: ${otp}`);

  res.json({ message: "OTP sent (check console for now)" });
});

// RESET PASSWORD
app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (otpStore[email] != otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  delete otpStore[email];

  res.json({ message: "Password updated" });
});

// ================= ESP32 =================

// GET DATA
app.get("/api/data", (req, res) => {
  res.json(latestData);
});

// RECEIVE DATA
app.post("/api/esp32-data", (req, res) => {
  applyIncomingSensorData(req.body);

  console.log("📡 ESP32:", latestData);

  logs.unshift({
    time: new Date().toLocaleTimeString(),
    event: "Sensor update",
  });

  if (logs.length > 20) logs.pop();

  res.json({ message: "Data received" });
});

// ESP32 COMPATIBILITY ROUTES
// Allows firmware/frontend using /sensors to work without changing existing /api routes.
app.post("/sensors", (req, res) => {
  applyIncomingSensorData(req.body);

  logs.unshift({
    time: new Date().toLocaleTimeString(),
    event: "Sensor update",
  });

  if (logs.length > 20) logs.pop();

  res.json({ status: "ok" });
});

app.get("/sensors", (req, res) => {
  res.json(latestData);
});

// MOTOR CONTROL
app.post("/api/motors", (req, res) => {
  const { motorsEnabled } = req.body;

  latestData.motorsEnabled = motorsEnabled;

  logs.unshift({
    time: new Date().toLocaleTimeString(),
    event: motorsEnabled ? "Motors ON" : "Motors OFF",
  });

  res.json({ message: "Motor updated" });
});

// LOGS
app.get("/api/logs", (req, res) => {
  res.json(logs);
});

// ROOT
app.get("/", (req, res) => {
  res.send("✅ Backend running");
});

// START
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});