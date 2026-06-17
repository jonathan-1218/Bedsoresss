import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../lib/api";

import PageLayout from "../components/PageLayout";
import StatsCards from "../components/StatsCards";
import Pressure3D from "../components/Pressure3D";
import SensorZones from "../components/SensorZones";
import BodyPositionMap from "../components/BodyPositionMap";
import PressureChart from "../components/PressureChart";
import PositionTimeline from "../components/PositionTimeline";
import LogsTable from "../components/LogsTable";

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
  const [logs, setLogs] = useState([]);
  const [heatmapSensors, setHeatmapSensors] = useState([0, 0, 0, 0, 0, 0]);
  const [heatmapKey, setHeatmapKey] = useState(0);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/api/data`);
      const d = res.data;
      setData(d);
      setHeatmapSensors(Array.isArray(d.sensors) ? d.sensors.slice(0, 6) : [0, 0, 0, 0, 0, 0]);
      setHistory((prev) => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString(),
        S1: d.sensors[0] || 0, S2: d.sensors[1] || 0, S3: d.sensors[2] || 0,
        S4: d.sensors[3] || 0, S5: d.sensors[4] || 0, S6: d.sensors[5] || 0,
      }]);
      setTimeline((prev) => [...prev.slice(-9), { time: new Date().toLocaleTimeString(), position: d.position }]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
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

  const refreshHeatmapOnly = async () => {
    try {
      await axios.post(`${API}/api/heatmap/reset`);
      setHeatmapSensors([0, 0, 0, 0, 0, 0]);
      setHeatmapKey((prev) => prev + 1);
    } catch (err) {
      console.error("Heatmap reset failed:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
    const dataInterval = setInterval(fetchData, 1000);
    const logsInterval = setInterval(fetchLogs, 5000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(logsInterval);
    };
  }, []);

  return (
    <PageLayout
      user={user}
      onLogout={onLogout}
      title="Dashboard"
      breadcrumb={["Bed 01", "Live View"]}
      motorsEnabled={data.motorsEnabled}
      toggleMotors={toggleMotors}
    >
      <StatsCards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="glass glow rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-bold">Pressure Heatmap (3D)</h2>
            <button
              type="button"
              onClick={refreshHeatmapOnly}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-cyan-900/40 border border-cyan-600/40 hover:bg-cyan-800/50 transition"
            >
              Refresh Heatmap
            </button>
          </div>
          <Pressure3D key={heatmapKey} sensors={heatmapSensors} />
        </div>
        <div className="glass glow rounded-2xl p-5">
          <h2 className="text-xl font-bold mb-4">Body Position</h2>
          <BodyPositionMap position={data.position} sensors={data.sensors} />
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
    </PageLayout>
  );
}
