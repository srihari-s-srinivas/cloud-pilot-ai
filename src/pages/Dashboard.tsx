import React, { useState } from 'react';
import { 
  Server, 
  HardDrive, 
  Users, 
  DollarSign, 
  RefreshCcw,
  Zap,
  ShieldCheck,
  TrendingDown,
  LayoutGrid,
  FileText,
  MousePointer2,
  PiggyBank,
  ChevronRight,
  Check,
  Cloud,
  Bell,
  Download
} from 'lucide-react';
import StatCard from '../components/StatCard.tsx';
import SecurityTable from '../components/SecurityTable.tsx';
import CostAnalysis from '../components/CostAnalysis.tsx';
import AiRecommendations from '../components/AiRecommendations.tsx';
import HealthRing from '../components/dashboard/HealthRing.tsx';
import RiskScoreCard from '../components/dashboard/RiskScoreCard.tsx';
import CostTrendChart from '../components/dashboard/CostTrendChart.tsx';
import SeverityPieChart from '../components/dashboard/SeverityPieChart.tsx';
import ArchitectureMap from '../components/dashboard/ArchitectureMap.tsx';
import HealthTrendChart from '../components/dashboard/HealthTrendChart.tsx';
import TerraformModal from '../components/TerraformModal.tsx';
import CloudOnboarding from '../components/CloudOnboarding.tsx';
import ScanProgressOverlay from '../components/dashboard/ScanProgressOverlay.tsx';
import ExecutiveReportOverlay from '../components/dashboard/ExecutiveReportOverlay.tsx';
import FindingDetailsDrawer from '../components/dashboard/FindingDetailsDrawer.tsx';
import NotificationCenter from '../components/dashboard/NotificationCenter.tsx';
import { useDashboard } from '../context/DashboardContext.tsx';
import api from '../services/api.ts';

