import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'motion/react';

import HealthTrendChart from './HealthTrendChart.tsx';

interface RiskScoreCardProps {
  score: number;
  level: string;
  trendData?: any[];
}

const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ score, level, trendData = [] }) => {
  const getLevelColor = () => {
    if (score < 30) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/20';
    if (score < 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/20';
    return 'text-red-400 border-red-500/30 bg-red-500/10 shadow-red-500/20';
  };

  return (
    <div className={`h-full border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between transition-all ${getLevelColor()} border-opacity-50 shadow-xl`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Risk Score Index</p>
          <h4 className="text-4xl font-mono font-bold tracking-tight">{score}<span className="text-xl opacity-50">/100</span></h4>
        </div>
        <div className="p-2 rounded-lg bg-black/20">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {trendData && trendData.length > 0 && (
        <div className="my-2 relative z-10 flex flex-col min-h-[90px] justify-end">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-2">Compliance History</p>
          <HealthTrendChart data={trendData} />
        </div>
      )}

      <div className="mt-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
           <div className={`w-2 h-2 rounded-full animate-pulse ${score > 60 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
           <p className="text-xs font-bold uppercase tracking-[0.2em]">{level} Threat Level</p>
        </div>
        <p className="text-[10px] leading-relaxed opacity-60">
           Based on {score > 60 ? 'critical' : 'minor'} security findings and unoptimized access patterns.
        </p>
      </div>

      {/* Background Decor */}
      <Activity className="absolute bottom-[-10px] right-[-10px] w-32 h-32 opacity-5 -rotate-12" />
    </div>
  );
};

export default RiskScoreCard;
