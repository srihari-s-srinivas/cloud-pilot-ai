import React from 'react';
import { 
  FileText, 
  Terminal, 
  User as UserIcon, 
  Clock, 
  AlertCircle,
  Database,
  Cloud,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { motion } from 'motion/react';

const AuditLogs = () => {
  const { auditLogs, loading } = useDashboard();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Warning': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('SCAN')) return <Zap className="w-4 h-4" />;
    if (action.includes('TERRAFORM')) return <Terminal className="w-4 h-4" />;
    if (action.includes('AWS')) return <Cloud className="w-4 h-4" />;
    if (action.includes('USER')) return <UserIcon className="w-4 h-4" />;
    if (action.includes('PERMISSION')) return <ShieldCheck className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-slate-400">Chronological record of system activities and security events.</p>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-8 bottom-8 w-[1px] bg-slate-800" />

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500 italic">Accessing audit trails...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic">No logs recorded yet.</div>
          ) : (
            auditLogs.map((log, index) => (
              <motion.div 
                key={(log as any)._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16"
              >
                {/* Circle */}
                <div className={`absolute left-[18px] top-6 w-[13px] h-[13px] rounded-full border-2 border-slate-950 z-10 ${
                  log.severity === 'Critical' ? 'bg-red-500' : 
                  log.severity === 'Warning' ? 'bg-orange-500' : 'bg-cyan-500'
                }`} />

                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl hover:border-slate-700 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-xl text-slate-400 group-hover:text-cyan-400 transition-colors">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{log.service}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 mt-2">{log.details}</p>
                  
                  {log.ipAddress && (
                    <div className="mt-3 flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-slate-600" />
                      <span className="text-[9px] font-mono text-slate-600">SOURCE: {log.ipAddress}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
