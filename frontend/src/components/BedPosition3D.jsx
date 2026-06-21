import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Model } from "./Model";

// ─── constants ───────────────────────────────────────────────────────────────
const MODEL_ROTATION = [-Math.PI / 2, 0, Math.PI];
const MODEL_POSITION  = [0, 0.04, 0.6];
const MODEL_SCALE     = 1.05;
const MAX_VAL         = 1023;

// ─── helpers ─────────────────────────────────────────────────────────────────
function pColor(v) {
  const t = Math.min(Math.max(Number(v) / MAX_VAL, 0), 1);
  if (t < 0.04) return "#1e3a3a";
  if (t < 0.25) return "#1d4ed8";
  if (t < 0.55) return "#d97706";
  return "#dc2626";
}

function postureMeta(sensors) {
  const [s1, s2, s3, s4, s5, s6] = sensors.map((v) => Number(v) || 0);
  const total = s1 + s2 + s3 + s4 + s5 + s6;
  if (total < 60) return { label: "No pressure detected", color: "#94a3b8" };
  const leftLoad  = s2 + s5;
  const rightLoad = s3 + s6;
  const sideDiff  = Math.abs(leftLoad - rightLoad) / (leftLoad + rightLoad + 1);
  if (sideDiff > 0.45)
    return leftLoad > rightLoad
      ? { label: "Left side lying",  color: "#22d3ee" }
      : { label: "Right side lying", color: "#fb7185" };
  if (s4 > 400) return { label: "Supine – hip pressure",  color: "#f59e0b" };
  return { label: "Supine (centered)", color: "#34d399" };
}

// ─── bed frame ───────────────────────────────────────────────────────────────
function BedFrame() {
  return (
    <group>
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[5.2, 0.24, 9.3]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.31, 0]}>
        <boxGeometry args={[4.5, 0.52, 8.45]} />
        <meshStandardMaterial color="#ddd6cb" roughness={0.98} />
      </mesh>
      {/* pillow */}
      <mesh position={[0, -0.02, -3.45]}>
        <boxGeometry args={[2.6, 0.3, 1.4]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.95} />
      </mesh>
      {/* headboard */}
      <mesh position={[0, 0.78, -4.35]}>
        <boxGeometry args={[4.8, 1.8, 0.22]} />
        <meshStandardMaterial color="#7a4f2e" roughness={0.7} />
      </mesh>
      {/* foot rail */}
      <mesh position={[0, 0.1, 4.35]}>
        <boxGeometry args={[4.8, 0.5, 0.18]} />
        <meshStandardMaterial color="#7a4f2e" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── a single pressure indicator ring ────────────────────────────────────────
function PressureRing({ position, value }) {
  const t = Math.min(Math.max(Number(value) / MAX_VAL, 0), 1);
  if (t < 0.04) return null;
  const color = pColor(value);
  const opacity = 0.15 + t * 0.45;
  const outerR  = 0.18 + t * 0.12;
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[outerR * 0.55, outerR, 32]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// ─── GLB patient with sensor-driven roll ─────────────────────────────────────
function Patient({ sensors }) {
  const [s1, s2, s3, s4, s5, s6] = sensors.map((v) => Number(v) || 0);
  const rootRef = useRef();

  // roll: left sensors (s2+s5) vs right sensors (s3+s6)
  const leftLoad  = s2 + s5;
  const rightLoad = s3 + s6;
  const totalSide = leftLoad + rightLoad;
  const targetRoll = totalSide > 40
    ? -((leftLoad - rightLoad) / totalSide) * (Math.PI / 2.1)
    : 0;

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const smooth = Math.min(1, delta * 4);
    rootRef.current.rotation.z += (targetRoll - rootRef.current.rotation.z) * smooth;
    rootRef.current.rotation.y += (Math.PI - rootRef.current.rotation.y) * smooth;
    rootRef.current.position.y = 0.14 + Math.sin(state.clock.elapsedTime * 1.3) * 0.008;
  });

  // Sensor indicator positions (tuned to GLB body parts in scene space)
  // These sit just above the mattress surface at each body zone
  const indicators = [
    { pos: [0,    0.42, -3.0],  v: s1 }, // S1 head
    { pos: [0.45, 0.35, -2.2],  v: s2 }, // S2 L shoulder
    { pos: [-0.45,0.35, -2.2],  v: s3 }, // S3 R shoulder
    { pos: [0,    0.3,  -1.05], v: s4 }, // S4 hip
    { pos: [0.22, 0.22,  0.55], v: s5 }, // S5 L ankle
    { pos: [-0.22,0.22,  0.55], v: s6 }, // S6 R ankle
  ];

  return (
    <group ref={rootRef} position={[0, 0.14, 0]}>
      {/* GLB model */}
      <Center position={MODEL_POSITION}>
        <Model scale={MODEL_SCALE} rotation={MODEL_ROTATION} />
      </Center>

      {/* Pressure rings */}
      {indicators.map((ind, i) => (
        <PressureRing key={i} position={ind.pos} value={ind.v} />
      ))}
    </group>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────
export default function BedPosition3D({ position, sensors = [0, 0, 0, 0, 0, 0] }) {
  const meta = postureMeta(sensors);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/70 overflow-hidden">
      <div style={{ height: 340 }}>
        <Canvas camera={{ position: [0, 4.5, 9.5], fov: 38 }}>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.72} />
          <directionalLight position={[3, 6, 2]} intensity={1.02} castShadow />
          <pointLight position={[-3, 3, -2]} intensity={0.35} color="#9fd1ff" />
          <pointLight position={[3,  2, -3]} intensity={0.28} color="#ffd8b0" />

          <BedFrame />

          <Suspense fallback={null}>
            <Patient sensors={sensors} />
          </Suspense>

          <Environment preset="city" />
          <ContactShadows position={[0, -0.56, 0]} opacity={0.35} scale={9} blur={2.4} far={3.2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]}>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#020617" />
          </mesh>

          <OrbitControls
            enablePan={false}
            minDistance={7}
            maxDistance={13}
            target={[0, 0.1, -1]}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </div>

      {/* footer */}
      <div className="px-5 py-3 border-t border-slate-700/50 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Detected Posture</p>
          <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#1e3a3a", display: "inline-block" }} /> No pressure</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Low</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> High</span>
        </div>
      </div>
    </div>
  );
}
