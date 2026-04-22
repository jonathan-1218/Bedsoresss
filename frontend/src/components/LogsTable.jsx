import React from "react";
export default function LogsTable({ logs }) {
  return (
    <div className="glass rounded-2xl p-6 glow">
      <h2 className="text-xl font-bold mb-4">Recent Activity Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="border-b border-slate-700"><th className="py-3">Time</th><th className="py-3">Event</th></tr></thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="border-b border-slate-800">
                <td className="py-3 text-slate-300">{log.time}</td>
                <td className="py-3">{log.event}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
