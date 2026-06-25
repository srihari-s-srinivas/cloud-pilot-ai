import React from 'react';
import { X, Copy, Download, Code, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TerraformModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  resourceId: string;
}

const TerraformModal: React.FC<TerraformModalProps> = ({ isOpen, onClose, code, resourceId }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `remediate_${resourceId.replace(/[^a-z0-9]/gi, '_')}.tf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                  <Code className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Remediation Blueprint</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-widest">HCL Terraform • Resource ID: {resourceId}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .tf
                  </button>
                </div>
                <pre className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-cyan-50/90 overflow-x-auto custom-scrollbar h-[400px]">
                  <code>{code}</code>
                </pre>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validated via CloudPilot AI Engine</span>
                </div>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-cyan-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-500/10"
                >
                  Close Blueprint
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TerraformModal;
