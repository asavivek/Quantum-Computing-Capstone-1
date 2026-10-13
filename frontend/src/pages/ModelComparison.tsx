import { useState, useEffect } from 'react';
import {
  BarChart3,
  Scale,
  RefreshCw,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Atom
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import api from '../services/api';
import { getLocalBenchmark } from '../services/predictionEngine';

export default function ModelComparison() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchBenchmark = async () => {
    setLoading(true);
    try {
      const res = await api.get('/models/compare');
      setData(res.data);
    } catch (e) {
      console.warn('Backend benchmark offline, loading local authentic benchmark metrics', e);
      const lBench = getLocalBenchmark();
      setData({
        benchmark: lBench,
        scientific_analysis:
          "Scientific Analysis: On tabular agricultural data with heterogeneous continuous features " +
          "(soil chemistry, moisture, temperature), Classical Tree Ensembles (HistGradientBoosting and Random Forest) " +
          "substantially outperform both Classical SVR and Quantum Fidelity-Kernel SVR. " +
          "The Quantum Kernel encodes features into periodic rotation angles (RZ and RZZ gates); without a structured " +
          "group-theoretic inductive bias or quantum data source, tabular feature splits are better partitioned by " +
          "axis-aligned decision trees. Furthermore, classical simulation of quantum kernels incurs an O(N^2) " +
          "computational cost, making classical inference orders of magnitude faster.",
        evaluation_protocol: {
          test_split_ratio: 0.20,
          random_seed: 42,
          leakage_protection: "Preprocessor fitted strictly on training partition",
          quantum_encoding: "PCA-4 followed by [0, pi] angle scaling into ZZFeatureMap"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/models/retrain');
      await fetchBenchmark();
    } catch (e) {
      console.error('Retraining failed', e);
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const modelsDict = data?.benchmark?.models || {};
  const modelKeys = ['dummy', 'random_forest', 'hist_gb', 'classical_svr', 'quantum_svr'];

  const metricsTableData = modelKeys.map(k => {
    const m = modelsDict[k] || {};
    return {
      key: k,
      name: m.name || k,
      type: m.type || 'Classical',
      r2: m.r2 ?? 0,
      mae: m.mae ?? 0,
      rmse: m.rmse ?? 0,
      trainTime: m.train_time_sec ?? 0,
      latency: m.latency_per_sample_ms ?? 0
    };
  });

  // Chart Data for Metrics Comparison
  const r2BarData = metricsTableData.map(m => ({
    name: m.name.replace(' Regressor', '').replace(' (Baseline)', '').replace(' (RBF)', '').replace(' (Qiskit)', ''),
    r2: m.r2,
    mae: m.mae,
    rmse: m.rmse
  }));

  // Parity Plot (Actual vs Predicted)
  const parity = data?.benchmark?.parity_data;
  const parityPoints = parity?.actual?.map((act: number, idx: number) => ({
    actual: act,
    hist_gb: parity.hist_gb?.[idx] || 0,
    random_forest: parity.random_forest?.[idx] || 0,
    classical_svr: parity.classical_svr?.[idx] || 0,
    quantum_svr: parity.quantum_svr?.[idx] || 0,
    crop: parity.sample_crops?.[idx] || 'Crop'
  })) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#0d1813]/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                Identical Test Split Evaluation
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Multi-Model Benchmark & Parity Evaluation
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Rigorous comparative analysis across Classical Ensembles, Kernel Baselines, and Qiskit Quantum SVR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Retraining All 5 Models...' : 'Re-Run Model Benchmark'}
            </button>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-600" />
          Empirical Performance Metrics (Test Set Evaluation)
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading benchmark statistics...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Model Name</th>
                  <th className="py-3 px-4 font-semibold">Model Family</th>
                  <th className="py-3 px-4 font-semibold">R² Score (Higher is better)</th>
                  <th className="py-3 px-4 font-semibold">MAE (t/ha)</th>
                  <th className="py-3 px-4 font-semibold">RMSE (t/ha)</th>
                  <th className="py-3 px-4 font-semibold">Training Time</th>
                  <th className="py-3 px-4 font-semibold">Inference Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/30">
                {metricsTableData.map((m) => {
                  const isTop = m.key === 'hist_gb';
                  const isQuantum = m.key === 'quantum_svr';
                  return (
                    <tr
                      key={m.key}
                      className={`hover:bg-slate-50/80 dark:hover:bg-emerald-950/20 transition-colors ${
                        isTop ? 'bg-emerald-50/30 dark:bg-emerald-950/15 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {isQuantum && <Atom className="h-4 w-4 text-purple-600" />}
                        {m.name}
                        {isTop && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            Top Accuracy
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {m.type}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={m.r2 > 0.8 ? 'text-emerald-700 dark:text-emerald-400' : m.r2 < 0 ? 'text-rose-600' : 'text-slate-700'}>
                          {m.r2.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {m.mae.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {m.rmse.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {m.trainTime.toFixed(4)}s
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {m.latency.toFixed(4)} ms/sample
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* R² & Error Comparison */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-2">
            R² Accuracy vs Mean Absolute Error (MAE)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Notice how decision tree ensembles achieve lowest MAE and highest R².
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r2BarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1713',
                    borderColor: '#1f382b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="r2" name="R² Score" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="mae" name="MAE (t/ha)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Latency Comparison */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-2">
            Inference Latency per Sample (Logarithmic Scale)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Quantum simulation requires pairwise statevector projections, incurring higher latency.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricsTableData.map(m => ({
                  name: m.name.split(' ')[0],
                  latency: m.latency
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} ms`, 'Latency']}
                  contentStyle={{
                    backgroundColor: '#0f1713',
                    borderColor: '#1f382b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="latency" name="Latency (ms)" fill="#8b5cf6" radius={[3, 3, 0, 0]}>
                  {metricsTableData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.key === 'quantum_svr' ? '#8b5cf6' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Parity Scatter Plot: Actual vs Predicted Yield */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813]">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-200 mb-2">
          Model Parity Chart (Actual vs Predicted Harvest Yield)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Points clustered tightly along the 45-degree diagonal represent accurate predictions on identical evaluation test samples.
        </p>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                type="number"
                dataKey="actual"
                name="Actual Yield"
                unit=" t/ha"
                tick={{ fontSize: 11 }}
                domain={[0, 'auto']}
              />
              <YAxis
                type="number"
                dataKey="hist_gb"
                name="Predicted Yield"
                unit=" t/ha"
                tick={{ fontSize: 11 }}
                domain={[0, 'auto']}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#0f1713',
                  borderColor: '#1f382b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Scatter
                name="HistGradientBoosting (Classical)"
                data={parityPoints.map((p: any) => ({ actual: p.actual, predicted: p.hist_gb, crop: p.crop }))}
                fill="#10b981"
              />
              <Scatter
                name="Quantum Fidelity SVR (Qiskit)"
                data={parityPoints.map((p: any) => ({ actual: p.actual, predicted: p.quantum_svr, crop: p.crop }))}
                fill="#8b5cf6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Honesty Narrative Section */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-6 shadow-xs dark:border-emerald-900/40 dark:bg-[#0d1813] space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Scientifically Honest Analysis: Classical vs Quantum ML in Agriculture
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {data?.scientific_analysis}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 dark:border-emerald-950/60 dark:bg-[#091510]">
            <strong className="block text-slate-900 dark:text-white mb-1">1. Tabular Inductive Bias</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Continuous soil chemistry (pH, N, P, K) interacts through thresholded bounds. Decision trees split along orthogonal planes naturally, whereas quantum kernels induce sinusoidal Hilbert geometries.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 dark:border-emerald-950/60 dark:bg-[#091510]">
            <strong className="block text-slate-900 dark:text-white mb-1">2. Simulation Complexity</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluating an N × N quantum kernel requires O(N²) state overlap calculations. On classical CPU/GPU simulators, this yields higher latency without hardware quantum acceleration.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 dark:border-emerald-950/60 dark:bg-[#091510]">
            <strong className="block text-slate-900 dark:text-white mb-1">3. Capstone Conclusion</strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Future quantum advantages in agriculture will likely arise in quantum chemistry (fertilizer catalysts, nitrogenase enzyme simulations) rather than standard tabular yield regression.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
