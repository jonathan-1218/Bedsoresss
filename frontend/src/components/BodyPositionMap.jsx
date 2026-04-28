import React from "react";

function inferAnatomyResult(sensors = []) {
  const values = Array.from({ length: 6 }, (_, i) => Number(sensors[i] || 0));
  const [head, leftShoulder, rightShoulder, hipBack, leftAnkle, rightAnkle] = values;
  const total = values.reduce((sum, value) => sum + value, 0);
  const leftChain = leftShoulder + leftAnkle;
  const rightChain = rightShoulder + rightAnkle;

  if (total < 50) return "No pressure";
  if (Math.abs(leftChain - rightChain) >= 90) {
    return leftChain > rightChain ? "Left side loading" : "Right side loading";
  }

  const maxVal = Math.max(...values);
  if (maxVal === head) return "Head pressure";
  if (maxVal === hipBack) return "Hip/Back pressure";
  if (maxVal === leftShoulder || maxVal === rightShoulder) return "Shoulder pressure";
  return "Ankle pressure";
}

export default function BodyPositionMap({ position, sensors = [0, 0, 0, 0, 0, 0] }) {
  const values = Array.from({ length: 6 }, (_, i) => Number(sensors[i] || 0));
  const sensorThreshold = 35;
  const sensorState = {
    S1: values[0] > sensorThreshold,
    S2: values[1] > sensorThreshold,
    S3: values[2] > sensorThreshold,
    S4: values[3] > sensorThreshold,
    S5: values[4] > sensorThreshold,
    S6: values[5] > sensorThreshold,
  };

  const anatomyResult = inferAnatomyResult(values);

  const sensorBlock = (isActive, extraClass = "") =>
    `flex items-center justify-center rounded-2xl font-mono text-sm tracking-widest transition-all duration-500 ${extraClass} ${
      isActive
        ? "bg-pink-200/30 text-pink-200 border border-pink-300/40 shadow-[0_0_18px_rgba(244,114,182,0.25)]"
        : "bg-[#1e2a1e]/60 text-[#8a9e8a] border border-[#2a3a2a]/60"
    }`;

  return (
    <div className="rounded-2xl bg-[#141a14] border border-[#1e2a1e] p-6">
      <p className="text-xs font-mono tracking-widest text-[#6b7f6b] mb-5 uppercase">
        Sensor Alignment Map
      </p>

      <div className="flex flex-col items-center gap-5">
        <div className={sensorBlock(sensorState.S1, "w-32 h-14")}>S1 · Head</div>

        <div className="flex gap-4 items-center">
          <div className={sensorBlock(sensorState.S2, "w-32 h-14")}>S2 · L Shoulder</div>
          <div className={sensorBlock(sensorState.S3, "w-32 h-14")}>S3 · R Shoulder</div>
        </div>

        <div className={sensorBlock(sensorState.S4, "w-44 h-14")}>S4 · Hip/Back</div>

        <div className="flex gap-4 items-center">
          <div className={sensorBlock(sensorState.S5, "w-36 h-14")}>S5 · L Ankle</div>
          <div className={sensorBlock(sensorState.S6, "w-36 h-14")}>S6 · R Ankle</div>
        </div>
      </div>

      <div className="text-center font-mono text-sm text-[#8a9e8a] mt-5 space-y-1">
        <p>
          resultant: <span className="text-pink-300">{anatomyResult}</span>
        </p>
        <p>
          backend: <span className="text-cyan-300">{position || "Waiting..."}</span>
        </p>
      </div>
    </div>
  );
}
