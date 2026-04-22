import React from "react";

// position comes from ESP32: "Left", "Center", "Right", "Waiting..."
export default function BodyPositionMap({ position }) {
  const active = (zone) => {
    const p = (position || "").toLowerCase();
    if (zone === "left" && p === "left") return true;
    if (zone === "ctr" && p === "center") return true;
    if (zone === "right" && p === "right") return true;
    return false;
  };

  const sensorBlock = (isActive, extraClass = "") =>
    `flex items-center justify-center rounded-2xl font-mono text-sm tracking-widest transition-all duration-500 ${extraClass} ${
      isActive
        ? "bg-pink-200/30 text-pink-200 border border-pink-300/40 shadow-[0_0_18px_rgba(244,114,182,0.25)]"
        : "bg-[#1e2a1e]/60 text-[#8a9e8a] border border-[#2a3a2a]/60"
    }`;

  const sensorState = {
    S1: active("ctr"),
    S2: active("left"),
    S3: active("right"),
    S4: active("ctr"),
    S5: active("left"),
    S6: active("right"),
  };

  return (
    <div className="rounded-2xl bg-[#141a14] border border-[#1e2a1e] p-6">
      <p className="text-xs font-mono tracking-widest text-[#6b7f6b] mb-5 uppercase">
        Sensor Alignment Map
      </p>

      <div className="flex flex-col items-center gap-5">
        <div className={sensorBlock(sensorState.S1, "w-32 h-14")}>S1</div>

        <div className="flex gap-4 items-center">
          <div className={sensorBlock(sensorState.S2, "w-32 h-14")}>S2</div>
          <div className={sensorBlock(sensorState.S3, "w-32 h-14")}>S3</div>
        </div>

        <div className={sensorBlock(sensorState.S4, "w-44 h-14")}>S4</div>

        <div className="flex gap-4 items-center">
          <div className={sensorBlock(sensorState.S5, "w-36 h-14")}>S5</div>
          <div className={sensorBlock(sensorState.S6, "w-36 h-14")}>S6</div>
        </div>
      </div>

      <p className="text-center font-mono text-sm text-[#8a9e8a] mt-5">
        position:{" "}
        <span className="text-pink-300">{position || "Waiting..."}</span>
      </p>
    </div>
  );
}
