import React from "react";
export default function PositionTimeline({ timeline }) {
  return (
    <div className="glass rounded-2xl p-6 glow">
      <h2 className="text-xl font-bold mb-4">Position Timeline</h2>
      <div className="space-y-3">
        {timeline.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-4 rounded-xl bg-slate-800/60">
            <span className="font-medium">{item.position}</span>
            <span className="text-slate-400">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
