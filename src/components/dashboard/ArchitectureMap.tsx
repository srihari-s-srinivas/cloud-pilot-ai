import React from 'react';
import { Server, HardDrive, Globe, Activity, Database, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboard } from '../../context/DashboardContext.tsx';

const iconMap: { [key: string]: any } = {
  Globe,
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu
};

const ArchitectureMap: React.FC = () => {
  const { topology } = useDashboard();
  
  const nodes = (Array.isArray(topology) && topology.length > 0) ? topology.map(node => ({
    ...node,
    icon: iconMap[node.icon] || Server
  })) : [];

  return (
    <div className="h-full w-full relative overflow-hidden p-12 group bg-slate-950/20 rounded-3xl">
      {/* Dynamic Data Flow & Connectors */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-30">
        <path d="M 120 200 L 280 200" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 4" />
        <path d="M 280 200 L 580 120" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="8 4" />
        <path d="M 280 200 L 580 280" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="8 4" />
        <path d="M 580 120 L 800 200" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="8 4" />
        <path d="M 580 280 L 800 200" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="8 4" />

        {/* Animated flow pulses */}
        <motion.circle r="3" fill="#22d3ee" filter="blur(2px)">
           <animateMotion path="M 120 200 L 280 200 L 580 120 L 800 200" dur="4s" repeatCount="indefinite" />
        </motion.circle>
        <motion.circle r="3" fill="#22d3ee" filter="blur(2px)">
           <animateMotion path="M 120 200 L 280 200 L 580 280 L 800 200" dur="5s" repeatCount="indefinite" begin="1s" />
        </motion.circle>
      </svg>

      {/* Nodes Container */}
      <div className="relative w-full h-full min-h-[350px]">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div className="flex flex-col items-center gap-4 group/node">
                <div className={`p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl transition-all duration-500 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:scale-110 relative ${node.color}`}>
                  <Icon className="w-8 h-8" />
                  
                  {/* Status Indicator Pulse */}
                  <div className="absolute -top-1 -right-1 flex">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <div className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 shadow-xl transition-all group-hover/node:border-cyan-500/20">
                  <span className="text-[11px] font-bold text-white tracking-tight">{node.label}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                     <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.1em]">{node.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ 
         backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
         backgroundSize: '40px 40px'
      }}></div>
    </div>
  );
};

export default ArchitectureMap;
