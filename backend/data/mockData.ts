export const mockSummary = {
  ec2Count: 18,
  s3Count: 12,
  iamCount: 32,
  monthlyCost: '$1,450.80',
  costTrend: '+14%',
  regionsActive: 4,
  healthScore: 82,
  riskScore: 78,
  riskLevel: 'High',
  aiConfidence: 91,
  potentialSavings: '$380.20',
  costData: [
    { month: 'Jan', cost: 1100 },
    { month: 'Feb', cost: 1250 },
    { month: 'Mar', cost: 1400 },
    { month: 'Apr', cost: 1320 },
    { month: 'May', cost: 1450 },
  ],
  healthHistory: [
    { time: '10:00', value: 88 },
    { time: '11:00', value: 85 },
    { time: '12:00', value: 82 },
    { time: '13:00', value: 79 },
    { time: '14:00', value: 81 },
    { time: '15:00', value: 84 },
    { time: '16:00', value: 82 },
  ]
};

export const mockSecurityFindings = [
  {
    id: 'SEC-001',
    resource: 'sg-0a2b3c4d5',
    resourceType: 'Security Group',
    issue: 'Open Port 22 (SSH) to Everyone',
    severity: 'Critical',
    impact: 'Instance is vulnerable to brute-force attacks and unauthorized access from any internet-connected device.',
    recommendation: 'Modify the security group to only allow SSH traffic from specific CIDR blocks or your VPN gateway.',
    category: 'Network',
    status: 'Open',
    lastScanned: new Date().toISOString()
  },
  {
    id: 'SEC-002',
    resource: 's3-bucket-financial-prod',
    resourceType: 'S3 Bucket',
    issue: 'S3 Bucket is Publicly Accessible',
    severity: 'Critical',
    impact: 'Unauthenticated users can read sensitive production financial data stored in this bucket.',
    recommendation: 'Enable Block Public Access at the bucket level and audit permissions.',
    category: 'Storage',
    status: 'Open',
    lastScanned: new Date().toISOString()
  },
  {
    id: 'SEC-003',
    resource: 'iam-user-dev-test',
    resourceType: 'IAM User',
    issue: 'AdministratorAccess policy attached directly to user',
    severity: 'High',
    impact: 'Violates principle of least privilege. Compromise of this user provides full account control.',
    recommendation: 'Remove direct policy attachment and use IAM groups with constrained policies.',
    category: 'IAM',
    status: 'Open',
    lastScanned: new Date().toISOString()
  },
  {
    id: 'SEC-004',
    resource: 'ebs-vol-0e5f6g7h8',
    resourceType: 'EBS Volume',
    issue: 'Unencrypted EBS Volume',
    severity: 'Medium',
    impact: 'Data at rest is not encrypted, potentially violating compliance standards like SOC2 or HIPAA.',
    recommendation: 'Take a snapshot and re-create the volume with encryption enabled.',
    category: 'Data',
    status: 'Resolved',
    lastScanned: new Date().toISOString()
  }
];

export const mockOptimizations = [
  {
    id: 'OPT-101',
    resource: 'i-09f8e7d6c',
    suggestion: 'Idle EC2 Instance Detected',
    potentialSavings: '$120.00',
    action: 'Stop or Terminate',
    priority: 'High',
    type: 'EC2',
    impact: 'CPU utilization has been below 2% for the last 14 days.'
  },
  {
    id: 'OPT-102',
    resource: 'vol-1a2b3c4d',
    suggestion: 'Unattached EBS Volume',
    potentialSavings: '$35.40',
    action: 'Delete Volume',
    priority: 'Medium',
    type: 'EBS',
    impact: 'Standard-tier volume taking up storage space without being mounted to any instance.'
  },
  {
    id: 'OPT-103',
    resource: 'eip-prod-frontend',
    suggestion: 'Unused Elastic IP',
    potentialSavings: '$4.50',
    action: 'Release IP',
    priority: 'Low',
    type: 'Networking',
    impact: 'Allocated public IP that is not currently associated with any resource.'
  }
];

export const mockAiRecommendations = [
  {
    id: 'AI-001',
    title: 'Rightsizing EC2 Fleet',
    content: 'Our ML model analysis shows that 4 production nodes in web-cluster-alpha are consistently utilizing less than 30% RAM. Switching from t3.large to t3.medium will maintain performance while cutting costs by 50%.',
    confidence: 96,
    category: 'Cost',
    priority: 'High'
  },
  {
    id: 'AI-002',
    title: 'S3 Intelligent-Tiering',
    content: 'Detected irregular access patterns on s3-bucket-logs. Implementing Intelligent-Tiering will automatically move inactive logs to cold storage, saving approx $85/month.',
    confidence: 92,
    category: 'Storage',
    priority: 'Medium'
  }
];

export const mockScansHistory = [
  { id: 'scan-1705', timestamp: '2024-05-17T10:00:00Z', status: 'Completed', findingsCount: 3 },
  { id: 'scan-1704', timestamp: '2024-05-16T15:30:00Z', status: 'Completed', findingsCount: 7 },
  { id: 'scan-1703', timestamp: '2024-05-15T09:15:00Z', status: 'Completed', findingsCount: 4 },
  { id: 'scan-1702', timestamp: '2024-05-14T22:45:00Z', status: 'Failed', findingsCount: 0 },
];

export const mockTopology = [
  { id: 'gw', icon: 'Globe', label: 'Edge Gateway', x: 10, y: 50, color: 'text-cyan-400', status: 'Active' },
  { id: 'alb', icon: 'Activity', label: 'App Load Balancer', x: 30, y: 50, color: 'text-blue-400', status: 'Active' },
  { id: 'ec2-a', icon: 'Server', label: 'Web-Node-01', x: 55, y: 30, color: 'text-emerald-400', status: 'Healthy' },
  { id: 'ec2-b', icon: 'Server', label: 'Web-Node-02', x: 55, y: 70, color: 'text-emerald-400', status: 'Healthy' },
  { id: 'rds', icon: 'Database', label: 'Aurora Cluster', x: 80, y: 50, color: 'text-indigo-400', status: 'Healthy' },
];
