import React from 'react';
import { Cpu, Zap, Target, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Recommendation {
  id: string;
  title: string;
  content: string;
  confidence: number;
  category: string;
  priority: string;
}

const AiRecommendations: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
  return (
    <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col h-full shadow-2xl group">
      {/* Back Glow */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-all duration-700"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-600 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.4)]">
               <Cpu className="w-4 h-4 text-slate-950" />
            </div>
            <div>
               <h3 className="font-bold text-white text-sm tracking-tight uppercase">CloudPilot Synthetic Intelligence</h3>
               <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Autonomous Analysis Phase</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800 rounded-md">
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
             <span className="text-[9px] font-mono font-bold text-cyan-400">ACTIVE</span>
          </div>
        </div>

        <div className="space-y-6 flex-1 overflow-auto custom-scrollbar pr-1">
          {Array.isArray(recommendations) && recommendations.map((rec, index) => (
            <motion.div 
               key={rec.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: index * 0.1 }}
               className="group/card relative"
            >
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-slate-700">{rec.category}</span>
                    <span className={`text-[10px] font-bold ${rec.priority === 'High' ? 'text-red-400' : 'text-amber-400'}`}>• {rec.priority} Priority</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-cyan-500 opacity-50" />
                    <span className="text-[9px] font-mono font-black text-slate-500">{rec.confidence}% Conf.</span>
                 </div>
              </div>
              
              <h4 className="text-white font-bold text-xs group-hover/card:text-cyan-400 transition-colors mb-2">{rec.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 italic mb-4">
                "{rec.content}"
              </p>

              <div className="h-px bg-gradient-to-r from-cyan-500/20 via-slate-800 to-transparent"></div>
            </motion.div>
          ))}
        </div>

        <button className="w-full py-3 bg-slate-950 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl text-[10px] hover:bg-cyan-500 hover:text-slate-950 transition-all uppercase tracking-widest mt-6 shadow-xl flex items-center justify-center gap-2 group/btn">
          Enter Insight Portal
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AiRecommendations;
