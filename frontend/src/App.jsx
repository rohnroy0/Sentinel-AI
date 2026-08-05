import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import AgentConsole from './pages/AgentConsole';
import UploadScan from './pages/UploadScan';
import Timeline from './pages/Timeline';
import Findings from './pages/Findings';
import InvestigationGraph from './pages/InvestigationGraph';
import AttackChains from './pages/AttackChains';
import RiskDashboard from './pages/RiskDashboard';
import Remediation from './pages/Remediation';
import Reports from './pages/Reports';
import DecisionLog from './pages/DecisionLog';
import Settings from './pages/Settings';

import { InvestigationProvider } from './context/InvestigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" /></div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <InvestigationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Dashboard Routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="agent-console" element={<AgentConsole />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="upload" element={<UploadScan />} />
            <Route path="investigation/:id" element={<Timeline />} />
            <Route path="findings" element={<Findings />} />
            <Route path="graph" element={<InvestigationGraph />} />
            <Route path="attack-chains" element={<AttackChains />} />
            <Route path="risk" element={<RiskDashboard />} />
            <Route path="remediation" element={<Remediation />} />
            <Route path="reports" element={<Reports />} />
            <Route path="decision-log" element={<DecisionLog />} />
            <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </InvestigationProvider>
  );
}

export default App;

