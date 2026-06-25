import React, { useState } from 'react';
import api from '../services/api.ts';
import { Cloud, Copy, Download, RefreshCw, CheckCircle2, FileCode, Terminal, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Terraform: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await api.post('/terraform/generate', { 
        resourceId: 'iac-module-beta', 
        issueType: 'Security Group' 
      });
      // Simulate delay for generation
      await new Promise(r => setTimeout(r, 1500));
      setCode(res.data.code);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remediation.tf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-6 max-w-5xl mx-auto w-full px-4">
      <header className="text-center space-y-2">
        <div className="inline-flex p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-2">
          <Cloud className="w-8 h-8 text-cyan-500" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">IaC Generator</h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm">
          Convert detected security vulnerabilities and optimization opportunities into production-ready Terraform configuration modules.
        </p>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-4">
              <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                 <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded bg-slate-700 text-white">AWS</button>
                 <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded text-slate-500 opacity-50 cursor-not-allowed">Azure</button>
                 <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded text-slate-500 opacity-50 cursor-not-allowed">GCP</button>
              </div>
              <span className="text-[10px] font-mono text-slate-600">v1.4.2 Production Staging</span>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={copyToClipboard}
                disabled={!code}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-4 group"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button 
                onClick={downloadFile}
                disabled={!code}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-4 group"
              >
                {downloaded ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">{downloaded ? 'Downloaded' : 'Download .tf'}</span>
              </button>
           </div>
        </div>

        {code && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <div className="p-1 bg-amber-500/20 rounded text-amber-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-200">AI-Generated Code — Not Automatically Verified</h4>
              <p className="text-xs text-amber-500/80 mt-1">
                Review all changes carefully before applying to production. Run <code className="font-mono text-amber-300">terraform plan</code> first.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900/50 border-b border-slate-800 flex items-center px-6 justify-between">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                <span className="text-[10px] font-mono text-slate-500 ml-4">cloud-pilot-remediation.tf</span>
             </div>
             <Terminal className="w-3 h-3 text-slate-600" />
          </div>

          <div className="h-full pt-10 overflow-auto custom-scrollbar font-mono text-sm leading-relaxed p-6">
             <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4"
                  >
                     <RefreshCw className="w-10 h-10 animate-spin text-cyan-500" />
                     <p className="text-xs uppercase tracking-[0.3em] animate-pulse">Generating Secure HCL...</p>
                  </motion.div>
                ) : code ? (
                   <motion.pre 
                     key="code"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-slate-300"
                   >
                     {code.split('\n').map((line, i) => (
                       <div key={i} className="flex group">
                         <span className="w-8 text-slate-700 text-right mr-6 select-none">{i + 1}</span>
                         <span className={
                           line.includes('resource') ? 'text-purple-400' :
                           line.includes('"') ? 'text-emerald-400' :
                           line.includes('=') ? 'text-cyan-400' :
                           'text-slate-300'
                         }>
                           {line}
                         </span>
                       </div>
                     ))}
                   </motion.pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6">
                     <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl opacity-50 flex flex-col items-center">
                        <FileCode className="w-16 h-16 mb-4" />
                        <h4 className="text-white font-bold mb-1">Configuration Engine Idle</h4>
                        <p className="text-xs max-w-xs text-center">Click generate to build the Terraform definitions for your current environment findings.</p>
                     </div>
                     <button 
                       onClick={generateCode}
                       className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all shadow-xl shadow-cyan-950/20 uppercase tracking-widest text-xs flex items-center gap-3"
                     >
                        <RefreshCw className="w-4 h-4" />
                        Generate Remediation HCL
                     </button>
                  </div>
                )}
             </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6">
           <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                 <Terminal className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-tighter">Terraform Apply</p>
                 <p className="text-[10px] text-slate-500">Learn how to run this code</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-700 ml-auto group-hover:text-cyan-400 transition-colors" />
           </div>
           
           <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                 <Cloud className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-tighter">Module Registry</p>
                 <p className="text-[10px] text-slate-500">View standard libraries</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-700 ml-auto group-hover:text-cyan-400 transition-colors" />
           </div>

           <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-tighter">Security Validated</p>
                 <p className="text-[10px] text-slate-500">Scanned for Drift Control</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-700 ml-auto group-hover:text-cyan-400 transition-colors" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Terraform;
