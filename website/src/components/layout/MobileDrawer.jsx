import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Phone, Globe, ExternalLink, MapPin } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function MobileDrawer({ isOpen, onClose }) {
  const location = useLocation();
  const { lang, setLang, toggleLanguage, isTamil } = useLanguage();

  if (!isOpen) return null;

  const navLinks = [
    { name: isTamil ? "முகப்பு" : "Home", path: "/" },
    { name: isTamil ? "சேரன் இரிகேஷன்" : "Cheran Irrigation", path: "/cheran-irrigation" },
    { name: isTamil ? "சேரன் பிளாஸ்ட்" : "Cheran Plast", path: "/cheran-plast" },
    { name: isTamil ? "தயாரிப்புகள்" : "Products", path: "/products" },
    { name: isTamil ? "மானியங்கள்" : "Subsidy Guide", path: "/subsidy-guide" },
    { name: isTamil ? "எங்களைப் பற்றி" : "About", path: "/about" },
    { name: isTamil ? "தொடர்பு" : "Contact", path: "/contact" },
  ];

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#FAF8F1] shadow-2xl flex flex-col justify-between border-l border-[#E3DFD2] z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E3DFD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <img
              src="/logo/logo_withoutbg.png"
              alt="Cheran Group"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-sm text-[#14432B] leading-tight">
                CHERAN GROUP
              </span>
              <span className="text-[10px] text-[#4A5A52] uppercase tracking-wider">
                Est. 1983
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#4A5A52] hover:bg-[#F2EEE2] transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="p-4 flex-1 space-y-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#14432B] text-white font-semibold"
                    : "text-[#1b1c18] hover:bg-[#F2EEE2]"
                }`}
              >
                <span>{item.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#E8B923]" />}
              </Link>
            );
          })}
        </div>

        {/* Footer info & CTA */}
        <div className="p-4 border-t border-[#E3DFD2] bg-white space-y-3">
          {/* Language switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E3DFD2]/60">
            <span className="text-xs text-[#4A5A52] flex items-center gap-1.5">
              <Globe size={14} /> Language / மொழி:
            </span>
            <div className="inline-flex items-center p-0.5 bg-[#F2EEE2] border border-[#E3DFD2] rounded-md">
              <button
                type="button"
                onClick={() => setLang("ta")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                  isTamil
                    ? "bg-[#14432B] text-white shadow-xs"
                    : "text-[#4A5A52] hover:text-[#14432B]"
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
                  !isTamil
                    ? "bg-[#14432B] text-white shadow-xs"
                    : "text-[#4A5A52] hover:text-[#14432B]"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Toll Free Direct Dial */}
          <a
            href="tel:18004251595"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#14432B] hover:bg-[#1F6B3F] text-white text-xs font-bold tracking-wide shadow-sm transition-colors"
          >
            <Phone size={15} className="text-[#E8B923]" />
            <span>Toll-Free: 1800 425 1595</span>
          </a>

          {/* Plant address snippet */}
          <div className="text-[11px] text-[#4A5A52] flex items-start gap-1.5 pt-1">
            <MapPin size={13} className="text-[#1F6B3F] shrink-0 mt-0.5" />
            <span>Vijayamangalam, Erode District, TN – 638056</span>
          </div>
        </div>
      </div>
    </div>
  );
}
