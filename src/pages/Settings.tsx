import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Shield, Bell, Cloud, Trash2, Camera, ExternalLink, Key, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          setIsUpdating(true);
          await updateProfile({ profileImage: base64String });
        } catch (error) {
          console.error('Photo upload failed');
        } finally {
          setIsUpdating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateName = async () => {
    try {
      setIsUpdating(true);
      await updateProfile({ name });
    } catch (error) {
      console.error('Update name failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full pb-12">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your identity, cloud credentials, and notification preferences.</p>
      </header>

      <div className="space-y-8">
        
        {/* Profile Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-3">
                 <User className="w-5 h-5 text-cyan-400" />
                 Engineer Profile
              </h3>
              <button 
                onClick={handleUpdateName}
                disabled={isUpdating || name === user?.name}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest text-slate-950 rounded-xl transition-all"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
           </div>
           <div className="flex items-center gap-8">
              <div className="relative group">
                 <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl font-bold text-white uppercase overflow-hidden">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name.charAt(0)
                    )}
                 </div>
                 <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                 />
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-cyan-600 rounded-full border-4 border-slate-900 text-white hover:bg-cyan-500 transition-all shadow-xl"
                 >
                    <Camera className="w-4 h-4" />
                 </button>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                       <input 
                         type="email" 
                         defaultValue={user?.email}
                         disabled
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                       />
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Appearance & Theme Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
           <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
              Appearance & Theme
           </h3>
           <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <p className="text-sm font-bold text-white">System Theme Mode</p>
                 <p className="text-xs text-slate-500 mt-1">Switch between clean, modern Light mode and high contrast Cosmic Slate Dark mode.</p>
              </div>
              <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
                 <button 
                   onClick={() => handleThemeChange('dark')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                     theme === 'dark' 
                       ? 'bg-slate-950 text-cyan-400 border border-slate-800 shadow-md scale-105' 
                       : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/10'
                   }`}
                 >
                    <Moon className="w-3.5 h-3.5" />
                    Dark Mode
                 </button>
                 <button 
                   onClick={() => handleThemeChange('light')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                     theme === 'light' 
                       ? 'bg-slate-950 text-amber-500 border border-slate-850 shadow-md scale-105' 
                       : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/10'
                   }`}
                 >
                    <Sun className="w-3.5 h-3.5" />
                    Light Mode
                 </button>
              </div>
           </div>
        </section>

        {/* AWS Connection */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-3">
                 <Cloud className="w-5 h-5 text-amber-500" />
                 Cloud Provider Integration
              </h3>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-full">
                 Active
              </span>
           </div>
           
           <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                 <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS" className="w-8 h-8 brightness-0 invert opacity-60" />
                 </div>
                 <div>
                    <h4 className="text-white font-bold text-sm">AWS Production Account</h4>
                    <p className="text-xs text-slate-500">ID: 8847-2291-0034 • US-East-1 • Regions: 3</p>
                 </div>
                 <button className="ml-auto text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest">
                    Manage Access Keys
                 </button>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-bold text-white">Auto-Remediation Capability</p>
                       <p className="text-xs text-slate-500">Allow CloudPilot AI to apply IAM policy fixes automatically.</p>
                    </div>
                    <div className="w-12 h-6 bg-cyan-600 rounded-full relative p-1 cursor-pointer">
                       <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                    <div>
                       <p className="text-sm font-bold text-white">Advanced Drift Detection</p>
                       <p className="text-xs text-slate-500">Continuous background polling of resource state transformations.</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-800 rounded-full relative p-1 cursor-pointer">
                       <div className="w-4 h-4 bg-slate-600 rounded-full absolute left-1"></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Security Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
           <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500" />
              Account Security
           </h3>
           <div className="space-y-4">
              <button className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                       <Key className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">Change Access Password</span>
                 </div>
                 <ExternalLink className="w-4 h-4 text-slate-600" />
              </button>
              <button className="w-full p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between hover:bg-red-500/10 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                       <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-red-400">Delete Project Environment</span>
                 </div>
                 <ExternalLink className="w-4 h-4 text-red-400 opacity-20" />
              </button>
           </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
