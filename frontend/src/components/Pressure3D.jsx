import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ── PHYSICAL SENSOR POSITIONS (matches hand-drawn sketch) ──
// Row 1: S1 center top
// Row 2: S2 left, S3 right
// Row 3: S4 center
// Row 4: S5 left, S6 right
const SENSOR_LAYOUT = [
  { id: 0, label: "S1", name: "Top Center",  x:  0.0, y:  6.0 },
  { id: 1, label: "S2", name: "Upper Left",  x: -2.8, y:  3.4 },
  { id: 2, label: "S3", name: "Upper Right", x:  2.8, y:  3.4 },
  { id: 3, label: "S4", name: "Mid Center",  x:  0.0, y:  0.6 },
  { id: 4, label: "S5", name: "Lower Left",  x: -2.8, y: -2.6 },
  { id: 5, label: "S6", name: "Lower Right", x:  2.8, y: -2.6 },
];

function pressureColor(t) {
  const stops = [
    [0.00, [0.30, 0.08, 0.45]],
    [0.18, [0.12, 0.18, 0.65]],
    [0.38, [0.00, 0.62, 0.90]],
    [0.58, [0.95, 0.78, 0.10]],
    [0.78, [1.00, 0.42, 0.10]],
    [1.00, [1.00, 0.10, 0.10]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const lo = stops[i - 1], hi = stops[i];
      const f = (t - lo[0]) / (hi[0] - lo[0]);
      return lo[1].map((v, k) => v + (hi[1][k] - v) * f);
    }
  }
  return stops[stops.length - 1][1];
}

function PressureSurface({ sensors }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(9, 16, 90, 150);
    const pos = g.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);

      // Body mask shaped around the real 4-row sensor placement
      const inTopCenter = Math.abs(py - 6.0) < 1.2 && Math.abs(px) < 1.8;
      const inUpperPair = Math.abs(py - 3.4) < 1.4 && Math.abs(px) < 3.9;
      const inMidCenter = Math.abs(py - 0.6) < 1.3 && Math.abs(px) < 2.0;
      const inLowerPair = Math.abs(py + 2.6) < 1.4 && Math.abs(px) < 3.9;
      const onBody = inTopCenter || inUpperPair || inMidCenter || inLowerPair;

      let z = 0, totalP = 0;

      SENSOR_LAYOUT.forEach(({ x: sx, y: sy }, idx) => {
        const d2 = (px - sx) ** 2 + (py - sy) ** 2;
        const inf = Math.exp(-d2 / 2.4);
        const pressure = (sensors[idx] || 0) / 1023;
        z += inf * pressure * 1.9;
        totalP += inf * pressure;
      });

      // Subtle contour so rows feel connected without changing sensor coordinates
      z += Math.exp(-((py - 6.0) ** 2) / 7.5) * 0.12;
      z += Math.exp(-((py - 3.4) ** 2) / 8.5) * 0.10;
      z += Math.exp(-((py - 0.6) ** 2) / 8.0) * 0.12;
      z += Math.exp(-((py + 2.6) ** 2) / 8.5) * 0.10;
      z -= 0.016 * Math.pow(Math.abs(px), 1.5);

      if (!onBody) z *= 0.05;
      pos.setZ(i, z);

      const t = Math.min(totalP, 1);
      const [r, gv, b] = pressureColor(onBody ? t : 0);
      colors.push(r, gv, b);
    }

    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [sensors]);

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <meshStandardMaterial vertexColors metalness={0.1} roughness={0.55} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SensorPin({ sensor, value }) {
  const ref = useRef();
  const pressure = (value || 0) / 1023;
  const [r, g, b] = pressureColor(pressure);
  const col = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.28 + Math.sin(state.clock.elapsedTime * 2 + sensor.id * 1.1) * 0.045;
    }
  });

  return (
    <group position={[sensor.x, 0, -sensor.y]}>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.28, 0.48, 32]} />
        <meshBasicMaterial color={new THREE.Color(r, g, b)} transparent opacity={0.22 + pressure * 0.38} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.26, 8]} />
        <meshBasicMaterial color={new THREE.Color(r, g, b)} transparent opacity={0.55} />
      </mesh>
      {/* Label */}
      <group ref={ref}>
        <Html center distanceFactor={10}>
          <div style={{
            background: "rgba(4,10,24,0.90)",
            border: `1px solid ${col}99`,
            borderRadius: "8px",
            padding: "3px 9px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            boxShadow: `0 0 12px ${col}55`,
            pointerEvents: "none",
          }}>
            <span style={{ color: col, fontSize: "10px", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.06em" }}>
              {sensor.label}
            </span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", fontFamily: "monospace" }}>
              {Math.round(pressure * 100)}%
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
}

function MattressBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <boxGeometry args={[9.8, 16.8, 0.16]} />
      <meshStandardMaterial color="#06090f" metalness={0.05} roughness={0.95} />
    </mesh>
  );
}

