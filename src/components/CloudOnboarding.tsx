import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Check, AlertCircle, Cloud, ChevronRight, Server, Database, ShieldCheck, Box, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api.ts';
import { useDashboard } from '../context/DashboardContext.tsx';

interface CloudOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const services = [
  { id: 'EC2', name: 'EC2 Compute', icon: Server },
  { id: 'S3', name: 'S3 Storage', icon: Box },
  { id: 'IAM', name: 'IAM Security', icon: Lock },
  { id: 'SG', name: 'Security Groups', icon: Shield },
  { id: 'RDS', name: 'RDS Databases', icon: Database },
  { id: 'Lambda', name: 'Lambda Functions', icon: Zap },
  { id: 'CloudFront', name: 'CloudFront CDN', icon: Globe },
];

const CloudOnboarding: React.FC<CloudOnboardingProps> = ({ isOpen, onClose }) => {
  const { updateCloudAccount } = useDashboard();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    selectedServices: ['EC2', 'S3', 'IAM', 'SG']
  });

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await api.post('/aws/test-connection', {
        accessKeyId: formData.accessKeyId,
        secretAccessKey: formData.secretAccessKey,
        region: formData.region
      });
      setTestResult({ success: true, message: res.data.message });
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.message || 'Connection failed. Please check credentials.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setConnectError(null);
    try {
      await api.post('/aws/connect', formData);
      await updateCloudAccount();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to complete AWS integration. Please try again.';
      setConnectError(errorMsg);
      console.error('Failed to connect AWS:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter(s => s !== id)
        : [...prev.selectedServices, id]
    }));
  };

  const handleBackStep = () => {
    setConnectError(null);
    setStep(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Connect AWS Environment</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-widest">Enterprise Cloud Onboarding</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2].map((s) => (
                  <div 
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-cyan-500' : 'w-4 bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-10">
              {step === 1 ? (
                <div className="space-y-8">
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-cyan-400">Security Recommendation</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        We recommend using an IAM user with <span className="text-white font-bold italic">ReadOnlyAccess</span>. 
                        CloudPilot AI only requires metadata visibility to analyze your architecture and security posture.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Access Key ID</label>
                      <input 
                        type="text"
                        placeholder="AKIA..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-mono"
                        value={formData.accessKeyId}
                        onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Region</label>
                        <select 
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                           value={formData.region}
                           onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        >
                           <option value="us-east-1">US East (N. Virginia)</option>
                           <option value="us-west-2">US West (Oregon)</option>
                           <option value="eu-central-1">Europe (Frankfurt)</option>
                           <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        </select>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Secret Access Key</label>
                    <div className="relative">
                      <input 
                        type={showSecret ? "text" : "password"}
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-mono"
                        value={formData.secretAccessKey}
                        onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    {testResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 border ${
                          testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                      >
                        {testResult.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-xs font-bold">{testResult.message}</span>
                      </motion.div>
                    )}

                      <div className="flex gap-4">
                        <button 
                          onClick={handleTestConnection}
                          disabled={loading || !formData.accessKeyId || !formData.secretAccessKey}
                          className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all disabled:opacity-50"
                        >
                          {loading ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button 
                          onClick={() => setStep(2)}
                          disabled={!testResult?.success}
                          className="flex-1 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          Next Step
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Select Scanning Scope</h4>
                    <p className="text-xs text-slate-400 pl-1">Choose which AWS services CloudPilot AI should index and analyze.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {services.map((service) => {
                      const Icon = service.icon;
                      const isSelected = formData.selectedServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                            isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`p-3 rounded-xl transition-all ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                          }`}>
                            {service.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {connectError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl flex items-start gap-3 border bg-red-500/10 border-red-500/20 text-red-400"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">Integration Failed</span>
                        <span className="text-xs text-red-300 mt-1 block">{connectError}</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-6">
                    <button 
                      onClick={handleBackStep}
                      className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleConnect}
                      disabled={loading || formData.selectedServices.length === 0}
                      className="flex-1 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {loading ? 'Finalizing Setup...' : 'Complete AWS Integration'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CloudOnboarding;
