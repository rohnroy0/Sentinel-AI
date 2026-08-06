import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Shield, Cpu } from 'lucide-react';
import { InvestigationProvider } from './context/InvestigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load heavy page routes for fast initial app render
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const AgentConsole = lazy(() => import('./pages/AgentConsole'));
const UploadScan = lazy(() => import('./pages/UploadScan'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Findings = lazy(() => import('./pages/Findings'));
const InvestigationGraph = lazy(() => import('./pages/InvestigationGraph'));
const AttackChains = lazy(() => import('./pages/AttackChains'));
const RiskDashboard = lazy(() => import('./pages/RiskDashboard'));
const Remediation = lazy(() => import('./pages/Remediation'));
const Reports = lazy(() => import('./pages/Reports'));
const DecisionLog = lazy(() => import('./pages/DecisionLog'));
const Settings = lazy(() => import('./pages/Settings'));

const PageFallbackLoader = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg)] text-center">
    <div className="relative mb-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] shadow-lg shadow-[var(--brand)]/5 animate-pulse">
        <Shield className="w-8 h-8" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
        <Cpu className="w-3.5 h-3.5 text-[var(--brand)] animate-spin" />
      </div>
    </div>
    <div className="h-1 w-32 bg-[var(--border)] rounded-full overflow-hidden mb-3">
      <div className="h-full bg-[var(--brand)] rounded-full animate-pulse w-2/3" />
    </div>
    <p className="text-xs font-mono font-semibold tracking-wider uppercase text-[var(--text-muted)]">
      Loading Sentinel Workspace…
    </p>
  </div>
);

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <PageFallbackLoader />;
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
          <Suspense fallback={<PageFallbackLoader />}>
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
          </Suspense>
        </Router>
      </AuthProvider>
    </InvestigationProvider>
  );
}

export default App;


