import React, { useState, useEffect } from "react";
import { Home, ChevronRight, Power } from "lucide-react";

export default function Topbar({ title, breadcrumb, motorsEnabled, toggleMotors, user }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour12: false }));

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="glass glow flex items-center justify-between px-6 h-16 sticky top-0 z-30 border-b border-cyan-400/10">
      {/* LEFT: breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
        <Home size={14} />
        {breadcrumb?.map((b, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={13} className="text-slate-600" />
            <span className={i === breadcrumb.length - 1 ? "text-white" : ""}>{b}</span>
          </React.Fragment>
        ))}
      </div>

      {/* CENTER: page title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-white hidden md:block">
        {title}
      </h1>

      {/* RIGHT: live badge + clock + motor toggle */}
      <div className="flex items-center gap-3">
        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live monitoring
        </div>

        {/* Clock */}
        <div className="font-mono text-sm text-cyan-300 bg-slate-800/60 border border-cyan-400/15 px-3 py-1.5 rounded-lg">
          {time}
        </div>

        {/* Motor toggle */}
        {toggleMotors && (
          <button
            onClick={toggleMotors}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              motorsEnabled
                ? "bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30"
            }`}
          >
            <Power size={14} />
            {motorsEnabled ? "OFF" : "ON"}
          </button>
        )}
      </div>
    </header>
  );
}
