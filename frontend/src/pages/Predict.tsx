import { useState } from 'react';
import {
  Sprout,
  Atom,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  Info,
  Download,
  Share2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../services/api';
import { executeClientPrediction, savePredictionLocally } from '../services/predictionEngine';

const PRESETS = [
  {
    name: 'Midwest Corn Belt',
    data: {
      crop: 'Corn',
      region: 'Corn Belt',
      season: 'Summer/Zaid',
      soil_type: 'Loam',
      soil_ph: 6.5,
      soil_nitrogen: 160,
      soil_phosphorus: 65,
      soil_potassium: 120,
      soil_organic_carbon: 2.1,
      temperature: 26.5,
      rainfall: 650,
      humidity: 65,
      soil_moisture: 38,
      area_hectares: 25.0,
      selected_model: 'hist_gb'
    }
  },
  {
    name: 'Punjab Wheat Basin',
    data: {
      crop: 'Wheat',
      region: 'Punjab Basin',
      season: 'Rabi/Winter',
      soil_type: 'Clay Loam',
      soil_ph: 6.8,
      soil_nitrogen: 125,
      soil_phosphorus: 50,
      soil_potassium: 75,
      soil_organic_carbon: 1.2,
      temperature: 19.5,
      rainfall: 420,
      humidity: 55,
      soil_moisture: 32,
      area_hectares: 12.0,
      selected_model: 'hist_gb'
    }
  },
  {
    name: 'Indo-Gangetic Rice Fields',
    data: {
      crop: 'Rice',
      region: 'Indo-Gangetic Plain',
      season: 'Kharif/Monsoon',
      soil_type: 'Clay',
      soil_ph: 6.2,
      soil_nitrogen: 140,
      soil_phosphorus: 55,
      soil_potassium: 80,
      soil_organic_carbon: 1.5,
      temperature: 29.0,
      rainfall: 1300,
      humidity: 78,
      soil_moisture: 58,
      area_hectares: 8.5,
      selected_model: 'hist_gb'
    }
  },
  {
    name: 'Cerrado Soybean Farm',
    data: {
      crop: 'Soybean',
      region: 'Cerrado',
      season: 'Autumn',
      soil_type: 'Sandy Loam',
      soil_ph: 6.3,
      soil_nitrogen: 45,
      soil_phosphorus: 60,
      soil_potassium: 95,
      soil_organic_carbon: 1.8,
      temperature: 25.0,
      rainfall: 580,
      humidity: 62,
      soil_moisture: 34,
      area_hectares: 50.0,
      selected_model: 'random_forest'
    }
  }
];

export default function Predict() {
  const [formData, setFormData] = useState({
    crop: 'Wheat',
    region: 'Midwest Plains',
    season: 'Rabi/Winter',
    soil_type: 'Loam',
    soil_ph: 6.5,
    soil_nitrogen: 120,
    soil_phosphorus: 50,
    soil_potassium: 140,
    soil_organic_carbon: 1.4,
    temperature: 22.0,
    rainfall: 450,
    humidity: 60,
    soil_moisture: 35,
    area_hectares: 10.0,
    selected_model: 'hist_gb'
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: any) => {
    setFormData(preset.data);
    setPrediction(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const [engineSource, setEngineSource] = useState<'backend' | 'client' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Attempt FastAPI backend execution
      const { data } = await api.post('/predictions/predict', formData);
      setPrediction(data);
      savePredictionLocally(data);
      setEngineSource('backend');
    } catch (err: any) {
      // 2. Seamless client-side fallback for standalone cloud deployment (e.g. Vercel)
      console.warn('Backend unavailable, running client-side agronomic and quantum prediction engine', err);
      try {
        const clientResult = executeClientPrediction(formData);
        setPrediction(clientResult);
        savePredictionLocally(clientResult);
        setEngineSource('client');
      } catch (clientErr: any) {
        const msg = clientErr.message || 'Prediction failed. Please verify input ranges.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!prediction) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QuantumYield AI Prediction Report - ${prediction.crop}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 36px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
          h1 { color: #065f46; font-size: 24px; margin: 0 0 4px 0; }
          .tagline { color: #64748b; font-size: 13px; margin: 0; }
          .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 20px; background: #f8fafc; }
          .yield-val { font-size: 38px; font-weight: 800; color: #047857; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; color: #334155; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 600; }
          .footer { font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QuantumYield AI — Crop Yield Prediction & Agronomy Report</h1>
          <p class="tagline">Department of Computer Science Engineering • Quantum Computing Capstone</p>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="badge">${prediction.selected_model.toUpperCase()}</span>
              <div class="yield-val">${prediction.predicted_yield} <span style="font-size:16px;">t/ha</span></div>
              <p style="margin:4px 0 0; font-size:13px; color:#475569;">90% Statistical Prediction Interval: [${prediction.confidence_lower} — ${prediction.confidence_upper}] t/ha</p>
              <p style="margin:4px 0 0; font-size:13px; font-weight:600; color:#065f46;">Total Projected Harvest: ${prediction.total_farm_yield_tons} metric tons (${formData.area_hectares} ha)</p>
            </div>
            <div style="font-size:12px; color:#64748b; text-align:right;">
              <p>Crop: <strong>${prediction.crop}</strong></p>
              <p>Region: <strong>${prediction.region}</strong></p>
              <p>Season: <strong>${prediction.season}</strong></p>
              <p>Generated: ${prediction.created_at}</p>
            </div>
          </div>
        </div>

        <h3>Field & Climate Input Parameters</h3>
        <table>
          <tr><th>Soil pH</th><td>${formData.soil_ph}</td><th>Temperature</th><td>${formData.temperature} °C</td></tr>
          <tr><th>Nitrogen (N)</th><td>${formData.soil_nitrogen} kg/ha</td><th>Rainfall</th><td>${formData.rainfall} mm</td></tr>
          <tr><th>Phosphorus (P)</th><td>${formData.soil_phosphorus} kg/ha</td><th>Humidity</th><td>${formData.humidity} %</td></tr>
          <tr><th>Potassium (K)</th><td>${formData.soil_potassium} kg/ha</td><th>Soil Moisture</th><td>${formData.soil_moisture} %</td></tr>
          <tr><th>Organic Carbon</th><td>${formData.soil_organic_carbon} %</td><th>Soil Type</th><td>${formData.soil_type}</td></tr>
        </table>

        <h3>Scientific Model Benchmark Breakdown</h3>
        <table>
          <tr><th>Model Architecture</th><th>Type</th><th>Predicted Yield</th><th>R² Metric</th><th>MAE</th></tr>
          ${(prediction.model_results || []).map((m: any) => `
            <tr>
              <td><strong>${m.model_name}</strong></td>
              <td>${m.model_type}</td>
              <td><strong>${m.predicted_yield} t/ha</strong></td>
              <td>${m.r2}</td>
              <td>${m.mae}</td>
            </tr>
          `).join('')}
        </table>

        <h3>Agronomic Advisory (FAO-56 & ICAR Guidelines)</h3>
        <div class="card" style="font-size:12px;">
          <p><strong>Soil pH Status:</strong> ${prediction.agronomic_insights?.ph_status?.status || 'Evaluated'} — ${prediction.agronomic_insights?.ph_status?.action || 'Optimal'}</p>
          <p><strong>Irrigation Need:</strong> ${prediction.agronomic_insights?.water_status?.irrigation_need || 'Evaluated'}</p>
          <p><strong>Critical Growth Stage:</strong> ${prediction.agronomic_insights?.critical_growth_stage || 'Flowering & Grain Filling'}</p>
          <p><strong>Citation Source:</strong> ${prediction.agronomic_insights?.agronomic_citation || 'FAO Irrigation and Drainage Paper 56'}</p>
        </div>

        <div class="footer">
          QuantumYield AI • Official CSE Capstone Research Project • Predict Better. Farm Smarter. Grow More.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const comparisonChartData = prediction?.model_results?.map((m: any) => ({
    name: m.model_name.replace(' Regressor', '').replace(' (Baseline)', '').replace(' (RBF)', ''),
    yield: m.predicted_yield,
    r2: m.r2,
    isSelected: m.model_key === prediction.selected_model
  })) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Quick Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Crop Yield Prediction Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Evaluate agronomic variables across classical ensembles and Qiskit fidelity-kernel SVR.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Quick Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-emerald-950/60 dark:bg-[#0d1813] dark:text-slate-200 dark:hover:border-emerald-600 transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Farm & Crop Setup */}
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Sprout className="h-4 w-4" /> 1. Crop & Geographic Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Crop Type
                  </label>
                  <select
                    name="crop"
                    value={formData.crop}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  >
                    {['Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Barley', 'Potato'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agro-Ecological Region
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  >
                    {['Midwest Plains', 'Indo-Gangetic Plain', 'California Central Valley', 'Corn Belt', 'Punjab Basin', 'Cerrado', 'Nile Delta', 'East Anglia'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cropping Season
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  >
                    {['Kharif/Monsoon', 'Rabi/Winter', 'Summer/Zaid', 'Spring', 'Autumn'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cultivated Area (Hectares)
                  </label>
                  <input
                    type="number"
                    name="area_hectares"
                    step="0.5"
                    min="0.5"
                    max="500"
                    value={formData.area_hectares}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Soil Chemistry & Health */}
            <div className="pt-4 border-t border-slate-100 dark:border-emerald-950/30">
              <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" /> 2. Soil Properties & Fertility
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Soil Texture Class
                  </label>
                  <select
                    name="soil_type"
                    value={formData.soil_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  >
                    {['Clay', 'Loam', 'Sandy Loam', 'Clay Loam', 'Sandy', 'Silt Loam'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Soil pH Level <span className="text-[10px] text-slate-400">(4.0 - 9.0)</span>
                  </label>
                  <input
                    type="number"
                    name="soil_ph"
                    step="0.1"
                    min="4.0"
                    max="9.0"
                    value={formData.soil_ph}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organic Carbon % <span className="text-[10px] text-slate-400">(0.2 - 4.5)</span>
                  </label>
                  <input
                    type="number"
                    name="soil_organic_carbon"
                    step="0.1"
                    min="0.2"
                    max="4.5"
                    value={formData.soil_organic_carbon}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nitrogen (N) <span className="text-[10px] text-slate-400">(kg/ha)</span>
                  </label>
                  <input
                    type="number"
                    name="soil_nitrogen"
                    step="1"
                    min="20"
                    max="280"
                    value={formData.soil_nitrogen}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phosphorus (P) <span className="text-[10px] text-slate-400">(kg/ha)</span>
                  </label>
                  <input
                    type="number"
                    name="soil_phosphorus"
                    step="1"
                    min="10"
                    max="140"
                    value={formData.soil_phosphorus}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Potassium (K) <span className="text-[10px] text-slate-400">(kg/ha)</span>
                  </label>
                  <input
                    type="number"
                    name="soil_potassium"
                    step="1"
                    min="25"
                    max="400"
                    value={formData.soil_potassium}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Weather & Water */}
            <div className="pt-4 border-t border-slate-100 dark:border-emerald-950/30">
              <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> 3. Weather & Hydrological Conditions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    step="0.5"
                    min="5"
                    max="45"
                    value={formData.temperature}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    name="rainfall"
                    step="5"
                    min="40"
                    max="2500"
                    value={formData.rainfall}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    name="humidity"
                    step="1"
                    min="15"
                    max="98"
                    value={formData.humidity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Soil Moisture (%)
                  </label>
                  <input
                    type="number"
                    name="soil_moisture"
                    step="1"
                    min="10"
                    max="75"
                    value={formData.soil_moisture}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Model Selector */}
            <div className="pt-4 border-t border-slate-100 dark:border-emerald-950/30">
              <label className="block text-xs font-bold tracking-wide uppercase text-emerald-800 dark:text-emerald-400 mb-2">
                Primary Prediction Model
              </label>
              <select
                name="selected_model"
                value={formData.selected_model}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
              >
                <option value="hist_gb">HistGradientBoosting Regressor (Classical - Highest Accuracy: R² 0.87)</option>
                <option value="random_forest">Random Forest Regressor (Classical Ensemble: R² 0.82)</option>
                <option value="classical_svr">Classical Support Vector Regressor - RBF (Kernel: R² 0.77)</option>
                <option value="quantum_svr">Quantum Fidelity-Kernel SVR (Qiskit ZZFeatureMap: R² -0.15)</option>
                <option value="dummy">Dummy Regressor (Baseline Mean: R² 0.00)</option>
              </select>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Atom className="h-4 w-4 animate-spin" />
                  <span>Computing Quantum State & Ensemble Yield...</span>
                </>
              ) : (
                <>
                  <Sprout className="h-4 w-4" />
                  <span>Execute Multi-Model Yield Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="space-y-6">
              {/* Primary Yield Banner Card */}
              <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-md dark:border-emerald-800/60 dark:from-[#0f241a] dark:to-[#08150f]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Predicted Harvest Yield
                    </span>
                    {engineSource === 'client' && (
                      <span className="ml-2 inline-block rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                        Client Agronomic Engine
                      </span>
                    )}
                    {engineSource === 'backend' && (
                      <span className="ml-2 inline-block rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                        Qiskit Backend
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {prediction.selected_model}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-900 dark:text-white">
                    {prediction.predicted_yield}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    t/ha
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-3 text-xs dark:border-emerald-900/40">
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">90% Prediction Interval:</span> [{prediction.confidence_lower} — {prediction.confidence_upper}] t/ha
                  </div>
                </div>

                <div className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Total Projected Harvest: {prediction.total_farm_yield_tons} metric tons ({formData.area_hectares} ha)
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Download / Print PDF Report
                  </button>
                </div>
              </div>

              {/* Side-by-Side Model Comparison Chart for this sample */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  Model Prediction Breakdown (This Sample)
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} t/ha`, 'Yield']}
                        contentStyle={{
                          backgroundColor: '#0f1713',
                          borderColor: '#1f382b',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="yield" radius={[4, 4, 0, 0]}>
                        {comparisonChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.isSelected ? '#10b981' : '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quantum Simulation Metadata */}
              {prediction.quantum_metadata && (
                <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-5 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 mb-2 text-purple-900 dark:text-purple-300 font-bold text-xs">
                    <Atom className="h-4 w-4" /> Quantum Circuit Execution Metadata
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div><strong>Qubits:</strong> {prediction.quantum_metadata.qubits} Qubits</div>
                    <div><strong>Feature Map:</strong> {prediction.quantum_metadata.feature_map}</div>
                    <div><strong>Entanglement:</strong> {prediction.quantum_metadata.entanglement}</div>
                    <div><strong>Kernel Latency:</strong> {prediction.quantum_metadata.quantum_inference_time_ms} ms</div>
                  </div>
                </div>
              )}

              {/* Agronomic Recommendations */}
              {prediction.agronomic_insights?.recommendations && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Agronomic Guidance & Advisory
                  </h4>
                  {prediction.agronomic_insights.recommendations.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs border ${
                        rec.severity === 'high'
                          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                          : rec.severity === 'warning'
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{rec.category}</span>
                        <span className="text-[10px] uppercase font-semibold">{rec.severity}</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">{rec.observation}</p>
                      <div className="mt-1.5 font-medium text-[11px]">
                        <strong>Action:</strong> {rec.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center dark:border-emerald-950/60 text-slate-400">
              <Sprout className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Awaiting Prediction Inputs</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Configure soil and weather parameters or select a regional preset above, then execute the model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
