import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PressureChart from "../components/PressureChart";
import PositionTimeline from "../components/PositionTimeline";
import BedPosition3D from "../components/BedPosition3D";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Analytics({ user, onLogout }) {
  const [history, setHistory] = useState([]);
  const [immobileHistory, setImmobileHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [currentPosition, setCurrentPosition] = useState("Waiting for ESP32...");
  const [positionSource, setPositionSource] = useState("init");
  const [mlConfidence, setMlConfidence] = useState(null);
  const [lastSensorAt, setLastSensorAt] = useState(null);

  const sensorAgeMs = lastSensorAt ? Date.now() - new Date(lastSensorAt).getTime() : Infinity;
  const isSensorOnline = Number.isFinite(sensorAgeMs) && sensorAgeMs <= 3000;
  const sensorStatusLabel = isSensorOnline ? "Online" : "Offline";
  const immobilityData = isSensorOnline ? immobileHistory : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/api/data`);
        const d = res.data;
        const t = new Date().toLocaleTimeString();
        setCurrentPosition(d.position || "Unknown");
        setPositionSource(d.positionSource || "unknown");
        setMlConfidence(Number.isFinite(d.mlConfidence) ? d.mlConfidence : null);
        setLastSensorAt(d.lastSensorAt || null);
        setHistory(p => [...p.slice(-29), { time: t, S1: d.sensors[0]||0, S2: d.sensors[1]||0, S3: d.sensors[2]||0, S4: d.sensors[3]||0, S5: d.sensors[4]||0, S6: d.sensors[5]||0 }]);
        const isPacketOnline = d.lastSensorAt && Date.now() - new Date(d.lastSensorAt).getTime() <= 3000;
        if (isPacketOnline) {
          setImmobileHistory(p => [...p.slice(-49), { t, sec: d.immobileForSec || 0 }]);
        }
        setTimeline(p => [...p.slice(-9), { time: t, position: d.position }]);
      } catch {}
    };
    fetchData();
    const id = setInterval(fetchData, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #020617, #0f172a, #111827)" }}>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Analytics" breadcrumb={["Analytics"]} user={user} />
        <main className="flex-1 p-5 space-y-5 overflow-auto">

          <div className="glass glow rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Live Predicted Body Position</p>
                <h2 className="text-3xl font-extrabold tracking-tight">{currentPosition}</h2>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    isSensorOnline
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  }`}
                >
                  ESP32 {sensorStatusLabel}
                </span>
                <span className="text-slate-400 text-sm">Source</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    positionSource === "ml"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                      : positionSource === "device"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {positionSource}
                </span>
                {positionSource === "ml" && mlConfidence !== null && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {(mlConfidence * 100).toFixed(1)}% confidence
                  </span>
                )}
              </div>
            </div>

            <BedPosition3D position={currentPosition} />

            {lastSensorAt && (
              <p className="text-slate-400 text-xs mt-3">
                Last sensor packet: {new Date(lastSensorAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="glass glow rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-4">Live Sensor Pressure (All Zones)</h2>
            <PressureChart history={history} />
          </div>

          <div className="glass glow rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-2">Immobility Duration</h2>
            <p className="text-slate-400 text-sm mb-4">
              Seconds patient has been immobile over time
              {!isSensorOnline && " (paused while ESP32 is offline)"}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={immobilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="sec" stroke="#06b6d4" fill="rgba(6,182,212,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass glow rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-4">Position Timeline</h2>
            <PositionTimeline timeline={timeline} />
          </div>

        </main>
      </div>
    </div>
  );
}
