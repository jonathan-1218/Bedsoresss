import React from "react";
import { Navigation, Activity, Clock, Vibrate } from "lucide-react";

const formatTime = (sec) => {
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};

export default function StatsCards({ data }) {
  const immobileSec = data.immobileForSec || 0;
  const immobileWarning = immobileSec >= 7200;

  const cards = [
    {
      title: "Current Position",
      value: data.position,
      icon: Navigation,
      accent: "cyan",
    },
    {
      title: "Movement Count",
      value: data.movementCount,
      icon: Activity,
      accent: "emerald",
    },
    {
      title: "Immobile Time",
      value: formatTime(immobileSec),
      icon: Clock,
      accent: immobileWarning ? "red" : "amber",
    },
    {
      title: "Vibration",
      value: data.vibrationActive ? "ACTIVE" : "OFF",
      icon: Vibrate,
      accent: data.vibrationActive ? "cyan" : "slate",
    },
  ];

  const accentClasses = {
    cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-400/20",    icon: "text-cyan-400",    value: "text-cyan-300" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-400/20", icon: "text-emerald-400", value: "text-emerald-300" },
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-400/20",   icon: "text-amber-400",   value: "text-white" },
    red:     { bg: "bg-red-500/10",     border: "border-red-400/20",     icon: "text-red-400",     value: "text-red-300" },
    slate:   { bg: "bg-slate-700/40",   border: "border-slate-600/30",   icon: "text-slate-400",   value: "text-white" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const c = accentClasses[card.accent];
        const Icon = card.icon;
        return (
          <div key={card.title} className="glass glow rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-slate-400 text-sm">{card.title}</p>
              <div className={`w-8 h-8 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                <Icon size={15} className={c.icon} />
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${c.value}`}>{card.value}</h2>
          </div>
        );
      })}
    </div>
  );
}
