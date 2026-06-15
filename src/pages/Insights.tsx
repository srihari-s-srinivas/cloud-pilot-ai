import React from 'react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { Cpu, Sparkles, BrainCircuit, Lightbulb, Zap, HelpCircle, ArrowRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePdfReport } from '../services/pdfGenerator.ts';

const Insights: React.FC = () => {
  const { 
    recommendations,
    summary,
    findings,
    optimizations,
    resources,
    cloudAccount,
    executiveReport
  } = useDashboard();

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfStep, setPdfStep] = React.useState('');

  const handleExportPdf = () => {
    setIsGeneratingPdf(true);
    
    const steps = [
      { text: 'Establishing secure cryptographic tunnel...', delay: 350 },
      { text: 'Retrieving secure infrastructure telemetry streams...', delay: 750 },
      { text: 'Aligning compliance & risk posture formulas...', delay: 1150 },
      { text: 'Synthesizing layout vector components...', delay: 1550 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPdfStep(step.text);
        if (index === steps.length - 1) {
          setTimeout(() => {
            try {
              generatePdfReport({
                summary,
                findings,
                optimizations,
                recommendations,
                resources,
                cloudAccount,
                executiveReport
              });
            } catch (error) {
              console.error('PDF synthesis failed:', error);
            } finally {
              setIsGeneratingPdf(false);
              setPdfStep('');
            }
          }, 350);
        }
      }, step.delay);
    });
  };

  return (
    <div className="h-full flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            CloudPilot AI Insights
            <div className="flex gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150"></span>
            </div>
          </h1>
          <p className="text-sm text-slate-500 mt-1 italic font-serif">Machine learning analysis of your infrastructure patterns and risk scores.</p>
        </div>
        <button 
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2.5 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed group"
          id="export-pdf-report-btn"
        >
          <FileText className="w-4 h-4 text-slate-950 group-hover:rotate-6 transition-transform" />
          Export Intelligence PDF
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0 overflow-auto pr-2 pb-8">
        
        {/* Main Feed */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           {recommendations.map((rec, idx) => (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden group border-l-4 border-l-cyan-500"
              >
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <BrainCircuit className="w-48 h-48 text-cyan-400" />
                 </div>
                 
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                          <Cpu className="w-5 h-5 text-cyan-400" />
                       </div>
                       <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{rec.category} Analysis</span>
                          <h3 className="text-xl font-bold text-white tracking-tight">{rec.title}</h3>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-2xl font-mono font-bold text-cyan-400 block leading-none">{rec.confidence}%</span>
                       <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">AI Confidence</span>
                    </div>
                 </div>

                 <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 mb-8 relative z-10 backdrop-blur-sm">
                    <p className="text-slate-300 text-lg leading-relaxed font-medium">
                       "{rec.content}"
                    </p>
                 </div>

                 <div className="flex items-center gap-6 relative z-10">
                    <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-emerald-400" />
                       <span className="text-xs text-slate-400">High Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Lightbulb className="w-4 h-4 text-amber-400" />
                       <span className="text-xs text-slate-400">Implementation: 2 hours</span>
                    </div>
                    <button className="ml-auto flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group/btn uppercase tracking-widest">
                       Learn Implementation Logic
                       <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </motion.div>
           ))}
        </div>

        {/* Sidebar Widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="p-6 bg-slate-900/60 border border-cyan-500/10 rounded-3xl">
              <h4 className="text-white font-bold text-sm tracking-tight mb-4 flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-cyan-400" />
                 Platform Readiness
              </h4>
              <div className="space-y-4">
                 {[
                   { label: 'Security Health', value: 92 },
                   { label: 'Cloud Optimization', value: 78 },
                   { label: 'Performance Integrity', value: 85 },
                   { label: 'Compliance Score', value: 94 },
                 ].map(item => (
                    <div key={item.label} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                          <span>{item.label}</span>
                          <span className="text-cyan-400">{item.value}%</span>
                       </div>
                       <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            className="h-full bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="p-6 bg-cyan-950/10 border border-cyan-500/20 rounded-3xl group cursor-help hover:bg-cyan-950/20 transition-all">
              <div className="flex items-start gap-4">
                 <HelpCircle className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                 <div>
                    <h5 className="text-white font-bold text-sm mb-1">What is AI Confidence?</h5>
                    <p className="text-slate-400 text-xs leading-relaxed">
                       This score represents the statistical likelihood that implementing the suggested change will result in the predicted performance gain or cost saving, based on historical telemetry.
                    </p>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner mb-4">
                 <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <h5 className="text-white font-bold text-sm">Experimental Features</h5>
              <AnimatePresence>
                {isGeneratingPdf && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
                    id="pdf-loading-overlay"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl"
                    >
                      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-white font-bold text-lg tracking-tight">Compiling Intelligence Report</h3>
                        <p className="text-slate-400 text-xs font-mono min-h-[1.5rem] tracking-tight text-cyan-400 animate-pulse">
                          {pdfStep}
                        </p>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <motion.div 
                          className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.8, ease: 'easeInOut' }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-none">
                        Do not close this window
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-slate-500 text-xs mt-1">Enable "CloudPilot-Live" to receive real-time Slack alerts for critical AI insights.</p>
              <button className="mt-6 w-full py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                 Configure Integrations
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Insights;
