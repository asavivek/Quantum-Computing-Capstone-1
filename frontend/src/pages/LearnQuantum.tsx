import { useState } from 'react';
import {
  GraduationCap,
  Atom,
  Binary,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Sliders,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function LearnQuantum() {
  // Interactive Two-Point Kernel Simulator
  const [thetaA, setThetaA] = useState(1.0);
  const [thetaB, setThetaB] = useState(1.2);

  // Analytical 1-qubit / 2-qubit rotation state overlap: |<psi(thetaA)|psi(thetaB)>|^2 = cos^2((thetaA - thetaB)/2)
  const delta = Math.abs(thetaA - thetaB);
  const fidelity1Q = Math.pow(Math.cos(delta / 2), 2);
  // With 2 reps ZZ entanglement factor:
  const fidelitySim = Math.pow(Math.cos(delta / 2), 4);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#0d1813]/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
            Educational Foundations
          </span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Quantum Machine Learning in Agriculture
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          A mathematically rigorous, accessible guide to quantum state embeddings, fidelity kernels, and empirical evaluation.
        </p>
      </div>

      {/* Module 1: Classical Bits vs Qubits */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            <Binary className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Classical Bits vs Qubits (Bloch Sphere Representation)
            </h2>
            <p className="text-xs text-slate-500">From discrete voltage levels to complex vector spaces.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-emerald-950/40 dark:bg-[#07130e]">
            <strong className="text-slate-900 dark:text-white block mb-1">Classical Bit:</strong>
            A classical bit exists deterministically in state <code>0</code> or <code>1</code>. A register of 4 bits stores exactly one 4-bit number at any instant.
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <strong className="text-emerald-900 dark:text-emerald-300 block mb-1">Quantum Bit (Qubit):</strong>
            A qubit is a state vector in a two-dimensional complex Hilbert space:
            <div className="my-2 font-mono bg-white dark:bg-[#0c1812] p-2 rounded border border-emerald-200 dark:border-emerald-800/40 text-center font-bold">
              |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1
            </div>
            The continuous probability amplitudes α and β can represent angles corresponding to continuous agricultural features (e.g., soil pH or temperature).
          </div>
        </div>
      </div>

      {/* Module 2: Quantum Feature Maps */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Quantum Feature Maps & Hilbert Space Embedding
            </h2>
            <p className="text-xs text-slate-500">Mapping agricultural vectors into high-dimensional quantum states.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Just as a classical Support Vector Machine uses kernel functions (like the Radial Basis Function) to project data into higher dimensions, a <strong>Quantum Feature Map</strong> maps a classical vector <code>x = [x₁, x₂, x₃, x₄]</code> into a quantum state:
        </p>
        <div className="font-mono bg-slate-50 dark:bg-[#07130e] p-3 rounded-xl border border-slate-200 dark:border-emerald-950/60 text-center font-bold text-xs text-emerald-800 dark:text-emerald-300">
          Φ: ℝᵈ → ℋ, &nbsp;&nbsp; x ↦ |Φ(x)⟩ = U_Φ(x) |0...0⟩
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          In Qiskit's <code>ZZFeatureMap</code>, single-qubit rotations <code>RZ(θ)</code> encode individual feature values, while two-qubit entangling gates <code>RZZ(θ_i θ_j)</code> encode pairwise non-linear feature interactions (such as the interaction between rainfall and soil nitrogen uptake).
        </p>
      </div>

      {/* Module 3: Fidelity Quantum Kernels */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-emerald-950/40 dark:bg-[#0d1813] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
            <Atom className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Fidelity Quantum Kernels & Transition Probabilities
            </h2>
            <p className="text-xs text-slate-500">How inner products in Hilbert space measure agricultural similarity.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          The quantum kernel between two agricultural data samples <code>x_i</code> and <code>x_j</code> is defined as the transition fidelity (state overlap) between their respective quantum states:
        </p>
        <div className="font-mono bg-purple-50/70 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 text-center font-bold text-xs text-purple-900 dark:text-purple-300">
          K(x_i, x_j) = |⟨Φ(x_i) | Φ(x_j)⟩|² = |⟨0...0 | U_Φ†(x_j) U_Φ(x_i) | 0...0⟩|²
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          On real quantum processors (or Qiskit Aer with shots), this is computed by running the circuit <code>U_Φ(x_i)</code> followed by the inverted circuit <code>U_Φ†(x_j)</code> and measuring the frequency of measuring all qubits as <code>|0000⟩</code>!
        </p>
      </div>

      {/* Interactive Two-Point Simulator */}
      <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-xs dark:border-emerald-950/50 dark:bg-[#0d1813] space-y-4">
        <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <Sliders className="h-4 w-4" /> Interactive Quantum Similarity Simulator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Vary two soil feature rotation parameters (θ_A and θ_B) and watch the analytical quantum kernel fidelity respond in real time:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Sample A Angle (θ_A):</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">{thetaA.toFixed(2)} rad</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.14"
              step="0.05"
              value={thetaA}
              onChange={(e) => setThetaA(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Sample B Angle (θ_B):</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">{thetaB.toFixed(2)} rad</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.14"
              step="0.05"
              value={thetaB}
              onChange={(e) => setThetaB(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Angular Difference Δθ: {delta.toFixed(2)} rad
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Fidelity K(θ_A, θ_B) drops as states move apart on the Bloch sphere.
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Kernel Value K:</span>
            <div className="text-2xl font-black text-emerald-900 dark:text-white font-mono">
              {fidelitySim.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Module 4: The Scientific Reality Check */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 sm:p-8 shadow-xs dark:border-amber-900/40 dark:bg-[#0d1813] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. The Scientific Reality Check: Debunking Quantum Advantage Myths
            </h2>
            <p className="text-xs text-slate-500">Why honesty is paramount in academic quantum computing capstones.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="flex gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Superposition is not parallel evaluation:</strong> Quantum superposition does NOT mean a computer checks every agricultural possibility at once. Measurement collapses the state according to the Born rule. Quantum speedup requires structured interference that concentrates probability on the desired answer.
            </div>
          </div>

          <div className="flex gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Tabular Data vs Structured Physics:</strong> Tabular agricultural data is dominated by step-thresholds (e.g. soil pH &lt; 5.5 causes sudden toxicity). Tree-based ensembles (Random Forest, Gradient Boosting) excel on tabular tables. Quantum kernels create continuous periodic waveforms that do not naturally mirror tabular splits.
            </div>
          </div>

          <div className="flex gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>The O(N²) Gram Matrix Bottleneck:</strong> Computing all pairwise quantum state overlaps requires O(N²) circuit evaluations. Simulating this on classical CPUs takes longer than fitting a gradient-boosted tree on thousands of rows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
