import React, { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronRight, CheckCircle2, Clock, Search, Filter, Wand2 } from 'lucide-react';

interface SecurityFinding {
  id: string;
  resource: string;
  resourceType: string;
  issue: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
  status: string;
  lastScanned: string;
}

const severityColors = {
  Critical: 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  High: 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

const SecurityTable: React.FC<{ 
  findings: SecurityFinding[], 
  onGenerateTerraform?: (resourceId: string, issueType: string) => void,
  onSelectFinding?: (finding: SecurityFinding) => void
}> = ({ findings = [], onGenerateTerraform, onSelectFinding }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const matchesSearch = f.resource.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           f.issue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [findings, searchTerm, severityFilter]);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleGenerateClick = async (finding: SecurityFinding) => {
    if (onGenerateTerraform) {
      setGeneratingFor(finding.id);
      await onGenerateTerraform(finding.resource, finding.resourceType);
      setGeneratingFor(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl flex-1">
      <div className="px-8 py-7 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/50">
        <div>
          <h3 className="font-bold text-white tracking-tight flex items-center gap-3 text-xl">
             <ShieldAlert className="w-5 h-5 text-red-500" />
             Security Intelligence
          </h3>
          <p className="text-xs text-slate-500 mt-1">Live heuristic analysis of architecture-level vulnerabilities.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search resource or issue..." 
              className="bg-slate-950/50 border border-slate-800 text-xs text-white pl-11 pr-6 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 min-w-[280px] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl">
             <Filter className="w-3.5 h-3.5 text-slate-500" />
             <select 
               className="bg-transparent border-none text-xs text-slate-400 focus:ring-0 cursor-pointer appearance-none pr-4"
               value={severityFilter}
               onChange={(e) => setSeverityFilter(e.target.value)}
             >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
             </select>
          </div>
          <span className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {filteredFindings.length} Anomalies Detected
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-950/30 text-slate-500 sticky top-0 z-20 shadow-sm shadow-slate-950/50 backdrop-blur-sm">
              <th className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">Resource Address</th>
              <th className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">Finding Descriptor</th>
              <th className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">Criticality</th>
              <th className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">Current Status</th>
              <th className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredFindings.map((finding) => (
              <React.Fragment key={finding.id}>
                <tr 
                  onClick={() => onSelectFinding ? onSelectFinding(finding) : toggleRow(finding.id)}
                  className={`group cursor-pointer transition-all hover:bg-slate-800/20 ${expandedRow === finding.id ? 'bg-slate-800/30' : ''}`}
                >
                  <td className="px-8 py-8">
                    <div className="flex flex-col gap-1">
                       <span className="font-mono text-xs text-cyan-400 font-bold group-hover:text-cyan-300 transition-colors uppercase tracking-tight">{finding.resource}</span>
                       <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{finding.resourceType}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8 font-bold text-white text-sm tracking-tight leading-snug max-w-xs">{finding.issue}</td>
                  <td className="px-8 py-8">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${severityColors[finding.severity]}`}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${finding.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${finding.status === 'Resolved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {finding.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    {expandedRow === finding.id ? <ChevronDown className="w-5 h-5 text-cyan-400 ml-auto" /> : <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-all ml-auto" />}
                  </td>
                </tr>
                {expandedRow === finding.id && (
                  <tr>
                    <td colSpan={5} className="bg-slate-950/20 border-l-4 border-cyan-500 animate-in slide-in-from-top-4 duration-500 p-0">
                       <div className="px-12 py-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                          <div className="space-y-6">
                             <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="w-4 h-4 text-cyan-500" />
                                Analysis & Compliance Matrix
                             </h5>
                             <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                Detected through active VPC-Flow-Log heuristics and security group ingress/egress analysis. 
                                This configuration creates a vulnerability window consistent with AWS security standard V-8821.
                             </p>
                             <div className="flex items-center gap-6 text-[10px] text-slate-600 font-mono">
                                <span>IDENT: {finding.id}</span>
                                <span>•</span>
                                <span>SCAN_REF: {new Date(finding.lastScanned).toLocaleDateString()}</span>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <h5 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Wand2 className="w-4 h-4" />
                                Prescribed Intelligent Remediation
                             </h5>
                             <div className="bg-slate-900/60 p-6 rounded-2xl border border-cyan-500/10 italic text-sm text-slate-100 font-medium leading-relaxed shadow-inner">
                                "{finding.recommendation}"
                             </div>
                             <div className="flex gap-4 pt-2">
                                <button 
                                  onClick={() => handleGenerateClick(finding)}
                                  disabled={generatingFor === finding.id}
                                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all shadow-lg disabled:opacity-50"
                                >
                                  {generatingFor === finding.id ? 'Analyzing...' : 'Generate Terraform'}
                                </button>
                                <button className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-500/10 font-black">Execute Remediation</button>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityTable;
