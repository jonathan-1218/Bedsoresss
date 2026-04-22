import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "", role: "caretaker" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password || !form.role) {
      setError("Please fill email, password, and role");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/login`, form);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.patient) localStorage.setItem("patient", JSON.stringify(res.data.patient));
      if (res.data.caretaker) localStorage.setItem("caretaker", JSON.stringify(res.data.caretaker));
      onLogin(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid login credentials or wrong role selected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="glass glow rounded-3xl p-8 w-full max-w-md border border-cyan-400/10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-4">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">BedSore AI Care</h1>
          <p className="text-slate-400 mt-1">Secure login for Admin / Caretaker / Guardian</p>
        </div>

        <div className="mb-4 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-xl">
          <p><strong className="text-slate-300">Admin:</strong> admin@example.com / 123456</p>
          <p><strong className="text-slate-300">Caretaker:</strong> caretaker@example.com / 123456</p>
          <p><strong className="text-slate-300">Guardian:</strong> guardian@example.com / 123456</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-400/50 outline-none text-white transition"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-400/50 outline-none text-white transition"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <select
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-400/50 outline-none text-white transition"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="caretaker">Caretaker</option>
            <option value="guardian">Guardian / Relative</option>
            <option value="admin">Admin (System Only)</option>
          </select>
        </div>

        {error && <p className="text-red-400 mt-3 text-sm font-medium">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 transition p-3 rounded-xl font-semibold text-white"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex justify-between mt-4 text-sm text-slate-400">
          <Link to="/forgot-password" className="hover:text-cyan-400">Forgot Password?</Link>
          <Link to="/register" className="hover:text-cyan-400">New User? Register</Link>
        </div>
      </div>
    </div>
  );
}
