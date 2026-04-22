import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Trash2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Settings({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try { const res = await axios.get(`${API}/api/users`); setUsers(res.data); } catch {}
    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API}/api/users/${id}`);
      setMsg("User deleted");
      load();
      setTimeout(() => setMsg(""), 2500);
    } catch { setMsg("Failed to delete"); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #020617, #0f172a, #111827)" }}>
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Settings" breadcrumb={["Settings"]} user={user} />
        <main className="flex-1 p-5">
          {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">{msg}</div>}
          <div className="glass glow rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-bold">User Management</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 px-6">Name</th><th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Phone</th><th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Joined</th><th className="py-3 px-6"></th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                        <td className="py-3 px-6 font-medium">{u.name}</td>
                        <td className="py-3 px-6 text-slate-400">{u.email}</td>
                        <td className="py-3 px-6 text-slate-400 font-mono text-xs">{u.phone}</td>
                        <td className="py-3 px-6">
                          <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/20">{u.role}</span>
                        </td>
                        <td className="py-3 px-6 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-6">
                          {u.id !== user.id && (
                            <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
