import React from "react";

const SENSOR_LABELS = [
  "L. Shoulder",
  "Upper Spine",
  "R. Shoulder",
  "L. Hip",
  "Lower Spine",
  "R. Hip",
];

export default function SensorGrid({ sensors }) {
  const getColor = (value) => {
    const pct = (value / 1023) * 100;
    if (pct < 20) return "from-blue-600 to-cyan-500";
    if (pct < 40) return "from-green-500 to-emerald-400";
    if (pct < 65) return "from-yellow-400 to-orange-400";
    return "from-red-500 to-pink-500";
  };

  const getRisk = (value) => {
    const pct = (value / 1023) * 100;
    if (pct < 20) return { label: "Low", color: "text-cyan-300" };
    if (pct < 40) return { label: "Normal", color: "text-green-400" };
    if (pct < 65) return { label: "Moderate", color: "text-yellow-400" };
    return { label: "High Risk", color: "text-red-400" };
  };

  return (
    <div className="glass rounded-2xl p-6 glow">
      <h2 className="text-xl font-bold mb-4">Sensor Pressure Zones</h2>
      <div className="grid grid-cols-3 gap-3">
        {sensors.map((value, index) => {
          const risk = getRisk(value);
          const pct = Math.round((value / 1023) * 100);
          return (
            <div
              key={index}
              className={`rounded-2xl flex flex-col items-center justify-center p-3 text-white bg-gradient-to-br ${getColor(value)} shadow-lg`}
            >
              <span className="text-xs font-medium opacity-80 text-center leading-tight">
                {SENSOR_LABELS[index]}
              </span>
              <span className="text-2xl font-bold mt-1">{pct}%</span>
              <span className={`text-xs font-semibold mt-0.5 ${risk.color} bg-black/20 rounded-full px-2 py-0.5`}>
                {risk.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* LAYOUT HINT */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        T-shape layout: Shoulders → Spine → Hips → Sacrum
      </div>
    </div>
  );
}
