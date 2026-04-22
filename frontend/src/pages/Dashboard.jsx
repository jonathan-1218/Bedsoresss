import React, { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatsCards from "../components/StatsCards";
import Pressure3D from "../components/Pressure3D";
import SensorZones from "../components/SensorZones";
import BodyPositionMap from "../components/BodyPositionMap";
import PressureChart from "../components/PressureChart";
import PositionTimeline from "../components/PositionTimeline";
import LogsTable from "../components/LogsTable";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState({
    sensors: [0, 0, 0, 0, 0, 0],
    position: "Waiting...",
    movementCount: 0,
    vibrationActive: false,
    motorsEnabled: false,
    immobileForSec: 0,
  });
  const [history, setHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [immobileHistory, setImmobileHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/api/data`);
      const d = res.data;
      setData(d);
      setHistory((prev) => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString(),
        S1: d.sensors[0]||0, S2: d.sensors[1]||0, S3: d.sensors[2]||0,
        S4: d.sensors[3]||0, S5: d.sensors[4]||0, S6: d.sensors[5]||0,
      }]);
      setImmobileHistory((prev) => [...prev.slice(-49), { t: new Date().toLocaleTimeString(), sec: d.immobileForSec||0 }]);
      setTimeline((prev) => [...prev.slice(-9), { time: new Date().toLocaleTimeString(), position: d.position }]);
    } catch (err) { console.error("Dashboard fetch error:", err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/api/logs`);
      setLogs(res.data);
    } catch {}
  };

  const toggleMotors = async () => {
    try {
      await axios.post(`${API}/api/motors`, { motorsEnabled: !data.motorsEnabled });
      setData((prev) => ({ ...prev, motorsEnabled: !prev.motorsEnabled }));
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
    const interval = setInterval(() => { fetchData(); fetchLogs(); }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #020617, #0f172a, #111827)" }}>
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Dashboard"
          breadcrumb={["Bed 01", "Live View"]}
          motorsEnabled={data.motorsEnabled}
          toggleMotors={toggleMotors}
          user={user}
        />

        <main className="flex-1 p-5 space-y-5 overflow-auto">
          <StatsCards data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass glow rounded-2xl p-5 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Pressure Heatmap (3D)</h2>
              <Pressure3D sensors={data.sensors} />
            </div>
            <div className="glass glow rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-4">Body Position</h2>
              <BodyPositionMap position={data.position} />
            </div>
          </div>

          <div className="glass glow rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-4">Sensor Pressure Chart</h2>
            <PressureChart history={history} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass glow rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-4">Sensor Zones</h2>
              <SensorZones sensors={data.sensors} />
            </div>
            <div className="glass glow rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-4">Position Timeline</h2>
              <PositionTimeline timeline={timeline} />
            </div>
          </div>

          <LogsTable logs={logs} />
        </main>
      </div>
    </div>
  );
}