function GridFloor() {
  const points = [];
  for (let i = -9; i <= 9; i++) {
    points.push(new THREE.Vector3(-9, -0.18, i), new THREE.Vector3(9, -0.18, i));
    points.push(new THREE.Vector3(i, -0.18, -9), new THREE.Vector3(i, -0.18, 9));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#091830" transparent opacity={0.6} />
    </lineSegments>
  );
}

export default function Pressure3D({ sensors = [0, 0, 0, 0, 0, 0] }) {
  return (
    <div style={{
      background: "rgba(2,6,23,0.75)",
      borderRadius: "20px",
      border: "1px solid rgba(6,182,212,0.14)",
      boxShadow: "0 0 60px rgba(6,182,212,0.05), 0 0 0 1px rgba(255,255,255,0.03)",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "20px", margin: 0, letterSpacing: "-0.02em" }}>
            3D Mattress Pressure Mapping
          </h2>
          <p style={{ color: "#334155", fontSize: "11px", margin: "5px 0 0", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            6-SENSOR LAYOUT · ROWS: S1 TOP → S2/S3 UPPER → S4 CENTER → S5/S6 LOWER
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "3px" }}>
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e88",
            display: "inline-block",
          }} />
          <span style={{ color: "#06b6d4", fontSize: "13px", fontFamily: "monospace" }}>Live Surface Scan</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{
        height: "480px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(14,74,106,0.45)",
        background: "#020817",
      }}>
        <Canvas camera={{ position: [0, 10, 14], fov: 36 }} shadows>
          <color attach="background" args={["#020817"]} />
          <fog attach="fog" args={["#020817", 20, 42]} />

          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 10, 6]} intensity={1.2} castShadow />
          <pointLight position={[0, 5, 0]}  intensity={1.5} color="#06b6d4" />
          <pointLight position={[0, 4, -8]} intensity={0.7} color="#7c3aed" />
          <pointLight position={[-5, 3, 4]} intensity={0.4} color="#0ea5e9" />

          <GridFloor />
          <MattressBase />
          <PressureSurface sensors={sensors} />

          {SENSOR_LAYOUT.map((s, i) => (
            <SensorPin key={s.id} sensor={s} value={sensors[i] || 0} />
          ))}

          <OrbitControls
            enablePan={false}
            minDistance={9}
            maxDistance={22}
            maxPolarAngle={Math.PI / 2.1}
            minPolarAngle={Math.PI / 4.5}
            autoRotate
            autoRotateSpeed={0.4}
          />
        </Canvas>
      </div>

      {/* Gradient colour bar */}
      <div style={{ marginTop: "16px" }}>
        <div style={{
          height: "10px",
          borderRadius: "99px",
          background: "linear-gradient(to right, #4c1d77, #1e3aaa, #06b6d4, #eab308, #f97316, #ef4444)",
          boxShadow: "0 0 16px rgba(6,182,212,0.18)",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
          {["Low Pressure", "Moderate", "High Pressure"].map((l) => (
            <span key={l} style={{ color: "#475569", fontSize: "11px" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Per-sensor legend */}
      <div style={{
        marginTop: "14px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "6px",
      }}>
        {SENSOR_LAYOUT.map((s, i) => {
          const pct = Math.round(((sensors[i] || 0) / 1023) * 100);
          const [r, g, b] = pressureColor(pct / 100);
          const col = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
          return (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "10px",
              padding: "6px 10px",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: col,
                boxShadow: `0 0 6px ${col}`,
                flexShrink: 0,
              }} />
              <div>
                <div style={{ color: col, fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{s.label}</div>
                <div style={{ color: "#475569", fontSize: "10px" }}>{s.name} · {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
