import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, Menu, Globe } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import MobileDrawer from "./MobileDrawer.jsx";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, setLang, isTamil } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: isTamil ? "முகப்பு" : "Home", path: "/" },
    { name: isTamil ? "சேரன் இரிகேஷன்" : "Cheran Irrigation", path: "/cheran-irrigation" },
    { name: isTamil ? "சேரன் பிளாஸ்ட்" : "Cheran Plast", path: "/cheran-plast" },
    { name: isTamil ? "தயாரிப்புகள்" : "Products", path: "/products" },
    { name: isTamil ? "மானியங்கள்" : "Subsidy Guide", path: "/subsidy-guide" },
    { name: isTamil ? "எங்களைப் பற்றி" : "About", path: "/about" },
    { name: isTamil ? "தொடர்பு" : "Contact", path: "/contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          scrolled
            ? "bg-[#FAF8F1]/95 backdrop-blur-md shadow-xs border-b border-[#E3DFD2]"
            : "bg-[#FAF8F1] border-b border-[#E3DFD2]"
        }`}
      >
        <div className="w-full max-w-[1520px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 h-20 flex items-center justify-between gap-2 lg:gap-4 overflow-hidden">
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <img
              src="/logo/logo_withoutbg.png"
              alt="Cheran Group Logo"
              className="h-9 sm:h-10 lg:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg lg:text-xl font-bold text-[#14432B] tracking-tight leading-none">
                CHERAN GROUP
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#4A5A52] uppercase tracking-wider mt-1 font-medium hidden sm:block">
                {isTamil ? "பாசனம் & குழாய்கள் • 1983 முதல்" : "Precision Irrigation & Piping • Est. 1983"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-2 xl:gap-2.5 2xl:gap-4.5 justify-center flex-1 min-w-0 px-2">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[11px] 2xl:text-xs uppercase tracking-wider py-1 px-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-[#1F6B3F] font-bold border-b-2 border-[#1F6B3F]"
                      : "text-[#414942] font-semibold hover:text-[#14432B]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions (Always Fixed to Right, Never Cut Off) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Toll-Free Call Pill - Full on 2XL, Compact on XL */}
            <a
              href="tel:18004251595"
              className="hidden 2xl:flex items-center gap-2 bg-[#14432B] hover:bg-[#1F6B3F] text-[#FAF8F1] px-3 py-1.5 rounded-full transition-colors shadow-xs shrink-0"
              title="Click to call Cheran Toll-Free hotline"
            >
              <Phone size={14} className="text-[#E8B923] shrink-0 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[8.5px] leading-tight text-[#E8B923] uppercase font-bold tracking-wider">
                  Toll-Free Helpline
                </span>
                <span className="text-[11.5px] font-bold font-mono tracking-tight leading-tight">
                  1800 425 1595
                </span>
              </div>
            </a>

            {/* Compact Toll-Free Pill on XL */}
            <a
              href="tel:18004251595"
              className="hidden lg:flex 2xl:hidden items-center gap-1.5 bg-[#14432B] hover:bg-[#1F6B3F] text-[#FAF8F1] px-2.5 py-1.5 rounded-full transition-colors shadow-xs shrink-0 text-xs font-bold font-mono"
              title="Click to call 1800 425 1595"
            >
              <Phone size={13} className="text-[#E8B923] shrink-0" />
              <span>1800 425 1595</span>
            </a>

            {/* Language Switcher - Clear Segmented Buttons [தமிழ் | EN] */}
            <div className="inline-flex items-center p-0.5 bg-[#F2EEE2] border border-[#E3DFD2] rounded-md shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setLang("ta")}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-all ${
                  isTamil
                    ? "bg-[#14432B] text-white shadow-xs"
                    : "text-[#4A5A52] hover:text-[#14432B]"
                }`}
                title="தமிழுக்கு மாற்றவும் (Switch to Tamil)"
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-[11px] font-bold rounded transition-all ${
                  !isTamil
                    ? "bg-[#14432B] text-white shadow-xs"
                    : "text-[#4A5A52] hover:text-[#14432B]"
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden p-2 rounded-lg text-[#14432B] hover:bg-[#F2EEE2] transition-colors border border-[#E3DFD2] shrink-0"
              aria-label="Open mobile navigation"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
