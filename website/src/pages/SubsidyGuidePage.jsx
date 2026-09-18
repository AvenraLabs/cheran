import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function SubsidyGuidePage() {
  const { lang, isTamil } = useLanguage();

  // 12-Document Interactive Checklist State
  const [checkedDocs, setCheckedDocs] = useState({});
  const toggleDoc = (id) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalDocs = 12;
  const readyCount = Object.values(checkedDocs).filter(Boolean).length;
  const progressPct = Math.round((readyCount / totalDocs) * 100);

  // Interactive Subsidy Calculator State
  const [acres, setAcres] = useState(3.5);
  const [cropType, setCropType] = useState('banana');

  const calcResults = useMemo(() => {
    if (acres <= 5.0) {
      const low = Math.round(acres * 32000);
      const high = Math.round(acres * 40000);
      return {
        category: isTamil ? 'சிறு / குறு விவசாயி' : 'Small / Marginal Farmer',
        categoryColor: 'text-sun-500',
        subsidyPct: isTamil ? '100% முழு மானியம்' : '100% Full Grant',
        pctColor: 'text-secondary-fixed',
        valueRange: `₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}`,
        shareNote: isTamil ? 'மத்திய அரசு (55%) + மாநில அரசு (45%)' : 'Central Share (55%) + TN State Top-up (45%)',
      };
    } else {
      const low = Math.round(acres * 30000);
      const high = Math.round(acres * 38000);
      return {
        category: isTamil ? 'பொது விவசாயி' : 'General Farmer',
        categoryColor: 'text-paper-50',
        subsidyPct: isTamil ? '75% மானியம்' : '75% Subsidized',
        pctColor: 'text-sun-500',
        valueRange: `₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}`,
        shareNote: isTamil ? 'மத்திய நிதி (45%) + மாநில நிதி (30%)' : 'Central Grant (45%) + TN State Share (30%)',
      };
    }
  }, [acres, isTamil]);

  // Survey Booking Form State
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    farmerName: '',
    phone: '',
    district: 'Erode',
    village: '',
    extentAndPump: '',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const documentsList = [
    {
      id: 'doc1',
      title: '1. Chitta & RSR Record',
      ta: 'சிட்டா & அடங்கல் பதிவு நகல்',
      desc: 'Computerized Patta / Chitta digital extract issued within the last 6 months.',
    },
    {
      id: 'doc2',
      title: '2. Adangal Copy',
      ta: 'நடப்பு பசலி அடங்கல்',
      desc: 'Certified crop cultivation status copy signed by the Village Administrative Officer.',
    },
    {
      id: 'doc3',
      title: '3. VAO Certificate',
      ta: 'கிராம நிர்வாக அலுவலர் சான்றிதழ்',
      desc: 'Land extent and ownership confirmation letter with official revenue stamp.',
    },
    {
      id: 'doc4',
      title: '4. Survey Map / FMB Sketch',
      ta: 'புல வரைபடம் (FMB)',
      desc: 'Field Measurement Book diagram clearly indicating survey parcel boundaries.',
    },
    {
      id: 'doc5',
      title: '5. Joint Well Agreement (If shared)',
      ta: 'கூட்டு கிணறு ஒப்பந்த பத்திரம்',
      desc: 'Non-judicial stamp paper consent signed by co-owners sharing motor/well.',
    },
    {
      id: 'doc6',
      title: '6. Small/Marginal Farmer Cert.',
      ta: 'சிறு / குறு விவசாயி சான்றிதழ்',
      desc: 'Issued by Tahsildar / Revenue Authority to confirm 100% eligibility.',
    },
    {
      id: 'doc7',
      title: '7. Registered Sale Deed / Partition',
      ta: 'கிரய பத்திரம் / பாகப்பிரிவினை நகல்',
      desc: 'Legal title document evidencing lawful tenure of the target agricultural acreage.',
    },
    {
      id: 'doc8',
      title: '8. Smart Ration Card',
      ta: 'ஸ்மார்ட் குடும்ப அட்டை நகல்',
      desc: 'Copy of family ration card matching the applicant head of household.',
    },
    {
      id: 'doc9',
      title: '9. Farmer Aadhaar Card',
      ta: 'ஆதார் அட்டை நகல்',
      desc: 'Linked to the mobile phone number used for Uzhavan/MIMS OTP verification.',
    },
    {
      id: 'doc10',
      title: '10. Water & Soil Test Report',
      ta: 'பாசன நீர் & மண் பரிசோதனை அறிக்கை',
      desc: 'Cheran field engineers provide this test on-site at zero cost during survey.',
    },
    {
      id: 'doc11',
      title: '11. Nationalized Bank Passbook',
      ta: 'வங்கி கணக்கு புத்தக நகல்',
      desc: 'Showing Account Number and IFSC clearly for Aadhaar-based DBT transactions.',
    },
    {
      id: 'doc12',
      title: '12. Passport Photos (2 Copies)',
      ta: 'பாஸ்போர்ட் அளவு புகைப்படம் (2)',
      desc: 'Recent color photographs for department dossier and inspection register.',
    },
  ];

  const stepsList = [
    {
      num: 1,
      phase: 'Phase 1: Preparation',
      title: 'Document Gathering',
      desc: 'Compile revenue documents including your Chitta, Adangal, Field Measurement Book (FMB) sketch, Aadhaar card, and Small/Marginal Farmer Certificate from the local VAO.',
      meta: 'Duration: 1–2 Days',
      icon: 'folder_shared',
    },
    {
      num: 2,
      phase: 'Phase 2: Cheran Field Visit',
      title: 'Free Cheran Site Survey',
      desc: 'A certified Cheran field engineer visits your land. We test borewell/well water discharge (LPH), conduct water pH testing, record GPS boundary coordinates, and prepare hydraulic crop design.',
      meta: 'Cheran Engineer (Free of Charge)',
      icon: 'explore',
    },
    {
      num: 3,
      phase: 'Phase 3: Digital Filing',
      title: 'Portal Registration',
      desc: 'Application is formally submitted to the Tamil Nadu Micro Irrigation Information System (MIMS) portal or Uzhavan App, registering Cheran as the empanelled system manufacturer.',
      meta: 'MIMS / Uzhavan Online Portal',
      icon: 'cloud_upload',
    },
    {
      num: 4,
      phase: 'Phase 4: Official Sanction',
      title: 'Administrative Sanction (Work Order)',
      desc: 'The Assistant Director of Horticulture (ADH) or Executive Engineer (AED) reviews land eligibility, verifies quota allocation, and issues the official Work Order.',
      meta: 'Issued by ADH Department',
      icon: 'assignment_turned_in',
    },
    {
      num: 5,
      phase: 'Phase 5: Ground Execution',
      title: 'On-Field Installation',
      desc: 'Cheran certified technicians dispatch factory-sealed ISI-standard uPVC mainline pipes, lateral drip tubes, filtration arrays, and emitters. Trenching and complete field layout are performed.',
      meta: 'Execution: 2–4 Business Days',
      icon: 'plumbing',
    },
    {
      num: 6,
      phase: 'Phase 6: Final Settlement',
      title: 'Joint Inspection & Handover',
      desc: 'Horticultural Officer, Cheran Lead Engineer, and farmer carry out pressure testing. Geo-tagged photographs with the farmer are uploaded, releasing the direct government disbursement.',
      meta: 'Direct Dept Disbursement',
      icon: 'handshake',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* =========================================================================
          1. TOP EDITORIAL HERO
         ========================================================================= */}
      <section className="w-full bg-forest-900 text-paper-50 relative overflow-hidden py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Breadcrumb & Metadata Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-sun-500 uppercase tracking-widest">
              <span>Official Scheme Guidelines</span>
              <span className="text-steel-600">/</span>
              <span>PMKSY & TN Horticulture Mission</span>
              <span className="text-steel-600">/</span>
              <span className="text-paper-50 font-bold">2024–2026</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest/10 rounded-full text-sun-500 text-xs font-mono font-bold border border-sun-500/20">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Approved Manufacturer Empanelment</span>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-secondary-fixed font-bold">
                Government of Tamil Nadu Assistance Portal
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-paper-50 tracking-tight leading-[1.08]">
                {isTamil
                  ? 'தமிழ்நாடு அரசு சொட்டு நீர் பாசன மானிய வழிகாட்டி'
                  : 'Tamil Nadu Micro-Irrigation Subsidy Guide'}
              </h1>
              <p className="text-sm sm:text-base text-surface-container-high leading-relaxed max-w-2xl">
                {isTamil
                  ? 'பிரதம மந்திரி நுண்ணீர்ப் பாசன திட்டம் (PMKSY) மற்றும் தோட்டக்கலைத்துறை கீழ் சிறு, குறு விவசாயிகளுக்கு 100% மற்றும் இதர விவசாயிகளுக்கு 75% முழு மானியம் பெறுவதற்கான விரிவான வழிகாட்டி.'
                  : 'Complete operational roadmap to securing 100% and 75% financial assistance for precision drip and sprinkler irrigation installations under PMKSY (Per Drop More Crop) and State Agricultural Development Programs.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#calculator"
                  className="bg-forest-700 hover:bg-forest-500 text-paper-50 px-6 py-3 rounded font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <span>Calculate Your Subsidy</span>
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </a>
                <a
                  href="#documents-checklist"
                  className="bg-surface-container-highest/15 hover:bg-surface-container-highest/25 text-paper-50 px-5 py-3 rounded font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-2 border border-paper-50/20"
                >
                  <span className="material-symbols-outlined text-base">checklist</span>
                  <span>12-Document Checklist</span>
                </a>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-2 border-t border-[rgba(227,223,210,0.15)]">
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl font-extrabold text-sun-500 leading-none">
                    100%
                  </span>
                  <span className="text-[11px] text-surface-container-high mt-1.5 block leading-snug">
                    Marginal & Small Farmers (≤ 5 Acres)
                  </span>
                </div>
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl font-extrabold text-paper-50 leading-none">
                    75%
                  </span>
                  <span className="text-[11px] text-surface-container-high mt-1.5 block leading-snug">
                    General Farmers (&gt; 5 Acres)
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block font-serif text-3xl sm:text-4xl font-extrabold text-secondary-fixed leading-none">
                    7–10 Yrs
                  </span>
                  <span className="text-[11px] text-surface-container-high mt-1.5 block leading-snug">
                    System Operational Guarantee Life
                  </span>
                </div>
              </div>
            </div>

            {/* Right Blueprint Card */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="bg-paper-50 p-3 rounded-xl shadow-xl relative overflow-hidden border border-line-200">
                <img
                  src="/images/subsidy-blueprint.jpeg"
                  alt="Technical blueprint of micro irrigation filtration setup with sand filter and hydrocyclone"
                  className="w-full h-72 sm:h-80 lg:h-96 object-cover rounded-lg"
                />
                <div className="absolute bottom-5 left-5 right-5 bg-forest-900/95 text-paper-50 p-4 rounded-lg backdrop-blur-sm border border-[rgba(227,223,210,0.2)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-sun-500 uppercase tracking-widest block">
                        Technical Sanction Ref
                      </span>
                      <span className="font-serif text-base font-bold text-paper-50">IS:13488 / IS:4985</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-surface-container-high block">Inspecting Authority</span>
                      <span className="text-xs font-semibold text-paper-50">Dept of Horticulture, TN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SUBSIDY ALLOCATION & ENTITLEMENT MATRIX
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200" id="entitlement-matrix">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider block mb-1">
              Entitlement Matrix
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight mb-2">
              Micro-Irrigation Subsidy Structure & Allocations
            </h2>
            <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
              Under the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) in conjunction with the Tamil Nadu State Agriculture Mission, financial grants are disbursed based on validated revenue holding classifications.
            </p>
          </div>

          {/* Two Tier Comparative Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* 100% Tier Card */}
            <div className="bg-paper-100 p-6 sm:p-8 rounded-xl shadow-xs relative overflow-hidden border border-line-200">
              <div className="absolute top-0 right-0 bg-sun-500 text-forest-900 font-mono text-[11px] px-3.5 py-1 font-bold uppercase tracking-wider rounded-bl-lg">
                Full Grant
              </div>
              <span className="text-xs font-mono text-forest-700 uppercase tracking-wider block mb-1">
                Category A Beneficiaries
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-1">
                Small & Marginal Farmers
              </h3>
              <p className="text-xs text-steel-600 mb-4">
                Holding total agricultural land up to 5.00 Acres (2.00 Hectares)
              </p>

              <div className="flex items-baseline gap-3 mb-6 bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-700 leading-none">
                  100%
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-forest-900">Cost Subsidy Coverage</span>
                  <span className="text-[11px] text-steel-600">Central Share (55%) + TN State Top-up (45%)</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-forest-900">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Zero capital contribution required on standard crop geometry packages</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Includes full filtration system, main line, lateral network, and manifold valves</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Priority verification and allotment by local Assistant Director of Horticulture</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Farmer only settles nominal GST component according to prevailing state orders</span>
                </div>
              </div>
            </div>

            {/* 75% Tier Card */}
            <div className="bg-paper-100 p-6 sm:p-8 rounded-xl shadow-xs relative overflow-hidden border border-line-200">
              <div className="absolute top-0 right-0 bg-forest-900 text-paper-50 font-mono text-[11px] px-3.5 py-1 font-bold uppercase tracking-wider rounded-bl-lg">
                Majority Grant
              </div>
              <span className="text-xs font-mono text-forest-700 uppercase tracking-wider block mb-1">
                Category B Beneficiaries
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-1">
                Other / General Farmers
              </h3>
              <p className="text-xs text-steel-600 mb-4">
                Holding agricultural land greater than 5.00 Acres (&gt; 2.00 Hectares)
              </p>

              <div className="flex items-baseline gap-3 mb-6 bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold text-forest-900 leading-none">
                  75%
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-forest-900">Cost Subsidy Coverage</span>
                  <span className="text-[11px] text-steel-600">Central Grant (45%) + TN State Share (30%)</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-forest-900">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Farmer contributes nominal 25% balance plus statutory taxes</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Coverage scalable up to 12.5 Acres (5 Hectares) maximum entitlement per family</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Cheran provides bank-assisted pro-forma invoices for fast agricultural loan release</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-forest-700 text-base mt-0.5">check_circle</span>
                  <span>Standard 3-year free manufacturer technical field service and AMC support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope of Hardware Covered Strip */}
          <div className="bg-paper-100 p-6 rounded-xl border border-line-200">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined text-forest-700 text-2xl">precision_manufacturing</span>
              <h4 className="font-serif text-lg font-bold text-forest-900">
                Comprehensive Component Coverage Under Govt Package
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-700 block mb-1">
                  01. Head Control Unit
                </span>
                <p className="text-xs text-steel-600 leading-relaxed">
                  Hydrocyclone sand separator, screen/disc filtration unit, backwash manifolds & pressure gauges.
                </p>
              </div>
              <div className="bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-700 block mb-1">
                  02. Fertigation System
                </span>
                <p className="text-xs text-steel-600 leading-relaxed">
                  Non-corrosive Venturi injector assembly or pressurized fertilizer injection tank with suction valves.
                </p>
              </div>
              <div className="bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-700 block mb-1">
                  03. Conveyance Piping
                </span>
                <p className="text-xs text-steel-600 leading-relaxed">
                  Class 2 & Class 3 ISI-certified uPVC / HDPE main and sub-main pipelines rated for 4 to 6 kg/cm².
                </p>
              </div>
              <div className="bg-paper-50 p-4 rounded-lg border border-line-200">
                <span className="font-mono text-xs font-bold text-forest-700 block mb-1">
                  04. Field Laterals & Emitters
                </span>
                <p className="text-xs text-steel-600 leading-relaxed">
                  Class 1 & Class 2 inline/online drip tubes, micro-tubes, flush valves, air release valves, and end sets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PHOTOGRAPHIC CONTEXT & IMPACT
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* 2x2 Photo Grid */}
            <div className="lg:col-span-6 order-2 lg:order-1 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <img
                  src="/images/subsidy-chili-field.jpeg"
                  alt="Lush green chili field with neatly installed micro-irrigation pipes"
                  className="w-full h-48 sm:h-56 object-cover rounded-xl border border-line-200 shadow-xs"
                />
                <div className="bg-forest-900 text-paper-50 p-4 rounded-xl shadow-xs">
                  <span className="font-serif text-3xl font-extrabold text-sun-500 leading-none block">
                    42,000+
                  </span>
                  <span className="text-[11px] text-surface-container-high block mt-1.5 leading-snug">
                    Hectares Irrigated Across Coimbatore, Erode & Tirupur
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4 sm:pt-6">
                <div className="bg-paper-50 p-4 rounded-xl shadow-xs border border-line-200">
                  <span className="material-symbols-outlined text-forest-700 text-2xl mb-1">water_drop</span>
                  <span className="font-serif text-xl font-bold text-forest-900 block leading-tight">50% to 70%</span>
                  <span className="text-[11px] text-steel-600 mt-0.5 block leading-tight">
                    Water conservation compared to traditional flooding
                  </span>
                </div>
                <img
                  src="/images/subsidy-emitter-macro.jpeg"
                  alt="Extreme macro close-up of a precision drip emitter releasing water droplet"
                  className="w-full h-48 sm:h-56 object-cover rounded-xl border border-line-200 shadow-xs"
                />
              </div>
            </div>

            {/* Narrative Column */}
            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-4">
              <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider">
                Ground Reality & Impact
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight">
                Engineering Precision That Satisfies Every Strict Audit
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Every government-subsidized Cheran installation must withstand unannounced departmental inspections, physical flow-rate verifications, and strict BIS pressure tests. Since 1983, our manufacturing plants in Vijayamangalam, Erode have supplied Tamil Nadu farmers with systems that operate reliably for decades.
              </p>

              <div className="bg-paper-50 p-5 rounded-xl border border-line-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-sun-500 text-xl mt-0.5">verified</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">
                      BIS IS:13488 & IS:4985 Certified
                    </span>
                    <span className="text-[11px] text-steel-600">
                      Zero non-compliance flags during state third-party quality control inspections.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-sun-500 text-xl mt-0.5">verified</span>
                  <div>
                    <span className="text-xs font-bold text-forest-900 block">
                      Empanelled Service Technical Team
                    </span>
                    <span className="text-[11px] text-steel-600">
                      Engineers resident in all block headquarters to prepare land maps and upload portal records within 48 hours.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. 6-STEP FARMER APPLICATION PROCESS
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider block mb-1">
              Step-By-Step Procedure
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight mb-2">
              The 6-Stage Government Subsidy Path
            </h2>
            <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
              From first farm survey to final department subsidy disbursement, Cheran coordinates the technical file so the farmer faces minimal administrative friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stepsList.map((step) => (
              <div
                key={step.num}
                className="bg-paper-100 p-6 rounded-xl shadow-xs border border-line-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-full bg-forest-900 text-paper-50 flex items-center justify-center font-serif text-lg font-bold">
                      {step.num}
                    </span>
                    <span className="material-symbols-outlined text-forest-700 text-2xl">
                      {step.icon}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-steel-600 uppercase tracking-wider block mb-1">
                    {step.phase}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-forest-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-steel-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line-200/60 text-[11px] font-mono text-forest-700 font-semibold">
                  {step.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. INTERACTIVE 12-DOCUMENT READINESS CHECKLIST
         ========================================================================= */}
      <section className="w-full bg-paper-100 py-12 lg:py-20 border-b border-line-200" id="documents-checklist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider block mb-1">
                Verification Checklist
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight mb-2">
                The 12 Mandatory Documents for Application
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                Check off the documents currently in your possession to assess your application readiness before our engineer visits.
              </p>
            </div>

            {/* Interactive Progress Meter */}
            <div className="bg-paper-50 p-4 rounded-xl shadow-xs border border-line-200 flex items-center gap-4 min-w-[240px]">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-line-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-forest-700 transition-all duration-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${progressPct}, 100`}
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-forest-900">
                  {progressPct}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-steel-600 block uppercase">Filing Status</span>
                <span className="font-serif text-sm font-bold text-forest-900">
                  {readyCount} of 12 Ready
                </span>
              </div>
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {documentsList.map((doc) => {
              const isChecked = !!checkedDocs[doc.id];
              return (
                <label
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-forest-700/10 border-forest-700/40 shadow-xs'
                      : 'bg-paper-50 border-line-200 hover:bg-paper-100/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by label onClick
                    className="w-4 h-4 text-forest-700 rounded mt-0.5 border-line-200 focus:ring-forest-700"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-forest-900 font-serif">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-forest-700 font-medium">
                      {doc.ta}
                    </span>
                    <span className="text-[11px] text-steel-600 mt-1 leading-snug">
                      {doc.desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Checklist Footer Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-paper-50 p-4 rounded-xl border border-line-200">
            <div className="flex items-center gap-2 text-xs text-steel-600">
              <span className="material-symbols-outlined text-sun-500 text-lg">info</span>
              <span>Missing 2 or 3 documents? Cheran field agents help arrange revenue certificate applications.</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-paper-100 hover:bg-surface-container-high text-forest-900 px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 border border-line-200 transition-colors"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Document Checklist</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. INTERACTIVE CALCULATOR & FIELD SURVEY REQUEST
         ========================================================================= */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 border-b border-line-200" id="calculator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Interactive Estimator */}
            <div className="lg:col-span-6 bg-paper-100 p-6 sm:p-8 rounded-xl shadow-xs border border-line-200 flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider block mb-1">
                    Interactive Tool
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                    Estimate Your Scheme Assistance
                  </h3>
                  <p className="text-xs text-steel-600 mt-1">
                    Select your land size and crop profile to see indicative government support.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-forest-900 uppercase">
                        Total Land Holding (in Acres)
                      </label>
                      <span className="font-serif text-lg font-bold text-forest-900 font-mono">
                        {acres.toFixed(1)} Ac
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.5"
                      value={acres}
                      onChange={(e) => setAcres(parseFloat(e.target.value))}
                      className="w-full accent-forest-700 h-2 bg-surface-container-high rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest-900 uppercase mb-1">
                      Primary Crop Type
                    </label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    >
                      <option value="banana">Banana / Sugarcane (Wide Spacing 1.5m - 1.8m)</option>
                      <option value="vegetables">Vegetables / Tomato / Chilies (Close 0.6m - 1.2m)</option>
                      <option value="coconut">Coconut / Orchard Groves (Spacing 6m - 8m)</option>
                      <option value="turmeric">Turmeric / Ginger (Raised Bed Drip)</option>
                    </select>
                  </div>

                  <div className="bg-forest-900 text-paper-50 p-5 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[rgba(227,223,210,0.15)] pb-2.5">
                      <span className="text-xs text-surface-container-high">Farmer Category</span>
                      <span className={`font-serif text-sm font-bold ${calcResults.categoryColor}`}>
                        {calcResults.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[rgba(227,223,210,0.15)] pb-2.5">
                      <span className="text-xs text-surface-container-high">Government Subsidy Share</span>
                      <span className={`font-serif text-base font-extrabold ${calcResults.pctColor}`}>
                        {calcResults.subsidyPct}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-surface-container-high">Estimated Equipment Value</span>
                      <span className="font-mono text-sm font-bold text-paper-50">
                        {calcResults.valueRange}
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] text-surface-container-high font-mono">
                      {calcResults.shareNote}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-steel-600 mt-4 italic leading-tight">
                * Values derived from standard TN-Horticulture indicative unit cost models. Exact entitlement finalized upon GPS survey and water source verification.
              </p>
            </div>

            {/* Booking Form for Cheran Site Survey */}
            <div className="lg:col-span-6 bg-paper-100 p-6 sm:p-8 rounded-xl border border-line-200">
              <div className="mb-4 pb-3 border-b border-line-200">
                <span className="text-xs font-mono font-bold text-forest-700 uppercase tracking-wider block mb-1">
                  Immediate Assistance
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                  Request a Free Cheran Farm Survey
                </h3>
                <p className="text-xs text-steel-600 mt-1">
                  Our field engineer from Erode / Perundurai will contact you within 24 hours.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 bg-forest-700/10 border border-forest-700/30 rounded-lg text-center my-6">
                  <span className="material-symbols-outlined text-forest-700 text-4xl mb-2">task_alt</span>
                  <h4 className="font-serif text-lg font-bold text-forest-900 mb-1">
                    Survey Request Registered!
                  </h4>
                  <p className="text-xs text-steel-600 max-w-md mx-auto">
                    Thank you {formData.farmerName}. A Cheran technical engineer has received your survey request for {formData.village}, {formData.district} and will contact you at {formData.phone} shortly.
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
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="farmerName">
                        Farmer Full Name *
                      </label>
                      <input
                        id="farmerName"
                        type="text"
                        required
                        value={formData.farmerName}
                        onChange={handleInputChange}
                        placeholder="e.g. K. Murugesan"
                        className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="phone">
                        Mobile Number (Aadhaar linked) *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 98428 12345"
                        className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="district">
                        District in Tamil Nadu *
                      </label>
                      <select
                        id="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option>Erode</option>
                        <option>Tiruppur</option>
                        <option>Coimbatore</option>
                        <option>Salem</option>
                        <option>Namakkal</option>
                        <option>Karur</option>
                        <option>Dindigul</option>
                        <option>Dharmapuri</option>
                        <option>Other District</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="village">
                        Taluk / Village Name *
                      </label>
                      <input
                        id="village"
                        type="text"
                        required
                        value={formData.village}
                        onChange={handleInputChange}
                        placeholder="e.g. Perundurai / Vijayamangalam"
                        className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="extentAndPump">
                      Approximate Extent & Water Source
                    </label>
                    <input
                      id="extentAndPump"
                      type="text"
                      value={formData.extentAndPump}
                      onChange={handleInputChange}
                      placeholder="e.g. 3 Acres, Open Well with 5HP Submersible pump"
                      className="w-full bg-paper-50 p-2.5 rounded border border-line-200 text-xs text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-forest-700 hover:bg-forest-900 text-paper-50 py-3 rounded font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    <span>Schedule Free On-Site Inspection</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FARMER HELPDESK BANNER & STATUTORY NOTICE
         ========================================================================= */}
      <section className="w-full bg-forest-900 text-paper-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-forest-700/50 p-6 sm:p-10 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-[rgba(227,223,210,0.15)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sun-500 text-forest-900 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">support_agent</span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-sun-500 uppercase tracking-widest block mb-0.5">
                  Cheran Farmer Guidance Helpline
                </span>
                <h3 className="font-serif text-lg sm:text-2xl font-bold text-paper-50">
                  Speak Directly With Our Micro-Irrigation Officer
                </h3>
                <p className="text-xs sm:text-sm text-surface-container-high mt-1 max-w-xl">
                  Clarifications regarding quota availability in your district, portal uploads, or joint-well declarations. We speak your language.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <a
                href="tel:18004251595"
                className="w-full sm:w-auto bg-sun-500 hover:bg-yellow-400 text-forest-900 px-5 py-3 rounded font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Toll-Free: 1800 425 1595</span>
              </a>
              <a
                href="tel:+919842811595"
                className="w-full sm:w-auto bg-surface-container-highest/15 hover:bg-surface-container-highest/25 text-paper-50 px-5 py-3 rounded font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-paper-50/20"
              >
                <span className="material-symbols-outlined text-base">phone_iphone</span>
                <span>+91 98428 11595</span>
              </a>
            </div>
          </div>

          {/* Statutory Regulatory Disclaimer */}
          <div className="mt-6 pt-4 border-t border-[rgba(227,223,210,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-surface-container-high/80">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sun-500 text-base">gavel</span>
              <span>
                <strong>Statutory Notice:</strong> Subsidy norms, percentages, and block physical targets are subject to Government of Tamil Nadu agricultural department guidelines.
              </span>
            </div>
            <div className="shrink-0 font-mono text-[11px]">
              Cheran Plast & Cheran Irrigation • Vijayamangalam, Erode
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
