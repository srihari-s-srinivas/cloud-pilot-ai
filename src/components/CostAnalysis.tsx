import React from 'react';
import { PiggyBank, ArrowDownCircle, Server, HardDrive, Database, Network, ChevronRight } from 'lucide-react';

interface CostOptimization {
  id: string;
  resource: string;
  suggestion: string;
  potentialSavings: string;
  action: string;
  priority: string;
  type: 'EC2' | 'EBS' | 'RDS' | 'Network' | string;
  impact: string;
}

const typeIcons = {
  EC2: Server,
  EBS: HardDrive,
  RDS: Database,
  Network: Network,
};

const CostAnalysis: React.FC<{ optimizations: CostOptimization[] }> = ({ optimizations }) => {
  return (
    <div className="flex flex-col h-full gap-4">
      {optimizations.map((opt) => {
        const Icon = typeIcons[opt.type as keyof typeof typeIcons] || PiggyBank;
        return (
          <div 
             key={opt.id} 
             className="group/item flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Background Priority Glow */}
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-[0.03] transition-opacity group-hover/item:opacity-10 ${
               opt.priority === 'Critical' ? 'bg-red-500' : opt.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-500'
            } rounded-bl-full`}></div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg group-hover/item:bg-slate-800 transition-colors">
               <Icon className="w-5 h-5 text-slate-400 group-hover/item:text-emerald-400 transition-colors" />
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest">{opt.resource}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                     opt.priority === 'Critical' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                  }`}>
                    {opt.priority}
                  </span>
               </div>
               <h5 className="text-white font-bold text-xs truncate group-hover/item:text-emerald-400 transition-colors">{opt.suggestion}</h5>
               <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-1">{opt.impact}</p>
            </div>

            <div className="text-right pl-4">
               <p className="text-md font-mono font-bold text-emerald-400 leading-none">{opt.potentialSavings}</p>
               <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">/ Month</p>
            </div>
            
            <div className="pl-2">
               <ChevronRight className="w-4 h-4 text-slate-700 group-hover/item:text-white transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CostAnalysis;
