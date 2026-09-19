import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CheranPlastPage() {
  const { lang } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    contactName: '',
    phone: '',
    firmName: '',
    district: '',
    productLine: 'Rigid PVC Agricultural Pipes (IS:4985)',
    quantity: '',
    specs: '',
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const pvcPipeData = [
    { dn: '20 mm (½")', c1: '—', c2: '—', c3: '1.1 - 1.5 mm', c4: '1.4 - 1.8 mm', joint: 'Solvent Socket', status: 'In Stock' },
    { dn: '50 mm (1½")', c1: '—', c2: '1.3 - 1.7 mm', c3: '1.8 - 2.2 mm', c4: '2.9 - 3.4 mm', joint: 'Solvent / Rubber Ring', status: 'In Stock' },
    { dn: '75 mm (2½")', c1: '1.4 - 1.8 mm', c2: '1.8 - 2.2 mm', c3: '2.6 - 3.1 mm', c4: '4.3 - 5.0 mm', joint: 'Solvent / Elastomeric Ring', status: 'In Stock' },
    { dn: '90 mm (3")', c1: '1.6 - 2.0 mm', c2: '2.2 - 2.7 mm', c3: '3.1 - 3.7 mm', c4: '5.1 - 5.9 mm', joint: 'Solvent / Elastomeric Ring', status: 'In Stock' },
    { dn: '110 mm (4")', c1: '1.9 - 2.3 mm', c2: '2.7 - 3.2 mm', c3: '3.7 - 4.3 mm', c4: '6.3 - 7.3 mm', joint: 'Solvent / Elastomeric Ring', status: 'In Stock' },
    { dn: '140 mm (5")', c1: '2.4 - 2.9 mm', c2: '3.4 - 4.0 mm', c3: '4.8 - 5.6 mm', c4: '8.0 - 9.2 mm', joint: 'Solvent / Elastomeric Ring', status: 'In Stock' },
    { dn: '160 mm (6")', c1: '2.8 - 3.3 mm', c2: '3.9 - 4.5 mm', c3: '5.4 - 6.3 mm', c4: '9.1 - 10.5 mm', joint: 'Solvent / Elastomeric Ring', status: 'In Stock' },
    { dn: '200 mm (8")', c1: '3.5 - 4.1 mm', c2: '4.9 - 5.7 mm', c3: '6.8 - 7.9 mm', c4: '11.4 - 13.2 mm', joint: 'Elastomeric Rubber Ring', status: 'Batch Run' },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* =========================================================================
          1. TOP DIVISION HEADER BAR
         ========================================================================= */}
      <section className="w-full bg-paper-100 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-forest-900 text-paper-50 font-mono font-bold uppercase tracking-wider text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sun-500"></span>
              Division Profile
            </span>
            <span className="text-steel-600 uppercase tracking-wide font-medium">
              Cheran Plast Extrusion Works • Est. 1983
            </span>
          </div>
          <div className="flex items-center gap-4 text-steel-600 font-mono">
            <span className="flex items-center gap-1 text-forest-700 font-bold">
              <span className="material-symbols-outlined text-base">verified</span>
              IS:4985:2021 Licensed
            </span>
            <span className="hidden md:inline text-line-200">|</span>
            <span className="hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-forest-700">factory</span>
              Vijayamangalam Unit I
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INDUSTRIAL HERO: 40+ YEARS OF POLYMER PRECISION EXTRUSION
         ========================================================================= */}
      <section className="w-full bg-paper-50 border-b border-line-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left 7-Col: Narrative & Founder Heritage */}
            <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:pr-6">
              <div>
                <div className="flex items-center gap-1.5 text-forest-700 mb-3 text-xs uppercase font-mono font-bold tracking-widest">
                  <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
                  <span>Polymer Extrusion Engineering</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-900 tracking-tight leading-[1.08] mb-4">
                  {lang === 'ta'
                    ? '40+ ஆண்டுகால பாலிமர் துல்லிய குழாய் உற்பத்தி பாரம்பரியம்'
                    : '40+ Years of Polymer Precision Extrusion.'}
                </h1>

                <p className="text-base sm:text-lg text-ink/80 max-w-2xl mb-6 leading-relaxed">
                  Founded in 1983 by <strong className="text-forest-900 font-bold">Mr. P.R. Kuppusamy</strong> in Vijayamangalam, Cheran Plast is Tamil Nadu’s trusted benchmark for ISI-marked heavy agricultural and commercial polymer piping infrastructure.
                </p>

                <div className="p-4 bg-paper-100 border-l-4 border-sun-500 rounded-r-lg mb-8">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-sun-500 text-2xl mt-0.5">verified_user</span>
                    <div>
                      <div className="text-sm font-bold text-forest-900 mb-0.5">
                        100% Virgin Grade Resin Guarantee
                      </div>
                      <p className="text-xs text-steel-600 leading-relaxed">
                        Formulated with zero scrap regrinds, certified non-toxic thermal stabilizers, and high-tensile compounding calibrated for harsh Indian agricultural soils and deep borewells.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line-200">
                <a
                  href="#sizing-matrix"
                  className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 font-semibold text-xs sm:text-sm px-6 py-3 rounded transition-colors shadow-sm"
                >
                  <span>Inspect Pipe Matrix</span>
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </a>
                <a
                  href="#lab-testing"
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-paper-100 text-forest-900 border border-line-200 hover:border-forest-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-forest-700">biotech</span>
                  <span>Laboratory Standards</span>
                </a>
                <div className="flex items-center gap-2 sm:ml-auto text-xs font-medium text-steel-600 mt-2 sm:mt-0">
                  <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></span>
                  <span>Extruding Daily • Dispatch Ready</span>
                </div>
              </div>
            </div>

            {/* Right 5-Col: Extrusion Facility & Droplet Motif */}
            <div className="lg:col-span-5 flex flex-col gap-4 mt-6 lg:mt-0">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-line-200 bg-surface-container shadow-md">
                <img
                  src="/images/cheran-plast-pipe-extrusion.jpeg"
                  alt="Cheran Plast twin screw extrusion manufacturing bay showing neatly stacked gray uPVC pressure pipes ready for hydro-testing"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-4 text-paper-50">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-sun-500 font-bold">
                    Vijayamangalam Plant Line 02
                  </div>
                  <div className="font-serif text-lg font-bold text-paper-50">
                    Automated Twin Screw Extrusion Line
                  </div>
                </div>
              </div>

              {/* Secondary Droplet Detail */}
              <div className="grid grid-cols-12 gap-3 bg-paper-100 p-3 rounded-lg border border-line-200 items-center">
                <div className="col-span-4 h-20 rounded overflow-hidden border border-line-200">
                  <img
                    src="/images/cheran-plast-droplet-macro.jpeg"
                    alt="High speed precision macro detail of clean water droplet forming at the lip of a Cheran Plast pipe orifice"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-8 flex flex-col justify-center">
                  <span className="text-[11px] font-mono text-steel-600 uppercase">Micro-Tolerance Bore</span>
                  <div className="text-xs font-bold text-forest-900 mt-0.5">Hydraulic Smoothness Index</div>
                  <p className="text-[11px] text-steel-600 mt-0.5 leading-snug">
                    C=150 Hazen-Williams coefficient reducing friction losses and pumping power consumption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. METRIC STRIP: 4 DECADES OF INTEGRITY
         ========================================================================= */}
      <section className="w-full bg-forest-900 text-paper-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0 divide-x-0 md:divide-x md:divide-[rgba(227,223,210,0.15)]">
            <div className="flex flex-col px-0 md:px-5 first:pl-0">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-sun-500 leading-none">
                1983
              </span>
              <span className="text-xs sm:text-sm font-bold text-paper-50 mt-2">Year of Establishment</span>
              <span className="text-xs text-surface-container-high mt-1">
                First extrusion workshop founded by Mr. P.R. Kuppusamy
              </span>
            </div>

            <div className="flex flex-col px-0 md:px-5 pt-4 md:pt-0">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-paper-50 leading-none">
                40<span className="text-sun-500 font-normal">+</span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-paper-50 mt-2">Years Continuous Run</span>
              <span className="text-xs text-surface-container-high mt-1">
                Supplying agricultural distributors across South India
              </span>
            </div>

            <div className="flex flex-col px-0 md:px-5 pt-4 md:pt-0">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-paper-50 leading-none">
                200<span className="text-xs font-mono font-normal ml-1">mm</span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-paper-50 mt-2">Max Extrusion Diameter</span>
              <span className="text-xs text-surface-container-high mt-1">
                Precision wall tolerances spanning Class 1 through Class 6
              </span>
            </div>

            <div className="flex flex-col px-0 md:px-5 pt-4 md:pt-0">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-sun-500 leading-none">
                100%
              </span>
              <span className="text-xs sm:text-sm font-bold text-paper-50 mt-2">Batch Hydro-Tested</span>
              <span className="text-xs text-surface-container-high mt-1">
                Compliant with Bureau of Indian Standards specifications
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. TECHNICAL HERITAGE & IN-HOUSE QUALITY STORY
         ========================================================================= */}
      <section className="w-full bg-paper-100 border-b border-line-200 py-12 lg:py-20" id="lab-testing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-5">
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block mb-2 font-mono">
                Engineering Pedigree
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 tracking-tight leading-tight mb-4">
                Heavy Polymer Infrastructure, Built for Fifty-Year Ground Life.
              </h2>
              <p className="text-sm text-ink/80 mb-4 leading-relaxed">
                In 1983, long before standard imported plastic pipe filled regional markets, Cheran Plast commissioned its premier twin-screw extruder in Vijayamangalam, Erode District. The mission: build heavy-walled, high-durability conduit capable of surviving the thermal shock and heavy rock-laden soil of the Kongu agricultural belt.
              </p>
              <p className="text-xs text-steel-600 mb-6 leading-relaxed">
                Today, our modern lines utilize vacuum sizing calibration tanks, multi-stage haul-off crawlers, and automated planetary cutting saws to ensure perfectly perpendicular ends and zero ovality variance.
              </p>

              <div className="border border-line-200 bg-paper-50 p-4 rounded-lg">
                <h3 className="text-xs uppercase font-bold text-forest-900 mb-1 flex items-center gap-2 font-mono">
                  <span className="material-symbols-outlined text-forest-700 text-base">handshake</span>
                  Founding Philosophy
                </h3>
                <blockquote className="italic text-xs text-ink/80 border-l-2 border-forest-700 pl-3 my-2 leading-relaxed">
                  "A burst irrigation pipe ruins months of a farmer's labor. Every length leaving our die must withstand double its rated working pressure before loading onto the truck."
                </blockquote>
                <span className="text-[11px] text-steel-600 uppercase tracking-wider block mt-2 font-mono">
                  — Mr. P.R. Kuppusamy, Founder
                </span>
              </div>
            </div>

            {/* Right Column: 4 In-House Testing Protocols */}
            <div className="lg:col-span-7">
              <div className="bg-paper-50 border border-line-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-line-200 mb-6">
                  <div>
                    <span className="text-xs text-sun-500 uppercase font-mono tracking-wider font-bold">
                      Quality Assurance Protocols
                    </span>
                    <h3 className="font-serif text-xl font-bold text-forest-900 mt-0.5">
                      In-House BIS Test Laboratories
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-paper-100 border border-line-200 text-xs font-mono text-forest-900 uppercase font-bold rounded">
                    Per Lot Inspection
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Test 1 */}
                  <div className="p-4 bg-paper-100/60 border border-line-200 rounded-lg">
                    <div className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-lg">speed</span>
                    </div>
                    <h4 className="font-serif text-sm font-bold text-forest-900 mb-1">
                      Long-Term Hydrostatic Test
                    </h4>
                    <p className="text-xs text-steel-600 leading-normal">
                      Pipes are submerged in temperature-regulated water baths at 60°C and 27°C, subjected to continuous hoop stress test for 1,000 hours to eliminate micro-fractures.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-forest-700 bg-paper-50 px-2 py-0.5 rounded inline-block border border-line-200">
                      IS:4985 Clause 10.1 Pass Rate 100%
                    </div>
                  </div>

                  {/* Test 2 */}
                  <div className="p-4 bg-paper-100/60 border border-line-200 rounded-lg">
                    <div className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-lg">hardware</span>
                    </div>
                    <h4 className="font-serif text-sm font-bold text-forest-900 mb-1">
                      Impact Resistance (Falling Striker)
                    </h4>
                    <p className="text-xs text-steel-600 leading-normal">
                      Chilled to 0°C, sample pipe rings are struck by hemispherical tup weights dropped from standard heights up to 2 meters without fracture or shatter.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-forest-700 bg-paper-50 px-2 py-0.5 rounded inline-block border border-line-200">
                      TIR &lt; 10% Certified Tolerance
                    </div>
                  </div>

                  {/* Test 3 */}
                  <div className="p-4 bg-paper-100/60 border border-line-200 rounded-lg">
                    <div className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-lg">thermostat</span>
                    </div>
                    <h4 className="font-serif text-sm font-bold text-forest-900 mb-1">
                      Vicat Softening Temperature
                    </h4>
                    <p className="text-xs text-steel-600 leading-normal">
                      Guarantees that pipe walls preserve their load-bearing structural integrity under blazing South Indian surface soil temperatures up to 80°C.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-forest-700 bg-paper-50 px-2 py-0.5 rounded inline-block border border-line-200">
                      Vicat Point ≥ 80°C Min Standard
                    </div>
                  </div>

                  {/* Test 4 */}
                  <div className="p-4 bg-paper-100/60 border border-line-200 rounded-lg">
                    <div className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-lg">lightbulb</span>
                    </div>
                    <h4 className="font-serif text-sm font-bold text-forest-900 mb-1">
                      Opacity & UV Degradation
                    </h4>
                    <p className="text-xs text-steel-600 leading-normal">
                      Specially dosed with pure rutile titanium dioxide to block &gt;99.8% light transmission, completely preventing internal algae buildup and UV brittleness.
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-forest-700 bg-paper-50 px-2 py-0.5 rounded inline-block border border-line-200">
                      Light Transmission ≤ 0.2%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PRODUCT SIZING MATRIX & TECHNICAL CATALOG
         ========================================================================= */}
      <section className="w-full bg-paper-50 border-b border-line-200 py-12 lg:py-20" id="sizing-matrix">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest block mb-2 font-mono">
                Manufacturing Division
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 tracking-tight">
                Cheran Plast Product Lineup
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 mt-1 max-w-2xl leading-relaxed">
                Fully certified pressure pipes and coils manufactured in Vijayamangalam. Available in plain ends, solvent-cement socketed, or elastomeric rubber ring seal joints.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs text-steel-600 uppercase font-mono">Standard lengths:</span>
              <span className="font-mono text-forest-900 font-semibold px-2 py-1 bg-paper-100 border border-line-200 rounded text-xs">
                6.0 Meters (20 ft)
              </span>
              <span className="font-mono text-forest-900 font-semibold px-2 py-1 bg-paper-100 border border-line-200 rounded text-xs">
                Coils 50m - 500m
              </span>
            </div>
          </div>

          <div className="space-y-8">
            {/* Category 1: Rigid PVC Pressure Pipes */}
            <div className="border border-line-200 bg-paper-50 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-paper-100 p-4 sm:p-6 border-b border-line-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-lg bg-forest-900 text-sun-500 flex items-center justify-center font-serif text-lg font-bold">
                    01
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-900">
                        Rigid PVC Pressure Pipes (IS:4985:2021)
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-forest-700 text-paper-50 text-[10px] font-mono uppercase tracking-wider font-bold">
                        ISI Mark
                      </span>
                    </div>
                    <p className="text-xs text-steel-600 mt-0.5">
                      Agricultural irrigation mains, sub-mains, rural potable water distribution schemes, and industrial fluid transmission.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-mono bg-paper-50 border border-line-200 rounded text-forest-900 font-semibold">
                  Working Pressure: 2.5 to 10.0 kgf/cm²
                </span>
              </div>

              {/* Technical Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-paper-100/70 border-b border-line-200 text-steel-600 uppercase font-mono tracking-wider">
                      <th className="py-3 px-4">Nominal Outer Dia (DN)</th>
                      <th className="py-3 px-4">Class 1 (2.5 kgf/cm²)</th>
                      <th className="py-3 px-4">Class 2 (4.0 kgf/cm²)</th>
                      <th className="py-3 px-4">Class 3 (6.0 kgf/cm²)</th>
                      <th className="py-3 px-4">Class 4 (10.0 kgf/cm²)</th>
                      <th className="py-3 px-4">Jointing Mechanism</th>
                      <th className="py-3 px-4 text-right">Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-200 text-forest-900 font-mono">
                    {pvcPipeData.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-paper-100/40 transition-colors ${idx % 2 === 1 ? 'bg-paper-100/20' : ''}`}>
                        <td className="py-3 px-4 font-sans font-bold text-forest-900">{row.dn}</td>
                        <td className="py-3 px-4 text-steel-600">{row.c1}</td>
                        <td className="py-3 px-4">{row.c2}</td>
                        <td className="py-3 px-4">{row.c3}</td>
                        <td className="py-3 px-4 font-bold text-forest-700">{row.c4}</td>
                        <td className="py-3 px-4 font-sans text-xs">{row.joint}</td>
                        <td className="py-3 px-4 font-sans text-right">
                          <span className={`text-xs font-semibold ${row.status === 'In Stock' ? 'text-forest-700' : 'text-sun-500'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category 2: HDPE Pipes & Coils */}
            <div className="border border-line-200 bg-paper-50 rounded-xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 bg-paper-100 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-line-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center font-serif text-sm font-bold">
                        02
                      </span>
                      <span className="px-2 py-0.5 rounded bg-forest-700 text-paper-50 text-[10px] font-mono uppercase tracking-wider font-bold">
                        IS:4984 / IS:12786
                      </span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-900 mb-2">
                      HDPE Pipes & Delivery Coils
                    </h3>
                    <p className="text-xs text-steel-600 mb-4 leading-relaxed">
                      Manufactured from PE-100 / PE-80 certified virgin resin granules. Unsurpassed flexibility, chemical inertness, and impact ductility. Engineered for undulating terrains, river crossings, and high-head submersible pump lifts.
                    </p>

                    <div className="space-y-1.5 mb-4 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-line-200">
                        <span className="text-steel-600">Raw Material:</span>
                        <span className="font-mono text-forest-900 font-bold">PE-100 Virgin High-Density Polymer</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-line-200">
                        <span className="text-steel-600">Pressure Ratings:</span>
                        <span className="font-mono text-forest-900 font-bold">PN 2.5, PN 4.0, PN 6.0, PN 10.0, PN 16</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-line-200">
                        <span className="text-steel-600">Packaging Format:</span>
                        <span className="font-mono text-forest-900 font-bold">Coiled (20mm–110mm) & Straight (6m)</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-steel-600">Jointing:</span>
                        <span className="font-mono text-forest-900 font-bold">Butt Fusion, Compression & Electrofusion</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line-200">
                    <a
                      href="tel:+919443342087"
                      className="inline-flex items-center gap-1.5 text-forest-700 font-bold text-xs hover:text-forest-900"
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                      <span>Order Custom Coil Lengths: +91 94433 42087</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 relative min-h-[280px] bg-surface-container flex items-center justify-center p-4">
                  <img
                    src="/images/hose-warehouse.jpeg"
                    alt="Cheran Plast heavy black HDPE pipe coils stacked neatly on factory wooden pallet"
                    className="w-full h-full max-h-[340px] object-cover rounded-lg border border-line-200"
                  />
                  <div className="absolute top-6 right-6 bg-forest-900/90 text-paper-50 p-2.5 rounded font-mono text-[11px] shadow-sm">
                    <div className="text-sun-500 font-bold uppercase">IS:12786 Certified</div>
                    <div>Submersible Pump Mains</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category 3 & 4 Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category 3: UPVC High Pressure Plumbing */}
              <div className="border border-line-200 bg-paper-50 rounded-xl p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center font-serif text-sm font-bold">
                      03
                    </span>
                    <span className="text-xs font-mono text-steel-600 uppercase">ASTM D-1785 / SCH 40 & 80</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-forest-900 mb-2">
                    UPVC Lead-Free Plumbing Systems
                  </h3>
                  <p className="text-xs text-steel-600 mb-4 leading-relaxed">
                    Engineered for domestic drinking water loops, high-rise architectural piping, and commercial chemical lines. 100% lead-free formulation eliminates water contamination and prevents heavy scale deposition.
                  </p>

                  <div className="bg-paper-100 p-3 rounded-lg mb-4 space-y-1 text-xs">
                    <div className="flex justify-between text-steel-600">
                      <span>Available Diameters:</span>
                      <span className="font-mono text-forest-900 font-semibold">15mm (½") to 100mm (4")</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Temperature Resistance:</span>
                      <span className="font-mono text-forest-900 font-semibold">Up to 60°C continuous</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Standard Schedules:</span>
                      <span className="font-mono text-forest-900 font-semibold">Schedule 40 & Schedule 80</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Chemical Compatibility:</span>
                      <span className="font-mono text-forest-900 font-semibold">Resistant to chlorine, acids & salts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line-200 text-xs">
                  <span className="font-semibold text-forest-700">100% Lead-Free Non-Toxic</span>
                  <span className="text-steel-600 font-mono">Plain Ends / Threaded</span>
                </div>
              </div>

              {/* Category 4: Borewell Casing & Column Pipes */}
              <div className="border border-line-200 bg-paper-50 rounded-xl p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded bg-forest-900 text-sun-500 flex items-center justify-center font-serif text-sm font-bold">
                      04
                    </span>
                    <span className="text-xs font-mono text-steel-600 uppercase">IS:12818 Borewell Series</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-forest-900 mb-2">
                    Borewell Casing & Column Pipes
                  </h3>
                  <p className="text-xs text-steel-600 mb-4 leading-relaxed">
                    Precision-threaded deep well casing (Plain & Ribbed screen) and high-torque submersible column drop pipes. Designed with trapezoidal square threads and rubber sealing rings that bear massive pump motor tensile weights.
                  </p>

                  <div className="bg-paper-100 p-3 rounded-lg mb-4 space-y-1 text-xs">
                    <div className="flex justify-between text-steel-600">
                      <span>Casing Classes:</span>
                      <span className="font-mono text-forest-900 font-semibold">CS (Shallow &lt;80m) & CM (Medium &gt;250m)</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Column Pipe Depths:</span>
                      <span className="font-mono text-forest-900 font-semibold">Rated for depths up to 1,200 Feet</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Thread Locking:</span>
                      <span className="font-mono text-forest-900 font-semibold">Bi-directional Wire-lock & EPDM O-Ring</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>Corrosion Factor:</span>
                      <span className="font-mono text-forest-900 font-semibold">Immune to electrolytic & acidic waters</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line-200 text-xs">
                  <span className="font-semibold text-forest-700">Trapezoidal High-Tensile Thread</span>
                  <span className="text-steel-600 font-mono">Sizes: 100mm to 200mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. MANUFACTURING UNIT I & B2B DISPATCH DESK
         ========================================================================= */}
      <section className="w-full bg-paper-100 border-b border-line-200 py-12 lg:py-20" id="dispatch-inquiry">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left 6-Col: Plant Location & Operations */}
            <div className="lg:col-span-6 bg-paper-50 border border-line-200 p-6 sm:p-8 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-forest-700 mb-2 text-xs uppercase font-mono font-bold">
                  <span className="material-symbols-outlined text-lg">domain</span>
                  <span>Manufacturing Unit I</span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mb-3">
                  Cheran Plast Production & Central Logistics Yard
                </h3>

                <p className="text-xs sm:text-sm text-ink/80 mb-6 leading-relaxed">
                  Situated directly on the Uthukuli Road arterial corridor in Vijayamangalam, our dedicated polymer facility coordinates primary compounding, high-speed multi-strand extrusion, and daily logistics dispatch for whole-trailer and dealer consignments.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-forest-700 mt-0.5 text-xl">pin_drop</span>
                    <div>
                      <div className="text-xs font-bold text-forest-900 uppercase font-mono">Factory Physical Coordinates</div>
                      <p className="text-xs text-steel-600 mt-0.5">
                        S.F.No. 137, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Erode District, Tamil Nadu – 638056.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-forest-700 mt-0.5 text-xl">local_shipping</span>
                    <div>
                      <div className="text-xs font-bold text-forest-900 uppercase font-mono">Consignment Fleet & Freight Clearance</div>
                      <p className="text-xs text-steel-600 mt-0.5">
                        Direct articulated trailer loading bays with continuous crane rigging for bulk pipe bundles. Same-day transport coverage across Erode, Coimbatore, Tirupur, Salem, Karur, Dindigul, and Namakkal districts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-forest-700 mt-0.5 text-xl">schedule</span>
                    <div>
                      <div className="text-xs font-bold text-forest-900 uppercase font-mono">Factory Dispatch Operations</div>
                      <p className="text-xs text-steel-600 mt-0.5">
                        Monday through Saturday: 08:30 AM – 07:00 PM IST. Direct yard collection permitted for authorized dealer transport vehicles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-paper-100 border border-line-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sun-500 text-lg">mark_email_read</span>
                  <span className="text-xs font-semibold text-forest-900">Commercial Tender Quotes:</span>
                </div>
                <a
                  href="mailto:cheraanplast@yahoo.com"
                  className="font-mono text-xs text-forest-700 hover:text-forest-900 font-bold"
                >
                  cheraanplast@yahoo.com
                </a>
              </div>
            </div>

            {/* Right 6-Col: Distributor & Contractor Form */}
            <div className="lg:col-span-6 bg-paper-50 border border-line-200 p-6 sm:p-8 rounded-xl flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line-200 mb-4">
                  <div>
                    <span className="text-xs text-sun-500 uppercase font-mono tracking-widest font-bold">
                      B2B Trade Desk
                    </span>
                    <h3 className="font-serif text-xl font-bold text-forest-900 mt-0.5">
                      Dealer & Bulk Dispatch Inquiries
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-forest-700 text-3xl">receipt_long</span>
                </div>

                <p className="text-xs text-steel-600 mb-4 leading-relaxed">
                  Contractors, agricultural cooperative societies, hardware stockists, and turnkey irrigation contractors may request bulk per-meter price rates and dispatch timelines directly from our manufacturing desk.
                </p>

                {formSubmitted ? (
                  <div className="p-6 bg-forest-700/10 border border-forest-700/30 rounded-lg text-center my-6">
                    <span className="material-symbols-outlined text-forest-700 text-4xl mb-2">task_alt</span>
                    <h4 className="font-serif text-lg font-bold text-forest-900 mb-1">
                      Inquiry Dispatched to Factory Desk!
                    </h4>
                    <p className="text-xs text-steel-600 max-w-md mx-auto">
                      Thank you {formData.contactName}. We have received your requirement for {formData.district} ({formData.quantity}). Our commercial dispatch team will connect at {formData.phone} shortly with wholesale quotes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="mt-4 text-xs font-semibold text-forest-700 hover:underline"
                    >
                      Submit Another Trade Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="contactName">
                          Contact Name *
                        </label>
                        <input
                          id="contactName"
                          type="text"
                          required
                          value={formData.contactName}
                          onChange={handleInputChange}
                          placeholder="e.g., S. Palanisamy"
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="phone">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98428 11595"
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="firmName">
                          Firm / Enterprise Name
                        </label>
                        <input
                          id="firmName"
                          type="text"
                          value={formData.firmName}
                          onChange={handleInputChange}
                          placeholder="e.g., Kongu Agro Supplies"
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="district">
                          District / Delivery Location *
                        </label>
                        <input
                          id="district"
                          type="text"
                          required
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="e.g., Perundurai, Erode"
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="productLine">
                          Target Product Line
                        </label>
                        <select
                          id="productLine"
                          value={formData.productLine}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        >
                          <option>Rigid PVC Agricultural Pipes (IS:4985)</option>
                          <option>HDPE Continuous Coils (IS:4984 / 12786)</option>
                          <option>UPVC Plumbing Pipes (ASTM D-1785)</option>
                          <option>Borewell Casing & Column Pipes</option>
                          <option>Complete Agricultural Project Mix</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="quantity">
                          Estimated Quantity
                        </label>
                        <input
                          id="quantity"
                          type="text"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="e.g., 2,500 Meters / 1 Full Truck"
                          className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-forest-900 uppercase mb-1" htmlFor="specs">
                        Technical Specifications / Project Details
                      </label>
                      <textarea
                        id="specs"
                        rows={2}
                        value={formData.specs}
                        onChange={handleInputChange}
                        placeholder="Specify wall thickness class (e.g. 6.0 kgf/cm²), socket type, or delivery deadline..."
                        className="w-full px-3 py-2 bg-paper-50 border border-line-200 rounded text-forest-900 text-xs focus:outline-none focus:border-forest-700"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-forest-700 hover:bg-forest-900 text-paper-50 font-bold text-xs py-3 rounded transition-colors tracking-wide flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>Submit Factory Dispatch Request</span>
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Lines */}
              <div className="mt-4 pt-4 border-t border-line-200 flex flex-wrap items-center justify-between gap-2 text-forest-900">
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-forest-700 text-lg">ring_volume</span>
                  <span className="uppercase tracking-wide text-steel-600 font-mono">Direct Factory Lines:</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs font-bold">
                  <a className="hover:text-forest-700" href="tel:+919443342087">+91 94433 42087</a>
                  <span className="text-line-200">•</span>
                  <a className="hover:text-forest-700" href="tel:+919842811595">+91 98428 11595</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CHERAN PLAST GOOGLE MAP & FACTORY LOCATION IN VIJAYAMANGALAM
         ========================================================================= */}
      <section className="w-full bg-paper-100 border-t border-line-200 py-12 lg:py-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-forest-700 uppercase tracking-widest font-bold block mb-1">
                Factory Coordinates &amp; Dispatch Yard
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">
                Cheran Plast (cheranplast) – Vijayamangalam
              </h2>
              <p className="text-xs sm:text-sm text-steel-600 mt-1 max-w-2xl">
                Located along Uthukuli Road in Vijayamangalam, Perundurai Taluk (Tamil Nadu 638056). Serving wholesale distributors, agricultural projects, and infrastructure contractors across South India.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/place/Cheran+Plast/@11.2394907,77.5015472,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba90d96fdc1beaf:0x803ae35379b1497b!8m2!3d11.2394907!4d77.5015472"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-900 text-paper-50 text-xs font-semibold px-5 py-3 rounded transition-colors shrink-0 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">directions</span>
              <span>Open in Google Maps / Get Directions</span>
            </a>
          </div>

          <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-line-200 shadow-sm bg-paper-50 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d489.16222312291933!2d77.50154720540013!3d11.239490719580735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba90d96fdc1beaf%3A0x803ae35379b1497b!2sCheran%20Plast!5e0!3m2!1sen!2sin!4v1789807736037!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Cheran Plast Google Map Location Vijayamangalam"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
