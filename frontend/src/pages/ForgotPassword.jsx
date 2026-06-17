import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API } from "../lib/api";

const INPUT = "w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-400/50 outline-none text-white transition";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setMsg(""); setError("");
    try {
      const res = await axios.post(`${API}/api/send-otp`, { email });
      setMsg(res.data.message || "OTP sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async () => {
    setMsg(""); setError("");
    try {
      const res = await axios.post(`${API}/api/reset-password`, { email, otp, newPassword });
      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass glow rounded-3xl p-8 w-full max-w-md border border-cyan-400/10">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Reset Password</h1>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Registered Email"
              className={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={sendOtp}
              className="px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 transition font-semibold text-white whitespace-nowrap text-sm"
            >
              Send OTP
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter OTP"
            className={INPUT}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            className={INPUT}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && resetPassword()}
          />
        </div>

        {msg   && <p className="text-emerald-400 mt-3 text-sm">{msg}</p>}
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}

        <button
          onClick={resetPassword}
          className="w-full mt-5 bg-cyan-500 hover:bg-cyan-600 transition p-3 rounded-xl font-semibold text-white"
        >
          Reset Password
        </button>

        <p className="text-center mt-4 text-slate-400 text-sm">
          Back to{" "}
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition">Login</Link>
        </p>
      </div>
    </div>
  );
}
