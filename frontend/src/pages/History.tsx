import { useState, useEffect } from 'react';
import {
  History,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  X,
  Atom,
  Sprout,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { getLocalHistory, deleteLocalPrediction } from '../services/predictionEngine';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/predictions/history?limit=100';
      if (selectedCrop) url += `&crop=${encodeURIComponent(selectedCrop)}`;
      if (selectedModel) url += `&model=${encodeURIComponent(selectedModel)}`;
      const { data } = await api.get(url);
      setPredictions(data);
    } catch (e) {
      console.warn('Backend unavailable, loading local history repository', e);
      let localList = getLocalHistory();
      if (selectedCrop) localList = localList.filter(p => p.crop.toLowerCase() === selectedCrop.toLowerCase());
      if (selectedModel) localList = localList.filter(p => p.selected_model.toLowerCase() === selectedModel.toLowerCase());
      setPredictions(localList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedCrop, selectedModel]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prediction record?')) return;
    try {
      await api.delete(`/predictions/${id}`);
    } catch (e) {
      console.warn('Deleting from local repository', e);
    }
    deleteLocalPrediction(id);
    setPredictions(prev => prev.filter(p => p.id !== id));
    if (activeModal?.id === id) setActiveModal(null);
  };

  const handleExportCsv = () => {
    const list = predictions.length > 0 ? predictions : getLocalHistory();
    const headers = ['ID', 'Crop', 'Region', 'Season', 'Model', 'Predicted Yield (t/ha)', 'Total Farm Tons', 'Date'];
    const rows = list.map(p => [
      p.id,
      p.crop,
      p.region,
      p.season,
      p.selected_model,
      p.predicted_yield,
      p.total_farm_yield_tons,
      p.created_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quantumyield_predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintModal = (record: any) => {
    if (!record) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QuantumYield AI Archive Report - ${record.crop}</title>
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
          <h1>QuantumYield AI — Archived Prediction Report</h1>
          <p class="tagline">Official Agricultural & Quantum ML Capstone Archive</p>
        </div>
        <div class="card">
          <span class="badge">${record.selected_model.toUpperCase()}</span>
          <div class="yield-val">${record.predicted_yield} <span style="font-size:16px;">t/ha</span></div>
          <p style="margin:4px 0 0; font-size:13px; color:#475569;">90% Prediction Interval: [${record.confidence_lower} — ${record.confidence_upper}] t/ha</p>
          <p style="margin:4px 0 0; font-size:13px; font-weight:600; color:#065f46;">Total Harvest: ${record.total_farm_yield_tons} metric tons (${record.area_hectares} ha)</p>
          <p style="font-size:12px; color:#64748b;">Crop: <strong>${record.crop}</strong> | Region: <strong>${record.region}</strong> | Date: ${record.created_at}</p>
        </div>
        <div class="footer">QuantumYield AI • Academic Research Archive</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const filteredPredictions = predictions.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.crop?.toLowerCase().includes(q) ||
      p.region?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#0d1813]/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                Persistent Audit Archive
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Prediction History & Research Archive
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Review, filter, inspect, and export historical quantum and classical yield predictions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export All to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by crop, region, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
          >
            <option value="">All Crops</option>
            {['Wheat', 'Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane', 'Barley', 'Potato'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#091510] dark:text-white"
          >
            <option value="">All Models</option>
            <option value="hist_gb">HistGradientBoosting</option>
            <option value="random_forest">Random Forest</option>
            <option value="classical_svr">Classical SVR</option>
            <option value="quantum_svr">Quantum SVR</option>
            <option value="dummy">Dummy Baseline</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading prediction history records...</div>
        ) : filteredPredictions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm">No historical predictions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp / ID</th>
                  <th className="py-3 px-4 font-semibold">Crop</th>
                  <th className="py-3 px-4 font-semibold">Region</th>
                  <th className="py-3 px-4 font-semibold">Model Selected</th>
                  <th className="py-3 px-4 font-semibold">Yield (t/ha)</th>
                  <th className="py-3 px-4 font-semibold">90% CI</th>
                  <th className="py-3 px-4 font-semibold">Total Harvest</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/30">
                {filteredPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-50/80 dark:hover:bg-emerald-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <div>{pred.created_at?.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate w-24">{pred.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {pred.crop}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {pred.region}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {pred.selected_model}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {pred.predicted_yield} t/ha
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      [{pred.confidence_lower} – {pred.confidence_upper}]
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 dark:text-emerald-400">
                      {pred.total_farm_yield_tons} tons
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveModal(pred)}
                          title="Inspect Details"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-emerald-950/40 dark:text-slate-400 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={`http://localhost:8000/api/predictions/${pred.id}/export/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF Report"
                          className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:text-emerald-400"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(pred.id)}
                          title="Delete Record"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0c1813] border border-slate-200 dark:border-emerald-950/50 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950/40 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Prediction Details — {activeModal.crop}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: {activeModal.id}</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Predicted Yield</span>
                  <div className="text-2xl font-black text-emerald-900 dark:text-white mt-1">
                    {activeModal.predicted_yield} t/ha
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">90% Confidence</span>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                    [{activeModal.confidence_lower} – {activeModal.confidence_upper}]
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Total Production</span>
                  <div className="text-xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                    {activeModal.total_farm_yield_tons} tons
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Field Inputs Recorded
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(activeModal.inputs || {}).map(([key, val]: any) => (
                  <div key={key} className="rounded-lg bg-slate-50 p-2 dark:bg-[#07130e] border border-slate-100 dark:border-emerald-950/30">
                    <span className="text-[10px] text-slate-400 block truncate">{key.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Model Comparison Table */}
            {activeModal.model_results && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
                  Model Breakdown
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-emerald-950/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-emerald-950/20 text-slate-500">
                      <tr>
                        <th className="p-2">Model</th>
                        <th className="p-2">Yield</th>
                        <th className="p-2">R²</th>
                        <th className="p-2">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/20">
                      {activeModal.model_results.map((m: any) => (
                        <tr key={m.model_key}>
                          <td className="p-2 font-medium">{m.model_name}</td>
                          <td className="p-2 font-bold">{m.predicted_yield} t/ha</td>
                          <td className="p-2 font-mono">{m.r2}</td>
                          <td className="p-2 font-mono">{m.latency_ms} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-emerald-950/30">
              <button
                type="button"
                onClick={() => handlePrintModal(activeModal)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download / Print PDF Report
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:border-emerald-950 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-emerald-950/30 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
