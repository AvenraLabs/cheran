import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ProductsPage() {
  const { isTamil } = useLanguage();
  const [divisionFilter, setDivisionFilter] = useState('all'); // 'all', 'irrigation', 'plast'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'upvc', 'drip', 'hdpe', 'filtration', 'casing'
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    productLine: 'Rigid uPVC Pressure Pipes (IS:4985)',
    acreageOrLength: '',
    cropOrApp: '',
    applicantName: '',
    phone: '',
    districtLocation: '',
  });

  const products = useMemo(() => [
    {
      id: 'upvc-pressure',
      division: 'plast',
      category: 'upvc',
      divisionLabel: 'Cheran Plast',
      divisionBg: 'bg-forest-900',
      badge: isTamil ? 'IS:4985:2021 தரச்சான்று' : 'IS:4985:2021 LICENSED',
      badgeColor: 'text-steel-600',
      title: isTamil ? 'ரிஜிட் uPVC பிரஷர் பைப்பிங் சிஸ்டம்' : 'Rigid uPVC Pressure Piping Systems',
      description: isTamil
        ? '100% தூய விர்ஜின் பாலிமர் மற்றும் நச்சுத்தன்மையற்ற கால்சியம்-ஜிங்க் வெப்ப நிலைப்படுத்திகளுடன் தயாரிக்கப்படுகிறது. விவசாய மெயின் லைன்கள் மற்றும் குடிநீர் விநியோகத்தில் குறைந்தபட்ச உராய்வு (Hazen-Williams C=150) மற்றும் அதிக நீரோட்ட வேகத்தை உறுதி செய்கிறது.'
        : 'Formulated with 100% virgin polymer resin and non-toxic calcium-zinc heat stabilizers. Engineered with mirror-finish inner bore (Hazen-Williams C=150) for maximum hydraulic velocity and minimum friction head-loss in farm mainlines and municipal distribution.',
      specs: [
        { label: isTamil ? 'அளவு வரம்பு:' : 'Diameter Range:', value: '20 mm to 200 mm OD (1/2" to 8" Nominal)' },
        { label: isTamil ? 'இயக்க அழுத்தம்:' : 'Working Pressure:', value: 'Class 1 (0.25 MPa) to Class 5 (1.0 MPa)' },
        { label: isTamil ? 'இணைப்பு முறை:' : 'Jointing System:', value: 'Solvent Cement Socket & Elastomeric Ring' },
        { label: isTamil ? 'நிலையான நீளம்:' : 'Standard Length:', value: '6.0 Meters (20 ft) Plain / Socketed' },
      ],
      image: '/images/products-pvc-pipes.jpeg',
      imageCaption: isTamil ? 'எக்ஸ்ட்ரூஷன் லைன் 04 • உயர் இழுவிசை விவசாய குழாய்கள்' : 'Extrusion Line 04 · High-Tensile Agricultural Conduits',
      imageAlt: 'Stacked grey uPVC pressure pipes ready for agricultural shipment at Cheran Plast',
      reverse: false,
    },
    {
      id: 'inline-drip',
      division: 'irrigation',
      category: 'drip',
      divisionLabel: 'Cheran Irrigation',
      divisionBg: 'bg-forest-700',
      badge: isTamil ? 'PMKSY 100% முழு மானியம்' : 'PMKSY 100% SUBSIDY',
      badgeColor: 'text-clay-400 font-bold',
      title: isTamil ? 'பிரீமியம் சிலிண்டிரிக்கல் இன்லைன் சொட்டுநீர் குழாய்கள்' : 'Premium Cylindrical Inline Drip Tubing',
      description: isTamil
        ? 'உயர்தர LLDPE பாலிமரில் கம்ப்யூட்டர் வடிவிலான சுழல் லேபிரிந்த் சொட்டுவான்கள் பொருத்தப்பட்டு உற்பத்தி செய்யப்படுகிறது. கரும்பு, வாழை, மஞ்சள் மற்றும் பழத்தோட்டங்களில் அடைப்புகளை முற்றிலும் தவிர்க்கும் அகலமான வடிகட்டி பற்கள் கொண்டது.'
        : 'Continuous extrusion high-grade LLDPE tubing embedded with computer-designed turbulent flow labyrinth emitters. Built-in wide filtration inlet teeth prevent silt ingress and root intrusion in sugarcane, banana, turmeric, and high-density orchards.',
      specs: [
        { label: isTamil ? 'வெளிப்புற விட்டம்:' : 'Outer Diameter:', value: '12 mm & 16 mm (Class 1 & Class 2)' },
        { label: isTamil ? 'சொட்டுவான் வெளியேற்றம்:' : 'Emitter Discharge:', value: '1.2 LPH, 2.0 LPH, & 4.0 LPH (at 1.0 kg/cm²)' },
        { label: isTamil ? 'இடைவெளி வகைகள்:' : 'Spacing Variants:', value: '20cm, 30cm, 40cm, 50cm, 60cm' },
        { label: isTamil ? 'சுருள் பேக்கேஜிங்:' : 'Coil Packaging:', value: '400m, 500m, & 1,000m UV-Treated Coils' },
      ],
      image: '/images/products-drip-droplet.jpeg',
      imageCaption: isTamil ? 'சுழல் லேபிரிந்த் சொட்டுவான் • மாறாத சீரான நீரோட்டம்' : 'Turbulent Flow Labyrinth Emitter · Constant Discharge',
      imageAlt: 'Precision drip lateral emitting a single crystal-clear water droplet',
      reverse: true,
    },
    {
      id: 'sand-media',
      division: 'irrigation',
      category: 'filtration',
      divisionLabel: 'Cheran Irrigation',
      divisionBg: 'bg-forest-700',
      badge: isTamil ? 'மல்டி-பே பேட்டரி' : 'MULTI-BAY BATTERY',
      badgeColor: 'text-steel-600',
      title: isTamil ? 'மணல் ஊடக வடிகட்டி பேட்டரிகள் & ஹைட்ரோசைக்ளோன்கள்' : 'Sand Media Filtration Batteries & Hydrocyclones',
      description: isTamil
        ? 'திறந்தவெளி கிணறுகள், ஆறுகள் மற்றும் ஆழ்துளை கிணறுகளில் உள்ள சேறு, பாசி மற்றும் நுண்ணிய கசடுகளை சொட்டுநீர் அமைப்பிற்குள் செல்வதற்கு முன் முழுமையாக நீக்கும் முதன்மை வடிகட்டி. எபோக்சி பவுடர் பூசப்பட்ட கனரக ஸ்டீல் தொட்டிகள் மற்றும் பேக்வாஷ் அமைப்புகள் கொண்டது.'
        : 'Modular primary filtration designed to eliminate silt, algae, and suspended grit from open agricultural wells, borewells, and canal feeds before lateral entry. Epoxy powder-coated high-gauge steel tanks with manual and automated backwash manifolds.',
      specs: [
        { label: isTamil ? 'நீர் சுத்திகரிப்பு திறன்:' : 'Throughput Capacity:', value: '25 m³/hr to 100 m³/hr per module' },
        { label: isTamil ? 'வடிகட்டி ஊடகம்:' : 'Filtration Media:', value: 'Crushed quartz silica + 120-mesh disc' },
        { label: isTamil ? 'அதிகபட்ச அழுத்தம்:' : 'Max Pressure:', value: '10 Bar (PN 10 Structural Integrity)' },
        { label: isTamil ? 'மேனிஃபோல்ட் ஹெடர்கள்:' : 'Manifold Headers:', value: '2.5" (65mm), 3" (80mm), & 4" (100mm)' },
      ],
      image: '/images/products-filtration-battery.jpeg',
      imageCaption: isTamil ? 'இரட்டை-அறை தானியங்கி பேக்வாஷ் அசெம்பிளி' : 'Dual-Chamber Automated Backwash Assembly',
      imageAlt: 'Sand media filtration battery installation in an agricultural field',
      reverse: false,
    },
    {
      id: 'hdpe-coils',
      division: 'plast',
      category: 'hdpe',
      divisionLabel: 'Cheran Plast',
      divisionBg: 'bg-forest-900',
      badge: isTamil ? 'IS:4984 / IS:12786' : 'IS:4984 / IS:12786',
      badgeColor: 'text-steel-600',
      title: isTamil ? 'HDPE விவசாய & நீர்க்கடத்தல் சுருள் குழாய்கள்' : 'HDPE Agricultural & Conduction Pipe Coils',
      description: isTamil
        ? 'மேடு பள்ளமான நிலப்பரப்புகள், லிப்ட் பாசன இணைப்புகள் மற்றும் தரைக்கு அடியில் செல்லும் பிரதான நீர்க்கடத்தல் வழிகளுக்காக வடிவமைக்கப்பட்ட உயர் அடர்த்தி பாலிஎதிலீன் குழாய்கள். நில அசைவுகளிலும் விரிசலடையாத அதிக இழுவிசை உறுதி கொண்டது.'
        : 'Flexible, ultra-durable carbon-black stabilized polyethylene pipes engineered for undulating topography, lift irrigation conduits, and sub-surface main conduction lines. High impact strength and crack resistance under soil movement.',
      specs: [
        { label: isTamil ? 'அளவு வரம்பு:' : 'Diameter Range:', value: '20 mm to 110 mm Coils (Up to 200 mm straight)' },
        { label: isTamil ? 'பிரஷர் ரேட்டிங்:' : 'Pressure Ratings:', value: 'PN 2.5 to PN 16.0 (PE 63 / 80 / 100)' },
        { label: isTamil ? 'இணைப்பு நுட்பம்:' : 'Jointing Mechanism:', value: 'Butt Fusion, Electrofusion & Quick Couplers' },
        { label: isTamil ? 'சுருள் அளவுகள்:' : 'Coil Bundles:', value: '100 m to 500 m Continuous Seamless Rolls' },
      ],
      image: '/images/products-hdpe-coils.jpeg',
      imageCaption: isTamil ? 'PE 100 விர்ஜின் கலவை • உயர் இழுவிசை வளைவுத் திறன்' : 'PE 100 Virgin Compound · High Tensile Flexibility',
      imageAlt: 'Stacked heavy coils of black HDPE pipes in warehouse',
      reverse: true,
    },
    {
      id: 'sprinklers-rainguns',
      division: 'irrigation',
      category: 'upvc',
      divisionLabel: 'Cheran Irrigation',
      divisionBg: 'bg-forest-700',
      badge: isTamil ? 'மேல்தெளிப்பு பாசனம்' : 'OVERHEAD CANOPY',
      badgeColor: 'text-steel-600',
      title: isTamil ? 'டெல்ரின் & கன்மெட்டல் இம்பாக்ட் ஸ்பிரிங்க்லர்கள் மற்றும் ரெயின்கன்' : 'Delrin & Gunmetal Impact Sprinklers and Rain Guns',
      description: isTamil
        ? 'தேயிலைத் தோட்டங்கள், நிலக்கடலை, தீவனப் புல், கரும்பு மற்றும் நாற்றுப் பண்ணைகளுக்கு சீரான பனிமழை போன்ற தெளிப்பை வழங்கும் பொறியியல் அமைப்பு. இரட்டை முனை பேலன்ஸ் மற்றும் துருப்பிடிக்காத ஸ்டெயின்லெஸ் ஸ்டீல் ஸ்பிரிங் கொண்டது.'
        : 'Engineered overhead precipitation systems offering uniform droplet distribution for tea plantations, groundnut, fodder grass, sugarcane, and nursery beds. Double nozzle balance with stainless steel trip springs.',
      specs: [
        { label: isTamil ? 'தெளிப்பு விட்டம்:' : 'Throw Radius:', value: '12 m to 45 m Spray Diameter Coverage' },
        { label: isTamil ? 'இயக்க அழுத்தம்:' : 'Operating Pressure:', value: '2.0 to 5.5 kgf/cm² (Bar)' },
        { label: isTamil ? 'உடல் கட்டமைப்பு:' : 'Body Composition:', value: 'UV Delrin / Heavy Brass & Gunmetal Alloy' },
        { label: isTamil ? 'இன்லெட் த்ரெட்:' : 'Inlet Threading:', value: '1/2", 3/4", 1", 1.25", 2" BSP Male/Female' },
      ],
      image: '/images/products-sprinkler-mist.jpeg',
      imageCaption: isTamil ? '360° வட்ட வடிவ & பகுதி-வட்ட முழு தெளிப்பு' : '360° Circular & Part-Circle Full Coverage',
      imageAlt: 'Agricultural impact sprinkler dispersing fine water mist',
      reverse: false,
    },
    {
      id: 'casing-column',
      division: 'plast',
      category: 'casing',
      divisionLabel: 'Cheran Plast',
      divisionBg: 'bg-forest-900',
      badge: isTamil ? 'IS:12818 ஆழ்துளை கிணறு தொடர்' : 'IS:12818 BOREWELL SERIES',
      badgeColor: 'text-steel-600',
      title: isTamil ? 'uPVC ஆழ்துளை கிணறு கேசிங் & காலம் பைப்புகள்' : 'uPVC Deep Borewell Casing & Column Pipes',
      description: isTamil
        ? '1,200 அடி ஆழம் வரையிலான அதீத நிலத்தடி அழுத்தத்தைத் தாங்கும் வகையில் துல்லியமான ட்ரெப்சாய்டல் திரெட்கள் கொண்ட ஆழ்துளை பைப் அமைப்பு. இருவழி ஒயர்-லாக் கப்ளிங் மற்றும் உயர் முறுக்குவிசை தாங்கும் உறுதி கொண்டது.'
        : 'Precision trapezoidal-threaded deep well column pipes and ribbed screen casing pipes designed to withstand deep underground hydrostatic pressure down to 1,200 feet. Features bi-directional wire-lock coupling and high-tensile torque resistance.',
      specs: [
        { label: isTamil ? 'அளவு வரம்பு:' : 'Diameter Range:', value: '100 mm to 200 mm (4" to 8" Nominal)' },
        { label: isTamil ? 'வகுப்பு வகை:' : 'Class Type:', value: 'CS (Shallow up to 80m) & CM (Medium up to 250m)' },
        { label: isTamil ? 'திரிடு முறை:' : 'Threading:', value: 'Male/Female Trapezoidal with EPDM O-Ring' },
        { label: isTamil ? 'துரு பாதுகாப்பு:' : 'Corrosion Shield:', value: '100% Inert to Acidic & Alkaline Water' },
      ],
      image: '/images/products-borewell-socket.jpeg',
      imageCaption: isTamil ? 'ட்ரெப்சாய்டல் பட்ரஸ் த்ரெட் • ஒயர்-லாக் பரிசோதிக்கப்பட்டது' : 'Trapezoidal Buttress Thread · Wire-Lock Tested',
      imageAlt: 'Precision white polymer borewell pipe socket and drip emitter',
      reverse: true,
    },
  ], [isTamil]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchDivision = divisionFilter === 'all' || p.division === divisionFilter;
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchDivision && matchCategory;
    });
  }, [products, divisionFilter, categoryFilter]);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySubmitted(true);
  };

  return (
    <div className="w-full bg-paper-50 font-sans text-ink selection:bg-forest-700 selection:text-paper-50">
      {/* Top Announcement Bar / Breadcrumb Strip */}
      <section className="w-full bg-paper-100 py-2.5 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-steel-600 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-forest-700 font-bold uppercase tracking-wider">
              {isTamil ? 'தயாரிப்புகள் கையேடு' : 'Catalog Portal'}
            </span>
            <span>/</span>
            <span className="text-ink">
              {isTamil ? 'எக்ஸ்ட்ரூஷன் & ஹைட்ராலிக் அமைப்புகள்' : 'Extrusion & Hydraulic Systems'}
            </span>
            <span className="hidden sm:inline text-line-200">/</span>
            <span className="hidden sm:inline text-steel-600">Edition 2025.1</span>
          </div>
          <div className="flex items-center gap-4 text-steel-600">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-forest-700">verified</span>
              <span>{isTamil ? '100% தூய விர்ஜின் பாலிமர்' : '100% Virgin Resins'}</span>
            </span>
            <span className="hidden md:inline text-line-200">•</span>
            <span className="hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-sun-500">military_tech</span>
              <span>{isTamil ? 'BIS அங்கீகரிக்கப்பட்ட சோதனைக்கூடம்' : 'BIS Approved Testing Lab'}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Editorial Catalog Hero Header */}
      <section className="w-full bg-paper-50 pt-8 sm:pt-12 pb-8 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-forest-900 text-paper-50 px-3 py-1 rounded text-xs font-mono uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-sun-500 animate-pulse"></span>
              <span className="text-paper-100 font-bold">
                {isTamil
                  ? 'சான்றளிக்கப்பட்ட தொழில் & விவசாய பைப்புகள் • IS:4985 • IS:13488 • IS:13487 • IS:12786'
                  : 'CERTIFIED INDUSTRIAL & AGRICULTURAL EXTRUSIONS · IS:4985 · IS:13488 · IS:13487 · IS:12786'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-[1.12]">
              {isTamil
                ? 'விவசாய நுண்ணீர்ப் பாசனம் & கனரக பாலிமர் குழாய்கள் அட்டவணை'
                : 'Agricultural Micro-Irrigation & Heavy Polymer Piping Catalog'}
            </h1>
            <p className="text-sm sm:text-base text-steel-600 max-w-3xl leading-relaxed">
              {isTamil
                ? 'தமிழ்நாடு விஜயமங்கலம் இரட்டை ஆலைகளில் நாற்பது ஆண்டு கால அனுபவத்துடன் தயாரிக்கப்படும் உயர்ரக பாலிமர் மற்றும் சொட்டுநீர்ப் பாசன சாதனங்கள். கடினமான நிலப்பரப்புகள், அதிக அழுத்த நிலைகள் மற்றும் 100% அரசு மானிய விதிமுறைகளுக்கு ஏற்ப வடிவமைக்கப்பட்டது.'
                : 'Forty years of metallurgical-grade polymer compounding and precision drip irrigation engineering manufactured at dual campuses in Vijayamangalam, Tamil Nadu. Designed for aggressive Deccan soils, high hydrostatic loads, and 100% subsidy compliance.'}
            </p>
          </div>

          {/* Quick Technical Spec Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-line-200">
            <div className="bg-paper-100/60 p-4 rounded border-l-4 border-forest-700">
              <span className="block text-[11px] font-mono text-steel-600 uppercase tracking-wider font-bold">
                {isTamil ? 'தயாரிப்பு பிரிவுகள்' : 'Product Categories'}
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900 block mt-1">
                {isTamil ? '6 முக்கிய பிரிவுகள்' : '6 Major Lines'}
              </span>
              <span className="text-xs text-steel-600 mt-0.5 block">
                {isTamil ? 'uPVC, HDPE, சொட்டுநீர் & வடிகட்டிகள்' : 'uPVC, HDPE, Drip & Filtration'}
              </span>
            </div>
            <div className="bg-paper-100/60 p-4 rounded border-l-4 border-forest-700">
              <span className="block text-[11px] font-mono text-steel-600 uppercase tracking-wider font-bold">
                {isTamil ? 'அளவு வரம்புகள்' : 'Outer Diameters'}
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900 block mt-1">
                20mm to 200mm
              </span>
              <span className="text-xs text-steel-600 mt-0.5 block">
                {isTamil ? 'அனைத்து மெட்ரிக் அளவுகளிலும்' : 'Schedule & metric standards'}
              </span>
            </div>
            <div className="bg-paper-100/60 p-4 rounded border-l-4 border-forest-700">
              <span className="block text-[11px] font-mono text-steel-600 uppercase tracking-wider font-bold">
                {isTamil ? 'அழுத்த வரம்பு' : 'Pressure Rating'}
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900 block mt-1">
                Class 1 to Class 5
              </span>
              <span className="text-xs text-steel-600 mt-0.5 block">
                Up to 16.0 kgf/cm² (PN 16)
              </span>
            </div>
            <div className="bg-paper-100/60 p-4 rounded border-l-4 border-forest-700">
              <span className="block text-[11px] font-mono text-steel-600 uppercase tracking-wider font-bold">
                {isTamil ? 'தர உத்தரவாதம்' : 'Quality Guarantee'}
              </span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-forest-900 block mt-1">
                100% Batch Tested
              </span>
              <span className="text-xs text-steel-600 mt-0.5 block">
                {isTamil ? 'உள்நாட்டு ஆய்வக சோதனை' : 'In-house hydrostatic verification'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Division & Category Switcher */}
      <section className="w-full bg-paper-100/95 sticky top-20 z-30 py-3 px-4 sm:px-6 lg:px-10 border-b border-line-200 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Wing Division Toggle */}
          <div className="flex items-center bg-paper-50 p-1 rounded border border-line-200 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setDivisionFilter('all')}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                divisionFilter === 'all'
                  ? 'bg-forest-900 text-paper-50 font-bold shadow-xs'
                  : 'text-forest-900 hover:bg-paper-100'
              }`}
            >
              {isTamil ? 'அனைத்து தயாரிப்புகள் (24)' : 'All Products (24 Items)'}
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('irrigation')}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                divisionFilter === 'irrigation'
                  ? 'bg-forest-900 text-paper-50 font-bold shadow-xs'
                  : 'text-forest-900 hover:bg-paper-100'
              }`}
            >
              {isTamil ? 'சேரன் இரிகேஷன் (14)' : 'Cheran Irrigation (14 Items)'}
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('plast')}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                divisionFilter === 'plast'
                  ? 'bg-forest-900 text-paper-50 font-bold shadow-xs'
                  : 'text-forest-900 hover:bg-paper-100'
              }`}
            >
              {isTamil ? 'சேரன் பிளாஸ்ட் (10)' : 'Cheran Plast (10 Items)'}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-steel-600 text-xs font-medium">
            <span className="font-mono uppercase tracking-wider text-steel-600 mr-1 hidden xl:inline font-bold">
              Filter:
            </span>
            {[
              { key: 'all', label: isTamil ? 'அனைத்தும்' : 'All' },
              { key: 'upvc', label: isTamil ? 'uPVC பிரஷர்' : 'uPVC Pressure' },
              { key: 'drip', label: isTamil ? 'இன்லைன் சொட்டுநீர்' : 'Drip Lines (Inline)' },
              { key: 'hdpe', label: isTamil ? 'HDPE சுருள்கள்' : 'HDPE Coils' },
              { key: 'filtration', label: isTamil ? 'வடிகட்டிகள்' : 'Filtration' },
              { key: 'casing', label: isTamil ? 'ஆழ்துளை பைப்புகள்' : 'Borewell Casing' },
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap border ${
                  categoryFilter === cat.key
                    ? 'bg-forest-700 text-paper-50 font-bold border-forest-700'
                    : 'bg-paper-50 hover:bg-line-200/60 text-forest-900 border-line-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Product Grid: Asymmetric Editorial Engineering Cards */}
      <section className="w-full bg-paper-50 py-12 lg:py-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-paper-50 border border-line-200 rounded overflow-hidden grid grid-cols-1 lg:grid-cols-12 hover:border-forest-700 hover:shadow-md transition-all"
            >
              {/* Text Side */}
              <div
                className={`lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 ${
                  prod.reverse ? 'order-1 lg:order-2' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 ${prod.divisionBg} text-paper-50 text-[11px] font-mono rounded uppercase tracking-wider font-bold`}>
                      {prod.divisionLabel}
                    </span>
                    <span className={`text-xs font-mono ${prod.badgeColor}`}>
                      {prod.badge}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">
                    {prod.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                    {prod.description}
                  </p>

                  <div className="bg-paper-100 p-4 rounded space-y-2 text-forest-900 border border-line-200/70">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                      {isTamil ? 'தொழில்நுட்ப விவரங்கள்' : 'Engineering Specifications'}
                    </span>
                    <ul className="text-xs space-y-1.5">
                      {prod.specs.map((s, idx) => (
                        <li
                          key={idx}
                          className={`flex justify-between pb-1 ${
                            idx < prod.specs.length - 1 ? 'border-b border-line-200/60' : ''
                          }`}
                        >
                          <span className="text-steel-600">{s.label}</span>
                          <span className="font-semibold text-right">{s.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    className="bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-4 py-2.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    href="tel:18004251595"
                  >
                    <span>{isTamil ? 'தொழிற்சாலை ஆர்டர் / உதவி' : 'Order Factory Consignment'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                  <a
                    className="bg-paper-100 hover:bg-line-200/60 text-forest-900 border border-line-200 text-xs font-semibold px-4 py-2.5 rounded transition-colors"
                    href="#technical-matrix"
                  >
                    {isTamil ? 'தொழில்நுட்ப அட்டவணை' : 'View Spec Matrix'}
                  </a>
                </div>
              </div>

              {/* Media Side */}
              <div
                className={`lg:col-span-7 bg-paper-100 relative min-h-[300px] lg:min-h-full border-t lg:border-t-0 ${
                  prod.reverse ? 'order-2 lg:order-1 border-r-0 lg:border-r border-line-200' : 'border-l-0 lg:border-l border-line-200'
                } overflow-hidden flex items-center justify-center p-4`}
              >
                <div className="w-full h-full min-h-[280px] sm:min-h-[340px] rounded overflow-hidden relative group">
                  <img
                    src={prod.image}
                    alt={prod.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 left-3 bg-forest-900/90 text-paper-50 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 shadow-md">
                    <span className="material-symbols-outlined text-sun-500 text-sm">precision_manufacturing</span>
                    <span>{prod.imageCaption}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Matrix Section: Deep Comparative Engineering Specification Table */}
      <section className="w-full bg-paper-100 py-12 lg:py-16 px-4 sm:px-6 lg:px-10 border-t border-b border-line-200" id="technical-matrix">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-forest-700 font-bold block">
                {isTamil ? 'நிலையான தரக்குறியீட்டு அட்டவணை' : 'STANDARDIZED SPECIFICATIONS'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 tracking-tight">
                {isTamil ? 'ஒருங்கிணைந்த எக்ஸ்ட்ரூஷன் & ஹைட்ராலிக் மேட்ரிக்ஸ்' : 'Unified Extrusion & Hydraulic Matrix'}
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 max-w-2xl mt-1 leading-relaxed">
                {isTamil
                  ? 'இந்திய தரக்கட்டுப்பாடு (BIS) குறியீடுகள், பயன்பாட்டு பொருத்தம் மற்றும் நேரடி ஆலை கொள்முதலுக்கான விரிவான விவரங்கள்.'
                  : 'Cross-reference Bureau of Indian Standards (BIS), application suitability, and standard manufacturing tolerances for direct factory procurement.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-paper-50 border border-line-200 text-forest-900 text-xs font-semibold px-4 py-2 rounded hover:bg-line-200/50 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>{isTamil ? 'அட்டவணையை அச்சிடுக' : 'Print Spec Matrix'}</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto bg-paper-50 border border-line-200 rounded shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-paper-100/80 border-b border-line-200 text-steel-600 font-mono text-[11px] tracking-wider uppercase">
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'தயாரிப்பு பிரிவு' : 'Category / Product Line'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'ஆலை பிரிவு' : 'Division'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'BIS தரக்குறியீடு' : 'Applicable BIS Code'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'அளவு வரம்பு' : 'Standard OD / Sizes'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'பிரஷர் ரேட்டிங்' : 'Pressure / Rating'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'இணைப்பு முறை' : 'Jointing Type'}</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">{isTamil ? 'அரசு மானிய நிலை' : 'Subsidy Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-200 text-ink">
                <tr className="hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">uPVC Rigid Pressure Pipes</div>
                    <span className="text-steel-600 text-[11px]">For agricultural mainlines &amp; distribution</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-900/10 text-forest-900 rounded text-[11px] font-semibold">Cheran Plast</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:4985:2021</td>
                  <td className="p-3 sm:p-4">20 mm – 200 mm OD</td>
                  <td className="p-3 sm:p-4">Class 1 to 5 (2.5 – 10 kg/cm²)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Solvent Cement / Rubber Ring</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">PMKSY Approved</span>
                  </td>
                </tr>

                <tr className="bg-paper-100/30 hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">Cylindrical Inline Drip Lateral</div>
                    <span className="text-steel-600 text-[11px]">Embedded labyrinth emitter tubing</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-700/10 text-forest-700 rounded text-[11px] font-semibold">Cheran Irrigation</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:13488:2008</td>
                  <td className="p-3 sm:p-4">12 mm &amp; 16 mm</td>
                  <td className="p-3 sm:p-4">Class 1 &amp; 2 (1.0 – 2.8 kg/cm²)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Compression Joiners &amp; Grommets</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">100% Subsidy</span>
                  </td>
                </tr>

                <tr className="hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">HDPE Polyethylene Coils</div>
                    <span className="text-steel-600 text-[11px]">Flexible water transmission lines</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-900/10 text-forest-900 rounded text-[11px] font-semibold">Cheran Plast</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:4984 / IS:12786</td>
                  <td className="p-3 sm:p-4">20 mm – 110 mm Coils</td>
                  <td className="p-3 sm:p-4">PN 2.5 to PN 16 (PE 63/80/100)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Butt-Weld / Couplers</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">Approved Component</span>
                  </td>
                </tr>

                <tr className="bg-paper-100/30 hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">Sand Media &amp; Disc Filters</div>
                    <span className="text-steel-600 text-[11px]">High-capacity primary filtration battery</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-700/10 text-forest-700 rounded text-[11px] font-semibold">Cheran Irrigation</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:14606 / Standard</td>
                  <td className="p-3 sm:p-4">2.5", 3", 4" Manifolds</td>
                  <td className="p-3 sm:p-4">Up to 10 Bar (PN 10)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Flanged Headers &amp; Quick-Clamps</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">Mandatory Head</span>
                  </td>
                </tr>

                <tr className="hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">Delrin &amp; Brass Impact Sprinklers</div>
                    <span className="text-steel-600 text-[11px]">High-uniformity canopy precipitation</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-700/10 text-forest-700 rounded text-[11px] font-semibold">Cheran Irrigation</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:12232 Series</td>
                  <td className="p-3 sm:p-4">1/2" to 2" BSP Male/Fem</td>
                  <td className="p-3 sm:p-4">2.0 to 5.5 kg/cm²</td>
                  <td className="p-3 sm:p-4 text-steel-600">Threaded Riser &amp; Tripods</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">Horticulture Grant</span>
                  </td>
                </tr>

                <tr className="bg-paper-100/30 hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-forest-900">
                    <div className="font-bold">uPVC Borewell Casing &amp; Columns</div>
                    <span className="text-steel-600 text-[11px]">Submersible drop and ribbed filter casing</span>
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-forest-900/10 text-forest-900 rounded text-[11px] font-semibold">Cheran Plast</span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-[11px]">IS:12818:2010</td>
                  <td className="p-3 sm:p-4">100 mm – 200 mm (4" – 8")</td>
                  <td className="p-3 sm:p-4">CS &amp; CM Ratings (Deep Wells)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Trapezoidal Buttress + O-Ring</td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="px-2 py-0.5 bg-[#a7f4bb]/60 text-[#14432b] font-semibold rounded text-[11px]">Deep Aquifer Safe</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Technical Sizing & Direct Factory Dispatch Block */}
      <section className="w-full bg-paper-50 py-12 lg:py-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Narrative & Helplines */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold">
                {isTamil ? 'நேரடி தொழிற்சாலை அனுப்புகை' : 'DIRECT FACTORY LOGISTICS'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 tracking-tight">
                {isTamil
                  ? 'உங்கள் நிலத்திற்கான தனிப்பயன் மதிப்பீடு அல்லது வரைபடம் தேவையா?'
                  : 'Need a Custom Bill of Materials or Hydraulic Layout?'}
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                {isTamil
                  ? 'எங்கள் விஜயமங்கலம் ஆலை பொறியியல் மையம் மோட்டார் பொருத்தம், உராய்வு இழப்பு கணக்கீடுகள் மற்றும் தோட்டக்கலை மானிய ஆவணங்களை நேரடியாக வழங்குகிறது. இடைத்தரகர் கமிஷன்கள் இல்லாத நேரடி ஆலை சேவை.'
                  : 'Our campus engineering desk provides certified bill of quantities, pump matching, friction head-loss calculations, and district horticulture subsidy paperwork directly from Vijayamangalam. Zero dealer commissions or distributor markups for certified agricultural schemes.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Helpline 1 */}
              <div className="p-4 bg-paper-100 rounded border-l-4 border-sun-500 flex items-start gap-3 border border-line-200 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-forest-900 text-sun-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">support_agent</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                    {isTamil ? 'விவசாயி & மானிய உதவி (கட்டணமில்லா எண்)' : 'Farmer & Subsidy Assistance (Toll-Free)'}
                  </span>
                  <a
                    className="font-serif text-xl font-bold text-forest-900 hover:text-forest-700 transition-colors block"
                    href="tel:18004251595"
                  >
                    1800 425 1595
                  </a>
                  <span className="text-xs text-steel-600">
                    {isTamil ? 'PMKSY உதவி மைய நேரடி இணைப்பு (தமிழ் / ஆங்கிலம்)' : 'Direct link to PMKSY empanelment desks (Tamil / English)'}
                  </span>
                </div>
              </div>

              {/* Helpline 2 */}
              <div className="p-4 bg-paper-100 rounded border-l-4 border-forest-700 flex items-start gap-3 border border-line-200 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-forest-900 text-paper-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">engineering</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                    {isTamil ? 'மூத்த களப் பொறியாளர் உதவி எண்' : 'Senior Field Engineer Hotline'}
                  </span>
                  <a
                    className="font-serif text-xl font-bold text-forest-900 hover:text-forest-700 transition-colors block"
                    href="tel:+919842811595"
                  >
                    +91 98428 11595
                  </a>
                  <span className="text-xs text-steel-600">
                    {isTamil ? 'நேரடி நில அளவீடு & ஹைட்ராலிக் அழுத்த கணக்கீடு' : 'On-site topographical surveys & head-loss optimization'}
                  </span>
                </div>
              </div>

              {/* Helpline 3 */}
              <div className="p-4 bg-paper-100 rounded border-l-4 border-steel-600 flex items-start gap-3 border border-line-200 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-forest-900 text-paper-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                    {isTamil ? 'டீலர்கள் & மொத்த லாரி லோடு ஏற்றுமதி' : 'B2B & Factory Consignment Dispatch'}
                  </span>
                  <a
                    className="font-serif text-xl font-bold text-forest-900 hover:text-forest-700 transition-colors block"
                    href="tel:+919443342087"
                  >
                    +91 94433 42087
                  </a>
                  <span className="text-xs text-steel-600">
                    {isTamil ? 'முழு லாரி லோட் (FTL) ஆர்டர்கள் - தமிழ்நாடு, கேரளா, கர்நாடகா' : 'Full truckload (FTL) orders across Tamil Nadu, Karnataka & Kerala'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="lg:col-span-6 bg-paper-100 p-6 sm:p-8 rounded border border-line-200 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold block">
                {isTamil ? 'தொழில்நுட்ப மதிப்பீடு கோரிக்கை' : 'TECHNICAL INQUIRY'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                {isTamil ? 'தயாரிப்பு விலைப்புள்ளி & அளவு திட்டமிடல்' : 'Request Extrusion Pricing & Sizing'}
              </h3>
              <p className="text-xs text-steel-600 mt-0.5">
                {isTamil ? 'விஜயமங்கலம் ஆலை பொறியியல் பிரிவுக்கு நேரடியாக சமர்ப்பிக்கப்படுகிறது.' : 'Direct submission to the Perundurai factory engineering division.'}
              </p>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  {isTamil ? 'விருப்பமான தயாரிப்பு பிரிவு' : 'Primary Product Line of Interest'}
                </label>
                <select
                  value={inquiryForm.productLine}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, productLine: e.target.value })}
                  className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                >
                  <option>Rigid uPVC Pressure Pipes (IS:4985)</option>
                  <option>Cylindrical Inline Drip Tubing (IS:13488)</option>
                  <option>HDPE Delivery &amp; Lateral Coils (IS:4984)</option>
                  <option>Sand Media Filtration Station / Hydrocyclone</option>
                  <option>Borewell Column &amp; Casing Pipes (IS:12818)</option>
                  <option>Impact Sprinklers &amp; Rain Gun Systems</option>
                  <option>Complete Farm Turnkey Micro-Irrigation Set</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-forest-900 block mb-1">
                    {isTamil ? 'நிலப்பரப்பு / பைப்பின் நீளம்' : 'Farm Acreage / Piping Length'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Acres or 2,400 Meters"
                    value={inquiryForm.acreageOrLength}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, acreageOrLength: e.target.value })}
                    className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-forest-900 block mb-1">
                    {isTamil ? 'முக்கிய பயிர் / பயன்பாடு' : 'Primary Crop / Application'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sugarcane / Turmeric / Borewell"
                    value={inquiryForm.cropOrApp}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, cropOrApp: e.target.value })}
                    className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-forest-900 block mb-1">
                    {isTamil ? 'விண்ணப்பதாரர் பெயர் *' : 'Applicant Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isTamil ? 'விவசாயி / ஒப்பந்ததாரர் பெயர்' : 'Farmer / Contractor Name'}
                    value={inquiryForm.applicantName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, applicantName: e.target.value })}
                    className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-forest-900 block mb-1">
                    {isTamil ? 'அலைபேசி எண் *' : 'Mobile Contact *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98XXX XXXXX"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-900 block mb-1">
                  {isTamil ? 'மாவட்டம் / டெலிவரி ஊர் *' : 'District / Delivery Village Location *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Erode / Tirupur / Coimbatore"
                  value={inquiryForm.districtLocation}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, districtLocation: e.target.value })}
                  className="w-full bg-paper-50 border border-line-200 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-forest-700 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>{isTamil ? 'ஆலை பொறியாளர் மதிப்பீடு பெற சமர்ப்பிக்க' : 'Submit for Plant Engineer Quotation'}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-steel-600 text-[11px] pt-1">
                <span className="material-symbols-outlined text-sm text-forest-700">timer</span>
                <span>{isTamil ? 'நிலையான SLA: 4 மணி நேரத்திற்குள் சரிபார்க்கப்பட்ட பதில்' : 'Standard SLA: Verified response within 4 operational hours'}</span>
              </div>

              {inquirySubmitted && (
                <div className="p-3 bg-[#a7f4bb]/40 text-[#14432b] rounded text-xs font-semibold flex items-center gap-2 border border-[#a7f4bb]">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>
                    {isTamil
                      ? 'உங்கள் கோரிக்கை பதிவு செய்யப்பட்டது! எங்கள் விஜயமங்கலம் பொறியாளர் 4 மணி நேரத்திற்குள் உங்களைத் தொடர்புகொள்வார்.'
                      : 'Inquiry received. A technical engineer will review your specifications within 4 hours.'}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Ground-Level Operational Compliance Strip */}
      <section className="w-full bg-forest-900 text-paper-50 py-8 px-4 sm:px-6 lg:px-10 border-t border-line-200/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-forest-700 flex items-center justify-center shrink-0 text-sun-500">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-paper-50">
                {isTamil ? '100% அரசு பதிவு பெற்ற உற்பத்தியாளர்' : '100% Government Empanelled Manufacturer'}
              </h4>
              <p className="text-xs text-line-200/80">
                {isTamil
                  ? 'தமிழ்நாடு தோட்டக்கலைத் துறை மூலமாக நேரடி வேளாண் கடன் & PMKSY மானியங்களுக்காக அங்கீகரிக்கப்பட்டது.'
                  : 'Approved for direct agricultural credit & PMKSY subsidies via Tamil Nadu Horticulture Dept.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="bg-sun-500 hover:bg-sun-500/90 text-forest-900 text-xs font-bold px-6 py-3 rounded transition-colors shadow-sm"
              href="tel:18004251595"
            >
              {isTamil ? 'கள அதிகாரியுடன் பேச' : 'Speak with Field Officer'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
