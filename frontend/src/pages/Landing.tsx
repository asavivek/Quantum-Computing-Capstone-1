import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Atom,
  Sprout,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import api from '../services/api';

export default function Landing() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      const { data } = await api.post('/auth/guest');
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        window.location.href = '/dashboard';
      }
    } catch (e) {
      navigate('/auth');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1310] text-slate-800 dark:text-slate-100 bg-circuit-pattern">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#091510]/80">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/30">
              <Atom className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                <span className="text-emerald-700 dark:text-emerald-400">Quantum</span>Yield AI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Capstone v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/auth?mode=login"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-400 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              Sign Up
            </Link>
            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              {demoLoading ? 'Launching...' : 'Quick Demo'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Computer Science Engineering Capstone in Quantum Computing
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-slate-900 dark:text-white max-w-4xl mx-auto">
            Predict Better. <br />
            <span className="bg-gradient-to-r from-emerald-700 via-emerald-500 to-lime-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-lime-400">
              Farm Smarter. Grow More.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A state-of-the-art precision agriculture platform bridging real agro-climatic sensor data,
            classical gradient boosting ensembles, and genuine Qiskit quantum fidelity-kernel regression.
          </p>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <Link
              to="/auth?mode=signup"
              className="flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-700/30 hover:bg-emerald-500 transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Sign Up / Register
            </Link>
            <Link
              to="/auth?mode=login"
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-emerald-900/40 dark:bg-[#0f1d17] dark:text-slate-200 dark:hover:bg-emerald-950/40 transition-all"
            >
              Sign In
            </Link>
            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="flex items-center gap-2 rounded-xl border border-dashed border-emerald-600/40 bg-emerald-500/10 px-5 py-3.5 text-base font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <PlayCircle className="h-5 w-5" />
              Instant Demo Access
            </button>
          </div>

          {/* Interactive Quantum-Agriculture Hero Schematic */}
          <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white/70 p-4 sm:p-8 shadow-2xl backdrop-blur-md dark:border-emerald-950/50 dark:bg-[#0d1813]/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Stage 1 */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white mb-3">
                  <Sprout className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Soil & Climate Sensors</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  pH, N-P-K nutrients, organic carbon, rainfall, temperature, and moisture.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white mb-3">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Feature Pipeline</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  StandardScaler + PCA dimensionality reduction to [0, π] rotation intervals.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-5 dark:border-purple-900/30 dark:bg-purple-950/20 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white mb-3">
                  <Atom className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Qiskit Feature Map</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ZZFeatureMap quantum states |ψ(x)⟩ and Gram fidelity matrix computation.
                </p>
              </div>

              {/* Stage 4 */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Yield & Advisory</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Estimated metric tons/ha with 90% CI and FAO-grounded agronomic rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Cards */}
      <section className="py-16 bg-slate-100/50 dark:bg-[#07130e]/50 border-y border-slate-200/80 dark:border-emerald-950/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Engineered for Scientific Rigor
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Honest machine learning benchmarking without hyperbole or pseudo-quantum emulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-emerald-950/40 dark:bg-[#0e1a14]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-5">
                <Sprout className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yield Prediction Workspace</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive 13-feature prediction form incorporating soil chemistry, ambient humidity, temperature, and farm area.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-emerald-950/40 dark:bg-[#0e1a14]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 mb-5">
                <Atom className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quantum Laboratory</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Native Qiskit 2.x and Aer circuit simulator. Inspect circuit depth, gate counts, state overlap fidelities, and live Gram matrix heatmaps.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-emerald-950/40 dark:bg-[#0e1a14]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 mb-5">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scientific Model Benchmark</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Objective comparison across 5 models: HistGradientBoosting, Random Forest, Classical SVR, Quantum SVR, and Dummy baseline.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-emerald-950/40 dark:bg-[#0e1a14]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transparent Agronomy Advisory</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Rule-based recommendations based on FAO Drainage Paper 56 and ICAR handbooks for pH buffering, fertilizer, and irrigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology & Capstone Limitations Section */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-200/80 bg-white p-8 shadow-lg dark:border-emerald-900/40 dark:bg-[#0d1813]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 mb-6">
              <AlertCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Scientific Methodology & Academic Capstone Limitations
            </h3>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100">Genuine Quantum Execution:</strong> All quantum kernels are computed using Qiskit 2.x parameterized circuits. The Gram matrix is constructed using analytical statevector overlaps |⟨ψ(x)|ψ(z)⟩|² or shot-based Aer simulation.
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100">Honest Evaluation:</strong> In accordance with empirical quantum machine learning literature, classical tree ensembles (Gradient Boosting and Random Forest) outperform quantum fidelity kernels on tabular agricultural data. The platform explicitly reports these metrics rather than inflating quantum performance.
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-100">Dimensionality Reduction:</strong> Due to classical simulation complexity O(2ⁿ) and kernel matrix construction O(N²), the quantum feature map is constrained to 4 principal component qubits to maintain interactive responsiveness without cloud quantum queue latency.
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-emerald-950/40 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Department of Computer Science Engineering • Quantum Computing Capstone
              </span>
              <button
                onClick={handleLaunchDemo}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
              >
                Launch Dashboard Demo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 py-8 dark:border-emerald-950/40 dark:bg-[#07130e]/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 QuantumYield AI — Quantum AI-Based Crop Yield Prediction & Smart Farming Platform.</p>
        <p className="mt-1">Tagline: Predict Better. Farm Smarter. Grow More.</p>
      </footer>
    </div>
  );
}
