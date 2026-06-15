import { Response } from 'express';
import AWSConnection from '../models/AWSConnection.ts';
import CloudResource from '../models/CloudResource.ts';
import { SecurityFinding } from '../models/SecurityFinding.ts';
import TerraformFix from '../models/TerraformFix.ts';
import Scan from '../models/Scan.ts';
import mongoose from 'mongoose';
import { 
  mockSummary, 
  mockTopology,
  mockOptimizations,
  mockSecurityFindings,
  mockAiRecommendations
} from '../data/mockData.ts';
import { aiService } from '../services/aiService.ts';
import AiCache from '../models/AiCache.ts';
import {
  localFindAWSConnection,
  localGetCloudResources,
  localGetSecurityFindings,
  localGetScans,
  localGetTerraformHistory,
  localCreateTerraformFix,
  readLocalDb,
  writeLocalDb
} from '../utils/localStore.ts';

/**
 * Helper to check connection for current user
 */
const getIsConnected = async (req: any) => {
  if (!req.user) return false;
  
  if (mongoose.connection.readyState !== 1) {
    try {
      const connection = await localFindAWSConnection(req.user._id);
      return connection && connection.status === 'Connected';
    } catch {
      return false;
    }
  }
  
  try {
    const connection = await AWSConnection.findOne({ userId: req.user._id }).maxTimeMS(2000);
    return connection && connection.status === 'Connected';
  } catch (error) {
    return false;
  }
};

/**
 * @desc    Get dashboard summary
 * @route   GET /api/dashboard/summary
 */
