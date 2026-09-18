import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="w-full bg-forest-900 text-paper-50 border-t border-line-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
        {/* Two Manufacturing Units Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 pb-12 border-b border-[rgba(227,223,210,0.15)]">
          {/* Unit II: Cheran Irrigation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl text-paper-50 tracking-tight font-bold">
                {lang === 'ta' ? 'சேரன் இரிகேஷன்' : 'Cheran Irrigation'}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-forest-700 text-paper-50 border border-[rgba(227,223,210,0.2)] font-mono">
                Mfg Unit II • Est. 2017
              </span>
            </div>
            <p className="text-sm text-surface-container-high leading-relaxed">
              S.F.No.145, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Erode District, Tamil Nadu 638056.
            </p>
            <div className="flex flex-col gap-2 mt-2 text-sm text-surface-container-high">
              <a 
                href="mailto:cherrandrip@gmail.com"
                className="flex items-center gap-2 hover:text-sun-500 transition-colors"
              >
                <span className="material-symbols-outlined text-sun-500 text-lg">mail</span>
                <span>cherrandrip@gmail.com</span>
              </a>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a 
                  href="tel:+919842811595"
                  className="flex items-center gap-1.5 hover:text-sun-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sun-500 text-lg">phone_in_talk</span>
                  <span>+91 98428 11595</span>
                </a>
                <span className="text-steel-600 hidden sm:inline">|</span>
                <a 
                  href="tel:18004251595"
                  className="flex items-center gap-1 text-sun-500 font-semibold hover:text-yellow-400 transition-colors"
                >
                  <span>Toll-Free: 1800 425 1595</span>
                </a>
              </div>
            </div>
          </div>

          {/* Unit I: Cheran Plast */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl text-paper-50 tracking-tight font-bold">
                {lang === 'ta' ? 'சேரன் பிளாஸ்ட்' : 'Cheran Plast'}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-forest-700 text-paper-50 border border-[rgba(227,223,210,0.2)] font-mono">
                Mfg Unit I • Est. 1983
              </span>
            </div>
            <p className="text-sm text-surface-container-high leading-relaxed">
              S.F.No.137, Uthukuli Road, Vijayamangalam, Perundurai, Erode – 638056.
            </p>
            <div className="flex flex-col gap-2 mt-2 text-sm text-surface-container-high">
              <a 
                href="mailto:cheraanplast@yahoo.com"
                className="flex items-center gap-2 hover:text-sun-500 transition-colors"
              >
                <span className="material-symbols-outlined text-sun-500 text-lg">mail</span>
                <span>cheraanplast@yahoo.com</span>
              </a>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a 
                  href="tel:+919443342087"
                  className="flex items-center gap-1.5 hover:text-sun-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sun-500 text-lg">call</span>
                  <span>+91 94433 42087</span>
                </a>
                <span className="text-steel-600 hidden sm:inline">|</span>
                <a 
                  href="tel:+919842811595"
                  className="flex items-center gap-1 hover:text-sun-500 transition-colors"
                >
                  <span>+91 98428 11595</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BIS Certification Badges Row */}
        <div className="py-6 border-b border-[rgba(227,223,210,0.15)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sun-500 text-2xl">verified</span>
            <span className="text-xs uppercase tracking-wider font-semibold text-paper-50">
              Bureau of Indian Standards Compliant
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-surface-container-high">
            <span className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(227,223,210,0.2)] font-bold text-sun-500">
              ISI MARK CERTIFIED
            </span>
            <span className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(227,223,210,0.2)]">
              IS:4985:2021 (uPVC)
            </span>
            <span className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(227,223,210,0.2)]">
              IS:13488:2008 (Drip Lines)
            </span>
            <span className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(227,223,210,0.2)]">
              IS:13487:2024 (Emitters)
            </span>
            <span className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.06)] border border-[rgba(227,223,210,0.2)]">
              IS:12786:2024 (Lateral Pipes)
            </span>
          </div>
        </div>

        {/* Copyright and Secondary Nav */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-surface-container-high">
          <p className="text-center md:text-left">
            © 1983–2026 Cheran Group. Precision Piping & Agricultural Irrigation Solutions. Erode, Tamil Nadu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <a href="/subsidy-guide" className="hover:text-sun-500 transition-colors">
              Subsidy Portal
            </a>
            <span className="text-steel-600">•</span>
            <a href="/products" className="hover:text-sun-500 transition-colors">
              Specifications
            </a>
            <span className="text-steel-600">•</span>
            <a href="/certifications" className="hover:text-sun-500 transition-colors">
              BIS Certifications
            </a>
            <span className="text-steel-600">•</span>
            <a href="/contact" className="hover:text-sun-500 transition-colors">
              Factory Inquiries
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
