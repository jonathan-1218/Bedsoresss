require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const execFileAsync = promisify(execFile);

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
  positionSource: "init",
  movementCount: 0,
  vibrationActive: false,
  motorsEnabled: false,
  immobileForSec: 0,
};

let logs = [{ time: "Start", event: "System initialized" }];

const NOISE_FLOOR = 30;
const MOVEMENT_DELTA_THRESHOLD = 55;
const POSITION_MIN_ACTIVE = 35;
const RAW_ZERO_THRESHOLD = 8;
const NO_PRESSURE_TOTAL_THRESHOLD = 50;
const IMMOBILE_ALERT_SEC = 120;
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MODEL_PATH = process.env.POSITION_MODEL_PATH || path.join(PROJECT_ROOT, "position_model.pkl");
const PREDICT_SCRIPT_PATH =
  process.env.POSITION_PREDICT_SCRIPT || path.join(PROJECT_ROOT, "predict_position.py");
const PYTHON_BIN = process.env.PYTHON_BIN || path.join(PROJECT_ROOT, ".venv", "bin", "python");
const ML_PREDICTION_TIMEOUT_MS = 3000;
const ML_MIN_INTERVAL_MS = 500;

let baselineSensors = null;
let previousAdjustedSensors = [0, 0, 0, 0, 0, 0];
let lastMovementAt = Date.now();
let mlFallbackLogged = false;
let lastMlResult = null;
let lastMlRunAt = 0;
let mlInFlight = null;

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
    // Adapt baseline slowly only when the reading is near the current baseline,
    // regardless of whether pressure pulls the value up or down.
    if (Math.abs(rawSensors[i] - baselineSensors[i]) <= 120) {
      baselineSensors[i] = baselineSensors[i] * 0.98 + rawSensors[i] * 0.02;
    }
  }
}

function adjustSensors(rawSensors) {
  return rawSensors.map((raw, i) => {
    const base = baselineSensors ? baselineSensors[i] : 0;
    const adjustedRaw = Math.max(0, Math.abs(raw - base) - NOISE_FLOOR);
    // Map 12-bit ADC (0-4095) into dashboard-friendly 0-1023 scale.
    return Math.min(1023, Math.round(adjustedRaw / 4));
  });
}

function isRawNoPressure(rawSensors) {
  return rawSensors.every((value) => value <= RAW_ZERO_THRESHOLD);
}

function mapMlPositionLabel(label) {
  const normalized = String(label || "").toLowerCase();
  if (normalized === "left") return "Left Side (Shoulder/Ankle)";
  if (normalized === "right") return "Right Side (Shoulder/Ankle)";
  if (normalized === "center") return "Centered (Head/Hip Alignment)";
  if (normalized === "no pressure") return "No pressure";
  return label;
}

function detectPositionRuleBased(sensors) {
  const [head, leftShoulder, rightShoulder, hipBack, leftAnkle, rightAnkle] = sensors;
  const total = sensors.reduce((sum, value) => sum + value, 0);
  const leftChain = leftShoulder + leftAnkle;
  const rightChain = rightShoulder + rightAnkle;
  const lateralDelta = Math.abs(leftChain - rightChain);

  if (total < NO_PRESSURE_TOTAL_THRESHOLD) {
    return "No pressure";
  }

  if (lateralDelta >= 90) {
    return leftChain > rightChain
      ? "Left Side (Shoulder/Ankle)"
      : "Right Side (Shoulder/Ankle)";
  }

  const dominant = Math.max(head, leftShoulder, rightShoulder, hipBack, leftAnkle, rightAnkle);
  if (dominant <= POSITION_MIN_ACTIVE) {
    return "Centered (Low Pressure)";
  }

  if (dominant === head) return "Head Pressure";
  if (dominant === hipBack) return "Hip/Back Pressure";
  if (dominant === leftShoulder || dominant === rightShoulder) return "Shoulder Pressure";
  return "Ankle Pressure";
}

function logMlFallback(reason) {
  if (mlFallbackLogged) return;
  mlFallbackLogged = true;
  console.warn(`ML position fallback enabled: ${reason}`);
}

