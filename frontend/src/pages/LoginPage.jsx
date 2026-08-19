import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowRight, Sprout, Smartphone, Laptop, Download, Share, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/common/Button.jsx";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if on mobile device (phone / tablet)
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent) ||
        (window.innerWidth <= 800 && "ontouchstart" in window);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Check if already in standalone/PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = (window.navigator.userAgent || "").toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          setIsInstalled(true);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowIOSPrompt(true);
      }
    } else {
      // For iOS Safari / Chrome or browsers without beforeinstallprompt, show step-by-step guide
      setShowIOSPrompt(true);
    }
  };

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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col selection:bg-[#D3E6E0] selection:text-[#14213D]">
      {/* Top Mobile-Only PWA Install Banner (Strictly Hidden on Desktop / PC) */}
      {isMobile && !isInstalled && !installPromptDismissed && (
        <div className="w-full bg-[#1E4D40] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 z-50 animate-in slide-in-from-top duration-300 border-b border-[#2F6F5E] sticky top-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-[7px] bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone size={16} className="text-[#A4E0D1]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                Install Cheran App
              </div>
              <div className="text-[10px] text-[#A4E0D1] truncate">
                Fast home-screen access & full screen
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-[#2F6F5E] hover:bg-[#255b4d] active:scale-95 text-white font-bold text-xs rounded-[6px] border border-[#529B87] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={() => setInstallPromptDismissed(true)}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
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
                CHERAN IRRIGATION
              </div>
              <div className="text-[10px] text-[#A4E0D1] font-medium tracking-wide mt-1">
                ENTERPRISE PORTAL
              </div>
            </div>
          </div>

          {/* Center Minimal Typography */}
          <div className="relative z-10 my-6 lg:my-0 space-y-3 max-w-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              Precision Irrigation & Operations Portal.
            </h2>

            {/* Desktop PWA Install Card (Hidden on Mobile) */}
            {!isMobile && !isInstalled && (
              <div className="pt-2">
                <div className="p-3.5 rounded-[12px] bg-white/10 backdrop-blur-md border border-white/20 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[6px] bg-white/20 flex items-center justify-center text-[#A4E0D1]">
                        <Laptop size={13} />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        Desktop App Ready
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#A4E0D1]/20 text-[#A4E0D1] rounded-[4px] border border-[#A4E0D1]/30">
                      PWA
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-light leading-relaxed">
                    Install on Windows / Mac for quick taskbar launch and distraction-free workflow.
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-2 bg-white text-[#1E4D40] hover:bg-[#EAF3F0] font-bold text-xs rounded-[8px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <Download size={13} />
                    <span>Install Desktop App</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom subtle copyright */}
          <div className="relative z-10 text-[11px] text-white/40">
            © {new Date().getFullYear()} Cheran Irrigation. All rights reserved.
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

      {/* iOS & Mobile Install Guide Modal */}
      {showIOSPrompt && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 border border-[#E4E1D8] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-[#2F6F5E] text-white flex items-center justify-center">
                  <Sprout size={16} />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#14213D] block">
                    Install Cheran App
                  </span>
                  <span className="text-[10px] text-[#52607D] block">
                    Add to iPhone / iPad Home Screen
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="text-[#8C97AB] hover:text-[#14213D] p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-[#52607D]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-[#14213D]">Share</strong> button in Safari's bottom toolbar (<Share size={13} className="inline text-[#2F6F5E] align-middle" />) or browser menu.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <span>
                  Scroll down the share sheet and select <strong className="text-[#14213D]">"Add to Home Screen"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong className="text-[#14213D]">Add</strong> in the top-right corner to install Cheran on your home screen.
                </span>
              </li>
            </ol>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowIOSPrompt(false)}
              className="w-full font-bold"
            >
              Got It
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
