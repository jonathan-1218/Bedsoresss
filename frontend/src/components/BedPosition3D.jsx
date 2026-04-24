import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Model } from "./Model";

const MODEL_URL = "/quaternius_cc0-male-character-1161.glb";
const MODEL_BASE_ROTATION = [-Math.PI / 2, 0, Math.PI];
const MODEL_BASE_POSITION = [0, 0.04, -2.05];
const MODEL_BASE_SCALE = 1.05;

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("GLB model failed to load:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function postureFromPosition(position) {
  const p = String(position || "").toLowerCase();

  if (p === "left") {
    return {
      rollZ: 0.58,
      yawY: 0.16,
      shiftX: -0.08,
      label: "Left side lying",
      glow: "#22d3ee",
    };
  }

  if (p === "right") {
    return {
      rollZ: -0.58,
      yawY: -0.16,
      shiftX: 0.08,
      label: "Right side lying",
      glow: "#fb7185",
    };
  }

  if (p === "center") {
    return {
      rollZ: 0,
      yawY: 0,
      shiftX: 0,
      label: "Supine (center)",
      glow: "#34d399",
    };
  }

  return {
    rollZ: 0,
    yawY: 0,
    shiftX: 0,
    label: "No pressure / waiting",
    glow: "#f59e0b",
  };
}

function BedFrame() {
  return (
    <group>
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[5.2, 0.24, 9.3]} />
        <meshStandardMaterial color="#9a6b45" metalness={0.08} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.31, 0]}>
        <boxGeometry args={[4.5, 0.52, 8.45]} />
        <meshStandardMaterial color="#ddd6cb" roughness={0.98} />
      </mesh>
      <mesh position={[0, -0.03, -3.45]}>
        <boxGeometry args={[2.45, 0.34, 1.35]} />
        <meshStandardMaterial color="#ececec" roughness={0.97} />
      </mesh>
      <mesh position={[0, 0.78, -4.28]}>
        <boxGeometry args={[4.8, 1.75, 0.2]} />
        <meshStandardMaterial color="#95663f" metalness={0.08} roughness={0.68} />
      </mesh>
    </group>
  );
}

function GLBPatient({ position }) {
  const pose = useMemo(() => postureFromPosition(position), [position]);
  const rootRef = useRef(null);

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const smooth = Math.min(1, delta * 5);
    rootRef.current.rotation.y += (Math.PI + pose.yawY - rootRef.current.rotation.y) * smooth;
    rootRef.current.rotation.z += (pose.rollZ - rootRef.current.rotation.z) * smooth;
    rootRef.current.position.x += (pose.shiftX - rootRef.current.position.x) * smooth;

    const breath = Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
    rootRef.current.position.y = 0.14 + breath;
  });

  return (
    <group ref={rootRef} position={[pose.shiftX, 0.14, 0]}>
      <Center position={MODEL_BASE_POSITION}>
        <Model scale={MODEL_BASE_SCALE} rotation={MODEL_BASE_ROTATION} />
      </Center>
      <mesh position={[0, 0.03, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.55, 40]} />
        <meshBasicMaterial color={pose.glow} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

export default function BedPosition3D({ position }) {
  const pose = postureFromPosition(position);
  const [modelStatus, setModelStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    const checkModel = async () => {
      try {
        const res = await fetch(MODEL_URL, { method: "HEAD" });
        const type = (res.headers.get("content-type") || "").toLowerCase();
        const looksLikeModel = !type.includes("text/html");

        if (mounted) {
          setModelStatus(res.ok && looksLikeModel ? "ready" : "missing");
        }
      } catch {
        if (mounted) setModelStatus("missing");
      }
    };

    checkModel();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-slate-950/60 overflow-hidden">
      <div className="h-[260px]">
        <Canvas camera={{ position: [0, 3.9, 8.2], fov: 36 }}>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.72} />
          <directionalLight position={[3, 6, 2]} intensity={1.02} castShadow />
          <pointLight position={[-3, 3, -2]} intensity={0.35} color="#9fd1ff" />
          <pointLight position={[3, 2, -3]} intensity={0.28} color="#ffd8b0" />

          <BedFrame />
          {modelStatus === "ready" ? (
            <ModelErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <GLBPatient position={position} />
              </Suspense>
            </ModelErrorBoundary>
          ) : null}

          <Environment preset="city" />
          <ContactShadows position={[0, -0.56, 0]} opacity={0.35} scale={8} blur={2.4} far={3.2} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#020617" />
          </mesh>

          <OrbitControls
            enablePan={false}
            minDistance={6}
            maxDistance={10}
            target={[-0.6, 0, -0.3]}
            minPolarAngle={Math.PI / 3.4}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={false}
          />
        </Canvas>
      </div>

      <div className="px-4 py-3 border-t border-cyan-900/30 bg-slate-950/70">
        <p className="text-xs uppercase tracking-widest text-slate-400">Detected posture</p>
        <p className="text-sm font-semibold" style={{ color: pose.glow }}>{pose.label}</p>
        <p className="text-[11px] text-slate-500 mt-1">
          {modelStatus === "ready"
            ? "Using realistic GLB model"
            : "Model missing: add quaternius_cc0-male-character-1161.glb to frontend/public/"}
        </p>
      </div>
    </div>
  );
}
