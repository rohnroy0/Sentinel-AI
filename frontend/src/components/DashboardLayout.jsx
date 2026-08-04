import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* Sidebar — hidden when printing */}
      <div className="no-print">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar — hidden when printing */}
        <div className="no-print">
          <TopNavbar />
        </div>
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
