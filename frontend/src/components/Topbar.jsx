import React, { useState, useEffect } from "react";
import { Home, ChevronRight, Power, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function Topbar({ title, breadcrumb, motorsEnabled, toggleMotors, user, sidebarCollapsed, onToggleSidebar }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const ss = time.getSeconds().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="sticky top-0 z-30 flex-shrink-0">
      {/* Main bar */}
      <div
        className="flex items-center justify-between px-6 h-16 border-b border-slate-700/60"
        style={{ background: "rgba(10,15,30,0.92)", backdropFilter: "blur(16px)" }}
      >
        {/* LEFT: sidebar toggle + breadcrumb */}
        <div className="flex items-center gap-3 text-sm text-slate-400">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
          <Home size={14} className="text-slate-500" />
          {breadcrumb?.map((b, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="text-slate-600" />
              <span className={i === breadcrumb.length - 1 ? "text-white font-medium" : ""}>{b}</span>
            </React.Fragment>
          ))}
        </div>

        {/* CENTER: title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold tracking-widest uppercase text-slate-300 hidden md:block">
          {title}
        </h1>

        {/* RIGHT: controls */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>

          {/* Clock */}
          <div className="hidden sm:flex flex-col items-end leading-none px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="font-mono text-sm text-cyan-300 tracking-widest">{hh}:{mm}:{ss}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{dateStr}</span>
          </div>

          {/* Motor toggle */}
          {toggleMotors && (
            <button
              onClick={toggleMotors}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                motorsEnabled
                  ? "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
              }`}
            >
              <Power size={13} />
              <span className="hidden sm:inline">{motorsEnabled ? "Motors ON" : "Motors OFF"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thin cyan accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
    </header>
  );
}