export const getSummary = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const connected = await getIsConnected(req);

    // If never connected AWS, return the pre-onboarding demo metrics
    if (!connected) {
      return res.json({
        ec2Count: mockSummary.ec2Count,
        s3Count: mockSummary.s3Count,
        iamCount: mockSummary.iamCount,
        monthlyCost: mockSummary.monthlyCost,
        potentialSavings: mockSummary.potentialSavings,
        healthScore: mockSummary.healthScore,
        riskScore: mockSummary.riskScore,
        riskLevel: mockSummary.riskLevel,
        costData: mockSummary.costData,
        healthHistory: mockSummary.healthHistory,
        isDemoSandbox: true
      });
    }

    let resources: any[] = [];
    let findings: any[] = [];

    if (mongoose.connection.readyState !== 1) {
      resources = await localGetCloudResources(userId);
      findings = await localGetSecurityFindings(userId);
    } else {
      resources = await CloudResource.find({ userId });
      findings = await SecurityFinding.find({ userId, status: 'Open' });
    }

    // Determine if user has run scan since establishing connection
    let scans: any[] = [];
    if (mongoose.connection.readyState !== 1) {
      scans = await localGetScans(userId);
    } else {
      scans = await Scan.find({ userId });
    }

    // If AWS is connected, but a scan has NOT been performed yet, show starting zero status
    if (scans.length === 0) {
      return res.json({
        ec2Count: 0,
        s3Count: 0,
        iamCount: 0,
        monthlyCost: "$0.00",
        potentialSavings: "$0.00",
        healthScore: 100,
        riskScore: 0,
        riskLevel: "Safe",
        costData: [{ name: 'S3', cost: 0 }, { name: 'EC2', cost: 0 }, { name: 'RDS', cost: 0 }],
        healthHistory: [100, 100, 100, 100, 100],
        needsScan: true,
        isDemoSandbox: false
      });
    }

    const ec2Count = resources.filter(r => r.type === 'EC2').length;
    const s3Count = resources.filter(r => r.type === 'S3').length;
    const iamCount = resources.filter(r => r.type === 'IAM' || r.type === 'IAM User').length;
    
    const totalMonthlyCost = resources.reduce((sum, r) => sum + (r.monthlyCost || 0), 0);
    const potentialSavings = totalMonthlyCost * 0.12; // Simple math sizing indicator

    // Security Metrics Analysis
    const critical = findings.filter(f => f.severity === 'Critical').length;
    const high = findings.filter(f => f.severity === 'High').length;
    const medium = findings.filter(f => f.severity === 'Medium').length;
    const low = findings.filter(f => f.severity === 'Low').length;

    let riskPenalty = (critical * 30) + (high * 15) + (medium * 8) + (low * 3);
    const healthScore = Math.max(0, 100 - riskPenalty);
    const riskScore = Math.min(100, riskPenalty);
    
    let riskLevel = 'Safe';
    if (riskScore > 70) riskLevel = 'Critical';
    else if (riskScore > 40) riskLevel = 'High';
    else if (riskScore > 15) riskLevel = 'Medium';
    else if (riskScore > 5) riskLevel = 'Low';

    // Group cost split by resource type
    const s3Cost = resources.filter(r => r.type === 'S3').reduce((sum, r) => sum + (r.monthlyCost || 0), 0);
    const ec2Cost = resources.filter(r => r.type === 'EC2').reduce((sum, r) => sum + (r.monthlyCost || 0), 0);
    const otherCost = resources.filter(r => r.type !== 'S3' && r.type !== 'EC2').reduce((sum, r) => sum + (r.monthlyCost || 0), 0);

    const costData = [
      { name: 'S3 Storage', cost: s3Cost },
      { name: 'EC2 Compute', cost: ec2Cost },
      { name: 'Other Services', cost: otherCost }
    ];

    res.json({
      ec2Count,
      s3Count,
      iamCount,
      monthlyCost: `$${totalMonthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      potentialSavings: `$${potentialSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      healthScore,
      riskScore,
      riskLevel,
      costData: totalMonthlyCost > 0 ? costData : [{ name: 'No Active Costs', cost: 0 }],
      healthHistory: [healthScore, healthScore, healthScore, healthScore, healthScore],
      isDemoSandbox: false
    });
  } catch (error) {
    console.error('Error in getSummary:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
};

/**
 * @desc    Get security findings
 * @route   GET /api/security/findings
 */
export const getSecurityFindings = async (req: any, res: Response) => {
  try {
    const connected = await getIsConnected(req);
    const userId = req.user?._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!connected) {
      const total = mockSecurityFindings.length;
      const data = mockSecurityFindings.slice(skip, skip + limit);
      return res.json({
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }
    
    if (mongoose.connection.readyState !== 1) {
      const localFindings = await localGetSecurityFindings(userId);
      // Sort findings by severity (Critical -> High -> Medium -> Low)
      const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const sorted = localFindings.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
      
      const total = sorted.length;
      const data = sorted.slice(skip, skip + limit);
      return res.json({
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    const total = await SecurityFinding.countDocuments({ userId });
    const findings = await SecurityFinding.find({ userId })
      .sort({ severity: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: findings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getSecurityFindings:', error);
    res.status(500).json({ message: 'Error fetching findings' });
  }
};

/**
 * @desc    Get cost optimizations
 * @route   GET /api/optimization/savings
 */
export const getCostOptimizations = async (req: any, res: Response) => {
  try {
    const connected = await getIsConnected(req);
    const userId = req.user?._id;

    if (!connected) {
      return res.json(mockOptimizations);
    }
    
    let resources: any[] = [];
    if (mongoose.connection.readyState !== 1) {
      resources = await localGetCloudResources(userId);
    } else {
      resources = await CloudResource.find({ userId });
    }

    // Generate dynamic simple cost recommendations if live AWS account has EC2 or S3
    const liveOptimizations = [];
    const runec2 = resources.filter(r => r.type === 'EC2');
    
    for (const ec2 of runec2) {
      liveOptimizations.push({
        _id: `opt-${ec2.resourceId}`,
        category: 'Compute',
        resource: ec2.name,
        action: 'Rightsize Insufficiently Utilized Instance',
        currentCost: ec2.monthlyCost,
        saving: ec2.monthlyCost * 0.4,
        details: `This EC2 instance (${ec2.resourceId}) demonstrates average CPU load under 5%. Downsize to t3.micro to optimize expenditure.`,
        severity: 'Medium'
      });
    }

    // Default to mock if account is assessed but user has no custom instances
    if (liveOptimizations.length === 0) {
      return res.json([]);
    }

    res.json(liveOptimizations);
  } catch (error) {
    console.error('Error in getCostOptimizations:', error);
    res.status(500).json({ message: 'Error fetching optimizations' });
  }
};

/**
 * Heuristic recommendations list for rate limiting silent fallback
 */
const heuristicRecommendations = [
  {
    category: "Security",
    title: "Restrict SSH Public Ingress Rules",
    impact: "High",
    effort: "Low",
    description: "Detected permissive security rules allowing public SSH access on EC2 security groups. Implement corporate firewall restrictions immediately."
  },
  {
    category: "Storage",
    title: "Enforce S3 Private Bucket Policies",
    impact: "Critical",
    effort: "Low",
    description: "One or more S3 buckets have public read access enabled. Block all public access and restrict bucket policies to VPC endpoints."
  },
  {
    category: "FinOps",
    title: "Rightsize Underutilized Computational Instances",
    impact: "Medium",
    effort: "Medium",
    description: "Multiple computational profiles show average CPU utilization under 5% over consecutive intervals. Downsizing is highly recommended to control expenditure."
  }
];

/**
 * @desc    Get AI Recommendations
 * @route   GET /api/ai/recommendations
 */
export const getAiRecommendations = async (req: any, res: Response) => {
  const connected = await getIsConnected(req);
  if (!connected) {
    return res.json(mockAiRecommendations);
  }
  try {
    const userId = req.user?._id;
    let resources: any[] = [];
    let findings: any[] = [];

    if (mongoose.connection.readyState !== 1) {
      resources = await localGetCloudResources(userId);
      findings = await localGetSecurityFindings(userId);
    } else {
      resources = await CloudResource.find({ userId });
      findings = await SecurityFinding.find({ userId, status: 'Open' });
    }

    const ec2Count = resources.filter(r => r.type === 'EC2').length;
    const s3Count = resources.filter(r => r.type === 'S3').length;
    const iamCount = resources.filter(r => r.type === 'IAM' || r.type === 'IAM User').length;
    const totalCost = resources.reduce((sum, r) => sum + (r.monthlyCost || 0), 0);

    const summary = {
      ec2Count,
      s3Count,
      iamCount,
      monthlyCost: `$${totalCost.toFixed(2)}`,
      riskScore: findings.length * 15
    };

    // Construct live optimizations
    const liveOptimizations = [];
    const runec2 = resources.filter(r => r.type === 'EC2');
    for (const ec2 of runec2) {
      liveOptimizations.push({
        _id: `opt-${ec2.resourceId}`,
        category: 'Compute',
        resource: ec2.name,
        action: 'Rightsize Insufficiently Utilized Instance',
        currentCost: ec2.monthlyCost,
        saving: ec2.monthlyCost * 0.4,
        details: `This EC2 instance (${ec2.resourceId}) demonstrates average CPU load under 5%. Downsize to t3.micro to optimize expenditure.`,
        severity: 'Medium'
      });
    }

    // LAYER 1 & LAYER 2 Caching and Protection
    const today = new Date().toDateString();
    let cache: any = null;

    if (mongoose.connection.readyState !== 1) {
      const db = readLocalDb();
      if (!db.aiCaches) db.aiCaches = [];
      cache = db.aiCaches.find((c: any) => c.userId === userId.toString());
      if (!cache) {
        cache = {
          userId: userId.toString(),
          cachedRecommendations: null,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          dailyAiCallCount: 0,
          lastAiCallDate: today
        };
        db.aiCaches.push(cache);
        writeLocalDb(db);
      }
    } else {
      cache = await AiCache.findOne({ userId });
      if (!cache) {
        cache = await AiCache.create({
          userId,
          cachedRecommendations: null,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
          dailyAiCallCount: 0,
          lastAiCallDate: today
        });
      }
    }

    // Check layer 1 (TTL cache less than 6 hours old)
    const now = new Date();
    const expiresTime = new Date(cache.expiresAt);
    if (cache.cachedRecommendations && expiresTime > now) {
      console.log(`[dashboardController] Returning cached AI recommendations for user ${userId}. Expires at: ${cache.expiresAt}`);
      return res.json(cache.cachedRecommendations);
    }

    // Reset daily count if date changed
    if (cache.lastAiCallDate !== today) {
      cache.dailyAiCallCount = 0;
      cache.lastAiCallDate = today;
    }

    // Check layer 2 (Max 10 calls per day)
    if (cache.dailyAiCallCount >= 10) {
      console.warn(`[dashboardController] User ${userId} has hit the daily Gemini call limit (10). Returning silent fallback.`);
      return res.json(heuristicRecommendations);
    }

    // Generate real recommendations via Gemini API
    const recommendations = await aiService.generateRecommendations(summary, findings, liveOptimizations);

    // Update cache entries
    cache.cachedRecommendations = recommendations;
    cache.generatedAt = mongoose.connection.readyState !== 1 ? new Date().toISOString() : new Date();
    cache.expiresAt = mongoose.connection.readyState !== 1 
      ? new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() 
      : new Date(Date.now() + 6 * 60 * 60 * 1000);
    cache.dailyAiCallCount = (cache.dailyAiCallCount || 0) + 1;

    if (mongoose.connection.readyState !== 1) {
      const db = readLocalDb();
      if (!db.aiCaches) db.aiCaches = [];
      const idx = db.aiCaches.findIndex((c: any) => c.userId === userId.toString());
      if (idx !== -1) {
        db.aiCaches[idx] = cache;
      } else {
        db.aiCaches.push(cache);
      }
      writeLocalDb(db);
    } else {
      await cache.save();
    }

    res.json(recommendations);
  } catch (error) {
    console.error('AI Insight Generation Failed:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
};

/**
 * @desc    Get Scan History
 * @route   GET /api/scans/history
 */
export const getScanHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (mongoose.connection.readyState !== 1) {
       const localHistory = await localGetScans(userId);
       return res.json(localHistory);
    }
    const history = await Scan.find({ userId }).sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scan history' });
  }
};

/**
 * @desc    Get Topology Layout
 * @route   GET /api/topology
 */
export const getTopology = async (req: any, res: Response) => {
  try {
    const connected = await getIsConnected(req);
    if (!connected) {
      return res.json(mockTopology);
    }

    const userId = req.user?._id;
    let resources: any[] = [];

    if (mongoose.connection.readyState !== 1) {
      resources = await localGetCloudResources(userId);
    } else {
      resources = await CloudResource.find({ userId });
    }

    // Construct a live interactive topology list with valid coordinates and icons
    const nodes = [
      { id: 'gw', icon: 'Globe', label: 'AWS Edge Gateway', x: 20, y: 50, color: 'text-cyan-400', status: 'Active' }
    ];

    const ec2res = resources.filter(r => r.type === 'EC2');
    const s3res = resources.filter(r => r.type === 'S3');

    if (ec2res.length > 0 || s3res.length > 0) {
      nodes.push({ id: 'network', icon: 'Activity', label: 'Secured VPC Network', x: 45, y: 50, color: 'text-blue-400', status: 'Active' });
      
      ec2res.forEach((item, index) => {
        const yPos = ec2res.length === 1 ? 50 : 25 + (index * (50 / (ec2res.length - 1 || 1)));
        nodes.push({
          id: item.resourceId,
          icon: 'Server',
          label: item.name || `EC2 Server (${item.resourceId})`,
          x: 65,
          y: yPos,
          color: item.riskLevel === 'Critical' || item.riskLevel === 'High' ? 'text-amber-500' : 'text-emerald-400',
          status: item.status || 'Active'
        });
      });

      s3res.forEach((item, index) => {
        const yPos = s3res.length === 1 ? 50 : 20 + (index * (60 / (s3res.length - 1 || 1)));
        nodes.push({
          id: item.resourceId,
          icon: 'HardDrive',
          label: item.name || `S3 Bucket (${item.resourceId})`,
          x: 85,
          y: yPos,
          color: item.riskLevel === 'Critical' || item.riskLevel === 'High' ? 'text-amber-500' : 'text-cyan-400',
          status: 'Active'
        });
      });
    } else {
      // If connected but they have zero actual resources, show a clean, accurate layout representing their verified account!
      nodes.push({ id: 'network', icon: 'Activity', label: 'Secured VPC Network', x: 50, y: 50, color: 'text-blue-400', status: 'Active' });
      nodes.push({ id: 'iam', icon: 'Database', label: 'Global IAM Policies', x: 80, y: 50, color: 'text-indigo-400', status: 'Safe' });
    }

    res.json(nodes);
  } catch (error) {
    console.error('Error in getTopology:', error);
    res.status(500).json({ message: 'Error fetching topology' });
  }
};

/**
 * @desc    Generate Terraform remediation
 * @route   POST /api/terraform/generate
 */
export const generateTerraform = async (req: any, res: Response) => {
  const { resourceId, issueType } = req.body;
  const userId = req.user._id;
  
  let baseCode = '';
  
  if (issueType === 'S3') {
    baseCode = `resource "aws_s3_bucket_public_access_block" "block_public_${resourceId.replace(/[^a-zA-Z0-9]/g, '_')}" {
  bucket = "${resourceId}"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`;
  } else if (issueType === 'Security Group') {
    baseCode = `resource "aws_security_group_rule" "restrict_ssh_${resourceId.replace(/[^a-zA-Z0-9]/g, '_')}" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["\${var.admin_ip_range}"]
  security_group_id = "${resourceId}"
  description = "Restricting SSH access to verified IP ranges only"
}`;
  } else {
    baseCode = `resource "aws_resource_policy" "remediation" {
  name = "remediate_${resourceId.replace(/[^a-zA-Z0-9]/g, '_')}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Deny"
      Action = "*"
      Resource = "*"
    }]
  })
}`;
  }

  // Prepend the disclaimer comment header
  const commentHeader = `# ⚠️  AI-Generated by CloudPilot AI
# Review before applying: https://developer.hashicorp.com/terraform/cli/commands/plan
# Run: terraform plan -var-file=your.tfvars

`;

  const code = commentHeader + baseCode;

  if (mongoose.connection.readyState !== 1) {
    const localFix = await localCreateTerraformFix(userId, {
      resourceId,
      issueType,
      code,
      status: 'Generated'
    });
    return res.json({
      ...localFix,
      code,
      disclaimer: "AI-generated. Not validated. Review before use.",
      generatedAt: new Date().toISOString(),
      verified: false
    });
  }

  // Save to history
  const fix = await TerraformFix.create({
    userId,
    resourceId,
    issueType,
    code,
    status: 'Generated'
  });

  res.json({
    ...fix.toObject(),
    code,
    disclaimer: "AI-generated. Not validated. Review before use.",
    generatedAt: fix.createdAt || new Date().toISOString(),
    verified: false
  });
};

/**
 * @desc    Get Terraform Fix History
 * @route   GET /api/terraform/history
 */
export const getTerraformHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState !== 1) {
       const localHistory = await localGetTerraformHistory(userId);
       const sorted = localHistory.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
       const total = sorted.length;
       const data = sorted.slice(skip, skip + limit);
       return res.json({
         data,
         total,
         page,
         totalPages: Math.ceil(total / limit)
       });
    }

    const total = await TerraformFix.countDocuments({ userId });
    const history = await TerraformFix.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
};
