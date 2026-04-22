import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setMsg("");
    setError("");

    try {
      const res = await axios.post(`${API}/api/send-otp`, { email });
      setMsg(res.data.message || "OTP sent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async () => {
    setMsg("");
    setError("");

    try {
      const res = await axios.post(`${API}/api/reset-password`, {
        email,
        otp,
        newPassword
      });
      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="glass glow rounded-3xl p-8 w-full max-w-md border border-cyan-400/10">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Reset Password
        </h1>

        <input
          type="email"
          placeholder="Registered Email"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendOtp}
          className="w-full bg-purple-500 hover:bg-purple-600 transition p-3 rounded-xl font-semibold text-white mb-4"
        >
          Send OTP
        </button>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-3 rounded-xl bg-slate-800 mb-4 outline-none text-white"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {msg && <p className="text-green-400 mb-3">{msg}</p>}
        {error && <p className="text-red-400 mb-3">{error}</p>}

        <button
          onClick={resetPassword}
          className="w-full bg-cyan-500 hover:bg-cyan-600 transition p-3 rounded-xl font-semibold text-white"
        >
          Reset Password
        </button>

        <p className="text-center mt-4 text-slate-400">
          Back to{" "}
          <Link to="/" className="text-cyan-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}