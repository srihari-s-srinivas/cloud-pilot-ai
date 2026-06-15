import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Copy,
  Clock,
  Globe,
  ExternalLink
} from 'lucide-react';

interface FindingDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finding: any;
  onGenerateTerraform: (id: string, type: string) => void;
}

const FindingDetailsDrawer: React.FC<FindingDetailsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  finding, 
  onGenerateTerraform 
}) => {
  const [showAiExplanation, setShowAiExplanation] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) setShowAiExplanation(false);
  }, [isOpen]);

  if (!isOpen || !finding) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"
        />
        
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 h-full w-full max-w-xl bg-slate-900 border-l border-white/5 pointer-events-auto shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl border ${
                finding.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                finding.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{finding.id}: {finding.category}</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{finding.resourceType}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* Main Issue */}
            <div>
              <h4 className="text-2xl font-bold text-white mb-4">{finding.issue}</h4>
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  finding.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  finding.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                  'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}>
                  {finding.severity} Severity
                </span>
                <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Status: {finding.status}
                </span>
                <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {new Date(finding.lastScanned).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">AI Threat Analysis</h5>
                </div>
                {!showAiExplanation && (
                  <button 
                    onClick={() => setShowAiExplanation(true)}
                    className="text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-400 transition-colors"
                  >
                    Explain This Risk
                  </button>
                )}
              </div>
              
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {finding.impact}
              </p>

              <AnimatePresence>
                {showAiExplanation && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-cyan-500/20 pt-4 mt-4 space-y-4"
                  >
                    <div>
                       <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mb-1">Attack Scenario</p>
                       <p className="text-xs text-slate-400 leading-relaxed italic">
                         "An attacker could discover this open port via mass-scanning tools and attempt to compromise the instance using discovered credentials or unpatched vulnerabilities in the SSH daemon."
                       </p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mb-1">Business Impact</p>
                       <p className="text-xs text-slate-400 leading-relaxed">
                         Unauthorized access could lead to data exfiltration, ransomware encryption of production volumes, and significant regulatory fines under CCPA/GDPR compliance frameworks.
                       </p>
                    </div>
                    <button 
                      onClick={() => setShowAiExplanation(false)}
                      className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
                    >
                      Collapse Analysis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-4">
                <AlertTriangle className="w-3.5 h-3.5" />
                Aggregated Exploit Probability: 72%
              </div>
            </div>

            {/* Affected Resource */}
            <div>
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Affected Entity</h5>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-xl text-slate-500">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{finding.resource}</div>
                    <div className="text-[10px] font-mono text-slate-600 uppercase">us-east-1a • Production-VPC</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-600 hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Remediation */}
            <div>
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Resolution Pathway</h5>
              <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/30 p-5 rounded-2xl border border-slate-800/50">
                {finding.recommendation}
              </p>
            </div>

            {/* Action Section */}
            <div className="pt-6 space-y-4">
              <button 
                onClick={() => onGenerateTerraform(finding.resource, finding.resourceType)}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/10"
              >
                <Terminal className="w-5 h-5" />
                Generate Infrastructure Fix
              </button>
              <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all">
                Mark as False Positive
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FindingDetailsDrawer;