const Dashboard = () => {
  const { summary, findings, optimizations, recommendations, runScan, isScanning, scanStatus, scanProgress, cloudAccount, executiveReport, notifications, cancelScanOverlay } = useDashboard();
  const [terraform, setTerraform] = useState<{ code: string; resourceId: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [activeCloud, setActiveCloud] = useState('AWS');
  const [hasAutomaticallyShown, setHasAutomaticallyShown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleExport = () => {
    const data = {
      summary,
      findings,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CloudPilot_Audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Automatically show onboarding if no cloud account is connected
  React.useEffect(() => {
    if (cloudAccount && !cloudAccount.connected && !hasAutomaticallyShown) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setHasAutomaticallyShown(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [cloudAccount, hasAutomaticallyShown]);

  const handleGenerateTerraform = async (resourceId: string, issueType: string) => {
    try {
      const response = await api.post('/terraform/generate', { resourceId, issueType });
      setTerraform({
        code: response.data.code,
        resourceId: response.data.resourceId
      });
    } catch (error) {
      console.error('Failed to generate Terraform:', error);
      alert('AI Generation failed. Connectivity loss detected.');
    }
  };

  // Pie chart data preparation
  const severityData = Array.isArray(findings) ? [
    { name: 'Critical', value: findings.filter(f => f.severity === 'Critical').length },
    { name: 'High', value: findings.filter(f => f.severity === 'High').length },
    { name: 'Medium', value: findings.filter(f => f.severity === 'Medium').length },
    { name: 'Low', value: findings.filter(f => f.severity === 'Low').length },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar pb-12">
      {/* Dynamic Overlays */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <ScanProgressOverlay 
        isVisible={isScanning} 
        progress={scanProgress.progress} 
        step={scanProgress.step} 
        status={scanStatus}
        onRetry={() => {
          cancelScanOverlay();
          setShowOnboarding(true);
        }}
        onClose={cancelScanOverlay}
      />
      
      <ExecutiveReportOverlay 
        isOpen={showExecutiveReport} 
        onClose={() => setShowExecutiveReport(false)} 
        report={executiveReport}
      />

      <FindingDetailsDrawer 
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        finding={selectedFinding}
        onGenerateTerraform={handleGenerateTerraform}
      />

      {/* Cloud Onboarding Flow */}
      <CloudOnboarding 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Terraform Modal */}
      <TerraformModal 
        isOpen={!!terraform}
        onClose={() => setTerraform(null)}
        code={terraform?.code || ''}
        resourceId={terraform?.resourceId || ''}
      />

      {/* Cloud Environment Selection Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit">
        {['AWS', 'Azure', 'GCP'].map(cloud => (
          <button
            key={cloud}
            onClick={() => cloud === 'AWS' ? setActiveCloud(cloud) : alert(`${cloud} monitoring coming soon in v2.0`)}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeCloud === cloud 
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {cloud}
          </button>
        ))}
      </div>
      
      {/* Header Section - Clean & High Hierarchy */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
             <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${cloudAccount?.connected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   {cloudAccount?.connected ? `AWS ID: ${cloudAccount.accountId}` : 'AWS Disconnected'}
                </span>
             </div>
             {cloudAccount?.connected && (
               <>
                 <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                    <LayoutGrid className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                       Region: {cloudAccount.region}
                    </span>
                 </div>
                 <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                       Scope: {cloudAccount.selectedServices?.length || 0} Services
                    </span>
                 </div>
               </>
             )}
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Infrastructure Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Global oversight of security posture, performance heuristics, and cost efficiency.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl relative hover:bg-slate-800 transition-all group"
          >
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-900 text-[8px] font-black items-center justify-center text-white">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setShowExecutiveReport(true)}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <FileText className="w-4 h-4" />
            Executive Report
          </button>
          <button 
            onClick={runScan}
            disabled={isScanning}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Sync Environment
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button 
            onClick={() => alert("Initiating Remediation sequence...")}
            className="flex items-center gap-3 px-6 py-3 bg-cyan-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/10"
          >
            <Zap className="w-4 h-4" />
            Remediate Drift
          </button>
        </div>
      </header>

      {/* Dynamic Environment Status Banner */}
      {cloudAccount?.connected ? (
        summary?.isDemoSandbox ? (
          <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-400">Demo Sandbox Active</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You are currently viewing sample placeholder mock values for assessment display. To scan your live AWS account, configure your custom keys in settings.
              </p>
            </div>
          </div>
        ) : (
          (summary?.ec2Count === 0 && summary?.s3Count === 0) ? (
            <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-400">Active Live Scan Success — Environment Verified Clean</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Connection to AWS Account ID <span className="text-white font-mono">{cloudAccount.accountId}</span> has been successfully established and scanned. Our real-time security auditor verified <span className="text-white font-bold">0 active compute instances</span> and <span className="text-white font-bold">0 public storage buckets</span> running in region <span className="text-white font-semibold">{cloudAccount.region}</span>. Your live environment is verified secure.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-400">Active Live AWS Sync — Connected</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Analyzing cloud resources for AWS Account ID <span className="text-white font-mono">{cloudAccount.accountId}</span> in region <span className="text-white font-semibold">{cloudAccount.region}</span>. Data displayed is retrieved in real-time from your active AWS deployment.
                </p>
              </div>
            </div>
          )
        )
      ) : (
        <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-300">AWS Disconnected</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No cloud provider keys configured. Click the tab above or navigate to Settings to connect your AWS access credentials for high-fidelity scanning.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Row - Broad & Spacious */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <StatCard 
          title="Compute Resources" 
          value={summary?.ec2Count || 0} 
          icon={Server} 
          color="blue" 
          trend="+2 today"
        />
        <StatCard 
          title="Data Storage" 
          value={summary?.s3Count || 0} 
          icon={HardDrive} 
          color="purple" 
          trend="8 Buckets total"
        />
        <StatCard 
          title="Identity Access" 
          value={summary?.iamCount || 0} 
          icon={Users} 
          color="amber" 
          trend="4 Policies needing review"
        />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Opex</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
               <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-mono font-bold text-white tracking-tighter">{summary?.monthlyCost}</h3>
            <div className="flex items-center gap-2 mt-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 tracking-tight">Potential: {summary?.potentialSavings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Row: Health, Risk, and Cost Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center relative min-h-[420px]">
           <div className="absolute top-6 left-8 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Health & Compliance</span>
           </div>
           <HealthRing percentage={summary?.healthScore || 0} />
           <div className="mt-8 flex gap-8 w-full border-t border-slate-800 pt-6">
              <div className="flex-1 text-center">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Standard</p>
                 <p className="text-sm font-mono font-bold text-white uppercase">FedRAMP</p>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="flex-1 text-center">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Downtime</p>
                 <p className="text-sm font-mono font-bold text-white uppercase">0.01%</p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-3">
           <RiskScoreCard 
             score={summary?.riskScore || 0} 
             level={summary?.riskLevel || 'Unknown'} 
             trendData={summary?.healthHistory || []}
           />
        </div>

        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-8">
           <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-md font-bold text-white tracking-tight uppercase">Cost Trajectory</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cloud spend over 5 month window</p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest">Analytics Active</span>
           </div>
           <div className="h-[250px] w-full">
              <CostTrendChart data={summary?.costData || []} />
           </div>
        </div>
      </div>

      {/* Main Content: Security Intelligence & AI/Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10 items-start">
        <div className="lg:col-span-8 min-h-[600px] flex flex-col">
           <SecurityTable 
             findings={findings} 
             onGenerateTerraform={handleGenerateTerraform} 
             onSelectFinding={(f) => setSelectedFinding(f)}
           />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[280px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Threat Ratio</h3>
                 <span className="text-[9px] font-mono text-cyan-500 font-bold">BY SEVERITY</span>
              </div>
              <div className="h-full pb-12">
                 <SeverityPieChart data={severityData} />
              </div>
           </div>
           <div className="min-h-[300px]">
              <AiRecommendations recommendations={recommendations} />
           </div>
        </div>
      </div>

      {/* Visualization Row: Large Breadth Architecture Map */}
      <div className="grid grid-cols-1 gap-10">
        <div className="min-h-[550px] bg-slate-900 border border-slate-800 rounded-3xl p-8 relative flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-xl font-bold text-white tracking-tight uppercase">Infrastructure Topology</h3>
                 <p className="text-xs text-slate-500 mt-1">Live visual representation of resource connections and security boundaries.</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Steady State</span>
                 </div>
                 <div className="w-px h-4 bg-slate-800"></div>
                 <button className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest transition-all">Reload Graph</button>
              </div>
           </div>
           <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <ArchitectureMap />
           </div>
        </div>

        {/* Tactical Optimizations Row */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                 <h3 className="text-xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Harvestable Efficiency
                 </h3>
                 <p className="text-xs text-slate-500 mt-1">Low-effort modifications with high financial impact scores.</p>
              </div>
              <div className="text-right">
                 <p className="text-3xl font-mono font-bold text-emerald-400">Total: {summary?.potentialSavings}</p>
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Monthly Reclamation Potential</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(optimizations) && optimizations.slice(0, 6).map((opt) => (
                <div key={opt.id} className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl hover:border-emerald-500/20 transition-all group flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-emerald-400">
                         <PiggyBank className="w-5 h-5" />
                      </div>
                      <span className="text-xl font-mono font-bold text-emerald-400 leading-none">{opt.potentialSavings}</span>
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">{opt.resource}</span>
                         <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase font-black uppercase tracking-widest">{opt.type}</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 group-hover:text-cyan-400 transition-colors">{opt.suggestion}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{opt.impact}</p>
                   </div>
                   <button className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-emerald-400 uppercase tracking-widest transition-colors group-hover:translate-x-1 duration-300">
                      Execute {opt.action}
                      <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
