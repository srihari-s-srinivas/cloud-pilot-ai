import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Server, 
  Database, 
  ShieldCheck, 
  HardDrive, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext.tsx';
import { motion } from 'motion/react';

const Resources = () => {
  const { resources, loading } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const resourceTypes = ['All', 'EC2', 'S3', 'IAM', 'RDS', 'EBS', 'Security Group'];

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         res.resourceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || res.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'EC2': return <Server className="w-5 h-5" />;
      case 'S3': return <Database className="w-5 h-5" />;
      case 'IAM': return <ShieldCheck className="w-5 h-5" />;
      case 'EBS': return <HardDrive className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resources Inventory</h1>
          <p className="text-slate-400">Manage and monitor your cloud assets across all regions.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search resources..."
              className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {resourceTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedType === type 
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Region</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Risk</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Cost</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading resources...</td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No resources found</td>
                </tr>
              ) : (
                filteredResources.map((res, index) => (
                  <motion.tr 
                    key={res.resourceId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                          {getResourceIcon(res.type)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{res.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">{res.resourceId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                        {res.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 uppercase font-mono">{res.region}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${res.status === 'running' || res.status === 'active' || res.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                        <span className="text-xs font-medium text-slate-400 capitalize">{res.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getRiskColor(res.riskLevel)}`}>
                        {res.riskLevel === 'Safe' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {res.riskLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-200">${res.monthlyCost.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Resources;
