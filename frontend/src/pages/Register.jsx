import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "guardian",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setMsg("");
    setError("");

    // ✅ VALIDATION
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.role
    ) {
      setError("Please fill all fields");
      return;
    }

    // Basic phone validation
    if (form.phone.length < 10) {
      setError("Enter valid phone number");
      return;
    }

    try {
      console.log("Sending data:", form); // debug

      const res = await axios.post(
        `${API}/api/register`,
        form
      );

      setMsg(res.data.message);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="glass glow rounded-3xl p-8 w-full max-w-md border border-cyan-400/10">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Create Account
        </h1>

        {/* NAME */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* PHONE */}
        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        {/* ROLE */}
        <select
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="guardian">Guardian / Relative</option>
          <option value="caretaker">Caretaker</option>
        </select>

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        {/* SUCCESS MESSAGE */}
        {msg && <p className="text-green-400 mb-3">{msg}</p>}

        {/* ERROR MESSAGE */}
        {error && <p className="text-red-400 mb-3">{error}</p>}

        {/* BUTTON */}
        <button
          onClick={handleRegister}
          className="w-full bg-cyan-500 hover:bg-cyan-600 transition p-3 rounded-xl font-semibold text-white"
        >
          Register
        </button>

        {/* LOGIN LINK */}
        <p className="text-center mt-4 text-slate-400">
          Already have an account?{" "}
          <Link to="/" className="text-cyan-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}