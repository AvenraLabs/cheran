import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CheranIrrigationPage() {
  const { lang, t } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    farmerName: '',
    farmerPhone: '',
    district: 'Erode',
    acreage: '',
    primaryCrop: 'turmeric',
    waterSource: 'borewell',
    subsidyCategory: 'small',
    notes: '',
    needDossierHelp: true,
  });

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const subsidyDocs = [
    {
      num: 1,
      en: 'Chitta & RSR Copy',
      ta: 'சிட்டா & அடங்கல் நகல்',
      desc: 'Computerized digital copy from TN e-Services verifying land ownership records.',
    },
    {
      num: 2,
      en: 'Adangal (Current Pasali)',
      ta: 'நடப்பு பசலி அடங்கல்',
      desc: 'Proof of current crop cultivation issued by the Village Administrative Officer.',
    },
    {
      num: 3,
      en: 'VAO Certificate',
      ta: 'கிராம நிர்வாக அலுவலர் சான்றிதழ்',
      desc: 'Attestation confirming actual possession, water source, and cultivation boundary.',
    },
    {
      num: 4,
      en: 'Land Survey Map (FMB)',
      ta: 'புல வரைபடம்',
      desc: 'Field Measurement Book (FMB) sketch indicating exact parcel dimensions and borewell location.',
    },
    {
      num: 5,
      en: 'Joint Survey Map (if co-owned)',
      ta: 'கூட்டு புல வரைபடம்',
      desc: 'Sub-division sketch signed by co-pattadars if land is held jointly under undivided ownership.',
    },
    {
      num: 6,
      en: 'Small / Marginal Farmer Certificate',
      ta: 'சிறு / குறு விவசாயி சான்றிதழ்',
      desc: 'Issued by Revenue Tahsildar for claiming 100% total subsidy entitlement.',
    },
    {
      num: 7,
      en: 'Registered Sale Deed / Ownership Copy',
      ta: 'பத்திர நகல்',
      desc: 'Clear photocopy of registered title deed proving legal proprietorship of agricultural parcel.',
    },
    {
      num: 8,
      en: 'Smart Ration Card Copy',
      ta: 'குடும்ப அட்டை நகல்',
      desc: 'Tamil Nadu Civil Supplies smart family card copy for beneficiary family registry.',
    },
    {
      num: 9,
      en: 'Aadhaar Card Copy',
      ta: 'ஆதார் அட்டை நகல்',
      desc: 'UIDAI identity card with active linked mobile number for OTP subsidy portal verification.',
    },
    {
      num: 10,
      en: 'Water & Soil Test Report',
      ta: 'பாசன நீர் & மண் பரிசோதனை அறிக்கை',
      desc: 'pH, electrical conductivity, and TDS certificate from certified agri laboratory.',
    },
    {
      num: 11,
      en: 'Nationalized Bank Passbook Copy',
      ta: 'வங்கி கணக்கு புத்தக நகல்',
      desc: 'First page showing IFSC code, account number, and farmer\'s name for direct DBT transfer.',
    },
    {
      num: 12,
      en: 'Passport Size Photographs (3 Nos.)',
      ta: 'புகைப்படம் 3',
      desc: 'Recent passport-size color photographs for physical application docket and field book.',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* =========================================================================
          1. DIVISION BANNER & HERO SECTION
         ========================================================================= */}
      <section className="relative w-full bg-paper-50 overflow-hidden border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          {/* Sub-header Breadcrumb & Portal Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-line-200/60">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-steel-600">
              <a href="/" className="hover:text-forest-700 font-medium transition-colors">
                Cheran Group
              </a>
              <span>/</span>
              <span className="text-forest-900 font-bold">Cheran Irrigation Division</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-forest-900 font-mono text-[11px]">
                Mfg Unit II • Est. 2017
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 bg-paper-100 px-3 py-1 rounded-full border border-line-200">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></span>
              <span>Govt. Subsidy Portal Active (TN-HORTI / PMKSY)</span>
            </div>
          </div>

          {/* Hero Content Grid (7-Col Text + 5-Col Image) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8">
            {/* Left 7 Columns */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded font-mono text-xs text-forest-900 mb-4 border border-line-200">
                <span className="material-symbols-outlined text-sun-500 text-base">verified</span>
                <span className="font-bold tracking-wider uppercase">IS:13488:2008 • IS:13487:2024 Licensed</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-[1.12] mb-4">
                {lang === 'ta'
                  ? 'ஒவ்வொரு துளிக்கும் துல்லியம்: நுண்ணீர்ப் பாசனம் மற்றும் நீர் சேமிப்பு தீர்வுகள்'
                  : 'Engineered for Every Drop: Micro-Irrigation & Water Conservation Solutions.'}
              </h1>

              <p className="text-base sm:text-lg text-steel-600 max-w-2xl mb-8 leading-relaxed">
                {lang === 'ta'
                  ? 'தென்னிந்திய விவசாயிகளுக்காக உயர் திறன் கொண்ட சொட்டு நீர் அமைப்புகள், தெளிப்பான் வலைப்பின்னல்கள் மற்றும் 100% அரசு மானிய உதவி 2017 முதல் வழங்கப்படுகிறது.'
                  : 'Empowering farmers across South India with high-efficiency drip systems, sprinkler networks, and complete Tamil Nadu Horticulture / PMKSY subsidy facilitation since 2017.'}
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <a
                  href="#subsidy-checklist"
                  className="inline-flex items-center justify-center bg-forest-700 hover:bg-forest-900 text-paper-50 px-6 py-3.5 rounded font-semibold text-sm transition-all shadow-sm gap-2 text-center"
                >
                  <span>View Subsidy Checklist (12 Docs)</span>
                  <span className="material-symbols-outlined text-lg">arrow_downward</span>
                </a>
                <a
                  href="tel:18004251595"
                  className="inline-flex items-center justify-center bg-paper-100 hover:bg-surface-container-high text-forest-900 px-6 py-3.5 rounded font-semibold text-sm border border-line-200 transition-all gap-2 text-center"
                >
                  <span className="material-symbols-outlined text-sun-500 text-xl">support_agent</span>
                  <span>Toll-Free 1800 425 1595</span>
                </a>
              </div>

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-3 gap-4 mt-10 pt-6 border-t border-line-200/60 w-full">
                <div className="flex flex-col">
                  <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 leading-none">
                    65%
                  </span>
                  <span className="text-xs uppercase tracking-wider text-steel-600 font-medium mt-2">
                    Water Saved / Acre
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 leading-none">
                    100%
                  </span>
                  <span className="text-xs uppercase tracking-wider text-steel-600 font-medium mt-2">
                    Subsidy (SM Farmers)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 leading-none">
                    40+
                  </span>
                  <span className="text-xs uppercase tracking-wider text-steel-600 font-medium mt-2">
                    Years Group Legacy
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Hero Droplet Visual */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative bg-surface-container rounded-xl overflow-hidden shadow-lg border border-line-200">
                <img
                  src="/images/hero-drip-droplet.jpeg"
                  alt="Cheran Precision Drip Emitter delivering single regulated droplet in agricultural soil"
                  className="w-full h-80 sm:h-96 lg:h-[460px] object-cover object-center transform hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-forest-900/95 via-forest-900/70 to-transparent p-6 text-paper-50">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-sun-500 font-bold block mb-1">
                        Field Proven Precision
                      </span>
                      <p className="font-serif text-xl sm:text-2xl font-bold text-paper-50">
                        Non-Clogging Labyrinth Emitters
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-surface-container-high block">Flow Rates</span>
                      <span className="text-sm sm:text-base font-bold text-sun-500 font-mono">
                        2 LPH • 4 LPH
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. PANORAMIC FIELD PERFORMANCE STRIP
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-12 md:py-16 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5">
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block mb-2">
                Landscape Scale Irrigation
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 tracking-tight mb-3">
                Engineered for Harsh Agro-Climates
              </h2>
              <p className="text-sm sm:text-base text-steel-600 leading-relaxed mb-6">
                From the red laterite soils of Erode and Tiruppur to the heavy black cotton belts of Coimbatore and Salem, Cheran micro-irrigation networks sustain steady operating pressure across undulating farmland contours.
              </p>
              <div className="p-4 bg-paper-50 rounded-lg shadow-sm border border-line-200">
                <span className="text-xs uppercase tracking-wider text-steel-600 block mb-1 font-semibold">
                  State Subsidies Facilitated
                </span>
                <p className="font-serif text-lg font-bold text-forest-900">
                  PMKSY • TN Horticulture Dept.
                </p>
                <p className="text-xs text-steel-600 mt-1">
                  100% subsidy for Small/Marginal farmers (&lt;5 acres); 75% for other farmers with direct liaison.
                </p>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="relative rounded-xl overflow-hidden shadow-md border border-line-200">
                <img
                  src="/images/crops-farmland.jpeg"
                  alt="Vast micro-irrigated farmland with Cheran drip lateral networks stretching across plantation rows"
                  className="w-full h-72 sm:h-96 object-cover object-center"
                />
                <div className="absolute top-4 right-4 bg-forest-900/90 text-paper-50 px-3.5 py-1.5 rounded font-mono text-xs flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-sun-500 text-base">verified</span>
                  <span>Field Inspection Verified • Perundurai Taluk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. TECHNICAL PRODUCT LINEUP (4-PILLAR ENGINEERING SUITE)
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 md:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Section Intro */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-line-200">
            <div>
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block mb-2">
                Production Grade Equipment
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight">
                Micro-Irrigation Engineering Suite
              </h2>
            </div>
            <p className="text-sm text-steel-600 max-w-md mt-2 md:mt-0 leading-relaxed">
              Precision manufactured in Vijayamangalam to BIS national benchmarks. Fully certified against UV degradation and hard groundwater chemical scaling.
            </p>
          </div>

          {/* 4-Pillar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* 01: Inline Drip Emitter Tubes */}
            <div className="bg-paper-100 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow border border-line-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-forest-700 text-paper-50 text-[11px] font-mono uppercase tracking-wider font-bold">
                    IS:13488:2008 • IS:13487:2024
                  </span>
                  <span className="text-xs text-steel-600 font-mono">Category 01</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                  Inline Drip Emitter Tubes
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 mb-4 leading-relaxed">
                  Continuous extrusion virgin LLDPE lateral piping fitted with precision cylindrical and flat turbulent-flow labyrinth emitters designed to resist particulate clogging and sediment build-up.
                </p>

                {/* Technical Table */}
                <div className="bg-paper-50 rounded-lg overflow-x-auto mb-4 border border-line-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-steel-600 uppercase font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3">Standard Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200/60 font-sans">
                      <tr>
                        <td className="py-2 px-3 font-medium text-forest-900">Nominal Diameter</td>
                        <td className="py-2 px-3 font-mono text-steel-600">12 mm, 16 mm, 20 mm</td>
                      </tr>
                      <tr className="bg-paper-100/50">
                        <td className="py-2 px-3 font-medium text-forest-900">Discharge Rates</td>
                        <td className="py-2 px-3 font-mono text-steel-600">2.0 LPH • 4.0 LPH</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-forest-900">Wall Thickness (Class)</td>
                        <td className="py-2 px-3 font-mono text-steel-600">0.6 mm – 1.2 mm (Class 1 to 3)</td>
                      </tr>
                      <tr className="bg-paper-100/50">
                        <td className="py-2 px-3 font-medium text-forest-900">Emitter Spacing</td>
                        <td className="py-2 px-3 font-mono text-steel-600">20 cm, 30 cm, 40 cm, 50 cm, 60 cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line-200/60">
                <span className="text-xs text-forest-700 font-semibold">
                  Suitable for: Turmeric, Banana, Vegetables & Coconut
                </span>
                <a
                  href="tel:18004251595"
                  className="inline-flex items-center text-forest-900 hover:text-forest-700 text-xs font-bold gap-1"
                >
                  <span>Request Quote</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 02: Automated & Manual Filtration Stations */}
            <div className="bg-paper-100 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow border border-line-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-forest-700 text-paper-50 text-[11px] font-mono uppercase tracking-wider font-bold">
                    BIS / Primary Filtration
                  </span>
                  <span className="text-xs text-steel-600 font-mono">Category 02</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                  Filtration Stations & Hydrocyclones
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 mb-4 leading-relaxed">
                  Industrial media batteries, hydrocyclone centrifugal sand separators, and heavy-duty disc/screen filters engineered to protect laterals from borehole sand grit, silt, and canal algae.
                </p>

                <div className="relative rounded-lg overflow-hidden mb-4 border border-line-200 shadow-sm">
                  <img
                    src="/images/filtration-media.png"
                    alt="Cheran heavy industrial triple-tank sand media and disc filtration battery"
                    className="w-full h-44 object-cover object-center"
                  />
                  <div className="absolute bottom-2 left-2 bg-forest-900/90 text-paper-50 px-2.5 py-1 rounded text-[11px] font-mono">
                    Triple Vessel Sand-Media + Secondary Disc
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-paper-50 p-3 rounded-lg border border-line-200 text-xs">
                  <div>
                    <span className="text-[11px] text-steel-600 block uppercase font-mono">Max Pressure</span>
                    <span className="font-bold text-forest-900">10 Bar (PN 10)</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-steel-600 block uppercase font-mono">Mesh Rating</span>
                    <span className="font-bold text-forest-900">120 – 150 Mesh (130 Micron)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line-200/60 mt-4">
                <span className="text-xs text-forest-700 font-semibold">
                  Corrosion-resistant epoxy coated steel
                </span>
                <a
                  href="tel:18004251595"
                  className="inline-flex items-center text-forest-900 hover:text-forest-700 text-xs font-bold gap-1"
                >
                  <span>View Specs</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 03: Overhead Sprinklers & Heavy Rain Guns */}
            <div className="bg-paper-100 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow border border-line-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-forest-700 text-paper-50 text-[11px] font-mono uppercase tracking-wider font-bold">
                    Overhead Irrigation
                  </span>
                  <span className="text-xs text-steel-600 font-mono">Category 03</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                  Impact Sprinklers & Rain Guns
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 mb-4 leading-relaxed">
                  Full and part-circle micro-sprinklers, mini-sprinklers, and wide-throw agricultural rain guns delivering uniform precipitation distribution for dense close-planted crops and plantations.
                </p>

                <div className="relative rounded-lg overflow-hidden mb-4 border border-line-200 shadow-sm">
                  <img
                    src="/images/sprinkler-mist.jpeg"
                    alt="Cheran heavy duty impact sprinkler spraying continuous water mist over plantation crop canopy"
                    className="w-full h-44 object-cover object-center"
                  />
                  <div className="absolute bottom-2 left-2 bg-forest-900/90 text-paper-50 px-2.5 py-1 rounded text-[11px] font-mono">
                    Model CR-40 High Trajectory Impact Gun
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-paper-50 p-3 rounded-lg border border-line-200 text-xs">
                  <div>
                    <span className="text-[11px] text-steel-600 block uppercase font-mono">Throw Radius</span>
                    <span className="font-bold text-forest-900">12m – 45m Spray Radius</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-steel-600 block uppercase font-mono">Body Material</span>
                    <span className="font-bold text-forest-900">Delrin / Cast Gunmetal</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line-200/60 mt-4">
                <span className="text-xs text-forest-700 font-semibold">
                  Ideal for: Sugarcane, Groundnut, Tea & Fodder
                </span>
                <a
                  href="tel:18004251595"
                  className="inline-flex items-center text-forest-900 hover:text-forest-700 text-xs font-bold gap-1"
                >
                  <span>Technical Data</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 04: Venturi & Fertilizer Injection Systems */}
            <div className="bg-paper-100 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow border border-line-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-forest-700 text-paper-50 text-[11px] font-mono uppercase tracking-wider font-bold">
                    Precision Fertigation
                  </span>
                  <span className="text-xs text-steel-600 font-mono">Category 04</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                  Venturi Fertigation & Dosing Injectors
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 mb-4 leading-relaxed">
                  Differential pressure venturi injectors delivering soluble fertilizers, micronutrients, and soil conditioners directly into the crop root zone with zero electrical energy requirements.
                </p>

                {/* Venturi Table */}
                <div className="bg-paper-50 rounded-lg overflow-x-auto mb-4 border border-line-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container text-steel-600 uppercase font-mono">
                      <tr>
                        <th className="py-2 px-3">Size</th>
                        <th className="py-2 px-3">Suction Capacity</th>
                        <th className="py-2 px-3">Operating Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200/60 font-sans">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-forest-900">3/4" (20 mm)</td>
                        <td className="py-2 px-3 font-mono text-steel-600">10 to 45 LPH</td>
                        <td className="py-2 px-3 font-mono text-steel-600">0.7 – 7.0 Bar</td>
                      </tr>
                      <tr className="bg-paper-100/50">
                        <td className="py-2 px-3 font-semibold text-forest-900">1" (25 mm)</td>
                        <td className="py-2 px-3 font-mono text-steel-600">30 to 110 LPH</td>
                        <td className="py-2 px-3 font-mono text-steel-600">0.7 – 7.0 Bar</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-forest-900">2" (50 mm) High Flow</td>
                        <td className="py-2 px-3 font-mono text-steel-600">200 to 1200 LPH</td>
                        <td className="py-2 px-3 font-mono text-steel-600">1.0 – 8.5 Bar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-surface-container rounded text-xs text-forest-900 border border-line-200">
                  <span className="font-bold block mb-0.5">Acid & Fertilizer Resistant PVDF:</span>
                  <p className="text-steel-600 text-[11px]">
                    Built to withstand sulfuric acid, phosphoric acid, and aggressive soluble agrochemicals without embrittlement.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-line-200/60 mt-4">
                <span className="text-xs text-forest-700 font-semibold">
                  Includes non-return check valve + rotameter
                </span>
                <a
                  href="tel:18004251595"
                  className="inline-flex items-center text-forest-900 hover:text-forest-700 text-xs font-bold gap-1"
                >
                  <span>Inquire Sizing</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SUBSIDY DOCUMENTS CHECKLIST (AUTHORITATIVE COMPLIANCE DOSSIER)
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-12 md:py-20 border-b border-line-200" id="subsidy-checklist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Section Header */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sun-500/20 text-forest-900 rounded font-mono text-xs mb-3 border border-sun-500/30">
              <span className="material-symbols-outlined text-base">assignment_turned_in</span>
              <span className="font-bold uppercase tracking-wider">Horticulture Department Verification Process</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight mb-3">
              Government Subsidy Mandatory Document Checklist
            </h2>
            <p className="text-sm sm:text-base text-steel-600 leading-relaxed">
              Under PMKSY and Tamil Nadu Micro Irrigation Scheme guidelines, farmers are entitled to{' '}
              <span className="font-semibold text-forest-900">100% subsidy for Small & Marginal farmers (up to 5 acres)</span>{' '}
              and <span className="font-semibold text-forest-900">75% subsidy for other landholders</span>. Prepare the following verified 12 documentation items for expedited approval.
            </p>
          </div>

          {/* Checklist Container */}
          <div className="bg-paper-50 rounded-xl p-6 sm:p-8 lg:p-10 shadow-md border border-line-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-line-200">
              <div>
                <span className="text-xs text-sun-500 uppercase font-mono font-bold tracking-wider block">
                  Official Scheme Documentation
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                  12-Point Farmer Verification Dossier
                </h3>
                <p className="text-xs text-forest-700 font-medium mt-0.5">
                  தேவையான 12 அரசு மானிய ஆவணங்கள் பட்டியல்
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-paper-100 hover:bg-surface-container-high text-forest-900 text-xs font-semibold border border-line-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Print Checklist</span>
                </button>
                <span className="px-3 py-1.5 rounded bg-forest-700 text-paper-50 text-xs font-mono font-bold uppercase">
                  100% Verified Guide
                </span>
              </div>
            </div>

            {/* 12 Items Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subsidyDocs.map((doc) => (
                <div key={doc.num} className="flex items-start gap-3 p-4 bg-paper-100 rounded-lg border border-line-200/70">
                  <div className="w-8 h-8 rounded-full bg-forest-700 text-paper-50 flex items-center justify-center shrink-0 font-mono text-sm font-bold shadow-sm">
                    {doc.num}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-base font-bold text-forest-900">
                      {doc.en}
                    </span>
                    <span className="text-xs text-forest-700 font-medium">
                      {doc.ta}
                    </span>
                    <span className="text-xs text-steel-600 mt-1 leading-relaxed">
                      {doc.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Assistance Helpline Bar */}
            <div className="mt-8 p-5 bg-surface-container rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-line-200">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-sun-500/20 flex items-center justify-center text-forest-900 shrink-0">
                  <span className="material-symbols-outlined text-2xl">edit_document</span>
                </div>
                <div>
                  <p className="font-serif text-base sm:text-lg font-bold text-forest-900">
                    Need assistance compiling these 12 documents?
                  </p>
                  <p className="text-xs text-steel-600 mt-0.5">
                    Our Erode technical liaison team visits your land parcel and prepares the complete dossier free of charge.
                  </p>
                </div>
              </div>
              <a
                href="tel:18004251595"
                className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 px-5 py-2.5 rounded text-xs sm:text-sm font-semibold transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-sun-500 text-base">call</span>
                <span>Call Subsidy Desk: 1800 425 1595</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. DIRECT FIELD ASSISTANCE & QUOTATION INQUIRY
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 md:py-20 border-b border-line-200" id="inquiry">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* 5-Col Direct Liaison & Contact */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block mb-2">
                  Engineering Support
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 tracking-tight mb-3">
                  Speak to a Micro-Irrigation Field Engineer
                </h2>
                <p className="text-sm text-steel-600 leading-relaxed mb-6">
                  Get customized lateral layout designs, water pump hydraulic head calculations, and filtration battery sizing based on your borewell output (LPM) and soil profile.
                </p>

                {/* Operational Cards */}
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-paper-100 rounded-lg border border-line-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-forest-700 text-xl">call</span>
                      <span className="text-xs text-steel-600 uppercase font-bold tracking-wider">
                        Direct Engineer Hotline
                      </span>
                    </div>
                    <a href="tel:+919842811595" className="font-serif text-xl font-bold text-forest-900 hover:text-forest-700 transition-colors block">
                      +91 98428 11595
                    </a>
                    <p className="text-xs text-steel-600 mt-0.5">
                      Mon – Sat: 8:00 AM – 7:30 PM (Tamil & English)
                    </p>
                  </div>

                  <div className="p-4 bg-paper-100 rounded-lg border border-line-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-forest-700 text-xl">support_agent</span>
                      <span className="text-xs text-steel-600 uppercase font-bold tracking-wider">
                        State Toll-Free Helpline
                      </span>
                    </div>
                    <a href="tel:18004251595" className="font-serif text-xl font-bold text-forest-900 hover:text-forest-700 transition-colors block">
                      1800 425 1595
                    </a>
                    <p className="text-xs text-steel-600 mt-0.5">
                      Toll-free across Tamil Nadu, Kerala, and Karnataka
                    </p>
                  </div>

                  <div className="p-4 bg-paper-100 rounded-lg border border-line-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-forest-700 text-xl">factory</span>
                      <span className="text-xs text-steel-600 uppercase font-bold tracking-wider">
                        Manufacturing Unit II
                      </span>
                    </div>
                    <p className="text-xs text-forest-900 font-medium leading-relaxed">
                      Cheran Irrigation, S.F.No.145, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Erode District, Tamil Nadu – 638056.
                    </p>
                    <a href="mailto:cherrandrip@gmail.com" className="inline-flex items-center gap-1.5 mt-2 text-forest-700 text-xs font-semibold hover:underline">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span>cherrandrip@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Col Fast Field Quotation Form */}
            <div className="lg:col-span-7 bg-paper-100 p-6 sm:p-8 lg:p-10 rounded-xl shadow-md border border-line-200">
              <div className="pb-4 mb-4 border-b border-line-200">
                <span className="text-xs text-forest-700 uppercase font-mono font-bold tracking-wider block">
                  Expedited Field Estimate
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                  Request Custom Irrigation Design & Subsidy Check
                </h3>
                <p className="text-xs text-steel-600 mt-1">
                  Submit your land particulars. A field engineer will respond within 4 business hours.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 bg-forest-700/10 border border-forest-700/30 rounded-lg text-center my-6">
                  <span className="material-symbols-outlined text-forest-700 text-4xl mb-2">check_circle</span>
                  <h4 className="font-serif text-lg font-bold text-forest-900 mb-1">
                    Inquiry Submitted Successfully
                  </h4>
                  <p className="text-xs text-steel-600 max-w-md mx-auto">
                    Thank you {formData.farmerName}. A Cheran Irrigation engineer has received your details for {formData.district} ({formData.acreage}) and will contact you at {formData.farmerPhone} shortly with your hydraulic calculation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="mt-4 text-xs font-semibold text-forest-700 hover:underline"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="farmerName">
                        Farmer / Beneficiary Name *
                      </label>
                      <input
                        id="farmerName"
                        type="text"
                        required
                        value={formData.farmerName}
                        onChange={handleInputChange}
                        placeholder="e.g. S. Murugesan"
                        className="px-3.5 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="farmerPhone">
                        Mobile Number (Aadhaar linked) *
                      </label>
                      <input
                        id="farmerPhone"
                        type="tel"
                        required
                        value={formData.farmerPhone}
                        onChange={handleInputChange}
                        placeholder="e.g. 98428 12345"
                        className="px-3.5 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="district">
                        District *
                      </label>
                      <select
                        id="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="px-3 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option value="Erode">Erode</option>
                        <option value="Coimbatore">Coimbatore</option>
                        <option value="Tiruppur">Tiruppur</option>
                        <option value="Salem">Salem</option>
                        <option value="Namakkal">Namakkal</option>
                        <option value="Dharmapuri">Dharmapuri</option>
                        <option value="Other">Other Tamil Nadu</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="acreage">
                        Acreage *
                      </label>
                      <input
                        id="acreage"
                        type="text"
                        required
                        value={formData.acreage}
                        onChange={handleInputChange}
                        placeholder="e.g. 3.5 Acres"
                        className="px-3.5 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="primaryCrop">
                        Crop Type *
                      </label>
                      <select
                        id="primaryCrop"
                        value={formData.primaryCrop}
                        onChange={handleInputChange}
                        className="px-3 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option value="turmeric">Turmeric / மஞ்சள்</option>
                        <option value="banana">Banana / வாழை</option>
                        <option value="coconut">Coconut / தென்னை</option>
                        <option value="sugarcane">Sugarcane / கரும்பு</option>
                        <option value="vegetables">Vegetables / காய்கறிகள்</option>
                        <option value="groundnut">Groundnut / நிலக்கடலை</option>
                        <option value="horticulture">Horticulture Orchard</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="waterSource">
                        Water Source
                      </label>
                      <select
                        id="waterSource"
                        value={formData.waterSource}
                        onChange={handleInputChange}
                        className="px-3 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option value="borewell">Deep Borewell</option>
                        <option value="openwell">Open Agricultural Well</option>
                        <option value="canal">Canal / Farm Pond</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="subsidyCategory">
                        Subsidy Category
                      </label>
                      <select
                        id="subsidyCategory"
                        value={formData.subsidyCategory}
                        onChange={handleInputChange}
                        className="px-3 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option value="small">Small/Marginal Farmer (&lt;5 Acres - 100% Subsidy)</option>
                        <option value="general">Other Farmer (&gt;5 Acres - 75% Subsidy)</option>
                        <option value="direct">Commercial / Direct Purchase</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-forest-900 uppercase" htmlFor="notes">
                      Additional Field Specifications or Requirements
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Specify pump HP, existing pipe line diameter, or any known water salinity issues..."
                      className="px-3.5 py-2 rounded bg-paper-50 text-forest-900 border border-line-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      id="needDossierHelp"
                      type="checkbox"
                      checked={formData.needDossierHelp}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded text-forest-700 focus:ring-forest-700 mt-0.5 border-line-200"
                    />
                    <label htmlFor="needDossierHelp" className="text-xs text-steel-600 leading-snug">
                      Please request your local officer to assist in collecting the 12 subsidy documents.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-sm font-bold py-3.5 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Submit for Engineering & Subsidy Assessment</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FACTORY QUALITY ASSURANCE & BIS COMPLIANCE BANNER
         ========================================================================= */}
      <section className="w-full bg-forest-900 text-paper-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8">
              <span className="text-xs text-sun-500 uppercase font-mono font-bold tracking-widest block mb-2">
                Factory Pedigree & Compliance
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-paper-50 tracking-tight mb-3">
                Precision Manufacturing to Bureau of Indian Standards
              </h2>
              <p className="text-sm sm:text-base text-surface-container-high leading-relaxed mb-6">
                Every batch of Cheran drip lateral pipe undergoes continuous hydrostatic pressure endurance testing, emitter pull-out tests, and tensile elongation verification at our Vijayamangalam factory laboratory prior to dispatch.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-forest-700/50 p-3 rounded border border-[rgba(227,223,210,0.15)]">
                  <span className="font-mono text-xs font-bold text-sun-500 block">IS:13488:2008</span>
                  <span className="text-xs text-paper-50">Drip Irrigation Pipes</span>
                </div>
                <div className="bg-forest-700/50 p-3 rounded border border-[rgba(227,223,210,0.15)]">
                  <span className="font-mono text-xs font-bold text-sun-500 block">IS:13487:2024</span>
                  <span className="text-xs text-paper-50">Emitters & Drippers</span>
                </div>
                <div className="bg-forest-700/50 p-3 rounded border border-[rgba(227,223,210,0.15)]">
                  <span className="font-mono text-xs font-bold text-sun-500 block">IS:12786:2024</span>
                  <span className="text-xs text-paper-50">Lateral Poly Pipes</span>
                </div>
                <div className="bg-forest-700/50 p-3 rounded border border-[rgba(227,223,210,0.15)]">
                  <span className="font-mono text-xs font-bold text-sun-500 block">IS:4985:2021</span>
                  <span className="text-xs text-paper-50">uPVC Mainlines</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-forest-700/30 p-6 rounded-xl flex flex-col justify-between border border-[rgba(227,223,210,0.2)]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-sun-500 text-2xl">pin_drop</span>
                  <h3 className="font-serif text-lg font-bold text-paper-50">Plant Visit & Dispatch</h3>
                </div>
                <p className="text-xs text-surface-container-high leading-relaxed mb-4">
                  Farmers, dealer partners, and horticulture officials are welcome to inspect extrusion lines and hydraulic testing benches in person.
                </p>
                <div className="text-xs text-surface-container-high space-y-1 font-sans">
                  <p><strong className="text-paper-50">Location:</strong> Vijayamangalam (NH 544 Corridor)</p>
                  <p><strong className="text-paper-50">Dist:</strong> Erode, Tamil Nadu 638056</p>
                  <p><strong className="text-paper-50">Direct Line:</strong> +91 94433 42087</p>
                </div>
              </div>
              <div className="mt-6">
                <a
                  href="tel:18004251595"
                  className="w-full inline-flex items-center justify-center gap-2 bg-sun-500 hover:bg-yellow-500 text-forest-900 text-xs font-bold py-3 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                  <span>Schedule Plant Inspection</span>
                </a>
              </div>
            </div>
          </div>

          {/* Cherran Irrigation Google Map Embed */}
          <div className="pt-8 border-t border-[rgba(227,223,210,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-paper-50">
                  Cherran Irrigation Systems Campus – Vijayamangalam
                </h4>
                <p className="text-xs text-surface-container-high">
                  S.F. No. 145, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Tamil Nadu 638056 (Opposite TNEB Substation)
                </p>
              </div>
              <a
                href="https://www.google.com/maps/place/Cherran+irrigation/@11.2366667,77.494745,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba90d007e983dfb:0xf72310b486aad996!8m2!3d11.2366667!4d77.494745"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-sun-500 hover:bg-yellow-500 text-forest-900 text-xs font-bold px-4 py-2.5 rounded transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-base">directions</span>
                <span>Open in Google Maps / Directions</span>
              </a>
            </div>

            <div className="w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-[rgba(227,223,210,0.3)] shadow-md bg-forest-900 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3913.3361103421166!2d77.4947449564934!3d11.236666655525854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba90d007e983dfb%3A0xf72310b486aad996!2sCherran%20irrigation!5e0!3m2!1sen!2sin!4v1789807782013!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Cherran Irrigation Google Map Location Vijayamangalam"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
