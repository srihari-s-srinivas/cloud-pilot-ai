import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';

interface ScanProgressOverlayProps {
  isVisible: boolean;
  progress: number;
  step: string;
  status?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

const ScanProgressOverlay: React.FC<ScanProgressOverlayProps> = ({ isVisible, progress, step, status, onRetry, onClose }) => {
  if (!isVisible) return null;

  const isTimeout = status === 'timeout';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-cyan-500/10 relative"
        >
          {isTimeout && onClose && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white bg-slate-950/30 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isTimeout ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-550/10 rounded-2xl text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Scan Timeout Exceeded</h3>
                  <p className="text-[10px] text-rose-500 font-black tracking-[0.2em] uppercase">Operation Aborted</p>
                </div>
              </div>

              <div className="bg-rose-950/20 border border-rose-950/40 p-5 rounded-2xl">
                <p className="text-sm font-medium text-rose-200/90 leading-relaxed">
                  AWS scan took too long and timed out. If you have a large infrastructure, please contact support or adjust selected services.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/15"
                  >
                    Retry with fewer services
                  </button>
                )}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest border border-slate-700"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Scan</h3>
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">Security Intelligence Engine</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-mono font-bold text-cyan-400">{progress}%</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <span>Current Phase: {step}</span>
                    <span>{progress === 100 ? 'Finishing...' : 'EST: 45s'}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 space-y-3">
                  {[
                    { label: 'Cloud API Connectivity', target: 10 },
                    { label: 'Resource Discovery', target: 40 },
                    { label: 'Security Policy Audit', target: 70 },
                    { label: 'AI Remediation Generation', target: 90 },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {progress >= p.target ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 text-slate-700 animate-spin" />
                        )}
                        <span className={`text-[11px] font-medium transition-colors ${progress >= p.target ? 'text-slate-300' : 'text-slate-600'}`}>
                          {p.label}
                        </span>
                      </div>
                      {progress >= p.target && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Done</span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-center text-slate-500 italic">
                  CloudPilot AI is analyzing {progress * 5} metadata points across your infrastructure.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScanProgressOverlay;
