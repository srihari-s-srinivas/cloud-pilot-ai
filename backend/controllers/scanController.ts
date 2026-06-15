import mongoose from 'mongoose';
import { Response } from 'express';
import Scan from '../models/Scan.ts';
import AuditLog from '../models/AuditLog.ts';
import Notification from '../models/Notification.ts';
import CloudResource from '../models/CloudResource.ts';
import AWSConnection from '../models/AWSConnection.ts';
import { SecurityFinding } from '../models/SecurityFinding.ts';
import { scanActionLiveAWS } from '../utils/awsScanner.ts';
import { decryptSecret } from '../utils/crypto.ts';
import {
  localFindAWSConnection,
  localCreateScan,
  localFindScanById,
  localUpdateScan,
  localSaveMultipleResources,
  localSaveMultipleFindings,
  localCreateNotification,
  localCreateAuditLog,
  readLocalDb,
  writeLocalDb,
  localSaveAWSConnection
} from '../utils/localStore.ts';

/**
 * @desc    Start a new cloud scan
 * @route   POST /api/scans/start
 */
export const startScan = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState !== 1) {
       console.log('⚠️ db disconnected - utilizing local file storage structure for scanner service');
       const scan = await localCreateScan(userId, {
         status: 'running',
         progress: 0,
         currentStep: 'Starting Cloud Reconnaissance...',
         servicesScanned: []
       });

       await localCreateAuditLog(userId, {
         action: 'SCAN_STARTED',
         service: 'Security Scanner',
         details: `Manual scan ${scan._id} initiated in Local File DB.`,
         severity: 'Info',
       });

       res.status(201).json(scan);
       simulateScanProgress(scan._id.toString(), userId, true);
       return;
    }

    // Create a new scan record
    const scan = await Scan.create({
      userId,
      status: 'running',
      progress: 0,
      currentStep: 'Starting Cloud Reconnaissance...',
      servicesScanned: [],
    });

    // Create audit log
    await AuditLog.create({
      userId,
      action: 'SCAN_STARTED',
      service: 'Security Scanner',
      details: `Manual scan ${scan._id} initiated.`,
      severity: 'Info',
    });

    res.status(201).json(scan);

    // Simulation logic (Background)
    simulateScanProgress(scan._id.toString(), userId, false);

  } catch (error: any) {
    console.error('[scanController][startScan]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get scan status
 * @route   GET /api/scans/status/:id
 */
export const getScanStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState !== 1) {
       const scan = await localFindScanById(req.params.id);
       if (!scan || scan.userId?.toString() !== userId.toString()) {
         return res.status(404).json({ message: 'Scan not found' });
       }
       return res.json(scan);
    }
    const scan = await Scan.findOne({ _id: req.params.id, userId });
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json(scan);
  } catch (error: any) {
    console.error('[scanController][getScanStatus]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Helper to simulate scan progress and trigger live audits at 100%
 */
const simulateScanProgress = async (scanId: string, userId: any, isLocalStore: boolean) => {
  const steps = [
    { progress: 10, step: 'Connecting to AWS endpoint & establishing auth...', service: 'IAM' },
    { progress: 20, step: 'Polling EC2 inventory listings...', service: 'EC2' },
    { progress: 30, step: 'Auditing S3 Bucket access logs...', service: 'S3' },
    { progress: 40, step: 'Inspecting active Security Group egress configs...', service: 'SG' },
    { progress: 50, step: 'Scanning RDS database instances & clusters...', service: 'RDS' },
    { progress: 65, step: 'Analyzing Lambda functions & permissions...', service: 'Lambda' },
    { progress: 80, step: 'Evaluating CloudFront distributions...', service: 'CloudFront' },
    { progress: 90, step: 'Executing real-time signature vulnerability queries...', service: 'AI' },
    { progress: 95, step: 'Packaging Terraform orchestration templates...', service: 'Terraform' },
    { progress: 100, step: 'Cloud Scan Assessment Completed', service: 'System' },
  ];

  for (const stepInfo of steps) {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    if (isLocalStore) {
      const scan = await localFindScanById(scanId);
      if (scan) {
        if (scan.status === 'timeout') {
          // If already timed out, abort simulation immediately
          return;
        }
        scan.progress = stepInfo.progress;
        scan.currentStep = stepInfo.step;
        if (stepInfo.service !== 'AI' && stepInfo.service !== 'System') {
          if (!scan.servicesScanned.includes(stepInfo.service)) {
            scan.servicesScanned.push(stepInfo.service);
          }
        }
        
        if (stepInfo.progress === 100) {
          // Generate realistic/live findings and data
          try {
            await generateScanResults(userId, true, scanId);
            
            const scanAfter = await localFindScanById(scanId);
            if (scanAfter && scanAfter.status !== 'timeout') {
              scanAfter.status = 'completed';
              scanAfter.completedAt = new Date().toISOString();

              const localFindings = (await readLocalDb()).securityFindings.filter((f: any) => f.userId === userId);
              const criticalCount = localFindings.filter((f: any) => f.severity === 'Critical').length;
              const highCount = localFindings.filter((f: any) => f.severity === 'High').length;
              const mediumCount = localFindings.filter((f: any) => f.severity === 'Medium').length;
              const lowCount = localFindings.filter((f: any) => f.severity === 'Low').length;

              scanAfter.findingsCount = { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount };

              await localCreateNotification(userId, {
                title: 'Scan Finished',
                message: `Cloud security scan finished. Found ${criticalCount} critical issues.`,
                type: 'scan',
                severity: criticalCount > 0 ? 'Critical' : 'Info'
              });

              await localCreateAuditLog(userId, {
                action: 'SCAN_COMPLETED',
                service: 'Security Scanner',
                details: `Scan ${scanId} finished in Local File DB. Found ${criticalCount} criticals.`,
                severity: 'Info',
              });
              await localUpdateScan(scanId, scanAfter);
            }
          } catch (e) {
            console.error("Local Scan Generation internal exception:", e);
          }
          return;
        }
        await localUpdateScan(scanId, scan);
      }
    } else {
      const scan = await Scan.findOne({ _id: scanId, userId });
      if (scan) {
        if (scan.status === 'timeout') {
          // If already timed out, abort simulation immediately
          return;
        }
        scan.progress = stepInfo.progress;
        scan.currentStep = stepInfo.step;
        if (stepInfo.service !== 'AI' && stepInfo.service !== 'System') {
          if (!scan.servicesScanned.includes(stepInfo.service)) {
            scan.servicesScanned.push(stepInfo.service);
          }
        }
        
        if (stepInfo.progress === 100) {
          // Generate realistic/live findings and data
          try {
            await generateScanResults(userId, false, scanId);
            
            const scanAfter = await Scan.findOne({ _id: scanId, userId });
            if (scanAfter && scanAfter.status !== 'timeout') {
              scanAfter.status = 'completed';
              scanAfter.completedAt = new Date();

              const criticalCount = await SecurityFinding.countDocuments({ userId, severity: 'Critical', status: 'Open' });
              const highCount = await SecurityFinding.countDocuments({ userId, severity: 'High', status: 'Open' });
              const mediumCount = await SecurityFinding.countDocuments({ userId, severity: 'Medium', status: 'Open' });
              const lowCount = await SecurityFinding.countDocuments({ userId, severity: 'Low', status: 'Open' });

              scanAfter.findingsCount = {
                critical: criticalCount,
                high: highCount,
                medium: mediumCount,
                low: lowCount,
              };

              // Create completion notification
              await Notification.create({
                userId,
                title: 'Scan Completed',
                message: `Cloud security scan finished. Found ${criticalCount} critical issues.`,
                type: 'scan',
                severity: criticalCount > 0 ? 'Critical' : 'Info',
              });

              // Create audit log
              await AuditLog.create({
                userId,
                action: 'SCAN_COMPLETED',
                service: 'Security Scanner',
                details: `Scan ${scanId} finished.`,
                severity: 'Info',
              });
              await scanAfter.save();
            }
          } catch (e) {
            console.error("Mongoose Scan Generation internal exception:", e);
          }
          return;
        }
        await scan.save();
      }
    }
  }
};

/**
 * Generate Scan Results in DB.
 * Transparently checks if user has entered real live credentials versus mock sandbox credentials,
 * and calls the correct SDK or falls back to clear demo models.
 */
const generateScanResults = async (userId: any, isLocalStore: boolean, scanId: string) => {
  let awsConnection: any = null;

  if (isLocalStore) {
    awsConnection = await localFindAWSConnection(userId);
  } else {
    awsConnection = await AWSConnection.findOne({ userId }).maxTimeMS(2000);
  }

  const hasConnection = !!awsConnection;
  const isMockDemo = !hasConnection || 
                     awsConnection.accessKeyId?.includes('DEMO') || 
                     awsConnection.accessKeyId?.includes('TEST') || 
                     awsConnection.accessKeyId?.startsWith('AKIAIOSF');

  const selectedServices = awsConnection?.selectedServices;

  if (isMockDemo) {
    console.log(`ℹ️ Mock/Demo Onboarding matches keys. Populating high-fidelity sandbox values for userId ${userId}.`);
    
    const resourceTemplates = [
      { name: 'prod-api-v1', type: 'EC2', region: 'us-east-1', monthlyCost: 145.50, status: 'active', riskLevel: 'Safe' },
      { name: 'prod-frontend-nodes', type: 'EC2', region: 'us-east-1', monthlyCost: 210.00, status: 'active', riskLevel: 'Safe' },
      { name: 'financial-records-prod', type: 'S3', region: 'us-east-1', monthlyCost: 85.20, status: 'active', riskLevel: 'Safe' },
      { name: 'backup-vault-seirra', type: 'S3', region: 'us-west-2', monthlyCost: 42.10, status: 'active', riskLevel: 'Safe' },
      { name: 'admin-access-role', type: 'IAM', region: 'Global', monthlyCost: 0, status: 'active', riskLevel: 'Safe' },
      { name: 'user-data-db', type: 'RDS', region: 'us-east-1', monthlyCost: 320.00, status: 'available', riskLevel: 'Safe' },
      { name: 'analytics-cluster', type: 'RDS', region: 'us-east-1', monthlyCost: 450.00, status: 'available', riskLevel: 'Safe' },
      { name: 'api-processor-lambda', type: 'Lambda', region: 'us-east-1', monthlyCost: 12.50, status: 'Active', riskLevel: 'Safe' },
      { name: 'data-transformer', type: 'Lambda', region: 'us-east-1', monthlyCost: 8.75, status: 'Active', riskLevel: 'Safe' },
      { name: 'cdn-distribution-main', type: 'CloudFront', region: 'Global', monthlyCost: 145.00, status: 'Deployed', riskLevel: 'Safe' },
    ];

    const findingsTemplates = [
      {
        resource: 'sg-public-ingress',
        resourceType: 'Security Group',
        issue: 'Open Port 22 (SSH) to Internet',
        severity: 'Critical' as const,
        impact: 'Allows potential brute-force access to cloud instances from any untrusted IP.',
        recommendation: 'Strictly limit SSH ingress to known office IPs or VPN range.',
        category: 'Network',
        status: 'Open'
      },
      {
        resource: 's3-financial-prod',
        resourceType: 'S3 Bucket',
        issue: 'Public Read Access Enabled',
        severity: 'Critical' as const,
        impact: 'Sensitive data in the storage bucket is viewable by anyone without authentication.',
        recommendation: 'Enable S3 Block Public Access and audit bucket policies.',
        category: 'Storage',
        status: 'Open'
      },
      {
        resource: 'iam-overprivileged-user',
        resourceType: 'IAM User',
        issue: 'AdministratorAccess policy attached directly',
        severity: 'High' as const,
        impact: 'Violates least privilege principle. Compromise leads to total account takeover.',
        recommendation: 'Remove direct policy attachment and use IAM groups with constrained policies.',
        category: 'IAM',
        status: 'Open'
      },
      {
        resource: 'user-data-db',
        resourceType: 'RDS Instance',
        issue: 'Publicly Accessible Database',
        severity: 'High' as const,
        impact: 'Database is accessible from the internet, increasing exposure to unauthorized access attempts and data breaches.',
        recommendation: 'Set PubliclyAccessible to false and restrict access via security groups.',
        category: 'Security',
        status: 'Open'
      },
      {
        resource: 'analytics-cluster',
        resourceType: 'RDS Cluster',
        issue: 'Encryption Disabled',
        severity: 'High' as const,
        impact: 'Cluster data is stored unencrypted, exposing all databases in the cluster.',
        recommendation: 'Enable encryption at rest for the cluster.',
        category: 'Security',
        status: 'Open'
      },
      {
        resource: 'api-processor-lambda',
        resourceType: 'Lambda Function',
        issue: 'Wildcard IAM Permissions Detected',
        severity: 'High' as const,
        impact: 'Lambda function has overly permissive IAM policies (Action: *), violating least privilege principle.',
        recommendation: 'Review and restrict resource policy to only required permissions.',
        category: 'Security',
        status: 'Open'
      },
      {
        resource: 'cdn-distribution-main',
        resourceType: 'CloudFront Distribution',
        issue: 'No HTTPS Redirect Policy',
        severity: 'Medium' as const,
        impact: 'Distribution allows HTTP traffic without automatic redirect to HTTPS, exposing data in transit.',
        recommendation: "Set viewer protocol policy to 'https-only' or 'redirect-to-https'.",
        category: 'Security',
        status: 'Open'
      }
    ];

    // Read selectedServices and filter resources or findings accordingly.
    // Default to showing zero resources and findings if awsConnection is null, selectedServices is undefined/empty
    let filteredResources: typeof resourceTemplates = [];
    let filteredFindings: typeof findingsTemplates = [];

    if (awsConnection && selectedServices && Array.isArray(selectedServices) && selectedServices.length > 0) {
      filteredResources = resourceTemplates.filter(rt => {
        if (rt.type === 'EC2') return selectedServices.includes('EC2');
        if (rt.type === 'S3') return selectedServices.includes('S3');
        if (rt.type === 'IAM') return selectedServices.includes('IAM User') || selectedServices.includes('IAM');
        if (rt.type === 'SG') return selectedServices.includes('Security Group') || selectedServices.includes('SG') || selectedServices.includes('Security Groups');
        if (rt.type === 'RDS') return selectedServices.includes('RDS');
        if (rt.type === 'Lambda') return selectedServices.includes('Lambda');
        if (rt.type === 'CloudFront') return selectedServices.includes('CloudFront');
        return false;
      });

      filteredFindings = findingsTemplates.filter(ft => {
        if (ft.resourceType === 'Security Group') return selectedServices.includes('SG') || selectedServices.includes('Security Group') || selectedServices.includes('Security Groups');
        if (ft.resourceType === 'S3 Bucket') return selectedServices.includes('S3') || selectedServices.includes('S3 Bucket');
        if (ft.resourceType === 'IAM User') return selectedServices.includes('IAM') || selectedServices.includes('IAM User');
        if (ft.resourceType === 'RDS Instance') return selectedServices.includes('RDS');
        if (ft.resourceType === 'RDS Cluster') return selectedServices.includes('RDS');
        if (ft.resourceType === 'Lambda Function') return selectedServices.includes('Lambda');
        if (ft.resourceType === 'CloudFront Distribution') return selectedServices.includes('CloudFront');
        return false;
      });
    }

    if (isLocalStore) {
      await localSaveMultipleResources(userId, filteredResources);
      await localSaveMultipleFindings(userId, filteredFindings);
    } else {
      await CloudResource.deleteMany({ userId });
      for (const rt of filteredResources) {
        await CloudResource.create({
          userId,
          resourceId: `${rt.type.toLowerCase()}-${Math.random().toString(36).substring(7)}`,
          name: rt.name,
          type: rt.type,
          region: rt.region,
          monthlyCost: rt.monthlyCost,
          status: rt.status,
          riskLevel: rt.riskLevel as any
        } as any);
      }
      await SecurityFinding.deleteMany({ userId });
      for (const ft of filteredFindings) {
        await SecurityFinding.create({
          userId,
          resource: ft.resource,
          resourceType: ft.resourceType,
          issue: ft.issue,
          severity: ft.severity as any,
          impact: ft.impact,
          recommendation: ft.recommendation,
          category: ft.category,
          status: ft.status as any
        } as any);
      }
    }
  } else {
    // REAL LIVE AWS SCANNING
    console.log(`🚀 REAL AWS KEY CONFIGURATION DETECTED: scanning AWS profile on behalf of ${userId}.`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`[scanController] AWS scan for user ${userId} timed out after 5 minutes.`);
    }, 5 * 60 * 1000); // 5 minutes timeout

    try {
      // Decode Secret Key prior to scan action - fix for plain text storage requirement
      const decryptedSecret = decryptSecret(awsConnection.secretAccessKey);

      const scanned = await scanActionLiveAWS(
        awsConnection.accessKeyId,
        decryptedSecret,
        awsConnection.region,
        awsConnection.selectedServices,
        controller.signal
      );

      if (isLocalStore) {
        await localSaveMultipleResources(userId, scanned.resources);
        await localSaveMultipleFindings(userId, scanned.findings);
        awsConnection.accountId = scanned.accountId;
        await localSaveAWSConnection(userId, awsConnection);
      } else {
        await CloudResource.deleteMany({ userId });
        for (const r of scanned.resources) {
          await CloudResource.create({ userId, ...r } as any);
        }
        await SecurityFinding.deleteMany({ userId });
        for (const f of scanned.findings) {
          await SecurityFinding.create({ userId, ...f } as any);
        }
        awsConnection.accountId = scanned.accountId;
        await awsConnection.save();
      }

      console.log(`Scan completed successfully. Found ${scanned.resources.length} active live resources and ${scanned.findings.length} live issues.`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error("CRITICAL Live AWS Assessment Timeout Error:", err);
        if (isLocalStore) {
          const scanObj = await localFindScanById(scanId);
          if (scanObj) {
            scanObj.status = 'timeout';
            scanObj.currentStep = 'AWS scan took too long and timed out. If you have a large infrastructure, please contact support or adjust selected services.';
            await localUpdateScan(scanId, scanObj);
          }
        } else {
          await Scan.updateOne(
            { _id: scanId },
            { 
              status: 'timeout', 
              currentStep: 'AWS scan took too long and timed out. If you have a large infrastructure, please contact support or adjust selected services.' 
            }
          );
        }
      } else {
        console.error("CRITICAL Live AWS Assessment Error:", err);
        if (isLocalStore) {
          await localCreateNotification(userId, {
            title: 'Live Scan API Failure',
            message: `Live AWS connection failed: ${err.message}`,
            type: 'scan',
            severity: 'Critical'
          });
        } else {
          await Notification.create({
            userId,
            title: 'Live Scan API Failure',
            message: `Live AWS connection failed: ${err.message}`,
            type: 'scan',
            severity: 'Critical'
          });
        }
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Common: Update Resource Risk Levels dynamically based on open findings
  if (isLocalStore) {
    const localDb = readLocalDb();
    const openFindings = localDb.securityFindings.filter((f: any) => f.userId === userId && f.status === 'Open');
    for (const finding of openFindings) {
      const targetRes = localDb.cloudResources.find((r: any) => r.userId === userId && r.name.toLowerCase().includes(finding.resource.toLowerCase()));
      if (targetRes) {
        targetRes.riskLevel = finding.severity;
      }
    }
    writeLocalDb(localDb);
  } else {
    const openFindings = await SecurityFinding.find({ userId, status: 'Open' });
    for (const finding of openFindings) {
      await CloudResource.updateOne(
        { userId, name: { $regex: new RegExp(finding.resource, 'i') } },
        { riskLevel: finding.severity }
      );
    }
  }
};
