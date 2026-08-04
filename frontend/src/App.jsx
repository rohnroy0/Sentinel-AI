import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
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
      </Routes>
    </Router>
  );
}

export default App;
