import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ContactPage() {
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState('farmer'); // 'farmer' or 'b2b'
  const [farmerSubmitted, setFarmerSubmitted] = useState(false);
  const [b2bSubmitted, setB2bSubmitted] = useState(false);

  const [farmerForm, setFarmerForm] = useState({
    name: '',
    phone: '',
    district: 'erode',
    village: '',
    acreage: '',
    crop: 'banana',
    waterSource: 'borewell',
    subsidyType: 'small-farmer',
    notes: '',
  });

  const [b2bForm, setB2bForm] = useState({
    company: '',
    person: '',
    phone: '',
    email: '',
    product: 'pvc-pressure',
    volume: '',
    destination: '',
    specs: '',
  });

  const handleFarmerSubmit = (e) => {
    e.preventDefault();
    setFarmerSubmitted(true);
  };

  const handleB2bSubmit = (e) => {
    e.preventDefault();
    setB2bSubmitted(true);
  };

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
              {isTamil ? 'தலைமையகம் & தொழிற்சாலை இருப்பிடம்' : 'Headquarters & Factory Coordinates'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-forest-900 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></span>
              <span>{isTamil ? 'விஜயமங்கலம் ஆலைகள் இயக்கம்: ஷிப்ட் I & II' : 'Vijayamangalam Plants Active: Shift I & II'}</span>
            </span>
            <span className="hidden sm:inline text-line-200">|</span>
            <span className="hidden sm:inline text-steel-600">IST 08:30 – 19:30</span>
          </div>
        </div>
      </section>

      {/* Section 1: Editorial Page Header */}
      <section className="w-full bg-paper-50 pt-8 sm:pt-12 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-paper-100 px-3 py-1 rounded text-forest-700 text-xs font-mono uppercase tracking-widest font-bold">
              <span className="material-symbols-outlined text-sm text-sun-500">precision_manufacturing</span>
              <span>{isTamil ? 'நேரடி தொழிற்சாலை தொடர்பு • தொழில்நுட்ப உதவி • மானிய மையம்' : 'DIRECT FACTORY CONNECT • TECHNICAL INQUIRIES • SUBSIDY DESK'}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-[1.12]">
              {isTamil
                ? 'எங்கள் பொறியாளர்கள், உற்பத்தி ஆலைகள் மற்றும் மானிய அலுவலர்களுடன் நேரடியாக இணையுங்கள்'
                : 'Connect Directly with Our Engineers, Plants, and Subsidy Officers'}
            </h1>
            <p className="text-sm sm:text-base text-steel-600 max-w-3xl leading-relaxed">
              {isTamil
                ? 'தொழில்நுட்ப பைப் விவரங்கள், உங்கள் நிலத்திற்கான பிரத்யேக சொட்டுநீர்ப் பாசன வரைபடம் அல்லது தமிழ்நாடு அரசு 100% மானிய உதவி எதுவாக இருந்தாலும், விஜயமங்கலத்தில் உள்ள எங்கள் பொறியியல் குழு உங்களுக்கு உதவத் தயாராக உள்ளது.'
                : 'Whether you require technical pipe specifications, a customized farm micro-irrigation layout, or turnkey assistance with Tamil Nadu government subsidies, our specialized engineering units in Vijayamangalam stand ready to deliver verified compliance.'}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end lg:items-end">
            <div className="bg-forest-900 text-paper-50 p-5 rounded-lg w-full max-w-sm space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-sun-500 uppercase tracking-wider font-bold">
                  {isTamil ? 'விரைவு தீர்வு' : 'Instant Clearance'}
                </span>
                <span className="text-[11px] font-mono bg-forest-700 px-2 py-0.5 rounded text-paper-100 font-bold">
                  4-HR SLA
                </span>
              </div>
              <p className="text-xs text-line-200/90 leading-snug">
                {isTamil
                  ? 'இடைத்தரகர்கள் இல்லை. உரிமம் பெற்ற மெக்கானிக்கல் பொறியாளர்கள் மற்றும் அரசு மானிய ஒருங்கிணைப்பாளர்களுடன் நேரடி தொடர்பு.'
                  : 'Zero intermediaries. Direct contact with certified mechanical engineers and empanelled horticulture liaisons.'}
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-paper-50 font-semibold border-t border-line-200/15">
                <span className="material-symbols-outlined text-sun-500 text-base">verified</span>
                <span>{isTamil ? 'அரசு பதிவு பெற்ற உற்பத்தியாளர் #TN-ERD-1983' : 'Govt. Registered Fabricator #TN-ERD-1983'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Primary Communication Anchors (Click-to-Call & Helplines) */}
      <section className="w-full bg-paper-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-10 border-y border-line-200">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-clay-400 uppercase tracking-widest font-bold block">
                {isTamil ? 'முன்னுரிமை தொடர்பு எண்கள் • உடனடி சேவை' : 'PRIORITY LINES • IMMEDIATE DISPATCH'}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
                {isTamil ? 'நேரடி இயக்க உதவி எண்கள்' : 'Direct Operational Channels'}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 bg-forest-900 text-paper-50 px-4 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-sun-500 text-base animate-pulse">record_voice_over</span>
              <span>
                {isTamil ? 'கள உதவி:' : 'Field support available in'} <strong>தமிழ் (Tamil)</strong> {isTamil ? 'மற்றும்' : '&'} <strong>English</strong>.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Call Card 1: Farmer & Subsidy */}
            <a
              className="group bg-paper-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 border border-line-200 hover:border-forest-700"
              href="tel:18004251595"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-forest-700/10 text-forest-700 group-hover:bg-forest-700 group-hover:text-paper-50 transition-colors">
                    <span className="material-symbols-outlined text-xl">agriculture</span>
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider bg-forest-700/10 text-forest-700 px-2 py-0.5 rounded font-bold">
                    {isTamil ? 'கட்டணமில்லா எண்' : 'Toll-Free Helpline'}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'விவசாயிகள் & மானிய மையம்' : 'Farmer & Subsidy Desk'}
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'PMKSY, தமிழ்நாடு தோட்டக்கலை 100% மானிய விண்ணப்பங்கள் மற்றும் நிலத்திற்கான இலவச CAD வடிவமைப்பு ஆலோசனை.'
                    : 'Free consultation for PMKSY, TN Horticulture 100% subsidy files, and on-farm CAD layouts across TN, KL, and KA.'}
                </p>
              </div>
              <div className="pt-2 border-t border-line-200/60">
                <div className="text-[11px] font-mono text-steel-600 uppercase tracking-wider">
                  {isTamil ? 'இலவச அழைப்பு' : 'Dial Toll-Free'}
                </div>
                <div className="font-serif text-2xl font-bold text-forest-700 group-hover:text-forest-900 transition-colors">
                  1800 425 1595
                </div>
              </div>
            </a>

            {/* Call Card 2: Field Engineer Hotline */}
            <a
              className="group bg-paper-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 border border-line-200 hover:border-forest-700"
              href="tel:+919842811595"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-forest-700/10 text-forest-700 group-hover:bg-forest-700 group-hover:text-paper-50 transition-colors">
                    <span className="material-symbols-outlined text-xl">engineering</span>
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider bg-sun-500/20 text-tertiary font-bold px-2 py-0.5 rounded">
                    {isTamil ? 'பொறியியல் பிரிவு' : 'Engineering Bay'}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'களப் பொறியாளர் நேரடி தொடர்பு' : 'Direct Field Engineer Hotline'}
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'உயர் அழுத்த குழாய்கள், வடிகட்டி அமைப்புகள், மைக்ரோ-ஸ்பிரிங்க்லர்கள் மற்றும் ஹைட்ராலிக் அழுத்த கணக்கீட்டு உதவி.'
                    : 'Technical sizing for high-pressure laterals, filtration manifolds, micro-jets, and hydraulic friction calculation.'}
                </p>
              </div>
              <div className="pt-2 border-t border-line-200/60">
                <div className="text-[11px] font-mono text-steel-600 uppercase tracking-wider">
                  {isTamil ? 'தொழிற்சாலை நேரடி எண் (திங்கள்–சனி)' : 'Direct Plant Line (Mon–Sat 08:00–19:30)'}
                </div>
                <div className="font-serif text-2xl font-bold text-forest-700 group-hover:text-forest-900 transition-colors">
                  +91 98428 11595
                </div>
              </div>
            </a>

            {/* Call Card 3: B2B & Logistics */}
            <a
              className="group bg-paper-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 border border-line-200 hover:border-forest-700"
              href="tel:+919443342087"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-forest-700/10 text-forest-700 group-hover:bg-forest-700 group-hover:text-paper-50 transition-colors">
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider bg-forest-900 text-paper-50 font-bold px-2 py-0.5 rounded">
                    {isTamil ? 'மொத்த விற்பனை அனுப்புகை' : 'Commercial Dispatch'}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'டீலர்கள் & சரக்கு போக்குவரத்து' : 'B2B & Extrusion Logistics'}
                </h3>
                <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'டீலர் விலைப்பட்டியல், டிரெய்லர் ஏற்றுமதி திட்டமிடல், uPVC பிரஷர் பைப்புகள், கேசிங் பைப்புகள் மற்றும் அரசு டெண்டர்கள்.'
                    : 'Wholesale dealer pricing, trailer consignment scheduling for uPVC pressure pipes, casing pipes, and municipal tenders.'}
                </p>
              </div>
              <div className="pt-2 border-t border-line-200/60">
                <div className="text-[11px] font-mono text-steel-600 uppercase tracking-wider">
                  {isTamil ? 'டிஸ்பாட்ச் மேலாளர் நேரடி எண்' : 'Dispatch Yard Manager'}
                </div>
                <div className="font-serif text-2xl font-bold text-forest-700 group-hover:text-forest-900 transition-colors">
                  +91 94433 42087
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Section 3: Dual Physical Plant & Campus Directory (NEVER MERGED) */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold">
              {isTamil ? 'உற்பத்தி வளாக முகவரிகள் (இரண்டு தனித்தனி பிரிவுகள்)' : 'MANUFACTURING CAMPUS DIRECTORY'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
              {isTamil
                ? 'விஜயமங்கலத்தில் இரண்டு பிரத்யேக உற்பத்தி வளாகங்கள்'
                : 'Two Purpose-Built Extrusion Facilities in Vijayamangalam'}
            </h2>
            <p className="text-sm sm:text-base text-steel-600 max-w-3xl leading-relaxed">
              {isTamil
                ? 'சேரன் குழுமம் விஜயமங்கலம் ஊத்துக்குளி சாலையில் இரண்டு தனித்தனி ஆலைகளைக் கொண்டுள்ளது. சேரன் பிளாஸ்ட் கனரக uPVC குழாய்களை உற்பத்தி செய்கிறது; சேரன் இரிகேஷன் சொட்டுநீர் குழாய்கள், ஸ்பிரிங்க்லர்கள் மற்றும் வடிகட்டிகளை உற்பத்தி செய்கிறது.'
                : 'Cheran Group operates two dedicated campuses along Uthukuli Road. Cheran Plast handles heavy-duty rigid PVC extrusions and bulk logistics, while Cheran Irrigation engineers micro-irrigation lines, emitters, and precision fertigation valves.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Division 1: Cheran Irrigation Systems */}
            <article className="bg-paper-100 rounded-lg overflow-hidden flex flex-col justify-between shadow-sm border border-line-200">
              <div className="relative h-60 sm:h-64 overflow-hidden bg-forest-900">
                <img
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  alt="Cheran Irrigation Systems Modern Precision Plant Vijayamangalam"
                  src="/images/contact-irrigation-plant.jpeg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/30 to-transparent"></div>
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-paper-50">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sun-500 font-bold block">
                      {isTamil ? 'ஆலை பிரிவு II' : 'Plant Division II'}
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-paper-50">
                      {isTamil ? 'சேரன் இரிகேஷன் சிஸ்டம்ஸ்' : 'Cheran Irrigation Systems'}
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-forest-700 px-3 py-1 rounded text-paper-50 font-bold">
                    EST. 2017
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                        {isTamil ? 'ஆலை சர்வே எண் & முகவரி' : 'Campus & Survey Address'}
                      </span>
                      <p className="text-ink leading-relaxed font-medium">
                        S.F. No. 145, Uthukuli Road,<br />
                        Vijayamangalam, Perundurai Taluk,<br />
                        Erode District, Tamil Nadu – 638056.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                        {isTamil ? 'நேரடி ஆலை தொடர்புகள்' : 'Direct Plant Inquiries'}
                      </span>
                      <p className="text-ink font-bold">cherrandrip@gmail.com</p>
                      <p className="text-forest-700 font-bold">+91 98428 11595 / 1800 425 1595</p>
                      <span className="inline-block text-[11px] text-steel-600 font-mono">
                        Mon – Sat: 08:30 AM – 07:00 PM
                      </span>
                    </div>
                  </div>

                  <div className="bg-paper-50 p-4 rounded border border-line-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-forest-900 font-bold text-xs">
                      <span className="material-symbols-outlined text-forest-700 text-base">verified</span>
                      <span>{isTamil ? 'சிறப்பு செயல்பாடுகள் & அரசு திட்டங்கள்' : 'Specialized Operations & Schemes'}</span>
                    </div>
                    <p className="text-xs text-steel-600 leading-relaxed">
                      {isTamil
                        ? 'விவசாய நில CAD வடிவமைப்பு, மண்-இடவியல் கணக்கெடுப்பு, இன்லைன் சொட்டுநீர் பைப் உற்பத்தி (IS:13488), மைக்ரோ ஸ்பிரிங்க்லர்கள், வெஞ்சுரி உரம் செலுத்தும் கருவிகள் மற்றும் PMKSY 100% மானிய கோப்பு பராமரிப்பு.'
                        : 'Agricultural field CAD layouts, micro-irrigation soil-topography surveys, drip lateral inline extrusion (IS:13488), micro sprinklers, venturi fertilizer injectors, and turnkey PMKSY government subsidy dossier management.'}
                    </p>
                  </div>

                  {/* Landmark Card */}
                  <div className="bg-forest-900 text-paper-50 p-4 rounded space-y-1 border-l-4 border-sun-500">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sun-500 text-lg mt-0.5">pin_drop</span>
                      <div>
                        <span className="text-xs font-mono font-bold text-sun-500 block uppercase">
                          {isTamil ? 'இருப்பிட அடையாளம் & வழிகாட்டுதல்' : 'Landmark & Approach Guidance'}
                        </span>
                        <p className="text-xs text-line-200/90 leading-relaxed mt-0.5">
                          {isTamil
                            ? 'விஜயமங்கலம் NH 544 சந்திப்பிலிருந்து ஊத்துக்குளி சாலையில் 2 கி.மீ தொலைவில், வேளாண் மின்சார துணை நிலையம் எதிரில் அமைந்துள்ளது. டிராக்டர்கள் மற்றும் வாகனங்கள் நேரடியாக வரலாம்.'
                            : 'Located 2 km from Vijayamangalam NH 544 intersection along Uthukuli Road, directly opposite the agricultural electrical sub-station. Direct tractor & farm vehicle drive-in access.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Google Map Embed for Cherran Irrigation */}
                  <div className="w-full h-64 sm:h-72 rounded-lg overflow-hidden border border-line-200 shadow-inner bg-paper-50 relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3913.3361103421166!2d77.4947449564934!3d11.236666655525854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba90d007e983dfb%3A0xf72310b486aad996!2sCherran%20irrigation!5e0!3m2!1sen!2sin!4v1789807782013!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Cherran Irrigation Google Map Location"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-4 py-2.5 rounded transition-colors"
                    href="https://www.google.com/maps/place/Cherran+irrigation/@11.2366667,77.494745,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba90d007e983dfb:0xf72310b486aad996!8m2!3d11.2366667!4d77.494745"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-base">map</span>
                    <span>{isTamil ? 'கூகுள் மேப்பில் பார்க்க' : 'Open in Google Maps'}</span>
                  </a>
                  <a
                    className="inline-flex items-center gap-2 bg-paper-50 hover:bg-paper-100 text-forest-900 text-xs font-semibold px-4 py-2.5 rounded transition-colors border border-line-200 shadow-xs"
                    href="tel:+919842811595"
                  >
                    <span className="material-symbols-outlined text-forest-700 text-base">call</span>
                    <span>{isTamil ? 'ஆலை II எண்ணை அழைக்க' : 'Call Plant II Desk'}</span>
                  </a>
                </div>
              </div>
            </article>

            {/* Division 2: Cheran Plast Extrusion Works */}
            <article className="bg-paper-100 rounded-lg overflow-hidden flex flex-col justify-between shadow-sm border border-line-200">
              <div className="relative h-60 sm:h-64 overflow-hidden bg-forest-900">
                <img
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  alt="Cheran Plast Extrusion Works Factory Floor Vijayamangalam"
                  src="/images/contact-pvc-plant.jpeg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900 via-forest-900/30 to-transparent"></div>
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-paper-50">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sun-500 font-bold block">
                      {isTamil ? 'ஆலை பிரிவு I (தலைமை அலுவலகம்)' : 'Plant Division I (Head Office)'}
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-paper-50">
                      {isTamil ? 'சேரன் பிளாஸ்ட் எக்ஸ்ட்ரூஷன் ஒர்க்ஸ்' : 'Cheran Plast Extrusion Works'}
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-forest-700 px-3 py-1 rounded text-paper-50 font-bold">
                    EST. 1983
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                        {isTamil ? 'ஆலை சர்வே எண் & முகவரி' : 'Campus & Survey Address'}
                      </span>
                      <p className="text-ink leading-relaxed font-medium">
                        S.F. No. 137, Uthukuli Road,<br />
                        Vijayamangalam, Perundurai Taluk,<br />
                        Erode District, Tamil Nadu – 638056.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-steel-600 font-bold block">
                        {isTamil ? 'டீலர் & வணிக தொடர்புகள்' : 'Commercial & Dealer Mail'}
                      </span>
                      <p className="text-ink font-bold">cheraanplast@yahoo.com</p>
                      <p className="text-forest-700 font-bold">+91 94433 42087 / +91 98428 11595</p>
                      <span className="inline-block text-[11px] text-steel-600 font-mono">
                        Dispatch Yard: 07:30 AM – 20:00 PM
                      </span>
                    </div>
                  </div>

                  <div className="bg-paper-50 p-4 rounded border border-line-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-forest-900 font-bold text-xs">
                      <span className="material-symbols-outlined text-forest-700 text-base">plumbing</span>
                      <span>{isTamil ? 'சிறப்பு செயல்பாடுகள் & உற்பத்தி' : 'Specialized Operations & Production'}</span>
                    </div>
                    <p className="text-xs text-steel-600 leading-relaxed">
                      {isTamil
                        ? 'கனரக uPVC பிரஷர் பைப்புகள் (IS:4985:2021), ஆழ்துளை கிணறு கேசிங் மற்றும் காலம் பைப்புகள், விவசாய & மின்சார HDPE குழாய்கள் மற்றும் அரசு ஒப்பந்த ஏற்றுமதி.'
                        : 'Heavy-duty rigid uPVC pressure pipes (IS:4985:2021), rib-screen borewell casings, high-density polyethylene (HDPE) electrical & agricultural conduits, large-diameter fittings, and government contract consignments.'}
                    </p>
                  </div>

                  {/* Landmark Card */}
                  <div className="bg-forest-900 text-paper-50 p-4 rounded space-y-1 border-l-4 border-sun-500">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sun-500 text-lg mt-0.5">local_shipping</span>
                      <div>
                        <span className="text-xs font-mono font-bold text-sun-500 block uppercase">
                          {isTamil ? 'சரக்கு ஏற்றுமதி தளம் & எடை மேடை' : 'Dispatch Yard & Weighbridge'}
                        </span>
                        <p className="text-xs text-line-200/90 leading-relaxed mt-0.5">
                          {isTamil
                            ? '40-அடி பல-அச்சு டிரெய்லர்கள் வந்து செல்லக்கூடிய பிரதான ஏற்றுமதி தளம். வளாகத்திலேயே 60-டன் சான்றளிக்கப்பட்ட கணினிமயமாக்கப்பட்ட எடை மேடை உள்ளது.'
                            : 'Central manufacturing unit and primary dispatch yard configured for 40-foot multi-axle trailers. Dedicated 60-ton certified computerized weighbridge on premises.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Google Map Embed for Cheran Plast */}
                  <div className="w-full h-64 sm:h-72 rounded-lg overflow-hidden border border-line-200 shadow-inner bg-paper-50 relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d489.16222312291933!2d77.50154720540013!3d11.239490719580735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba90d96fdc1beaf%3A0x803ae35379b1497b!2sCheran%20Plast!5e0!3m2!1sen!2sin!4v1789807736037!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Cheran Plast Google Map Location"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-4 py-2.5 rounded transition-colors"
                    href="https://www.google.com/maps/place/Cheran+Plast/@11.2394907,77.5015472,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba90d96fdc1beaf:0x803ae35379b1497b!8m2!3d11.2394907!4d77.5015472"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-base">map</span>
                    <span>{isTamil ? 'கூகுள் மேப்பில் பார்க்க' : 'Open in Google Maps'}</span>
                  </a>
                  <a
                    className="inline-flex items-center gap-2 bg-paper-50 hover:bg-paper-100 text-forest-900 text-xs font-semibold px-4 py-2.5 rounded transition-colors border border-line-200 shadow-xs"
                    href="tel:+919443342087"
                  >
                    <span className="material-symbols-outlined text-forest-700 text-base">call</span>
                    <span>{isTamil ? 'ஆலை I யார்டை அழைக்க' : 'Call Plant I Yard'}</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section 4: Comprehensive Dual-Tab Inquiry Terminal */}
      <section className="w-full bg-paper-100 py-12 lg:py-20 px-4 sm:px-6 lg:px-10 border-y border-line-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Context & SLA */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold block">
                  {isTamil ? 'தொழில்நுட்ப மதிப்பீட்டு பிரிவு' : 'TECHNICAL ROUTING DESK'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {isTamil ? 'தொழில்நுட்ப வரைபடம் அல்லது விலைப்புள்ளி கோரிக்கை' : 'Request Technical Sizing or Factory Quotations'}
                </h2>
                <p className="text-xs sm:text-sm text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'உங்கள் நிலம் அல்லது திட்டத்தின் விவரங்களை பதிவு செய்யுங்கள். எங்கள் மூத்த பொறியியல் இயக்குநர் உங்கள் கோரிக்கையை பரிசீலித்து துல்லியமான திட்டத்தை வழங்குவார்.'
                    : 'Submit your project or agricultural field parameters directly to our senior estimating desk. Every submission is assigned to an application engineer.'}
                </p>
              </div>

              {/* SLA Box */}
              <div className="bg-forest-900 text-paper-50 p-6 rounded-lg shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-sun-500">
                  <span className="material-symbols-outlined text-2xl">timer</span>
                  <span className="font-serif text-lg font-bold">
                    {isTamil ? '4-மணி நேர உடனடி தீர்வு (SLA)' : '4-Hour Operational SLA'}
                  </span>
                </div>
                <p className="text-xs text-line-200/90 leading-relaxed">
                  {isTamil
                    ? 'தொழில்நுட்ப விசாரணைகள், சொட்டுநீர்ப் பாசன வரைபடங்கள் மற்றும் மொத்த விலைப்புள்ளி கோரிக்கைகளுக்கு ஆலை வேலை நேரத்தில் 4 மணி நேரத்திற்குள் பதிலளிக்கிறோம்.'
                    : 'We respond to all technical inquiries, irrigation CAD proposals, and bulk tender pricing requests within 4 operational hours during plant working shifts.'}
                </p>
                <div className="pt-2 space-y-2 text-xs text-paper-100/90 border-t border-line-200/15">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-container text-sm">check_circle</span>
                    <span>IS:4985 மற்றும் IS:13488 தரநிலைகளின்படி நேரடி மதிப்பீடு</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-container text-sm">check_circle</span>
                    <span>தமிழ்நாடு விவசாயிகளுக்கான 100% மானிய ஆவண சரிபார்ப்பு</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-container text-sm">check_circle</span>
                    <span>டீலர்களுக்கான GST-உடன் கூடிய நேரடி தொழிற்சாலை விலை</span>
                  </div>
                </div>
              </div>

              {/* Free CAD Assessment Visual */}
              <div className="bg-paper-50 p-4 rounded-lg shadow-xs border border-line-200 flex items-center gap-3">
                <img
                  className="w-16 h-16 rounded object-cover border border-line-200 shrink-0"
                  alt="CAD Blueprint"
                  src="/images/contact-blueprints-thumb.jpeg"
                />
                <div>
                  <span className="text-xs font-bold text-forest-900 block">
                    {isTamil ? 'இலவச CAD ஹைட்ராலிக் மதிப்பீடு' : 'Free CAD Hydraulic Assessment'}
                  </span>
                  <span className="text-[11px] text-steel-600 block mt-0.5">
                    {isTamil
                      ? 'உங்கள் நில சர்வே எண் மற்றும் பயிர் விவரங்களை குறிப்பிடவும். துல்லியமான பிரஷர் அளவீட்டு வரைபடம் இலவசமாக வழங்கப்படும்.'
                      : 'Upload field sketches or mention survey numbers for automated pressure calculations.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Tab Terminal */}
            <div className="lg:col-span-7 bg-paper-50 p-6 sm:p-8 rounded-lg shadow-sm border border-line-200 space-y-6">
              {/* Terminal Tabs */}
              <div className="flex p-1 bg-paper-100 rounded gap-1 border border-line-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('farmer')}
                  className={`flex-1 py-2.5 px-3 rounded text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'farmer'
                      ? 'text-paper-50 bg-forest-700 font-bold shadow-xs'
                      : 'text-steel-600 hover:text-forest-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">water_drop</span>
                  <span>{isTamil ? 'விவசாயி & மானிய திட்டம்' : 'Farmer & Subsidy Layout'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('b2b')}
                  className={`flex-1 py-2.5 px-3 rounded text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'b2b'
                      ? 'text-paper-50 bg-forest-700 font-bold shadow-xs'
                      : 'text-steel-600 hover:text-forest-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">factory</span>
                  <span>{isTamil ? 'டீலர் & வணிக தேவைகள்' : 'B2B, Dealer & Contractor'}</span>
                </button>
              </div>

              {/* Form 1: Farmer & Micro-Irrigation Inquiry */}
              {activeTab === 'farmer' && (
                <form onSubmit={handleFarmerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'விவசாயி பெயர் *' : 'Farmer Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isTamil ? 'எ.கா: எஸ். முத்துசாமி கவுண்டர்' : 'e.g. S. Muthusamy Gounder'}
                        value={farmerForm.name}
                        onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'ஆதார் இணைக்கப்பட்ட அலைபேசி எண் *' : 'Aadhaar-Linked Mobile Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="98428 12345"
                        value={farmerForm.phone}
                        onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'மாவட்டம் (தமிழ்நாடு) *' : 'District (Tamil Nadu) *'}
                      </label>
                      <select
                        required
                        value={farmerForm.district}
                        onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      >
                        <option value="erode">Erode (ஈரோடு)</option>
                        <option value="tiruppur">Tiruppur (திருப்பூர்)</option>
                        <option value="coimbatore">Coimbatore (கோயம்புத்தூர்)</option>
                        <option value="salem">Salem (சேலம்)</option>
                        <option value="namakkal">Namakkal (நாமக்கல்)</option>
                        <option value="dindigul">Dindigul (திண்டுக்கல்)</option>
                        <option value="karur">Karur (கரூர்)</option>
                        <option value="dharmapuri">Dharmapuri (தருமபுரி)</option>
                        <option value="krishnagiri">Krishnagiri (கிருஷ்ணகிரி)</option>
                        <option value="theni">Theni (தேனி)</option>
                        <option value="other">Other District (இதர மாவட்டம்)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'வட்டம் & கிராமத்தின் பெயர் *' : 'Taluk & Village Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isTamil ? 'எ.கா: பெருந்துறை / விஜயமங்கலம்' : 'e.g. Perundurai / Vijayamangalam'}
                        value={farmerForm.village}
                        onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'மொத்த பரப்பு (ஏக்கர்) *' : 'Total Acreage *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 3.5 Acres"
                        value={farmerForm.acreage}
                        onChange={(e) => setFarmerForm({ ...farmerForm, acreage: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'பயிர் வகை *' : 'Primary Crop *'}
                      </label>
                      <select
                        required
                        value={farmerForm.crop}
                        onChange={(e) => setFarmerForm({ ...farmerForm, crop: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      >
                        <option value="sugarcane">Sugarcane (கரும்பு)</option>
                        <option value="banana">Banana (வாழை)</option>
                        <option value="turmeric">Turmeric (மஞ்சள்)</option>
                        <option value="coconut">Coconut (தென்னை)</option>
                        <option value="vegetables">Vegetables / Onion (காய்கறிகள் / வெங்காயம்)</option>
                        <option value="orchard">Fruit Orchard (மா/கொய்யா தோட்டம்)</option>
                        <option value="other">Other Crop (இதர பயிர்)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'நீர் ஆதாரம் *' : 'Water Source *'}
                      </label>
                      <select
                        required
                        value={farmerForm.waterSource}
                        onChange={(e) => setFarmerForm({ ...farmerForm, waterSource: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      >
                        <option value="borewell">Deep Borewell (ஆழ்துளை கிணறு)</option>
                        <option value="open-well">Open Well (திறந்த வெளி கிணறு)</option>
                        <option value="canal">Canal / Farm Pond (கால்வாய் / குட்டை)</option>
                        <option value="river">River Lift (ஆற்று நீர் பாசனம்)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-forest-900 block font-semibold">
                      {isTamil ? 'அரசு மானிய உதவி வகை *' : 'Govt Subsidy Assistance Requested *'}
                    </label>
                    <select
                      required
                      value={farmerForm.subsidyType}
                      onChange={(e) => setFarmerForm({ ...farmerForm, subsidyType: e.target.value })}
                      className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                    >
                      <option value="small-farmer">
                        {isTamil ? 'ஆம், சிறு / குறு விவசாயிகளுக்கான 100% முழு மானியம் (5 ஏக்கர் வரை)' : 'Yes, 100% Subsidy for Small / Marginal Farmers (Up to 5 Acres)'}
                      </option>
                      <option value="other-farmer">
                        {isTamil ? 'ஆம், பொது விவசாயிகளுக்கான 75% மானியம் (> 5 ஏக்கர்)' : 'Yes, 75% Subsidy for General Category Farmers (> 5 Acres)'}
                      </option>
                      <option value="commercial-direct">
                        {isTamil ? 'நேரடி வணிக கொள்முதல் (அரசு மானிய ஆவணங்கள் இன்றி)' : 'Commercial Direct Purchase (No Govt Subsidy Paperwork)'}
                      </option>
                      <option value="consultation">
                        {isTamil ? 'PMKSY தகுதி மற்றும் நடைமுறை ஆலோசனை தேவை' : 'Need Guidance on PMKSY Eligibility'}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-forest-900 block font-semibold">
                      {isTamil ? 'கூடுதல் விவரங்கள் (மோட்டார் HP, வரிசை இடைவெளி போன்றவை)' : 'Additional Farm Details (Optional)'}
                    </label>
                    <textarea
                      rows="3"
                      placeholder={isTamil ? 'மோட்டார் குதிரைத்திறன் (HP), வரிசை இடைவெளி அல்லது நிலத்தின் தன்மை...' : 'Specify HP of motor, row-to-row spacing, or topography details...'}
                      value={farmerForm.notes}
                      onChange={(e) => setFarmerForm({ ...farmerForm, notes: e.target.value })}
                      className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-6 py-3 rounded transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>{isTamil ? 'பாசன வரைபட கோரிக்கையை சமர்ப்பிக்க' : 'Submit Irrigation Request'}</span>
                    </button>
                    <span className="text-[11px] text-steel-600 hidden sm:inline">
                      {isTamil ? 'விஜயமங்கலம் பொறியாளருக்கு நேரடியாக அனுப்பப்படுகிறது' : 'Direct-to-engineer transmission'}
                    </span>
                  </div>

                  {farmerSubmitted && (
                    <div className="p-3 bg-[#a7f4bb]/40 text-[#14432b] rounded text-xs font-semibold flex items-center gap-2 border border-[#a7f4bb]">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>
                        {isTamil
                          ? 'நன்றி! உங்கள் விவசாய விபரங்கள் பெறப்பட்டது. 4 மணி நேரத்திற்குள் எங்கள் விஜயமங்கலம் பொறியாளர் உங்களை தொடர்புகொள்வார்.'
                          : 'Thank you. Your technical requirements have been forwarded to the Vijayamangalam engineering room. Expected SLA contact: within 4 hours.'}
                      </span>
                    </div>
                  )}
                </form>
              )}

              {/* Form 2: B2B, Dealer & Piping Bulk Inquiry */}
              {activeTab === 'b2b' && (
                <form onSubmit={handleB2bSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'நிறுவனம் / வியாபார நிலையப் பெயர் *' : 'Company / Trader / Contractor Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isTamil ? 'எ.கா: கொங்கு அக்ரி ஹார்டுவேர்ஸ்' : 'e.g. Kongu Agri Hardwares'}
                        value={b2bForm.company}
                        onChange={(e) => setB2bForm({ ...b2bForm, company: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'தொடர்பு நபர் & பதவி *' : 'Contact Person & Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isTamil ? 'எ.கா: கே. சுந்தரம், நிர்வாக பங்குதாரர்' : 'e.g. K. Sundaram, Managing Partner'}
                        value={b2bForm.person}
                        onChange={(e) => setB2bForm({ ...b2bForm, person: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'வணிக அலைபேசி எண் *' : 'Commercial Phone / Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 94433 00000"
                        value={b2bForm.phone}
                        onChange={(e) => setB2bForm({ ...b2bForm, phone: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'வணிக மின்னஞ்சல் *' : 'Business Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="purchases@company.in"
                        value={b2bForm.email}
                        onChange={(e) => setB2bForm({ ...b2bForm, email: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'தேவைப்படும் தயாரிப்பு *' : 'Product Line Required *'}
                      </label>
                      <select
                        required
                        value={b2bForm.product}
                        onChange={(e) => setB2bForm({ ...b2bForm, product: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      >
                        <option value="pvc-pressure">Rigid PVC Pressure Pipes (IS:4985)</option>
                        <option value="hdpe-coils">HDPE Laterals &amp; Coils (IS:12786)</option>
                        <option value="casing-pipes">Borewell Casing &amp; Column Pipes</option>
                        <option value="drip-emitters">Bulk Inline Driplines (IS:13488)</option>
                        <option value="mixed-dispatch">Mixed Full Trailer Consignment</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'தேவைப்படும் அளவு / எடை *' : 'Estimated Volume / Meters *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 Tons / 25,000m"
                        value={b2bForm.volume}
                        onChange={(e) => setB2bForm({ ...b2bForm, volume: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-forest-900 block font-semibold">
                        {isTamil ? 'டெலிவரி சேருமிடம் *' : 'Delivery Destination *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="City / State"
                        value={b2bForm.destination}
                        onChange={(e) => setB2bForm({ ...b2bForm, destination: e.target.value })}
                        className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-forest-900 block font-semibold">
                      {isTamil ? 'குறிப்பிட்ட பிரஷர் ரேட்டிங் & டெண்டர் விவரங்கள்' : 'Specific Technical / Pressure Ratings & Tender Requirements'}
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Class 2, 3, 4 pressure ratings, outer diameter (OD), wall thickness tolerances, or delivery timelines..."
                      value={b2bForm.specs}
                      onChange={(e) => setB2bForm({ ...b2bForm, specs: e.target.value })}
                      className="w-full bg-paper-100 p-2.5 rounded text-ink text-xs border border-line-200 focus:outline-none focus:bg-paper-50 focus:border-forest-700"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-6 py-3 rounded transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">request_quote</span>
                      <span>{isTamil ? 'டீலர் தொழிற்சாலை விலைப்புள்ளி கோர' : 'Request B2B Factory Pricing'}</span>
                    </button>
                    <span className="text-[11px] text-steel-600 hidden sm:inline">
                      Ex-Factory &amp; Delivered Quotes Available
                    </span>
                  </div>

                  {b2bSubmitted && (
                    <div className="p-3 bg-[#a7f4bb]/40 text-[#14432b] rounded text-xs font-semibold flex items-center gap-2 border border-[#a7f4bb]">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>
                        {isTamil
                          ? 'நன்றி! உங்கள் வணிக விலைப்புள்ளி கோரிக்கை சேரன் பிளாஸ்ட் டிஸ்பாட்ச் யார்டிற்கு அனுப்பப்பட்டுள்ளது. 4 மணி நேரத்திற்குள் விலைப்புள்ளி அனுப்பப்படும்.'
                          : 'Thank you. Your commercial inquiry has been sent to our dispatch yard. Quotation will be provided within 4 operational hours.'}
                      </span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Factory Visit & Technical Inspection Protocol */}
      <section className="w-full bg-paper-50 py-12 lg:py-20 px-4 sm:px-6 lg:px-10 border-b border-line-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold">
              {isTamil ? 'அரசு அலுவலர்கள் & கூட்டுறவு சங்கங்கள் பார்வை' : 'OFFICIAL DELEGATION & LABORATORY AUDITS'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
              {isTamil ? 'தொழிற்சாலை பார்வை மற்றும் தர ஆய்வு நெறிமுறைகள்' : 'Factory Visit & Quality Inspection Protocol'}
            </h2>
            <p className="text-xs sm:text-sm text-steel-600 max-w-3xl leading-relaxed">
              {isTamil
                ? 'வேளாண் அலுவலர்கள், விநியோகஸ்தர்கள், குடிநீர் வடிகால் வாரிய பொறியாளர்கள் மற்றும் பதிவு பெற்ற விவசாயக் குழுக்களுக்கு நேரடி தர ஆய்வுக்கான முழு வசதிகளை நாங்கள் வழங்குகிறோம்.'
                : 'We maintain an open-door policy for agricultural extension officers, distributor delegations, water board engineers, and registered farmer cooperative collectives seeking on-site quality verification.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-paper-100 p-6 rounded-lg shadow-xs space-y-3 flex flex-col justify-between border border-line-200">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-forest-900 text-sun-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">science</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'BIS ஹைட்ரோஸ்டேடிக் சோதனை கூடங்கள்' : 'BIS Hydrostatic Test Bays'}
                </h3>
                <p className="text-xs text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'நேரடி வெடிப்பு அழுத்த சோதனை, இழுவிசை நீட்சி சரிபார்ப்பு மற்றும் சொட்டுவான் மாறுபாட்டுக் கெழு (Cv) சோதனைகளை எங்கள் BIS அங்கீகரிக்கப்பட்ட ஆய்வகத்தில் நேரடியாகப் பார்வையிடலாம்.'
                    : 'Witness live burst-pressure testing, tensile elongation checks, and emitter coefficient variation (Cv) measurement at our in-house BIS accredited test laboratories.'}
                </p>
              </div>
              <div className="bg-paper-50 p-3 rounded text-xs text-forest-900 font-semibold flex items-center gap-2 border border-line-200">
                <span className="material-symbols-outlined text-forest-700 text-base">verified_user</span>
                <span>{isTamil ? '48 மணி நேர முன் அறிவிப்பு தேவை' : '48-Hour Advance Notice Required'}</span>
              </div>
            </div>

            <div className="bg-paper-100 p-6 rounded-lg shadow-xs space-y-3 flex flex-col justify-between border border-line-200">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-forest-900 text-sun-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">schedule</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'தொழிற்சாலை பார்வை நேரம்' : 'Operational Visiting Hours'}
                </h3>
                <p className="text-xs text-steel-600 leading-relaxed">
                  <strong>{isTamil ? 'திங்கள் முதல் சனி வரை:' : 'Monday through Saturday:'}</strong><br />
                  08:30 AM – 06:30 PM IST.<br />
                  {isTamil
                    ? 'தொழில்நுட்ப ஆலை நடைபயணம் தினமும் காலை 11:00 மணி மற்றும் பிற்பகல் 03:30 மணிக்கு எங்கள் உற்பத்தி கண்காணிப்பாளர்களுடன் நடைபெறும்.'
                    : 'Technical plant walk-throughs conducted at 11:00 AM and 03:30 PM daily with certified extrusion superintendents.'}
                </p>
              </div>
              <div className="bg-paper-50 p-3 rounded text-xs text-forest-900 font-semibold flex items-center gap-2 border border-line-200">
                <span className="material-symbols-outlined text-forest-700 text-base">badge</span>
                <span>{isTamil ? 'கேட் 1-ல் வருகையாளர் பதிவு' : 'Visitor ID Registration at Gate 1'}</span>
              </div>
            </div>

            <div className="bg-paper-100 p-6 rounded-lg shadow-xs space-y-3 flex flex-col justify-between border border-line-200">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded bg-forest-900 text-sun-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">alt_route</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink pt-1">
                  {isTamil ? 'போக்குவரத்து இணைப்பு' : 'Logistical Connectivity'}
                </h3>
                <p className="text-xs text-steel-600 leading-relaxed">
                  {isTamil
                    ? 'சேலம்-கொச்சி தேசிய நெடுஞ்சாலை (NH 544) மூலம் நேரடி போக்குவரத்து வசதி: ஈரோடு சந்திப்பு (34 கி.மீ), திருப்பூர் சந்திப்பு (24 கி.மீ), மற்றும் கோயம்புத்தூர் சர்வதேச விமான நிலையம் (62 கி.மீ).'
                    : 'Direct arterial access via Salem-Kochi Highway (NH 544). Convenient proximity to major transit nodes: Erode Junction (34 km), Tiruppur Junction (24 km), and Coimbatore International Airport (62 km).'}
                </p>
              </div>
              <div className="bg-paper-50 p-3 rounded text-xs text-forest-900 font-semibold flex items-center gap-2 border border-line-200">
                <span className="material-symbols-outlined text-forest-700 text-base">navigation</span>
                <span>{isTamil ? 'கனரக டிரெய்லர்கள் திரும்புவதற்கான அகலமான வழி' : 'Wide Turning Radius for Articulated Trailers'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Trust & Transparency Assurance Banner */}
      <section className="w-full bg-forest-900 py-12 lg:py-16 px-4 sm:px-6 lg:px-10 text-paper-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono text-sun-500 uppercase tracking-widest font-bold block">
              {isTamil ? 'நேரடி தொழிற்சாலை வெளிப்படைத்தன்மை உறுதிமொழி' : 'DIRECT FACTORY INTEGRITY PLEDGE'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-paper-50 leading-tight">
              {isTamil
                ? 'இடைத்தரகர்கள் இல்லை. விஜயமங்கலம் தளத்திலிருந்து நேரடி வெளிப்படையான விலை.'
                : 'No Middlemen. Direct Transparent Pricing from the Vijayamangalam Floor.'}
            </h2>
            <p className="text-xs sm:text-sm text-line-200/80 leading-relaxed">
              {isTamil
                ? '42 ஆண்டுகளாக, இடைத்தரகர் கமிஷன்கள் இன்றி விவசாயிகளுக்கும் டீலர்களுக்கும் உண்மையான தொழிற்சாலை விலையிலேயே வழங்கி வருகிறோம். போலி ISI முத்திரைகள் இல்லை, ஒவ்வொரு மீட்டர் பைப்பிற்கும் முழு உத்தரவாதம்.'
                : 'For 42 years, Cheran Group has guarded agricultural margins by dealing straight with farmers and authorized infrastructure contractors. No concealed distributor markups, zero counterfeit ISI markings, and full traceability for every meter of pipe extruded.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sun-500 hover:bg-sun-500/90 text-forest-900 text-sm font-bold px-6 py-3.5 rounded transition-all shadow-md"
              href="tel:18004251595"
            >
              <span className="material-symbols-outlined text-xl">phone_in_talk</span>
              <span>1800 425 1595</span>
            </a>
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-700/80 text-paper-50 text-sm font-semibold px-6 py-3.5 rounded transition-all border border-line-200/20 shadow-xs"
              href="mailto:cherrandrip@gmail.com"
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span>{isTamil ? 'பொறியியல் குழுவிற்கு மின்னஞ்சல்' : 'Email Engineering Team'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Section 7: Live Technical Specifications Summary Grid */}
      <section className="w-full bg-paper-100 py-10 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-steel-600 uppercase tracking-wider font-semibold">
                {isTamil ? 'தொழில்நுட்ப விவரக் குறிப்புகள்' : 'REFERENCE BENCHMARKS'}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-900">
                {isTamil ? 'விஜயமங்கலம் வளாகத்தில் உற்பத்தியாகும் தரநிலைகள்' : 'Standard Manufacturing Extrusions Handled on Campus'}
              </h3>
            </div>
            <span className="hidden md:inline text-xs font-mono bg-paper-50 px-3 py-1 rounded text-steel-600 border border-line-200">
              {isTamil ? 'ஒவ்வொரு மணிநேரமும் பேட்ச் சோதனை' : 'Batch Samples Tested Hourly'}
            </span>
          </div>

          <div className="overflow-x-auto bg-paper-50 rounded-lg shadow-xs border border-line-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-paper-100 text-steel-600 font-mono uppercase tracking-wider border-b border-line-200">
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'பிரிவு' : 'Classification'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'இந்திய தரநிலைகள்' : 'Indian Standard'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'அளவு வரம்பு' : 'Size Range'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'பிரஷர் / வகுப்பு' : 'Working Pressure / Class'}</th>
                  <th className="p-3 sm:p-4 font-semibold">{isTamil ? 'முதன்மை பயன்பாடு' : 'Primary Applications'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-200 text-ink">
                <tr className="hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-forest-900">uPVC Pressure Pipes</td>
                  <td className="p-3 sm:p-4 font-mono">IS:4985:2021</td>
                  <td className="p-3 sm:p-4 font-mono">20 mm to 200 mm OD</td>
                  <td className="p-3 sm:p-4">Class 1 to Class 5 (2.5 to 10 kg/cm²)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Potable water supply, farm mains, lift lines</td>
                </tr>
                <tr className="bg-paper-100/30 hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-forest-900">Inline Drip Tubing</td>
                  <td className="p-3 sm:p-4 font-mono">IS:13488:2008</td>
                  <td className="p-3 sm:p-4 font-mono">12 mm &amp; 16 mm</td>
                  <td className="p-3 sm:p-4">Class 1 &amp; 2 (PC &amp; Non-PC Cylindrical)</td>
                  <td className="p-3 sm:p-4 text-steel-600">Sugarcane, banana, turmeric, horticulture</td>
                </tr>
                <tr className="hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-forest-900">HDPE Irrigation Pipes</td>
                  <td className="p-3 sm:p-4 font-mono">IS:4984 / IS:12786</td>
                  <td className="p-3 sm:p-4 font-mono">20 mm to 110 mm Coils</td>
                  <td className="p-3 sm:p-4">PE 63 / PE 80 / PE 100 ratings</td>
                  <td className="p-3 sm:p-4 text-steel-600">Sub-surface conduction, undulating terrain</td>
                </tr>
                <tr className="bg-paper-100/30 hover:bg-paper-100/50 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-forest-900">Borewell Casing / Column</td>
                  <td className="p-3 sm:p-4 font-mono">IS:12818:2010</td>
                  <td className="p-3 sm:p-4 font-mono">100 mm to 200 mm</td>
                  <td className="p-3 sm:p-4">CS &amp; CM Types with Trapeze Threading</td>
                  <td className="p-3 sm:p-4 text-steel-600">Deep submersible borewells up to 1,200 ft</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
