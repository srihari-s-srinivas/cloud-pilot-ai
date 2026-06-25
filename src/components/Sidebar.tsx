import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  ShieldAlert, 
  PiggyBank, 
  Cpu, 
  LogOut, 
  LayoutDashboard,
  Cloud,
  Layers,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useDashboard } from '../context/DashboardContext.tsx';
import { motion } from 'motion/react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { notifications } = useDashboard();
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Inventory', icon: Layers, path: '/resources' },
    { name: 'Security', icon: ShieldAlert, path: '/security' },
    { name: 'Optimization', icon: PiggyBank, path: '/cost' },
    { name: 'AI Insights', icon: Cpu, path: '/insights' },
    { name: 'Terraform', icon: Cloud, path: '/terraform' },
    { name: 'Audit Logs', icon: HistoryIcon, path: '/audit-logs' },
    { name: 'Scan History', icon: BarChart3, path: '/history' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  return (
    <aside className="flex flex-col h-screen w-64 bg-slate-900/50 text-slate-400 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-500 rounded border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Cloud className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="font-bold tracking-tight text-white">CloudPilot AI</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm flex-1">{item.name}</span>
            {item.name === 'Dashboard' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px]">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-slate-600 overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name.charAt(0)
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">Phase 1 Build</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 group text-xs"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
