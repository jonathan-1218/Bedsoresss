import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

const SENSOR_NAMES = {
  S1: "Top Center",
  S2: "Upper Left",
  S3: "Upper Right",
  S4: "Mid Center",
  S5: "Lower Left",
  S6: "Lower Right",
};

const COLORS = {
  S1: "#06b6d4",
  S2: "#22c55e",
  S3: "#f59e0b",
  S4: "#ef4444",
  S5: "#8b5cf6",
  S6: "#ec4899",
};

export default function PressureChart({ history }) {
  return (
    <div className="glass rounded-2xl p-6 glow">
      <h2 className="text-xl font-bold mb-4">Live Pressure History</h2>
      {history.length < 2 ? (
        <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
          Waiting for data...
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" domain={[0, 1023]} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #0e7490", borderRadius: "12px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend formatter={(value) => SENSOR_NAMES[value] || value} />
              {Object.keys(COLORS).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[key]}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
