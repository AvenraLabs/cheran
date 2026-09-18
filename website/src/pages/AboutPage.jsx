import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AboutPage() {
  const { isTamil } = useLanguage();

  const coreValues = [
    {
      num: '01',
      icon: 'verified',
      tamil: 'நேர்மை',
      name: isTamil ? 'நேர்மை' : 'Honesty',
      desc: isTamil
        ? 'உயர் ரக விர்ஜின் பிசின் கலவை, சுவரின் தடிமன் சான்றிதழ் மற்றும் எக்காரணத்திற்காகவும் கனிம ஃபில்லர்கள் சேர்க்காத வெளிப்படைத்தன்மை.'
        : 'Uncompromising transparency in virgin resin compounding, wall-thickness certification, and never using clandestine mineral fillers.',
      standard: isTamil ? 'தூய கூட்டுத் தரம்' : 'Formula Purity Standard',
    },
    {
      num: '02',
      icon: 'diversity_1',
      tamil: 'நம்பிக்கை',
      name: isTamil ? 'நம்பிக்கை' : 'Trust',
      desc: isTamil
        ? 'தமிழ்நாடு, கேரளா மற்றும் கர்நாடகா முழுவதும் 65,000-க்கும் மேற்பட்ட விவசாய குடும்பங்கள் அளித்த நான்கு தசாப்த கால அசைக்க முடியாத நம்பிக்கை.'
        : 'Four decades of generational faith earned from over 65,000 agricultural families across Tamil Nadu, Kerala, and Karnataka.',
      standard: isTamil ? 'தலைமுறை தொடர்ச்சி' : 'Generational Continuity',
    },
    {
      num: '03',
      icon: 'water_drop',
      tamil: 'திறன்',
      name: isTamil ? 'திறன்' : 'Efficiency',
      desc: isTamil
        ? '70% வரை நீர் பயன்பாட்டு திறன், குறைவான உராய்வு கொண்ட உள்சுவர்கள் மூலம் பம்ப் மற்றும் மின்சார பயன்பாட்டை பெருமளவு குறைக்கிறது.'
        : 'Maximizing water-use efficiency up to 70% with low-friction polymer inner walls that slash tractor and pump power consumption.',
      standard: isTamil ? 'Hazen-Williams C=150 நீரோட்டம்' : 'Hazen-Williams C=150 Flow',
    },
    {
      num: '04',
      icon: 'handshake',
      tamil: 'விசுவாசம்',
      name: isTamil ? 'விசுவாசம்' : 'Loyalty',
      desc: isTamil
        ? 'விவசாய பங்குதாரர்கள் மற்றும் டீலர்களுக்கு விரைவான மாற்று பொருட்கள் மற்றும் வேளாண் ஆலோசனைகளுடன் வாழ்நாள் கள சேவை அர்ப்பணிப்பு.'
        : 'Lifelong field service commitments to farmer partners and retail dealers with responsive replacements and agronomic guidance.',
      standard: isTamil ? '1800 இலவச கள உதவி மையம்' : '1800 Free Field Helpline',
    },
    {
      num: '05',
      icon: 'memory',
      tamil: 'புதுமை',
      name: isTamil ? 'புதுமை' : 'Innovation',
      desc: isTamil
        ? 'சுய-சுத்திகரிப்பு சுழல் லேபிரிந்த் சொட்டுவான்கள், இரட்டை அடுக்கு UV பாதுகாப்பு மற்றும் உள்நாட்டிலேயே வடிவமைக்கப்பட்ட அலாய் டை வடிவமைப்பு.'
        : 'Self-cleaning turbulent labyrinth emitters, dual-layer UV shielding, and proprietary alloy extrusion dies designed in-house.',
      standard: isTamil ? 'அடைப்பற்ற சொட்டுவான்கள்' : 'Clog-Resistant Emitters',
    },
    {
      num: '06',
      icon: 'balance',
      tamil: 'நம்பகத்தன்மை',
      name: isTamil ? 'நம்பகத்தன்மை' : 'Reliability',
      desc: isTamil
        ? 'வயலில் ஏற்படும் திடீர் வெடிப்புகளை தவிர்க்க, இயக்க வரம்பை விட 2.5 மடங்கு கூடுதல் அழுத்தத்தில் 100% ஹைட்ரோஸ்டேடிக் சோதனை.'
        : '100% batch hydrostatic pressure testing under 2.5× operating limits to eliminate catastrophic field bursts and trench failures.',
      standard: isTamil ? 'வெடிப்பற்ற முழு உத்தரவாதம்' : 'Zero Burst Guarantee',
    },
    {
      num: '07',
      icon: 'license',
      tamil: 'தரம்',
      name: isTamil ? 'தரம்' : 'Qualities',
      desc: isTamil
        ? 'IS:4985, IS:13488, IS:13487 மற்றும் IS:12786 விதிகளுக்குட்பட்ட கடுமையான உற்பத்தி மற்றும் ஆய்வக இயந்திரவியல் சோதனை நெறிமுறைகள்.'
        : 'Stringent compliance adhering to IS:4985, IS:13488, IS:13487, and IS:12786 with in-house physical and chemical test suites.',
      standard: isTamil ? 'நான்கு BIS ISI தர முத்திரைகள்' : 'Quadruple BIS Markings',
    },
    {
      num: '08',
      icon: 'support_agent',
      tamil: 'சேவை',
      name: isTamil ? 'சேவை' : 'Services',
      desc: isTamil
        ? 'PMKSY அரசு மானிய ஆவணங்கள், வயல்வௌி ஜிபிஎஸ் கணக்கெடுப்பு, ஹைட்ராலிக் அளவு திட்டமிடல் மற்றும் நிறுவிய பின் நேரடி கள ஆய்வு.'
        : 'Complete turnkey PMKSY subsidy documentation, field topography GPS surveying, hydraulic line sizing, and post-installation audit.',
      standard: isTamil ? 'முழுமையான PMKSY மானிய சேவை' : 'Turnkey PMKSY Execution',
    },
  ];

  const milestones = [
    {
      year: '1983',
      tag: isTamil ? 'தொடக்கம்' : 'Inception',
      title: isTamil ? 'சேரன் பிளாஸ்ட் தொடக்கம்' : 'Cheran Plast Founded',
      desc: isTamil
        ? 'திரு. P.R. குப்புசாமி அவர்களால் விஜயமங்கலத்தில் விவசாய uPVC குழாய்களுக்கான முதல் இரட்டை-திருகு எக்ஸ்ட்ரூடர் நிறுவப்பட்டது.'
        : 'Mr. P.R. Kuppusamy commissioned the first twin-screw extruder line for rigid agricultural uPVC pipes at Vijayamangalam, Perundurai.',
      sub: isTamil ? 'பிளாண்ட் I • 2.5 kg/cm² பைப் லைன்' : 'Plant I • 2.5 kg/cm² Pipe Line',
    },
    {
      year: '1995',
      tag: isTamil ? 'தர அங்கீகாரம்' : 'Accreditation',
      title: isTamil ? 'IS:4985 BIS தரச்சான்றிதழ்' : 'IS:4985 BIS Certification',
      desc: isTamil
        ? 'மத்திய அரசின் BIS ISI முத்திரை பெற்றது. ஈரோடு, கோவை, திருப்பூர் பகுதி விவசாயிகளின் முதன்மை நம்பிக்கைப் பெயராக மாறியது.'
        : 'Conferred the Bureau of Indian Standards ISI Mark for agricultural pressure conduits, becoming the trusted brand for Coimbatore, Erode, & Tirupur.',
      sub: isTamil ? 'உரிம எண்: CM/L-6184071' : 'CM/L-6184071 Issued',
    },
    {
      year: '2005',
      tag: isTamil ? 'நிலத்தடி நீர் பொறியியல்' : 'Aquifer Engineering',
      title: isTamil ? 'ஆழ்துளை கிணறு பைப்புகள்' : 'Borewell Heavy Systems',
      desc: isTamil
        ? 'கடினமான பாறை அமைப்புகளில் 1,200 அடி ஆழம் வரை தாங்கும் 35 kg/cm² அதிக இழுவிசை கொண்ட காலம் மற்றும் கேசிங் பைப்புகள் உருவாக்கப்பட்டன.'
        : 'Engineered high-tensile column pipes and ribbed screen casing pipes rated up to 35 kg/cm² for deep sub-surface extraction in rocky Deccan formations.',
      sub: isTamil ? 'சதுர-திரிடு பிரசிஷன் டூலிங்' : 'Square-Thread Tooling',
    },
    {
      year: '2017',
      tag: isTamil ? 'விரிவாக்கம்' : 'Expansion',
      title: isTamil ? 'சேரன் இரிகேஷன் தொடக்கம்' : 'Cheran Irrigation Launched',
      desc: isTamil
        ? 'இன்லைன் சிலிண்டிரிக்கல் சொட்டுநீர் குழாய்கள், வடிகட்டிகள் மற்றும் PMKSY அரசு மானிய திட்டங்களுக்காக பிளாண்ட் II (S.F. 145) நிறுவப்பட்டது.'
        : 'Established dedicated Plant II (S.F.No.145) for inline cylindrical emitters, flat drip tape, disk filtration units, and PMKSY subsidy empanelment.',
      sub: isTamil ? 'தோட்டக்கலை துறை அங்கீகாரம்' : 'Horticulture Dept Empanelment',
    },
    {
      year: '2025',
      tag: isTamil ? 'நவீன ஆட்டோமேஷன்' : 'Modern Pedigree',
      title: isTamil ? 'கணினிமயமாக்கப்பட்ட துல்லியம்' : 'Computerized Precision',
      desc: isTamil
        ? 'தானியங்கி லேசர் பரிசோதனை கொண்ட மல்டி-லேயர் ஆப்டிகல் எக்ஸ்ட்ரூஷன் மற்றும் விவசாயிகளுக்கு நேரடி இல்லம் தேடி மானிய உதவி.'
        : 'Automated multi-layer optical extrusion lines, computer-controlled burst hydrostatic test bays, and doorstep subsidy disbursement assistance.',
      sub: isTamil ? 'ஜீரோ-டாலரன்ஸ் உற்பத்தி' : 'Zero-Tolerance Compliance',
      highlight: true,
    },
  ];

  return (
    <div className="w-full bg-paper-50 font-sans text-ink selection:bg-forest-700 selection:text-paper-50">
      {/* Top Heritage Breadcrumb Strip */}
      <section className="w-full bg-paper-100 py-2.5 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-steel-600 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-forest-700 font-bold uppercase tracking-wider">
              {isTamil ? 'சேரன் தொழில்துறை குழுமம்' : 'Cheran Industrial Group'}
            </span>
            <span>/</span>
            <span className="text-steel-600">
              {isTamil ? 'நான்கு தசாப்த வரலாறு & பாரம்பரியம்' : 'Heritage & Governance'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-forest-900 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></span>
              <span>{isTamil ? 'நிறுவப்பட்டது: 1983 • விஜயமங்கலம்' : 'Est. 1983 • Vijayamangalam, Tamil Nadu'}</span>
            </span>
            <span className="hidden sm:inline text-line-200">|</span>
            <span className="hidden sm:inline text-steel-600">DOC: CHR-HIST-83</span>
          </div>
        </div>
      </section>

      {/* SECTION 1: EDITORIAL HEADER & METRIC STRIP */}
      <section className="w-full bg-paper-50 px-4 sm:px-6 lg:px-10 pt-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow & Monospace Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-200 pb-3 mb-8">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2.5 h-2.5 bg-forest-700"></span>
              <span className="text-xs font-mono font-bold text-forest-900 tracking-widest uppercase">
                {isTamil ? '40+ ஆண்டு கால நேர்மை • 1983 முதல் இன்று வரை' : 'FOUR DECADES OF INTEGRITY · 1983 TO TODAY'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-steel-600 text-xs font-mono">
              <span>{isTamil ? 'கொங்கு மண்டல ஆவணங்கள்' : 'KONGU REGION ARCHIVES'}</span>
              <span className="text-line-200">/</span>
              <span>{isTamil ? 'விஜயமங்கலம், ஈரோடு' : 'VIJAYAMANGALAM, TN'}</span>
              <span className="text-line-200">/</span>
              <span className="text-forest-700 font-semibold">DOC. NO. CHR-HIST-83</span>
            </div>
          </div>

          {/* Main Headline Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline pb-12">
            <div className="lg:col-span-8">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-[1.12] max-w-4xl">
                {isTamil
                  ? 'கொங்கு மண்ணிலிருந்து உருவான தரம்: நான்கு தசாப்த கால நீர் மேலாண்மை மற்றும் உற்பத்திப் பாரம்பரியம்'
                  : 'Built from the Soil of Kongu Nadu: A Legacy of Water Stewardship and Precision Manufacturing'}
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm sm:text-base text-steel-600 leading-relaxed">
                {isTamil
                  ? '1983-ல் பெருந்துறை வட்டம் விஜயமங்கலத்தில் திரு. P.R. குப்புசாமி அவர்களால் தொடங்கப்பட்ட சேரன் குழுமம், உள்நாட்டு உயர்ரக பாலிமர் குழாய்கள் மற்றும் நுண்ணீர்ப் பாசன தொழில்நுட்பங்கள் மூலம் விவசாயிகளின் நீர் தற்சார்ப்பை உயர்த்தியுள்ளது.'
                  : 'Founded in 1983 by Mr. P.R. Kuppusamy in Vijayamangalam, Perundurai, Cheran Group transformed regional agricultural water resilience through indigenously extruded polymer conduits and precision micro-irrigation systems.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Strip (Bespoke 4-Cell Engineering Ledger) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-line-200 bg-paper-100/60 divide-y lg:divide-y-0 lg:divide-x divide-line-200">
            <div className="p-5 lg:p-7">
              <span className="text-xs font-mono uppercase tracking-widest text-steel-600 block mb-1">
                {isTamil ? 'தொடங்கப்பட்ட ஆண்டு' : 'Foundation Year'}
              </span>
              <div className="font-serif text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-none">
                1983
              </div>
              <span className="text-xs text-steel-600 block mt-2">
                {isTamil ? 'ஈரோடு மாவட்டத்தில் முதல் தொழிற்சாலை' : 'First plant established in Erode district'}
              </span>
            </div>
            <div className="p-5 lg:p-7">
              <span className="text-xs font-mono uppercase tracking-widest text-steel-600 block mb-1">
                {isTamil ? 'உற்பத்தி அனுபவம்' : 'Operational Pedigree'}
              </span>
              <div className="font-serif text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-none">
                40+
              </div>
              <span className="text-xs text-steel-600 block mt-2">
                {isTamil ? 'தொடர்ச்சியான டூல்ரூம் மற்றும் எக்ஸ்ட்ரூஷன் திறன்' : 'Continuous years of toolroom engineering'}
              </span>
            </div>
            <div className="p-5 lg:p-7">
              <span className="text-xs font-mono uppercase tracking-widest text-steel-600 block mb-1">
                {isTamil ? 'பயன்பெற்ற விவசாயிகள்' : 'Agrarian Footprint'}
              </span>
              <div className="font-serif text-4xl lg:text-5xl font-extrabold text-forest-700 tracking-tight leading-none">
                65k+
              </div>
              <span className="text-xs text-steel-600 block mt-2">
                {isTamil ? 'செழிப்புற்ற விவசாய குடும்பங்கள்' : 'Farming families irrigated sustainably'}
              </span>
            </div>
            <div className="p-5 lg:p-7">
              <span className="text-xs font-mono uppercase tracking-widest text-steel-600 block mb-1">
                {isTamil ? 'உற்பத்தி வளாகங்கள்' : 'Manufacturing Plants'}
              </span>
              <div className="font-serif text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-none">
                02
              </div>
              <span className="text-xs text-steel-600 block mt-2">
                {isTamil ? 'பிரத்யேக அதிநவீன தொழிற்சாலைகள்' : 'Dedicated high-throughput facilities'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FOUNDER'S LEGACY & PHILOSOPHY (Asymmetric Split) */}
      <section className="w-full bg-paper-100 py-12 lg:py-20 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Archival Workshop Image + Framing */}
            <div className="lg:col-span-6 space-y-6">
              <div className="relative bg-paper-50 p-2 border border-line-200 shadow-sm">
                <div className="overflow-hidden aspect-[4/3] bg-surface-container">
                  <img
                    alt="Archival Toolroom Vijayamangalam 1983"
                    className="w-full h-full object-cover grayscale contrast-110 hover:scale-[1.02] transition-transform duration-500"
                    src="/images/about-archival-toolroom.jpeg"
                  />
                </div>
                <div className="p-4 bg-paper-50 border-t border-line-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-forest-700 text-lg shrink-0 mt-0.5">
                    precision_manufacturing
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm text-ink font-semibold leading-snug">
                      {isTamil
                        ? '1983-ல் விஜயமங்கலம் பட்டறையில் திரு. P.R. குப்புசாமி அவர்கள் ஆரம்பகால மோல்டுகளை சோதிக்கிறார்.'
                        : 'Mr. P.R. Kuppusamy testing early dies in the Vijayamangalam toolroom, 1983.'}
                    </p>
                    <span className="text-[11px] font-mono text-steel-600 uppercase tracking-wider block mt-1">
                      {isTamil ? 'வரலாற்றுப் பதிவு • இரட்டை-சுவர் டூலிங் அளவுத்திருத்தம்' : 'ARCHIVAL RECORD • LATHE CALIBRATION ON DUAL-WALL TOOLING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Industrial Artifact Quote Plate */}
              <div className="bg-forest-900 text-paper-50 p-6 sm:p-7 rounded-none border-l-4 border-sun-500 shadow-md">
                <div className="flex items-center gap-2 text-sun-500 mb-2">
                  <span className="material-symbols-outlined text-xl">format_quote</span>
                  <span className="text-xs font-mono uppercase tracking-widest text-paper-100/80">
                    {isTamil ? 'நிறுவனரின் தாரக மந்திரம்' : 'Founding Tenet'}
                  </span>
                </div>
                <blockquote className="font-serif text-lg sm:text-xl italic text-paper-50 leading-relaxed font-normal">
                  {isTamil
                    ? '“தண்ணீர் என்பது வெறும் பயன்பாட்டுப் பொருள் அல்ல—அது நம் விவசாய குடும்பங்களின் உழைப்பு மூலதனம். நமது குழாய்கள் அதில் நுழையும் ஒவ்வொரு துளியையும் மதிக்க வேண்டும்.”'
                    : '“Water is not merely a utility in our land—it is family capital. Our pipes must honor every single drop that enters them.”'}
                </blockquote>
                <span className="text-xs font-mono text-sun-500 font-bold uppercase tracking-wider block mt-3">
                  {isTamil ? '— மறைந்த திரு. P.R. குப்புசாமி, நிறுவனத் தலைவர்' : '— Late Sri P.R. Kuppusamy, Founder Chairman'}
                </span>
              </div>
            </div>

            {/* Right: Narrative & Dual Mission/Vision Columns */}
            <div className="lg:col-span-6 flex flex-col space-y-6 lg:pl-4">
              <div className="space-y-2">
                <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">history_edu</span>
                  <span>{isTamil ? 'நிறுவனரின் தொலைநோக்குப் பார்வை' : "THE FOUNDER'S CALLING"}</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight leading-tight">
                  {isTamil ? 'வறட்சியை வென்ற ஒரு பொறியாளரின் உறுதிப்பாடு' : 'An Engineer’s Resolve Against Drought'}
                </h2>
              </div>

              <div className="space-y-4 text-steel-600 text-sm sm:text-base leading-relaxed">
                <p>
                  {isTamil
                    ? '1970-களின் இறுதியில் கொங்கு மண்டலத்தில் நிலத்தடி நீர்மட்டம் சரியத் தொடங்கியபோது, தரம் குறைந்த குழாய்களால் விவசாயிகள் கடும் நஷ்டமடைந்தனர். கடுமையான வெயிலின் வெப்பத்தில் பைப் விரிசலடைவதும், பிரஷர் தாங்காமல் வெடிப்பதும் வழக்கமாக இருந்தது.'
                    : 'When severe groundwater table depletion began threatening the dry agricultural belts of western Tamil Nadu in the late 1970s, Mr. P.R. Kuppusamy saw that fragile, low-grade irrigation piping was failing farmers at the worst possible moments. Pumping heads were collapsing under thermal sun-load, joints ruptured at sub-standard bar ratings, and entire harvests were lost to water conveyance failure.'}
                </p>
                <p>
                  {isTamil
                    ? 'மறுசுழற்சி செய்யப்பட்ட தரமற்ற பிளாஸ்டிக்கிற்கு மாற்றாக, விஜயமங்கலத்தில் முதல் இரட்டை-திருகு பிரசிஷன் பட்டறையை நிறுவினார். தக்காண பீடபூமியின் கரிசல் மண் உப்புத்தன்மை மற்றும் கொளுத்தும் கோடை வெப்பத்தைத் தாங்கும் 100% தூய விர்ஜின் பிசின் கொண்டு குழாய்களை உற்பத்தி செய்தார்.'
                    : 'Rather than importing secondary regrind extrusions, he established Vijayamangalam’s first dedicated twin-screw precision die workshop. His premise was simple: formulate virgin-grade compound chemistry resilient against Deccan black soil salinity and extreme Tamil Nadu summers.'}
                </p>
              </div>

              {/* Vision & Mission Structured Ledger */}
              <div className="space-y-4 pt-2">
                <div className="bg-paper-50 p-5 sm:p-6 border border-line-200 shadow-sm">
                  <div className="flex items-center gap-2.5 text-forest-900 mb-2">
                    <span className="material-symbols-outlined text-forest-700">visibility</span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold">
                      {isTamil ? 'எங்கள் தொலைநோக்கு (Vision)' : 'Our Vision'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                    {isTamil
                      ? 'தென்னிந்தியாவின் முதன்மையான வேளாண் பொறியியல் மையமாக விளங்கி, சமரசமற்ற பாலிமர் தரம் மற்றும் நுண்ணீர்ப் பாசன தொழில்நுட்பங்கள் மூலம் விவசாயிகளின் வாழ்வாதாரத்தை உயர்த்துவது.'
                      : "To stand as South India's foremost agricultural engineering powerhouse, enabling sustainable crop yields through uncompromising polymer integrity and water-saving technologies."}
                  </p>
                </div>

                <div className="bg-paper-50 p-5 sm:p-6 border border-line-200 shadow-sm">
                  <div className="flex items-center gap-2.5 text-forest-900 mb-2">
                    <span className="material-symbols-outlined text-forest-700">handshake</span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold">
                      {isTamil ? 'எங்கள் பணி இலக்கு (Mission)' : 'Our Mission'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                    {isTamil
                      ? 'அதிக நீடித்து உழைக்கும் பாசனக் குழாய்களை உற்பத்தி செய்தல், கண்டிப்பான BIS தரநிலைகளைப் பேணுதல், மற்றும் நேரடி களப் பொறியியல் ஆதரவுடன் நுண்ணீர்ப் பாசனத்தை அனைத்து விவசாயிகளுக்கும் எளிதில் கிடைக்கச் செய்தல்.'
                      : 'Manufacture the highest-durability irrigation lines and polymer pipes, maintain rigorous BIS standards, and make precision micro-irrigation accessible to every farmer through localized engineering support and zero-compromise extrusion.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE 8 CORE VALUES (8 Pillars of Cheran Group) */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-2 text-forest-700 mb-2">
              <span className="material-symbols-outlined text-xl">psychiatry</span>
              <span className="text-xs font-mono uppercase tracking-widest font-bold">
                {isTamil ? 'சேரன் குழுமத்தின் 8 தூண்கள்' : 'The 8 Pillars of Cheran Group'}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight leading-tight">
              {isTamil
                ? 'ஒவ்வொரு உற்பத்தி தொகுதியையும் வழிநடத்தும் 8 அடிப்படைக் கோட்பாடுகள்'
                : 'The Foundational Virtues Guiding Every Batch Extruded and Every Lateral Installed'}
            </h2>
            <p className="text-sm sm:text-base text-steel-600 mt-3 leading-relaxed">
              {isTamil
                ? '1983-ல் சேரன் நிறுவனத்தின் எட்டு இலை ஆலமர சின்னத்திலிருந்து பெறப்பட்ட இந்த எட்டுக் கோட்பாடுகள், மூலப்பொருள் தேர்வு முதல் விவசாயிகளின் வயல்வெளி ஆய்வு வரை அனைத்தையும் நெறிப்படுத்துகின்றன.'
                : 'Drawn from the symbolic eight-leaf banyan emblem of Cheran’s 1983 founding charter, these eight operating canons govern our raw compound purchasing, toolroom tolerance, and farmer welfare commitments.'}
            </p>
          </div>

          {/* 8-Card Utility Grid (2 Rows of 4 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {coreValues.map((val) => (
              <div
                key={val.num}
                className="bg-paper-100/50 p-6 border border-line-200 hover:border-forest-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl text-forest-700/40 font-bold">{val.num}</span>
                    <span className="material-symbols-outlined text-forest-700 text-2xl">{val.icon}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <span className="text-xs font-mono text-clay-400 uppercase font-bold tracking-wider block">
                      {val.tamil}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-900">{val.name}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">{val.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-line-200/60 text-[11px] font-mono text-steel-600 tracking-wider uppercase font-semibold">
                  {val.standard}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: COMPANY TIMELINE & EVOLUTION (1983 → 2025) */}
      <section className="w-full bg-forest-900 text-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between border-b border-line-200/20 pb-6 mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sun-500 mb-2">
                <span className="material-symbols-outlined text-xl">timeline</span>
                <span className="text-xs font-mono uppercase tracking-widest font-semibold">
                  {isTamil ? 'தொழில்துறை வளர்ச்சி வரலாறு' : 'Chronicle of Industrial Evolution'}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-paper-50 tracking-tight">
                {isTamil
                  ? 'விஜயமங்கலம் பட்டறையிலிருந்து தேசிய அளவிலான ஹைட்ராலிக் தரம் வரை'
                  : 'From Vijayamangalam Workshop to National Hydraulic Benchmark'}
              </h2>
            </div>
            <span className="text-xs font-mono text-paper-100/60 uppercase tracking-widest hidden md:block">
              MILESTONES 1983 – 2025
            </span>
          </div>

          {/* Roadmap Grid with 5 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {milestones.map((m) => (
              <div
                key={m.year}
                className={`p-6 border flex flex-col justify-between ${
                  m.highlight
                    ? 'bg-forest-700/70 border-sun-500/60 shadow-lg'
                    : 'bg-primary-container/40 border-line-200/15'
                }`}
              >
                <div className="space-y-2">
                  <span className="font-serif text-4xl font-extrabold text-sun-500 block leading-none">
                    {m.year}
                  </span>
                  <span
                    className={`text-[11px] font-mono uppercase tracking-widest block ${
                      m.highlight ? 'text-sun-500 font-bold' : 'text-paper-100/60'
                    }`}
                  >
                    {m.tag}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-paper-50">{m.title}</h3>
                  <p className="text-xs sm:text-sm text-line-200/80 leading-relaxed pt-1">{m.desc}</p>
                </div>
                <div
                  className={`mt-5 pt-3 border-t text-[11px] font-mono ${
                    m.highlight
                      ? 'border-line-200/20 text-sun-500 font-semibold'
                      : 'border-line-200/10 text-paper-100/60'
                  }`}
                >
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: MANUFACTURING INFRASTRUCTURE & ENGINEERING STANDARDS */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Title & Narrative */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-forest-700 mb-2">
                <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
                <span className="text-xs font-mono uppercase tracking-widest font-bold">
                  {isTamil ? 'உற்பத்தி கட்டமைப்பு & தரக்கட்டுப்பாடு' : 'Infrastructure & Compliance'}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight leading-tight">
                {isTamil
                  ? 'விஜயமங்கலத்தில் இரண்டு பிரத்யேக உற்பத்தி ஆலைகள்'
                  : 'Dual-Plant Architecture Built for Scale and Strict Quality Rigor'}
              </h2>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                {isTamil
                  ? 'விஜயமங்கலம் ஊத்துக்குளி சாலையில் அமைந்துள்ள எங்கள் இரண்டு உற்பத்தி ஆலைகளிலும் அல்ட்ராசோனிக் தடிமன் கண்காணிப்புடன் 24 மணி நேரமும் உற்பத்தி நடைபெறுகிறது.'
                  : 'Operating from two contiguous industrial survey plots in Vijayamangalam, our extrusion lines run 24 hours under continuous ultrasonic wall-thickness monitors.'}
              </p>
            </div>
          </div>

          {/* Two Factory Cards Side-by-Side (NEVER MERGED) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Plant I Card */}
            <div className="lg:col-span-6 bg-paper-100 p-6 sm:p-8 border border-line-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="overflow-hidden aspect-[16/9] mb-5 bg-surface-container">
                  <img
                    alt="Cheran Plast Extrusion Hall"
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    src="/images/about-extrusion-hall.jpeg"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-line-200 pb-2 mb-4">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                    {isTamil ? 'பிளாண்ட் I — சேரன் பிளாஸ்ட்' : 'Plant I — Cheran Plast'}
                  </h3>
                  <span className="text-xs font-mono px-3 py-1 bg-forest-700 text-paper-50 rounded font-bold">
                    EST. 1983
                  </span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-steel-600 mb-6">
                  <p>
                    <strong className="text-ink">{isTamil ? 'முகவரி:' : 'Location:'}</strong> S.F.No.137, Uthukuli Road, Vijayamangalam, Perundurai Taluk.
                  </p>
                  <p>
                    <strong className="text-ink">{isTamil ? 'முதன்மை தயாரிப்புகள்:' : 'Primary Output:'}</strong> Rigid uPVC Pressure Conduits, Agricultural Column Pipes, Ribbed Casing Pipes, Submersible Delivery Risers.
                  </p>
                  <p>
                    <strong className="text-ink">{isTamil ? 'உற்பத்தி வசதி:' : 'Extrusion Capacity:'}</strong> 6 Twin-Screw Continuous Extrusion Lines with automated haul-off traction and online belling systems.
                  </p>
                </div>
              </div>
              <div className="bg-paper-50 p-4 border border-line-200 space-y-1">
                <span className="text-[11px] font-mono text-forest-700 font-bold uppercase tracking-wider block">
                  {isTamil ? 'இந்திய தரக்கட்டுப்பாடு சான்றுகள்' : 'Bureau of Indian Standards Scope'}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-ink font-mono text-xs sm:text-sm">
                  <span>IS:4985:2021</span>
                  <span className="text-line-200">•</span>
                  <span>IS:12818 (Borewell Casing)</span>
                  <span className="text-line-200">•</span>
                  <span>Class 1 to Class 5 Ratings</span>
                </div>
              </div>
            </div>

            {/* Plant II Card */}
            <div className="lg:col-span-6 bg-paper-100 p-6 sm:p-8 border border-line-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="overflow-hidden aspect-[16/9] mb-5 bg-surface-container">
                  <img
                    alt="Technical Blueprint and Testing Standards"
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    src="/images/about-blueprint-standards.jpeg"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-line-200 pb-2 mb-4">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                    {isTamil ? 'பிளாண்ட் II — சேரன் இரிகேஷன்' : 'Plant II — Cheran Irrigation'}
                  </h3>
                  <span className="text-xs font-mono px-3 py-1 bg-forest-700 text-paper-50 rounded font-bold">
                    EST. 2017
                  </span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-steel-600 mb-6">
                  <p>
                    <strong className="text-ink">{isTamil ? 'முகவரி:' : 'Location:'}</strong> S.F.No.145, Uthukuli Road, Vijayamangalam, Perundurai Taluk.
                  </p>
                  <p>
                    <strong className="text-ink">{isTamil ? 'முதன்மை தயாரிப்புகள்:' : 'Primary Output:'}</strong> Cylindrical &amp; Flat Inline Drip Lines, Micro-Sprinklers, Hydrocyclone &amp; Screen Filters, Venturi Injectors.
                  </p>
                  <p>
                    <strong className="text-ink">{isTamil ? 'உற்பத்தி வசதி:' : 'Extrusion Capacity:'}</strong> High-speed inline lateral lines with laser visual inspection for emitter insertion integrity.
                  </p>
                </div>
              </div>
              <div className="bg-paper-50 p-4 border border-line-200 space-y-1">
                <span className="text-[11px] font-mono text-forest-700 font-bold uppercase tracking-wider block">
                  {isTamil ? 'நுண்ணீர்ப் பாசன சான்றிதழ்கள்' : 'Micro-Irrigation Accreditation'}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-ink font-mono text-xs sm:text-sm">
                  <span>IS:13488:2008</span>
                  <span className="text-line-200">•</span>
                  <span>IS:13487:2024</span>
                  <span className="text-line-200">•</span>
                  <span>IS:12786:2024</span>
                </div>
              </div>
            </div>
          </div>

          {/* Laboratory Rigor & Testing Bays Strip */}
          <div className="bg-paper-100 p-6 sm:p-8 lg:p-10 border border-line-200 shadow-sm">
            <div className="max-w-3xl mb-8">
              <div className="flex items-center gap-2 text-clay-400 mb-1">
                <span className="material-symbols-outlined text-lg">biotech</span>
                <span className="text-xs font-mono uppercase tracking-widest font-bold">
                  {isTamil ? 'உள்நாட்டு ஆய்வக தரம்' : 'Internal Quality Control'}
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                {isTamil
                  ? 'BIS அங்கீகரிக்கப்பட்ட ஹைட்ரோஸ்டேடிக் மற்றும் மெக்கானிக்கல் சோதனை கூடங்கள்'
                  : 'In-House BIS-Approved Hydrostatic & Mechanical Test Bays'}
              </h3>
              <p className="text-xs sm:text-sm text-steel-600 mt-2 leading-relaxed">
                {isTamil
                  ? 'ஒவ்வொரு ஷிப்ட்டிலும் குழாய்கள் மற்றும் சொட்டுவான்கள் தொடர்ச்சியான வெடிப்பு மற்றும் சுமை சோதனைகளுக்கு உட்படுத்தப்படுகின்றன. ஆய்வு அறிக்கையின்றி எந்தவொரு பைப்பும் ஆலையை விட்டு வெளியேறாது.'
                  : 'Every production shift pulls pipe and emitter samples for destructive and sustained load validation. No batch leaves Vijayamangalam without documented compliance logs.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-paper-50 p-5 border border-line-200">
                <div className="flex items-center gap-2 text-forest-700 font-semibold mb-2">
                  <span className="material-symbols-outlined text-lg">speed</span>
                  <span className="text-sm font-bold">
                    {isTamil ? 'ஹைட்ரோஸ்டேடிக் வெடிப்பு சோதனை' : 'Hydrostatic Burst Testing'}
                  </span>
                </div>
                <p className="text-xs text-steel-600 leading-relaxed">
                  {isTamil
                    ? '60°C வெப்பநிலையில் 1,000 மணிநேர தொடர் அழுத்த சோதனை மூலம் குழாய்களின் பல ஆண்டு உழைப்பு உறுதி செய்யப்படுகிறது.'
                    : 'Sustained 1,000-hour internal pressure test rigs operating at 60°C to simulate multi-year sub-surface stress and joint adhesion endurance.'}
                </p>
              </div>

              <div className="bg-paper-50 p-5 border border-line-200">
                <div className="flex items-center gap-2 text-forest-700 font-semibold mb-2">
                  <span className="material-symbols-outlined text-lg">light_mode</span>
                  <span className="text-sm font-bold">
                    {isTamil ? 'ஒளிபுகாமை & கார்பன் பிளாக்' : 'Opacity & Carbon Black'}
                  </span>
                </div>
                <p className="text-xs text-steel-600 leading-relaxed">
                  {isTamil
                    ? '0.2% க்கும் குறைவான ஒளி ஊடுருவல் சோதனை, பாசி உருவாவதைத் தடுத்து சொட்டுவான் அடைப்புகளை முற்றிலும் நீக்குகிறது.'
                    : 'Optical transmittance analysis guaranteeing under 0.2% light entry, inhibiting internal algae blooms in laterals and maintaining emitter flow.'}
                </p>
              </div>

              <div className="bg-paper-50 p-5 border border-line-200">
                <div className="flex items-center gap-2 text-forest-700 font-semibold mb-2">
                  <span className="material-symbols-outlined text-lg">straighten</span>
                  <span className="text-sm font-bold">
                    {isTamil ? 'மோதல் & வெப்ப மீள் சோதனை' : 'Reversion & Impact Check'}
                  </span>
                </div>
                <p className="text-xs text-steel-600 leading-relaxed">
                  {isTamil
                    ? '0°C வெப்பநிலையில் கனரக ஸ்ட்ரைக்கர் மோதல் சோதனை மற்றும் வெப்ப பரிமாண நிலைத்தன்மை சரிபார்ப்பு.'
                    : 'Falling-weight striker impact verification at 0°C and thermal longitudinal reversion checks ensuring pipes maintain dimensional fidelity.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: EDITORIAL CTA BAND */}
      <section className="w-full bg-forest-900 text-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-sun-500">
                <span className="material-symbols-outlined text-xl">handshake</span>
                <span className="text-xs font-mono uppercase tracking-widest font-bold">
                  {isTamil ? 'நேரடி தொழிற்சாலை ஆலோசனை' : 'Agrarian Partnership & Factory Visits'}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-paper-50 tracking-tight leading-tight">
                {isTamil
                  ? 'எங்கள் விஜயமங்கலம் பொறியாளர்களுடன் நேரடியாக ஆலோசனை செய்யுங்கள்'
                  : 'Consult Directly with Our Vijayamangalam Engineers'}
              </h2>
              <p className="text-sm sm:text-base text-line-200/90 max-w-2xl leading-relaxed">
                {isTamil
                  ? 'அரசு மானியத்தின் கீழ் 20 ஏக்கர் தோட்டக்கலை சொட்டுநீர்ப் பாசன திட்டம் அமைப்பதற்கோ அல்லது மொத்த விற்பனை uPVC பிரஷர் பைப் தேவைக்கோ, எங்கள் தொழில்நுட்ப இயக்குநர்கள் கள ஆய்வு மற்றும் திட்டமிடலுக்கு தயாராக உள்ளனர்.'
                  : 'Whether planning a 20-acre orchard drip scheme under government subsidy or sourcing industrial uPVC pressure piping for municipal irrigation, our technical directors are available for on-site reviews and hydraulic surveys.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  className="inline-flex items-center gap-2 bg-forest-700 hover:bg-paper-50 hover:text-forest-900 text-paper-50 px-6 py-3 font-semibold text-sm transition-all border border-line-200/30"
                  href="tel:18004251595"
                >
                  <span className="material-symbols-outlined text-sun-500 text-xl">call</span>
                  <span>{isTamil ? 'கட்டணமில்லா எண்: 1800 425 1595' : 'Call Toll-Free 1800 425 1595'}</span>
                </a>
                <Link
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-paper-100 hover:text-forest-900 text-paper-50 px-6 py-3 font-semibold text-sm transition-all border border-line-200/40"
                  to="/contact"
                >
                  <span>{isTamil ? 'தொழிற்சாலை வருகை பதிவு' : 'Schedule Plant Inspection'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-primary-container/60 p-6 sm:p-7 border-l-4 border-sun-500 space-y-3">
              <span className="text-[11px] font-mono text-sun-500 uppercase tracking-widest block font-bold">
                {isTamil ? 'தொழிற்சாலை முகவரி' : 'VISIT OUR TOOLROOM'}
              </span>
              <h4 className="font-serif text-lg sm:text-xl font-bold text-paper-50">
                {isTamil ? 'சேரன் குழும வளாகம்' : 'Cheran Group Works'}
              </h4>
              <p className="text-xs sm:text-sm text-line-200/80 leading-relaxed">
                S.F.No.137 &amp; 145, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Erode District, Tamil Nadu – 638056.
              </p>
              <div className="pt-2 border-t border-line-200/10 text-paper-100/70 text-xs space-y-1">
                <div><strong>{isTamil ? 'நேரடி எண்:' : 'Direct:'}</strong> +91 98428 11595</div>
                <div><strong>{isTamil ? 'மின்னஞ்சல்:' : 'Email:'}</strong> cherrandrip@gmail.com</div>
                <div><strong>{isTamil ? 'வேலை நேரம்:' : 'Visiting Hours:'}</strong> Mon – Sat, 9:00 AM – 6:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
