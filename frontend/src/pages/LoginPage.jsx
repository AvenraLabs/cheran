import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowRight, Download, Share, X } from "lucide-react";
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
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect mobile
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
    setIsMobile(isMobileDevice);

    // Capture standard PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers without direct prompt event
      setShowIOSPrompt(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
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
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/icon.png" alt="App Icon" className="w-7 h-7 rounded-[6px] object-contain shrink-0" />
            <span className="text-xs font-bold text-white truncate">Install App</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-[#1E4D40] hover:bg-[#EAF3F0] active:scale-95 text-xs font-bold rounded-[6px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
        <div className="lg:w-5/12 bg-gradient-to-br from-[#1E4D40] via-[#2F6F5E] to-[#14382F] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[200px] lg:min-h-screen">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#13362C]/40 rounded-full blur-3xl pointer-events-none" />

          {/* Center Minimal Typography */}
          <div className="relative z-10 my-auto space-y-4 max-w-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              Enterprise Operations & Management Portal.
            </h2>

            {/* Desktop PWA Install Button (Minimal - No verbose text) */}
            {!isMobile && !isInstalled && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#1E4D40] hover:bg-[#EAF3F0] active:scale-95 font-bold text-xs rounded-[10px] shadow-sm transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>Install App</span>
                </button>
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
            {/* Brand Logo & Header on White Side */}
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="Cheran Logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div className="text-base sm:text-lg font-bold tracking-tight text-[#14213D] leading-none font-display">
                CHERAN IRRIGATION
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] tracking-tight">
                Sign In
              </h1>
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

      {/* Device-Specific PWA Installation Guide Modal */}
      {showIOSPrompt && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            className="bg-white rounded-[16px] max-w-sm w-full p-5 space-y-4 border border-[#E4E1D8] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
              <div className="flex items-center gap-2.5">
                <img src="/icon.png" alt="Cheran Logo" className="w-8 h-8 rounded-[8px] object-contain shrink-0" />
                <div>
                  <span className="text-sm font-bold text-[#14213D] block">
                    Install Cheran ERP App
                  </span>
                  <span className="text-[10px] text-[#52607D]">
                    {isIOS ? "iOS Safari Guide" : isMobile ? "Android Chrome Guide" : "Desktop Browser Guide"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="text-[#8C97AB] hover:text-[#14213D] p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="py-1 text-xs text-[#52607D] space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>Tap the <Share size={13} className="inline text-[#2F6F5E] align-text-bottom mx-0.5" /> <strong>Share</strong> button at the bottom of Safari</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top right corner</span>
                </div>
              </div>
            ) : isMobile ? (
              /* Android Instructions */
              <div className="py-1 text-xs text-[#52607D] space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Install</strong> to add Cheran ERP to your apps</span>
                </div>
              </div>
            ) : (
              /* Desktop Instructions */
              <div className="py-1 text-xs text-[#52607D] space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>Click the <strong>Install App icon (⊕ / ⤓)</strong> in your browser address bar</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>Click <strong>Install</strong> in the popup to add to your desktop</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 bg-[#2F6F5E] hover:bg-[#255b4d] text-white font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
