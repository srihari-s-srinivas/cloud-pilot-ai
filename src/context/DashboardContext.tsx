import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';

/**
 * DashboardContext for managing scan state and global data
 */
interface DashboardContextType {
  summary: any;
  findings: any[];
  optimizations: any[];
  recommendations: any[];
  scans: any[];
  topology: any[];
  resources: any[];
  auditLogs: any[];
  notifications: any[];
  terraformHistory: any[];
  executiveReport: any | null;
  cloudAccount: { connected: boolean; status?: string; region?: string; selectedServices?: string[]; accountId?: string; lastScan?: string } | null;
  loading: boolean;
  isScanning: boolean;
  scanStatus: string;
  scanProgress: { progress: number; step: string };
  runScan: () => Promise<void>;
  updateCloudAccount: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  generateReport: () => Promise<void>;
  lastScanTime: string | null;
  cancelScanOverlay: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<any>({
    ec2Count: 0,
    s3Count: 0,
    iamCount: 0,
    monthlyCost: '$0.00',
    potentialSavings: '$0.00',
    healthScore: 0,
    riskScore: 0,
    riskLevel: 'None',
    costData: []
  });
  const [findings, setFindings] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [scans, setScans] = useState([]);
  const [topology, setTopology] = useState([]);
  const [resources, setResources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [terraformHistory, setTerraformHistory] = useState([]);
  const [executiveReport, setExecutiveReport] = useState(null);
  const [cloudAccount, setCloudAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanProgress, setScanProgress] = useState({ progress: 0, step: '' });
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const endpoints = [
        { key: 'summary', url: '/dashboard/summary' },
        { key: 'findings', url: '/security/findings' },
        { key: 'optimizations', url: '/optimization/savings' },
        { key: 'recommendations', url: '/ai/recommendations' },
        { key: 'scans', url: '/scans/history' },
        { key: 'topology', url: '/topology' },
        { key: 'aws', url: '/aws/status' },
        { key: 'resources', url: '/resources' },
        { key: 'auditLogs', url: '/audit-logs' },
        { key: 'notifications', url: '/notifications' },
        { key: 'report', url: '/reports/executive' },
        { key: 'terraform', url: '/terraform/history' },
      ];

      const results = await Promise.allSettled(endpoints.map(e => api.get(e.url)));

      results.forEach((result, index) => {
        const endpoint = endpoints[index];
        if (result.status === 'fulfilled') {
          const data = result.value.data;
          switch (endpoint.key) {
            case 'summary': setSummary(data); break;
            case 'findings': setFindings(Array.isArray(data) ? data : []); break;
            case 'optimizations': setOptimizations(Array.isArray(data) ? data : []); break;
            case 'recommendations': setRecommendations(Array.isArray(data) ? data : []); break;
            case 'scans': setScans(Array.isArray(data) ? data : []); break;
            case 'topology': setTopology(Array.isArray(data) ? data : []); break;
            case 'aws': setCloudAccount(data); break;
            case 'resources': setResources(Array.isArray(data) ? data : []); break;
            case 'auditLogs': setAuditLogs(Array.isArray(data) ? data : []); break;
            case 'notifications': setNotifications(Array.isArray(data) ? data : []); break;
            case 'report': setExecutiveReport(data); break;
            case 'terraform': setTerraformHistory(Array.isArray(data) ? data : []); break;
          }
        } else {
          console.error(`Error fetching ${endpoint.url}:`, result.reason);
        }
      });

      setLastScanTime(new Date().toISOString());
    } catch (error) {
      console.error('Error in fetching dashboard data process:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cancelScanOverlay = () => {
    setIsScanning(false);
    setScanStatus('idle');
  };

  const runScan = async () => {
    setIsScanning(true);
    setScanStatus('running');
    setScanProgress({ progress: 0, step: 'Initializing scan...' });

    try {
      const startRes = await api.post('/scans/start');
      const scanId = startRes.data._id;

      // Poll for scan status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/scans/status/${scanId}`);
          const scan = statusRes.data;

          setScanProgress({ progress: scan.progress, step: scan.currentStep });
          setScanStatus(scan.status);

          if (scan.status === 'completed' || scan.status === 'failed') {
            clearInterval(pollInterval);
            setIsScanning(false);
            await fetchData();
          } else if (scan.status === 'timeout') {
            clearInterval(pollInterval);
            console.warn('[DashboardContext] Polling stopped on timeout status.');
          }
        } catch (error) {
          console.error('Error polling scan status:', error);
          clearInterval(pollInterval);
          setIsScanning(false);
          setScanStatus('failed');
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
      setScanStatus('failed');
    }
  };

  const generateReport = async () => {
    try {
      await api.post('/reports/generate');
      const repRes = await api.get('/reports/executive');
      setExecutiveReport(repRes.data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n as any)._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const updateCloudAccount = async () => {
    try {
      const res = await api.get('/aws/status');
      setCloudAccount(res.data);
    } catch (error) {
      console.error('Error updating AWS status:', error);
    }
  };

  return (
    <DashboardContext.Provider value={{ 
      summary, 
      findings, 
      optimizations, 
      recommendations, 
      scans,
      topology,
      resources,
      auditLogs,
      notifications,
      terraformHistory,
      executiveReport,
      cloudAccount,
      loading, 
      isScanning,
      scanStatus,
      scanProgress,
      runScan,
      updateCloudAccount,
      markNotificationRead,
      generateReport,
      lastScanTime,
      cancelScanOverlay
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
