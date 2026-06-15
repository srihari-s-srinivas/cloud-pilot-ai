import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, X, PieChart, TrendingUp, Shield, Zap } from 'lucide-react';

interface ExecutiveReportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

const ExecutiveReportOverlay: React.FC<ExecutiveReportOverlayProps> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col h-[80vh]">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Executive Summary Report</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">Generated: {new Date(report.generatedAt).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Health Score</span>
                  </div>
                  <div className="text-4xl font-mono font-bold text-white mb-2">{report.healthScore}%</div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cloud Compliance Matrix</p>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saving Potential</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-emerald-400 mb-2">${report.metrics.monthlySavingPotential.toFixed(2)}</div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Projected Monthly reclaim</p>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Posture</span>
                  </div>
                  <div className={`text-4xl font-mono font-bold uppercase mb-2 ${report.riskPosture === 'High Alert' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {report.riskPosture}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Current Vigilance Level</p>
                </div>
              </div>

              {/* Summary Text */}
              <div className="bg-cyan-500/5 p-8 rounded-3xl border border-cyan-500/20">
                <h4 className="text-lg font-bold text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Strategic Overview
                </h4>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {report.summary}
                </p>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Key Remediation Priorities</h4>
                <div className="space-y-4">
                  {report.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex gap-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black ${
                        rec.priority === 'Critical' ? 'text-red-400' : 'text-white'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{typeof rec === 'string' ? rec : rec.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{typeof rec === 'string' ? '' : rec.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-800 bg-slate-900/50 text-center">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
                CONFIDENTIAL • CLOUDPILOT-AI ENTERPRISE SCAN • INTERNAL USE ONLY
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExecutiveReportOverlay;
