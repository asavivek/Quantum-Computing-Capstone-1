import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import api from '../services/api';
import { Atom, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        navigate('/dashboard');
      } else {
        const { data } = await api.post('/auth/register', {
          email,
          full_name: fullName,
          password
        });
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = async () => {
    setError(null);
    setGuestLoading(true);
    try {
      const { data } = await api.post('/auth/guest');
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Unable to launch guest evaluator demo.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-[#0c1310] bg-circuit-pattern">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-emerald-950/50 dark:bg-[#091510]/90">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/30">
              <Atom className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="text-emerald-700 dark:text-emerald-400">Quantum</span>Yield AI
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isLogin ? 'Sign In to Quantum Platform' : 'Create Researcher Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Smart Farming & Quantum Machine Learning Lab
          </p>
        </div>

        {/* 1-Click Guest Access Banner */}
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-left dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Capstone Reviewer / Evaluator Access
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Instant 1-click access pre-configured with researcher privileges.
              </p>
              <button
                type="button"
                onClick={handleGuestDemo}
                disabled={guestLoading}
                className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-600 transition-all cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {guestLoading ? 'Authenticating...' : 'Enter as Guest Researcher'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-emerald-950/40 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              isLogin
                ? 'bg-white text-emerald-800 shadow-xs dark:bg-emerald-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              !isLogin
                ? 'bg-white text-emerald-800 shadow-xs dark:bg-emerald-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Agronomist"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#0c1812] dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@university.edu"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#0c1812] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-hidden dark:border-emerald-950/60 dark:bg-[#0c1812] dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-500 transition-all cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-400">
          <Link to="/" className="hover:text-emerald-600 transition-colors">
            ← Back to QuantumYield Home
          </Link>
        </div>
      </div>
    </div>
  );
}
