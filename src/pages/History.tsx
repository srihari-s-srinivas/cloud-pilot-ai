import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { History as HistoryIcon, Search, Calendar, ChevronRight, CheckCircle2, XCircle, Code, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const History: React.FC = () => {
  const { scans, terraformHistory } = useDashboard();
  const [activeTab, setActiveTab] = useState<'scans' | 'terraform'>('scans');

  return (
    <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity & Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Review historical snapshots and generated remediation code.</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('scans')}
             className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'scans' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Scan History
           </button>
           <button 
             onClick={() => setActiveTab('terraform')}
             className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'terraform' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Terraform History
           </button>
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'scans' ? (
            <motion.div 
              key="scans-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {scans.length > 0 ? scans.map((scan, idx) => (
                <motion.div 
                  key={scan._id || scan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:bg-slate-900/80 transition-all flex items-center justify-between overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                     scan.status === 'completed' || scan.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>

                  <div className="flex items-center gap-6">
                     <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <Calendar className="w-5 h-5 text-slate-400" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-xs font-mono text-cyan-400 font-bold">{scan._id || scan.id}</span>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                              scan.status === 'completed' || scan.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                           }`}>
                              {scan.status}
                           </span>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {new Date(scan.createdAt || scan.timestamp).toLocaleDateString('en-US', { 
                             weekday: 'long', 
                             year: 'numeric', 
                             month: 'long', 
                             day: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit'
                          })}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-12">
                     {(scan.findingsCount?.critical !== undefined || scan.findingsCount !== undefined) && (
                       <div className="text-right">
                          <span className="block text-xl font-mono font-bold text-white leading-none">
                            {typeof scan.findingsCount === 'object' 
                              ? (scan.findingsCount.critical + scan.findingsCount.high + scan.findingsCount.medium + scan.findingsCount.low)
                              : scan.findingsCount}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Vulnerabilities</span>
                       </div>
                     )}
                     <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all group-hover:translate-x-1">
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
                </motion.div>
              )) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                   <p className="text-slate-500 text-sm">No scan history found. Run your first scan to see data here.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="tf-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {terraformHistory.length > 0 ? terraformHistory.map((fix, idx) => (
                <motion.div 
                  key={fix._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:bg-slate-900/80 transition-all flex items-center justify-between overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>

                  <div className="flex items-center gap-6">
                     <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                        <Code className="w-5 h-5 text-cyan-400" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-xs font-mono text-cyan-400 font-bold">{fix.resourceId}</span>
                           <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {fix.issueType}
                           </span>
                        </div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Remediation Script Generated</p>
                        <p className="text-[10px] text-slate-500">Generated on {new Date(fix.createdAt).toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all">
                        <Search className="w-3 h-3" />
                        View Code
                     </button>
                  </div>
                </motion.div>
              )) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl">
                   <p className="text-slate-500 text-sm">No Terraform fixes generated yet. Resolve an issue to see history.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 p-12 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
         <HistoryIcon className="w-12 h-12 text-slate-700 mb-4" />
         <p className="text-slate-500 text-sm max-w-xs">Older history can be retrieved by enabling Archival Logging in your project settings.</p>
      </div>
    </div>
  );
};

export default History;
