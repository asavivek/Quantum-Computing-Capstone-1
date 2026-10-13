import { useState } from 'react';
import {
  ShieldCheck,
  Sprout,
  Droplets,
  Thermometer,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

const CROP_GUIDELINES: Record<string, any> = {
  Wheat: {
    ph: '6.0 – 7.5',
    temp: '15 – 24 °C',
    water: '350 – 600 mm',
    n: '100 – 150 kg/ha',
    p: '40 – 65 kg/ha',
    k: '50 – 80 kg/ha',
    critical: 'Crown root initiation & Grain filling',
    citation: 'FAO Irrigation and Drainage Paper 56 / ICAR Wheat Agronomy'
  },
  Rice: {
    ph: '5.5 – 7.0',
    temp: '22 – 32 °C',
    water: '1000 – 1600 mm',
    n: '120 – 160 kg/ha',
    p: '40 – 60 kg/ha',
    k: '60 – 90 kg/ha',
    critical: 'Panicle initiation & Flowering',
    citation: 'IRRI Rice Knowledge Bank / FAO Crop Water Management'
  },
  Corn: {
    ph: '5.8 – 7.2',
    temp: '20 – 30 °C',
    water: '500 – 800 mm',
    n: '140 – 200 kg/ha',
    p: '50 – 80 kg/ha',
    k: '80 – 140 kg/ha',
    critical: 'Silking & Tasseling',
    citation: 'USDA-ARS Corn Production Handbook'
  },
  Soybean: {
    ph: '6.0 – 7.0',
    temp: '20 – 28 °C',
    water: '450 – 700 mm',
    n: '30 – 60 kg/ha (N-fixing)',
    p: '45 – 75 kg/ha',
    k: '70 – 120 kg/ha',
    critical: 'Pod development & Seed filling',
    citation: 'Purdue Extension Soybean Field Guide'
  },
  Cotton: {
    ph: '6.2 – 7.8',
    temp: '24 – 34 °C',
    water: '600 – 950 mm',
    n: '110 – 160 kg/ha',
    p: '40 – 65 kg/ha',
    k: '90 – 150 kg/ha',
    critical: 'Square formation & Boll opening',
    citation: 'Cotton Research and Development Corporation (CRDC)'
  },
  Sugarcane: {
    ph: '6.0 – 7.5',
    temp: '25 – 35 °C',
    water: '1300 – 2200 mm',
    n: '180 – 250 kg/ha',
    p: '70 – 100 kg/ha',
    k: '180 – 260 kg/ha',
    critical: 'Formative tillering & Grand growth phase',
    citation: 'Sugarcane Breeding Institute / FAO Land & Water'
  },
  Barley: {
    ph: '6.2 – 7.8',
    temp: '14 – 22 °C',
    water: '300 – 500 mm',
    n: '70 – 110 kg/ha',
    p: '35 – 55 kg/ha',
    k: '40 – 70 kg/ha',
    critical: 'Tillering & Heading',
    citation: 'FAO ECOCROP Database'
  },
  Potato: {
    ph: '5.2 – 6.5',
    temp: '15 – 22 °C',
    water: '500 – 750 mm',
    n: '130 – 180 kg/ha',
    p: '70 – 110 kg/ha',
    k: '150 – 240 kg/ha',
    critical: 'Tuber initiation & Bulking',
    citation: 'CIP (International Potato Center) Agronomy Manual'
  }
};

export default function AgronomyInsights() {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [testPh, setTestPh] = useState(6.5);
  const [testRain, setTestRain] = useState(450);

  const guide = CROP_GUIDELINES[selectedCrop] || CROP_GUIDELINES.Wheat;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#0d1813]/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
            Agronomic Decision Support System
          </span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Agricultural Insights & Crop Reference Standards
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Transparent, rule-based agronomic guidelines derived from verified FAO, IRRI, and ICAR published research.
        </p>
      </div>

      {/* Crop Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(CROP_GUIDELINES).map((crop) => (
          <button
            key={crop}
            onClick={() => setSelectedCrop(crop)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              selectedCrop === crop
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-[#0d1813] dark:border-emerald-950 dark:text-slate-300 dark:hover:bg-emerald-950/40'
            }`}
          >
            {crop}
          </button>
        ))}
      </div>

      {/* Selected Crop Standard Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Agronomic Standards for {selectedCrop}
              </h2>
              <p className="text-xs text-slate-500">Citation: {guide.citation}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-400">Soil pH Window</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.ph}</div>
            <p className="text-[11px] text-slate-500 mt-1">Prevents aluminum toxicity and orthophosphate fixation.</p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-400">Cumulative Moisture</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.water}</div>
            <p className="text-[11px] text-slate-500 mt-1">Seasonal evapotranspiration demand.</p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400">Optimal Temperature</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.temp}</div>
            <p className="text-[11px] text-slate-500 mt-1">Thermal envelope for active photosynthetic canopy.</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-emerald-950/40 dark:bg-[#07130e]">
            <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Nitrogen (N) Demand</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.n}</div>
            <p className="text-[11px] text-slate-500 mt-1">Vegetative chlorophyll synthesis.</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-emerald-950/40 dark:bg-[#07130e]">
            <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Phosphorus (P) Demand</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.p}</div>
            <p className="text-[11px] text-slate-500 mt-1">ATP cellular transfer & crown rooting.</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-emerald-950/40 dark:bg-[#07130e]">
            <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Potassium (K) Demand</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{guide.k}</div>
            <p className="text-[11px] text-slate-500 mt-1">Osmotic pressure & stomatal drought response.</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-emerald-950/20 dark:text-slate-300">
          <strong>Critical Phenological Stage:</strong> {guide.critical}. Irrigation deficits or temperature anomalies during this period incur the highest yield penalty.
        </div>
      </div>

      {/* Agronomic Rule Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" /> Soil Acidity & Alkalinity Remediation
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-lg border border-slate-100 p-3 dark:border-emerald-950/40">
              <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">Acidic Soils (pH &lt; 6.0)</strong>
              Apply agricultural limestone (CaCO₃) or dolomite (CaMg(CO₃)₂). Dissolution neutralizes H⁺ ions, raises CEC, and frees bound phosphorus.
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-emerald-950/40">
              <strong className="text-amber-800 dark:text-amber-300 block mb-1">Alkaline Soils (pH &gt; 7.5)</strong>
              Incorporate agricultural gypsum (CaSO₄·2H₂O) or elemental sulfur. Microbial oxidation produces sulfuric acid, displacing exchangeable sodium and reducing root-zone pH.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" /> Hydrological Deficit Management
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-lg border border-slate-100 p-3 dark:border-emerald-950/40">
              <strong className="text-blue-800 dark:text-blue-300 block mb-1">Moisture Stress (&lt; 25% Field Capacity)</strong>
              Execute deficit drip irrigation or micro-sprinkler rounds prior to reproductive flowering to prevent flower drop and aborted kernels.
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-emerald-950/40">
              <strong className="text-indigo-800 dark:text-indigo-300 block mb-1">Waterlogging Satiation (&gt; 65% Saturation)</strong>
              Dig perimeter furrow drains immediately. Extended submergence creates root hypoxia, precipitating root rot and denitrification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
