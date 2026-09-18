import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { lang, isTamil } = useLanguage();

  const productCards = [
    {
      title: isTamil ? 'எச்டிபிஇ பாசன லேட்டரல் குழாய்' : 'HDPE Irrigation Lateral Hose',
      standard: 'IS:12786:2024 COMPLIANT',
      spec: '12mm – 32mm',
      desc: isTamil
        ? 'சூரிய வெப்பம் மற்றும் விரிசலைத் தாங்கும் வகையில் கார்பன் பிளாக் கொண்டு உற்பத்தி செய்யப்படுகிறது.'
        : 'Manufactured with masterbatch carbon black for superior ultraviolet resistance, stress cracking prevention, and long life in tropical fields.',
      param: 'Pressure: 2.5 to 6 Bar',
      image: '/images/hose-warehouse.jpeg',
      link: '/products',
    },
    {
      title: isTamil ? 'ரிஜிட் பிவிசி பிரஷர் பைப்' : 'Rigid PVC Pressure Pipes',
      standard: 'IS:4985:2021 CERTIFIED',
      spec: 'Class 1 to Class 5',
      desc: isTamil
        ? 'ஆழ்துளை கிணற்று நீர் ஏற்றம் மற்றும் குடிநீர் விநியோகத்திற்கு உராய்வு குறைவான வழவழப்பான உள்கட்டமைப்பு.'
        : 'Smooth internal bore minimizing friction losses in deep well water lifting and potable municipal feeder lines.',
      param: 'Diameter: 20mm to 200mm',
      image: '/images/home-pvc-yard.jpeg',
      link: '/cheran-plast',
    },
    {
      title: isTamil ? 'இன்லைன் & ஆன்லைன் சொட்டு நீர் அமைப்பு' : 'Inline & Online Drip Systems',
      standard: 'IS:13488 & 13487',
      spec: '1.2 to 8.0 LPH',
      desc: isTamil
        ? 'அடைப்புகளைத் தடுக்கும் துல்லிய லேபரிந்த் பாதையுடன் கூடிய உருளை மற்றும் தட்டை டிரிப்பர்கள்.'
        : 'Continuous flat cylindrical emitters with self-flushing turbulent pathways engineered for high uniform discharge coefficients.',
      param: 'Spacings: 20cm to 100cm',
      image: '/images/hero-drip-droplet.jpeg',
      link: '/cheran-irrigation',
    },
    {
      title: isTamil ? 'விவசாய தெளிப்பான் நெட்வொர்க்' : 'Agricultural Sprinkler Networks',
      standard: 'ROTARY NOZZLE',
      spec: '12m to 28m Throw',
      desc: isTamil
        ? 'மஞ்சள், நிலக்கடலை, தீவனம், மற்றும் தேயிலை பயிர்களுக்கு சீரான மழைத்தூவல் தெளிப்பு.'
        : 'Uniform precipitation profiles ideal for groundnut, pulses, turmeric, tea estates, and open nursery installations.',
      param: 'Material: Delrin & Gunmetal',
      image: '/images/sprinkler-mist.jpeg',
      link: '/cheran-irrigation',
    },
    {
      title: isTamil ? 'தொழில்துறை வடிகட்டுதல் அமைப்புகள்' : 'Industrial Filtration Systems',
      standard: 'HYDROCYCLONE / DISC',
      spec: '25 – 100 m³/hr',
      desc: isTamil
        ? 'வண்டல் மண், பாசி மற்றும் நுண்ணிய தூசிகளை நீக்கி டிரிப்பர்களைப் பாதுகாக்கும் மணல் மற்றும் டிஸ்க் ஃபில்டர்கள்.'
        : 'High-capacity gravel, sand, and disk filters designed to eliminate silt, algae, and suspended solids before entering emitter channels.',
      param: 'Backwash: Manual & Semi-Auto',
      image: '/images/filtration-media.png',
      link: '/cheran-irrigation',
    },
    {
      title: isTamil ? 'யுபிவிசி பிளம்பிங் & போர்வல் கேசிங்' : 'uPVC Plumbing & Borewell Casings',
      standard: 'ASTM D1785 / SCH 40 & 80',
      spec: 'Corrosion Free',
      desc: isTamil
        ? 'ஆழ்துளை கிணறுகளின் பக்கவாட்டு அழுத்தங்களைத் தாங்கும் வகையில் டிரெப்சாய்டல் திரெட்கள் கொண்ட கேசிங் பைப்.'
        : 'High tensile strength casing pipes engineered to withstand immense lateral hydrostatic earth pressures in deep borewells.',
      param: 'Lengths: 3m & 6m Standard',
      image: '/images/home-casing-pipes.jpeg',
      link: '/cheran-plast',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* =========================================================================
          1. HERO SECTION: Bleeds under header
         ========================================================================= */}
      <section className="relative -mt-20 w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-forest-900 border-b border-line-200">
        {/* Background Image with Scrim */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-35 scale-105 transform motion-safe:transition-transform motion-safe:duration-1000"
          style={{ backgroundImage: "url('/images/crops-farmland.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/80 to-forest-900/60" />

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-16 w-full flex flex-col justify-between">
          <div className="max-w-3xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-700/60 text-sun-500 w-fit border border-forest-500/30">
              <span className="material-symbols-outlined text-base">verified</span>
              <span className="font-mono text-xs tracking-wider uppercase text-paper-50 font-bold">
                {isTamil ? 'தமிழ்நாட்டின் 40+ ஆண்டுகால தொழில் சிறப்பு' : 'Four Decades of Tamil Nadu Industrial Excellence'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-paper-50 tracking-tight leading-[1.08]">
              {isTamil ? (
                <>
                  நுண்ணீர்ப் பாசனம் & <br className="hidden sm:inline" />
                  <span className="italic font-normal text-secondary-fixed">துல்லிய குழாய் உற்பத்தி,</span> 1983 முதல்
                </>
              ) : (
                <>
                  Smart Irrigation & <br className="hidden sm:inline" />
                  <span className="italic font-normal text-secondary-fixed">Precision Piping,</span> Since 1983
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-surface-container-high max-w-2xl leading-relaxed">
              {isTamil
                ? 'நான்கு தசாப்தங்களாக உயர்தர பாலிமர் குழாய் உற்பத்தி மற்றும் அதிநவீன விவசாய சொட்டு நீர் பாசன பொறியியலை இணைக்கும் தென்னிந்தியாவின் முதன்மை குழுமம்.'
                : 'South India’s premier manufacturing group combining four decades of industrial polymer extrusion with state-of-the-art agricultural micro-irrigation engineering.'}
            </p>

            {/* Editorial Split CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                to="/cheran-irrigation"
                className="group inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-500 text-paper-50 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded shadow-sm transition-all"
              >
                <span>{isTamil ? 'சொட்டு நீர் தீர்வுகள்' : 'Explore Irrigation Solutions'}</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <Link
                to="/cheran-plast"
                className="group inline-flex items-center gap-2 bg-paper-50/15 hover:bg-paper-50/25 text-paper-50 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded border border-paper-50/20 transition-all"
              >
                <span>{isTamil ? 'குழாய் தீர்வுகள்' : 'Explore Piping Solutions'}</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_outward
                </span>
              </Link>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="mt-12 pt-6 border-t border-[rgba(227,223,210,0.15)] flex flex-wrap items-center justify-between gap-4 text-surface-container-high text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sun-500 animate-pulse"></span>
              <span>Vijayamangalam Manufacturing Hub, Erode District</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>BIS Approved Labs</span>
              <span>•</span>
              <span>Govt. Empanelled Supplier</span>
              <span>•</span>
              <span>200,000+ Acres Irrigated</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. TRUST BAR: 4 Monolithic Stat Blocks
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col p-6 bg-paper-50 rounded-xl shadow-xs border border-line-200">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-900 leading-none">
                40+
              </span>
              <span className="font-serif text-lg text-forest-700 mt-2 font-bold">Years Heritage</span>
              <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                Continuous polymer compounding & precision piping since 1983.
              </p>
            </div>

            <div className="flex flex-col p-6 bg-paper-50 rounded-xl shadow-xs border border-line-200">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-900 leading-none">
                4
              </span>
              <span className="font-serif text-lg text-forest-700 mt-2 font-bold">ISI Certifications</span>
              <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                Certified to IS:4985, IS:13488, IS:13487, & IS:12786 national benchmarks.
              </p>
            </div>

            <div className="flex flex-col p-6 bg-paper-50 rounded-xl shadow-xs border border-line-200">
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-900 leading-none">
                  100%
                </span>
                <span className="text-sun-500 font-mono text-xs font-bold uppercase">Subsidy</span>
              </div>
              <span className="font-serif text-lg text-forest-700 mt-2 font-bold">Govt. Assistance</span>
              <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                Comprehensive field survey and turnkey paper processing for small farmers.
              </p>
            </div>

            <div className="flex flex-col p-6 bg-paper-50 rounded-xl shadow-xs border border-line-200">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-900 leading-none">
                30+
              </span>
              <span className="font-serif text-lg text-forest-700 mt-2 font-bold">Districts Covered</span>
              <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                Robust distributor footprint across Tamil Nadu, Kerala, and Karnataka.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. TWO-BRAND ASYMMETRIC EDITORIAL SPLIT
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col gap-12">
          <div className="flex flex-col max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-forest-700">
              Dual Pillars of Cheran Group
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 mt-1 tracking-tight">
              Specialized Engineering. Shared Integrity.
            </h2>
          </div>

          {/* Brand Panel 1: Cheran Irrigation (Est. 2017) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-paper-100 p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xs border border-line-200">
            <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-forest-700 text-paper-50 font-bold uppercase">
                  ESTABLISHED 2017
                </span>
                <span className="text-xs text-steel-600 font-mono">Agricultural Micro-Irrigation Division</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-forest-900 leading-tight">
                Cheran Irrigation Systems
              </h3>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Engineered for high crop yield with minimal water expenditure. Our inline and online micro-drip networks, precision emitters, and sand-filtration battery units are tailored specifically for South Indian soil geologies and borewell water profiles.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-forest-700 text-xl mt-0.5">water_drop</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">60% Water Saving</span>
                    <span className="text-[11px] text-steel-600">Root-zone precision feed</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-forest-700 text-xl mt-0.5">shield</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">Clog-Resistant</span>
                    <span className="text-[11px] text-steel-600">Advanced labyrinth path</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/cheran-irrigation"
                  className="group inline-flex items-center gap-1.5 text-forest-700 font-bold text-xs sm:text-sm hover:text-forest-900 transition-colors"
                >
                  <span>View Micro-Drip & Sprinkler Catalog</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 overflow-hidden rounded-xl border border-line-200 shadow-sm">
              <img
                src="/images/home-drip-macro.jpeg"
                alt="Close up macro view of a precision micro drip emitter releasing clean drop of water directly onto fertile dark farm soil"
                className="w-full h-72 sm:h-80 lg:h-[380px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Brand Panel 2: Cheran Plast (Est. 1983) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-paper-100 p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xs border border-line-200">
            <div className="lg:col-span-7 overflow-hidden rounded-xl border border-line-200 shadow-sm">
              <img
                src="/images/home-pvc-plant.jpeg"
                alt="Wide angle interior of heavy industrial polymer extrusion plant with precision stacked rows of rigid grey uPVC pipes"
                className="w-full h-72 sm:h-80 lg:h-[380px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-forest-900 text-paper-50 font-bold uppercase">
                  ESTABLISHED 1983
                </span>
                <span className="text-xs text-steel-600 font-mono">Polymer Extrusion Pioneer</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-forest-900 leading-tight">
                Cheran Plast
              </h3>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Over 40 years of metallurgical-grade polymer expertise. We formulate and extrude rigid PVC pressure pipes, unplasticized polyvinyl chloride (uPVC) infrastructure conduits, and tough HDPE hoses that withstand severe hydraulic pressures and extreme solar exposure.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-forest-700 text-xl mt-0.5">verified_user</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">IS:4985 Certified</span>
                    <span className="text-[11px] text-steel-600">100% virgin polymer resin</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-forest-700 text-xl mt-0.5">speed</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">High Pressure</span>
                    <span className="text-[11px] text-steel-600">Up to 16 kgf/cm² rating</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/cheran-plast"
                  className="group inline-flex items-center gap-1.5 text-forest-700 font-bold text-xs sm:text-sm hover:text-forest-900 transition-colors"
                >
                  <span>Explore uPVC & Rigid PVC Specifications</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PRODUCT CATEGORY GRID: 6 Technical Cards
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col gap-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-line-200">
            <div className="flex flex-col max-w-xl">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-forest-700">
                Commercial Portfolio
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 mt-1 tracking-tight">
                Precision Agricultural & Industrial Equipment
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-900"
            >
              <span>Complete Technical Product Range</span>
              <span className="material-symbols-outlined text-base">east</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCards.map((card, idx) => (
              <Link
                key={idx}
                to={card.link}
                className="group bg-paper-100 rounded-xl overflow-hidden shadow-xs border border-line-200 flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="w-full h-48 overflow-hidden bg-surface-container">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-steel-600 mb-1">
                      <span>{card.standard}</span>
                      <span className="text-forest-700 font-bold">{card.spec}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-steel-600 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line-200/60 flex items-center justify-between text-xs">
                    <span className="font-mono text-steel-600">{card.param}</span>
                    <span className="material-symbols-outlined text-forest-700 text-lg group-hover:translate-x-1 transition-transform">
                      chevron_right
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SUBSIDY CALLOUT BAND
         ========================================================================= */}
      <section className="w-full bg-forest-900 text-paper-50 py-12 lg:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sun-500/20 text-sun-500 w-fit font-mono text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">account_balance</span>
                <span>Tamil Nadu Horticulture Dept & PMKSY Approved</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-paper-50 tracking-tight leading-tight">
                Empanelled Micro-Irrigation Subsidies for Farmers
              </h2>
              <p className="text-xs sm:text-sm text-surface-container-high leading-relaxed">
                Cheran Irrigation works directly with the Department of Horticulture and Plantation Crops to deliver complete government subsidies directly to small and marginal farming families.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-paper-50/5 rounded-lg border border-[rgba(227,223,210,0.15)]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-extrabold text-sun-500 leading-none">100%</span>
                    <span className="font-mono text-xs font-bold text-paper-50 uppercase">Assistance</span>
                  </div>
                  <span className="font-serif text-sm font-bold text-paper-50 block mt-1">Small & Marginal Farmers</span>
                  <span className="text-[11px] text-surface-container-high">Up to 5.0 Acres (2.0 Hectares) holding</span>
                </div>
                <div className="p-4 bg-paper-50/5 rounded-lg border border-[rgba(227,223,210,0.15)]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-extrabold text-secondary-fixed leading-none">75%</span>
                    <span className="font-mono text-xs font-bold text-paper-50 uppercase">Subsidy</span>
                  </div>
                  <span className="font-serif text-sm font-bold text-paper-50 block mt-1">General Category</span>
                  <span className="text-[11px] text-surface-container-high">Above 5.0 Acres operational land</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/cheran-irrigation#subsidy-checklist"
                  className="inline-flex items-center gap-2 bg-sun-500 hover:bg-yellow-400 text-forest-900 font-bold text-xs sm:text-sm px-5 py-3 rounded transition-colors"
                >
                  <span>Access Subsidy Application Guide</span>
                  <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                </Link>
                <span className="text-xs text-surface-container-high">
                  Need documentation help? Call: 1800 425 1595
                </span>
              </div>
            </div>

            {/* Checklist Column */}
            <div className="lg:col-span-5 bg-paper-50/10 p-6 rounded-xl border border-[rgba(227,223,210,0.15)] flex flex-col gap-4">
              <h3 className="font-serif text-lg font-bold text-paper-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-sun-500">checklist</span>
                <span>Subsidy Document Checklist</span>
              </h3>
              <p className="text-xs text-surface-container-high leading-relaxed">
                Our local field engineers visit your site to complete surveying, layout preparation, and online submission at no cost.
              </p>
              <ul className="flex flex-col gap-2 text-xs text-paper-50">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-base">check_circle</span>
                  <span>Patta / Chitta copy with Adangal</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-base">check_circle</span>
                  <span>FMB (Field Measurement Book) Sketch</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-base">check_circle</span>
                  <span>Aadhaar Card & Ration Card copy</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-base">check_circle</span>
                  <span>Small / Marginal Farmer Certificate (VAO)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-base">check_circle</span>
                  <span>Electricity Board Service Connection / Well detail</span>
                </li>
              </ul>
              <div className="pt-2">
                <a
                  href="tel:18004251595"
                  className="w-full inline-flex items-center justify-center gap-2 bg-paper-50 hover:bg-paper-100 text-forest-900 font-bold text-xs py-3 px-4 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-forest-700 text-base">call</span>
                  <span>Speak to Subsidy Desk Officer</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. OFFICIAL CERTIFICATIONS STRIP
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-8 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-forest-900 flex items-center justify-center text-sun-500 shrink-0">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-forest-900 leading-none">
                  Bureau of Indian Standards
                </span>
                <span className="text-[11px] font-mono text-steel-600 mt-1 uppercase">
                  Tested in Certified Testing Laboratories
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="p-3 bg-paper-50 rounded-lg text-center border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-900 block">IS:4985:2021</span>
                <span className="text-[10px] text-steel-600 uppercase">uPVC Pressure Pipes</span>
              </div>
              <div className="p-3 bg-paper-50 rounded-lg text-center border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-900 block">IS:13488:2008</span>
                <span className="text-[10px] text-steel-600 uppercase">Drip Irrigation Lines</span>
              </div>
              <div className="p-3 bg-paper-50 rounded-lg text-center border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-900 block">IS:13487:2024</span>
                <span className="text-[10px] text-steel-600 uppercase">Irrigation Emitters</span>
              </div>
              <div className="p-3 bg-paper-50 rounded-lg text-center border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-900 block">IS:12786:2024</span>
                <span className="text-[10px] text-steel-600 uppercase">HDPE Lateral Pipes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. HERITAGE SECTION: Founder Mr. P.R. Kuppusamy & Roots
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Image */}
            <div className="lg:col-span-6 relative">
              <div className="relative z-10 rounded-xl overflow-hidden shadow-md border border-line-200">
                <img
                  src="/images/home-heritage-factory.jpeg"
                  alt="Historical and contemporary engineering operations of Cheran Group at Vijayamangalam"
                  className="w-full h-80 sm:h-96 lg:h-[440px] object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 z-20 hidden sm:flex flex-col bg-forest-900 text-paper-50 p-4 rounded-xl shadow-lg border border-[rgba(227,223,210,0.2)] max-w-xs">
                <span className="font-serif text-3xl font-extrabold text-sun-500 leading-none">1983</span>
                <span className="text-xs font-bold text-paper-50 mt-1">Foundation Year</span>
                <span className="text-[11px] text-surface-container-high mt-0.5">
                  Vijayamangalam, Perundurai Taluk, Erode District
                </span>
              </div>
            </div>

            {/* Narrative */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-forest-700">
                Decades of Manufacturing Integrity
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight leading-tight">
                Built from the Soil of the Kongu Region
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Founded by Mr. P.R. Kuppusamy, Cheran Group began as a pioneering extrusion outfit in Vijayamangalam, Perundurai Taluk. Confronting severe groundwater depletion across the dry belts of western Tamil Nadu, the enterprise evolved to engineer durable, clog-resistant micro-irrigation lines designed for local agricultural hardships.
              </p>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Today, our dual campuses encompass state-of-the-art multi-layer pipe extruders, laser perforation lines, and an in-house hydraulic hydrostatic burst-testing laboratory, serving over 65,000 satisfied farmers across South India.
              </p>

              <div className="p-4 bg-paper-100 rounded-lg border border-line-200">
                <p className="font-serif text-sm sm:text-base text-forest-900 italic font-normal">
                  “Water is not merely a utility in our land—it is family capital. Our pipes must honor every drop that enters them.”
                </p>
                <span className="text-[11px] font-mono text-steel-600 block mt-1.5 font-bold uppercase tracking-wider">
                  — Cheran Group Founding Principle
                </span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-900 text-paper-50 font-bold text-xs sm:text-sm px-6 py-3 rounded transition-colors"
                >
                  <span>Read Full Cheran History</span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
                <Link
                  to="/certifications"
                  className="text-xs font-bold text-forest-700 hover:text-forest-900"
                >
                  Lab Certifications & Test Reports →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. DIRECT ACTION STRIP
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="p-6 sm:p-8 bg-forest-900 text-paper-50 rounded-2xl shadow-md flex flex-col lg:flex-row items-center justify-between gap-6 border border-[rgba(227,223,210,0.15)]">
            <div className="flex flex-col gap-1 max-w-2xl text-center lg:text-left">
              <span className="text-xs font-mono text-sun-500 uppercase tracking-widest font-bold">
                Immediate Field Engineer Consultation
              </span>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-paper-50 tracking-tight">
                Plan Your Farm's Drip & Piping Layout Today
              </h2>
              <p className="text-xs sm:text-sm text-surface-container-high leading-relaxed mt-1">
                Connect directly with our Perundurai factory engineers for borewell depth pressure calculations, bill of quantities, and subsidy application assistance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <a
                href="tel:+919842811595"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sun-500 hover:bg-yellow-400 text-forest-900 px-6 py-3.5 rounded font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                <span>+91 98428 11595</span>
              </a>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-forest-700 hover:bg-forest-500 text-paper-50 px-6 py-3.5 rounded font-semibold text-xs sm:text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                <span>Request Quotation</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
