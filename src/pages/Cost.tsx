import React from 'react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { PiggyBank, ArrowDownRight, TrendingDown, DollarSign, Wallet2, BarChart, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const Cost: React.FC = () => {
  const { optimizations, summary } = useDashboard();

  return (
    <div className="h-full flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinOps Optimization</h1>
          <p className="text-sm text-slate-500 mt-1">Total projected yearly savings: <span className="text-emerald-400 font-bold">$1,540.00</span></p>
        </div>
        
        <div className="flex gap-3">
           <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-right">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Current monthly burn</span>
              <span className="text-xl font-mono text-white font-bold">{summary?.monthlyCost || '$0.00'}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0 overflow-auto pr-2 pb-8">
        
        {/* Left: Summary Analytics */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingDown className="w-24 h-24 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Executive Summary</p>
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Idle Resources</span>
                    <span className="text-sm font-mono text-white font-bold">12 detected</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Right-sizing Ops</span>
                    <span className="text-sm font-mono text-white font-bold">8 opportunities</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Unused Assets</span>
                    <span className="text-sm font-mono text-white font-bold">4 candidates</span>
                 </div>
              </div>
              <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Top Priority Saving</span>
                 </div>
                 <p className="text-2xl font-mono text-white font-bold">$45.00 <span className="text-xs font-normal text-slate-500">/mo</span></p>
                 <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Instance i-0abcd1234 (Right-sizing)</p>
              </div>
           </div>

           <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cost Distribution</p>
              <div className="space-y-4">
                 {[
                   { label: 'Compute', value: 65, color: 'bg-cyan-500' },
                   { label: 'Storage', value: 20, color: 'bg-purple-500' },
                   { label: 'Database', value: 10, color: 'bg-amber-500' },
                   { label: 'Networking', value: 5, color: 'bg-slate-500' },
                 ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-slate-500">{item.label}</span>
                          <span className="text-white">{item.value}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${item.value}%` }}
                             className={`h-full ${item.color} rounded-full`}
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Optimization Candidates */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {optimizations.map((opt, idx) => (
                 <motion.div 
                   key={opt.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.1 }}
                   className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all group"
                 >
                   <div className="flex justify-between items-start mb-6">
                      <div className={`p-2.5 rounded-lg border ${
                         opt.priority === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                         {opt.priority === 'High' ? <AlertTriangle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
                      </div>
                      <div className="text-right">
                         <span className="block text-xl font-mono font-bold text-emerald-400 tracking-tight">{opt.potentialSavings}</span>
                         <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Projected Saving</span>
                      </div>
                   </div>

                   <div className="mb-6">
                      <p className="text-[10px] font-mono text-cyan-400 mb-1">{opt.resource}</p>
                      <p className="text-sm font-bold text-white leading-tight mb-2">{opt.suggestion}</p>
                      <p className="text-xs text-slate-500 italic">"Detected low utilization thresholds over 7-day lookback period."</p>
                   </div>

                   <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Required</span>
                      <button className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-slate-800 hover:bg-emerald-600 px-3 py-1.5 rounded transition-all group/btn uppercase tracking-widest">
                         {opt.action}
                         <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                   </div>
                 </motion.div>
              ))}
           </div>
           
           <div className="p-8 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
              <BarChart className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-white font-bold tracking-tight">Enterprise Cost Report</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">Deep-dive into regional spending and reserved instance utilization. Available in your weekly PDF report.</p>
              <button className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-700 transition-all">
                 Download Quarterly PDF
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Cost;
