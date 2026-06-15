import React from 'react';
import { useDashboard } from '../context/DashboardContext.tsx';
import Sidebar from '../components/Sidebar.tsx';
import { Loader2 } from 'lucide-react';

/**
 * MainLayout provides Sidebar and consistent structure for protected pages
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isScanning } = useDashboard();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto">
             <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                <div className="text-center">
                  <p className="text-white font-bold tracking-tight">Active Infrastructure Scan</p>
                  <p className="text-slate-500 text-xs mt-1">Analyzing AWS resource compliance and cost...</p>
                </div>
             </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
             </div>
          ) : children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
