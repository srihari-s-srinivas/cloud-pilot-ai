import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { ShieldAlert, ShieldCheck, Filter, ChevronRight, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const severityColors: { [key: string]: string } = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const Security: React.FC = () => {
  const { findings } = useDashboard();
  const [selectedFinding, setSelectedFinding] = useState<any>(findings[0]);
  const [filter, setFilter] = useState('All');

  const filteredFindings = filter === 'All' 
    ? findings 
    : findings.filter(f => f.severity === filter);

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Posture</h1>
          <p className="text-sm text-slate-500 mt-1">Found {findings.length} active vulnerabilities in your infrastructure.</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
          {['All', 'Critical', 'High', 'Medium'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left List */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finding Catalog</span>
             <Filter className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredFindings.map((finding) => (
               <button
                 key={finding.id}
                 onClick={() => setSelectedFinding(finding)}
                 className={`w-full text-left p-5 border-b border-slate-800 transition-all hover:bg-slate-800/30 group relative ${
                   selectedFinding?.id === finding.id ? 'bg-cyan-500/5' : ''
                 }`}
               >
                 {selectedFinding?.id === finding.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[2px_0_10px_rgba(6,182,212,0.5)]"></div>
                 )}
                 <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${severityColors[finding.severity]}`}>
                       {finding.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">{finding.id}</span>
                 </div>
                 <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors leading-snug">
                   {finding.issue}
                 </h4>
                 <p className="text-xs text-slate-500 font-mono truncate">{finding.resource}</p>
               </button>
            ))}
          </div>
        </div>

        {/* Right Details */}
        <div className="col-span-12 lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedFinding ? (
              <motion.div
                key={selectedFinding.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-xl border ${severityColors[selectedFinding.severity]}`}>
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Detailed Analysis</span>
                    <h2 className="text-xl font-bold text-white">{selectedFinding.issue}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Resource ID</p>
                      <p className="font-mono text-sm text-cyan-400">{selectedFinding.resource}</p>
                   </div>
                   <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                      <p className="text-sm text-white font-medium">{selectedFinding.category || 'Infrastructure'}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <section>
                      <div className="flex items-center gap-2 mb-2 text-slate-300">
                         <AlertTriangle className="w-4 h-4 text-amber-500" />
                         <h5 className="text-sm font-bold uppercase tracking-wider">Business Impact</h5>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {selectedFinding.impact}
                      </p>
                   </section>

                   <section>
                      <div className="flex items-center gap-2 mb-2 text-slate-300">
                         <Info className="w-4 h-4 text-cyan-400" />
                         <h5 className="text-sm font-bold uppercase tracking-wider">CloudPilot AI Recommendation</h5>
                      </div>
                      <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl relative overflow-hidden group">
                         <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <CheckCircle2 className="w-32 h-32" />
                         </div>
                         <p className="text-cyan-100 text-sm leading-relaxed italic relative z-10">
                           "{selectedFinding.recommendation}"
                         </p>
                      </div>
                   </section>
                </div>

                <div className="mt-auto pt-8 flex gap-4">
                   <button className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all text-xs uppercase tracking-widest shadow-xl shadow-cyan-900/10">
                      Apply Auto-Remediation
                   </button>
                   <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-widest border border-slate-700">
                      Acknowledge Risk
                   </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center italic">
                 <ShieldCheck className="w-16 h-16 mb-4 opacity-10" />
                 <p>Select a vulnerability to view mitigation strategy.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Security;
