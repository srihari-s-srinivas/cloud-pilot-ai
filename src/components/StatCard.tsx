import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  trend?: string;
  delay?: number;
}

const colors = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const StatCard: React.FC<StatCardProps & { color: any }> = ({ title, value, icon: Icon, color, trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-center h-full hover:bg-slate-900/60 transition-all group"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-mono font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
          {value}
        </h3>
        {trend && (
          <span className={`text-[10px] font-sans font-normal ${trend.includes('+') ? 'text-emerald-400' : 'text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
