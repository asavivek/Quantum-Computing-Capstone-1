import { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import {
  LayoutDashboard,
  Sprout,
  History,
  Atom,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export default function Layout() {
  const { user, setUser } = useContext(AuthContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/auth');
  };

  const navSections = [
    {
      title: 'PLATFORM CORE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Yield Predictor', path: '/predict', icon: Sprout },
        { name: 'History & Reports', path: '/history', icon: History },
      ]
    },
    {
      title: 'QUANTUM RESEARCH',
      items: [
        { name: 'Quantum Laboratory', path: '/quantum', icon: Atom },
        { name: 'Model Benchmark', path: '/compare', icon: BarChart3 },
        { name: 'Learn Quantum AI', path: '/learn', icon: GraduationCap },
      ]
    },
    {
      title: 'AGRONOMY',
      items: [
        { name: 'Insights & Guidelines', path: '/insights', icon: ShieldCheck },
      ]
    }
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Platform Dashboard';
    if (p.includes('/predict')) return 'Crop Yield Prediction Workspace';
    if (p.includes('/history')) return 'Prediction History & Report Archive';
    if (p.includes('/quantum')) return 'Quantum Machine Learning Laboratory';
    if (p.includes('/compare')) return 'Multi-Model Benchmark & Parity Evaluation';
    if (p.includes('/learn')) return 'Educational Guide: Quantum AI in Agriculture';
    if (p.includes('/insights')) return 'Agronomic Guidelines & Diagnostic System';
    return 'QuantumYield AI';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0c1310] text-slate-800 dark:text-slate-100 bg-circuit-pattern transition-colors">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-200 dark:border-emerald-950/40 dark:bg-[#091510]/95 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between px-6 border-b border-slate-200/80 dark:border-emerald-950/40">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-md shadow-emerald-900/30">
              <Atom className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-white">
                <span className="text-emerald-700 dark:text-emerald-400">Quantum</span>Yield
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">AI</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-medium">QML Smart Farming</p>
            </div>
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-300">
                {sec.title}
              </h3>
              <div className="space-y-1 pt-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 dark:bg-emerald-600/90'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-200'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Simulator Health & User Profile */}
        <div className="border-t border-slate-200/80 p-4 dark:border-emerald-950/40 bg-slate-50/50 dark:bg-emerald-950/10 space-y-3">
          {/* Simulator Live Pulse */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-800/40">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-800 dark:text-emerald-300">Qiskit Aer Simulator</span>
            </div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[10px]">Active</span>
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'Q'}
              </div>
              <div className="truncate text-left">
                <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user?.full_name || 'Guest Researcher'}
                </div>
                <div className="truncate text-[10px] text-slate-600 dark:text-slate-300">
                  {user?.email || 'guest@quantumyield.ai'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-200 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLogout}
                title="Logout session"
                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 px-6 backdrop-blur-md dark:border-emerald-950/40 dark:bg-[#091510]/70">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-emerald-950/40"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {getPageTitle()}
              </h2>
              <p className="hidden sm:block text-[11px] text-slate-600 dark:text-slate-300">
                Predict Better. Farm Smarter. Grow More.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/predict"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Prediction</span>
            </NavLink>
            <NavLink
              to="/quantum"
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Atom className="h-3.5 w-3.5" />
              <span>Quantum Lab</span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