async function predictPositionWithModel(sensors) {
  if (!fs.existsSync(PYTHON_BIN)) {
    logMlFallback(`Python executable missing at ${PYTHON_BIN}`);
    return null;
  }

  if (!fs.existsSync(PREDICT_SCRIPT_PATH)) {
    logMlFallback(`Predict script missing at ${PREDICT_SCRIPT_PATH}`);
    return null;
  }

  if (!fs.existsSync(MODEL_PATH)) {
    logMlFallback(`Model file missing at ${MODEL_PATH}`);
    return null;
  }

  const now = Date.now();
  const canReuseRecent = lastMlResult && now - lastMlRunAt < ML_MIN_INTERVAL_MS;
  if (canReuseRecent) {
    return lastMlResult;
  }

  if (mlInFlight) {
    return lastMlResult;
  }

  const sensorArg = `S:${sensors.join(",")}`;
  lastMlRunAt = now;
  mlInFlight = execFileAsync(
    PYTHON_BIN,
    [PREDICT_SCRIPT_PATH, "--model", MODEL_PATH, "--sensors", sensorArg, "--format", "json"],
    {
      cwd: PROJECT_ROOT,
      timeout: ML_PREDICTION_TIMEOUT_MS,
    },
  )
    .then(({ stdout }) => {
      const parsed = JSON.parse(stdout.trim());
      const position = parsed.prediction ? String(parsed.prediction) : null;
      const topConfidence = Number.isFinite(parsed.topConfidence)
        ? Number(parsed.topConfidence)
        : null;

      if (!position) return null;

      const result = {
        position,
        topConfidence,
      };
      lastMlResult = result;
      return result;
    })
    .catch((error) => {
      logMlFallback(error.message || "Prediction process failed");
      return null;
    })
    .finally(() => {
      mlInFlight = null;
    });

  if (lastMlResult) {
    return lastMlResult;
  }

  return mlInFlight;
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

async function applyIncomingSensorData(body = {}) {
  const normalizedSensors = normalizeSensorPayload(body);

  if (normalizedSensors) {
    const rawNoPressure = isRawNoPressure(normalizedSensors);
    updateBaseline(normalizedSensors);
    let adjustedSensors = adjustSensors(normalizedSensors);
    if (rawNoPressure) {
      adjustedSensors = [0, 0, 0, 0, 0, 0];
    }

    const adjustedTotal = adjustedSensors.reduce((sum, value) => sum + value, 0);
    const shouldRunMl = !rawNoPressure && adjustedTotal >= NO_PRESSURE_TOTAL_THRESHOLD;
    const mlResult = shouldRunMl ? await predictPositionWithModel(normalizedSensors) : null;
    let positionSource = "rule";
    let inferredPosition = detectPositionRuleBased(adjustedSensors);
    let mlConfidence = null;

    if (mlResult && mlResult.position && inferredPosition !== "No pressure") {
      inferredPosition = mapMlPositionLabel(mlResult.position);
      positionSource = "ml";
      mlConfidence = mlResult.topConfidence;
    }

    if (body.position) {
      inferredPosition = body.position;
      positionSource = "device";
    }

    latestData = {
      ...latestData,
      ...body,
      sensors: adjustedSensors,
      rawSensors: normalizedSensors,
      position: inferredPosition,
      positionSource,
      mlConfidence,
      lastSensorAt: new Date().toISOString(),
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

// Reset only rendered heatmap sensors, keep body-position context/history intact.
app.post("/api/heatmap/reset", (req, res) => {
  latestData = {
    ...latestData,
    sensors: [0, 0, 0, 0, 0, 0],
  };

  logs.unshift({
    time: new Date().toLocaleTimeString(),
    event: "Heatmap reset",
  });

  if (logs.length > 20) logs.pop();

  res.json({ message: "Heatmap reset" });
});

// RECEIVE DATA
app.post("/api/esp32-data", async (req, res) => {
  try {
    await applyIncomingSensorData(req.body);

    console.log("📡 ESP32:", latestData);

    logs.unshift({
      time: new Date().toLocaleTimeString(),
      event: "Sensor update",
    });

    if (logs.length > 20) logs.pop();

    res.json({ message: "Data received" });
  } catch (err) {
    console.error("ESP32 ingest failed:", err);
    res.status(500).json({ message: "Failed to process sensor data" });
  }
});

// ESP32 COMPATIBILITY ROUTES
// Allows firmware/frontend using /sensors to work without changing existing /api routes.
app.post("/sensors", async (req, res) => {
  try {
    await applyIncomingSensorData(req.body);

    logs.unshift({
      time: new Date().toLocaleTimeString(),
      event: "Sensor update",
    });

    if (logs.length > 20) logs.pop();

    res.json({ status: "ok" });
  } catch (err) {
    console.error("/sensors ingest failed:", err);
    res.status(500).json({ status: "error" });
  }
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

// Reduce noisy stack traces when clients disconnect mid-body upload.
app.use((err, req, res, next) => {
  const isAborted =
    err?.type === "request.aborted" ||
    /request aborted/i.test(String(err?.message || ""));

  if (isAborted) {
    return res.status(400).json({ message: "Request aborted" });
  }

  return next(err);
});

// START
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});