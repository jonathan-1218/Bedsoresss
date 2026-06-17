import React from "react";
import PageLayout from "../components/PageLayout";

const PATIENTS = [
  { id: 1, name: "Ravi Kumar",  age: 72, bed: "Bed 01", condition: "High Risk", lastTurn: "14 min ago", status: "alert" },
  { id: 2, name: "Meena Devi",  age: 65, bed: "Bed 02", condition: "Moderate",  lastTurn: "28 min ago", status: "warn"  },
  { id: 3, name: "Arjun Singh", age: 80, bed: "Bed 03", condition: "Low Risk",  lastTurn: "5 min ago",  status: "safe"  },
];

const badge = {
  alert: "bg-red-500/20 text-red-300 border-red-400/30",
  warn:  "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  safe:  "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
};
const badgeLabel = { alert: "⚠ Alert", warn: "• Monitor", safe: "✓ Safe" };

export default function Patients({ user, onLogout }) {
  return (
    <PageLayout user={user} onLogout={onLogout} title="Patients" breadcrumb={["Patients"]}>
      <div className="glass glow rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Patient Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Age</th>
                <th className="py-3 px-6">Bed</th>
                <th className="py-3 px-6">Condition</th>
                <th className="py-3 px-6">Last Repositioned</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {PATIENTS.map(p => (
                <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                  <td className="py-3 px-6 font-medium">{p.name}</td>
                  <td className="py-3 px-6 text-slate-400">{p.age}</td>
                  <td className="py-3 px-6 text-slate-400">{p.bed}</td>
                  <td className="py-3 px-6 text-slate-400">{p.condition}</td>
                  <td className="py-3 px-6 text-slate-400 font-mono text-xs">{p.lastTurn}</td>
                  <td className="py-3 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge[p.status]}`}>
                      {badgeLabel[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
