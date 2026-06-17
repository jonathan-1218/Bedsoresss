import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../lib/api";

const INPUT = "w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-400/50 outline-none text-white transition";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "guardian" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleRegister = async () => {
    setMsg("");
    setError("");
    if (!form.name || !form.email || !form.phone || !form.password || !form.role) {
      setError("Please fill all fields");
      return;
    }
    if (form.phone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    try {
      const res = await axios.post(`${API}/api/register`, form);
      setMsg(res.data.message);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass glow rounded-3xl p-8 w-full max-w-md border border-cyan-400/10">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Create Account</h1>

        <div className="space-y-4">
          <input type="text"     placeholder="Full Name"     className={INPUT} value={form.name}     onChange={set("name")} />
          <input type="email"    placeholder="Email"         className={INPUT} value={form.email}    onChange={set("email")} />
          <input type="tel"      placeholder="Phone Number"  className={INPUT} value={form.phone}    onChange={set("phone")} />
          <select className={INPUT} value={form.role} onChange={set("role")}>
            <option value="guardian">Guardian / Relative</option>
            <option value="caretaker">Caretaker</option>
          </select>
          <input type="password" placeholder="Password"      className={INPUT} value={form.password} onChange={set("password")} onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
        </div>

        {msg   && <p className="text-emerald-400 mt-3 text-sm">{msg}</p>}
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

        <button
          onClick={handleRegister}
          className="w-full mt-5 bg-cyan-500 hover:bg-cyan-600 transition p-3 rounded-xl font-semibold text-white"
        >
          Register
        </button>

        <p className="text-center mt-4 text-slate-400 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition">Login</Link>
        </p>
      </div>
    </div>
  );
}
