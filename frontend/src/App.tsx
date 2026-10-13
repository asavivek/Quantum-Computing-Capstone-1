import { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import HistoryPage from './pages/History';
import QuantumInsights from './pages/QuantumInsights';
import ModelComparison from './pages/ModelComparison';
import AgronomyInsights from './pages/AgronomyInsights';
import LearnQuantum from './pages/LearnQuantum';

export const AuthContext = createContext<any>(null);
export const ThemeContext = createContext<any>(null);

function App() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const activeUserStr = localStorage.getItem('active_user');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          localStorage.setItem('active_user', JSON.stringify(data));
        } catch (e) {
          if (activeUserStr) {
            try {
              setUser(JSON.parse(activeUserStr));
            } catch {
              localStorage.removeItem('token');
              localStorage.removeItem('active_user');
            }
          } else {
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0c1310] text-emerald-800 dark:text-emerald-400 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <span className="text-xs font-semibold uppercase tracking-wider">Loading QuantumYield AI...</span>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <AuthContext.Provider value={{ user, setUser }}>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="predict" element={<Predict />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="quantum" element={<QuantumInsights />} />
              <Route path="compare" element={<ModelComparison />} />
              <Route path="insights" element={<AgronomyInsights />} />
              <Route path="learn" element={<LearnQuantum />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
