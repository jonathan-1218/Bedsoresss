import React from "react";
export default function StatsCards({ data }) {
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };
  const cards = [
    { title: "Current Position", value: data.position },
    { title: "Movement Count", value: data.movementCount },
    { title: "Immobile Time", value: formatTime(data.immobileForSec) },
    { title: "Vibration", value: data.vibrationActive ? "ACTIVE" : "OFF" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="glass rounded-2xl p-5 glow">
          <p className="text-slate-400 text-sm">{card.title}</p>
          <h2 className="text-2xl font-bold mt-2">{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
