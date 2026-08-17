import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowRight, Sprout } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/common/Button.jsx";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setErrorMsg(err.message || err.response?.data?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col lg:flex-row selection:bg-[#D3E6E0] selection:text-[#14213D]">
      {/* Left Minimal Brand Panel */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#1E4D40] via-[#2F6F5E] to-[#14382F] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[220px] lg:min-h-screen">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#13362C]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm">
            <Sprout size={22} className="text-[#A4E0D1]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white leading-none">
              CHERAN PLAST
            </div>
            <div className="text-[10px] text-[#A4E0D1] font-medium tracking-wide mt-1">
              ENTERPRISE PORTAL
            </div>
          </div>
        </div>

        {/* Center Minimal Typography */}
        <div className="relative z-10 my-8 lg:my-0 space-y-3 max-w-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            Precision Irrigation & Operations Portal.
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
            Centralized management for government projects, inventory ledger, and workforce.
          </p>
        </div>

        {/* Bottom subtle copyright */}
        <div className="relative z-10 text-[11px] text-white/40">
          © {new Date().getFullYear()} Cheran Plast. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="lg:w-7/12 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-20 flex-1">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] tracking-tight">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm text-[#52607D]">
              Enter your staff credentials to access the portal
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[10px] flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C97AB]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAFAF8] border border-[#E4E1D8] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] focus:border-transparent text-[#14213D] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C97AB]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm bg-[#FAFAF8] border border-[#E4E1D8] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] focus:border-transparent text-[#14213D] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C97AB] hover:text-[#14213D] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full py-3 text-sm font-bold shadow-[0_2px_8px_rgba(47,111,94,0.25)] flex items-center justify-center gap-2 mt-4"
            >
              <span>Sign In</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
