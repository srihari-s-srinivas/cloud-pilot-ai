import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  ShieldAlert, 
  Zap, 
  RefreshCcw, 
  Cloud, 
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.tsx';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useDashboard();

  const getIcon = (type: string, severity: string) => {
    if (type === 'finding' || severity === 'Critical') return <ShieldAlert className="w-4 h-4 text-red-400" />;
    if (type === 'scan') return <RefreshCcw className="w-4 h-4 text-cyan-400" />;
    if (type === 'optimization') return <Zap className="w-4 h-4 text-emerald-400" />;
    if (type === 'terraform') return <Cloud className="w-4 h-4 text-indigo-400" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10, x: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-20 right-8 z-[80] w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden shadow-cyan-500/5"
          >
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Active Alerts</h3>
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                  <p className="text-xs text-slate-500 font-medium">No recent alerts or notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((noti) => (
                    <div 
                      key={(noti as any)._id}
                      onClick={() => !noti.read && markNotificationRead((noti as any)._id)}
                      className={`p-4 hover:bg-slate-800/30 transition-colors cursor-pointer group relative ${!noti.read ? 'bg-cyan-500/[0.02]' : ''}`}
                    >
                      {!noti.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                      )}
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {getIcon(noti.type, noti.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-xs font-bold leading-tight ${!noti.read ? 'text-white' : 'text-slate-400'}`}>
                              {noti.title}
                            </h4>
                            <span className="text-[9px] font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(noti.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                            {noti.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              noti.severity === 'Critical' ? 'text-red-500' : 'text-cyan-500'
                            }`}>
                              {noti.severity} Alert
                            </span>
                            {!noti.read && (
                              <button className="text-[9px] font-black text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Mark Seen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center">
                <button className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
