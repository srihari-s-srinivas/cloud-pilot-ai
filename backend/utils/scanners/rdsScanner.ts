import { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand } from "@aws-sdk/client-rds";

interface RDSResource {
  resourceId: string;
  name: string;
  type: string;
  region: string;
  monthlyCost: number;
  status: string;
  riskLevel: string;
  metadata?: {
    engine?: string;
    engineVersion?: string;
    instanceClass?: string;
    allocatedStorage?: number;
    publiclyAccessible?: boolean;
    storageEncrypted?: boolean;
    backupRetentionPeriod?: number;
    dbInstanceIdentifier?: string;
    dbClusterIdentifier?: string;
  };
}

interface RDSFinding {
  resource: string;
  resourceType: string;
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  impact: string;
  recommendation: string;
  status: "Open";
}

interface RDSCostOptimization {
  resource: string;
  suggestion: string;
  potentialSavings: string;
}

export const scanRDSInstances = async (
  rdsClient: RDSClient,
  region: string,
  abortSignal?: AbortSignal
): Promise<{ resources: RDSResource[]; findings: RDSFinding[]; costOptimizations: RDSCostOptimization[] }> => {
  const resources: RDSResource[] = [];
  const findings: RDSFinding[] = [];
  const costOptimizations: RDSCostOptimization[] = [];

  try {
    // Scan DB Instances
    const dbInstancesResponse = await rdsClient.send(new DescribeDBInstancesCommand({}), { abortSignal });
    const dbInstances = dbInstancesResponse.DBInstances || [];

    for (const instance of dbInstances) {
      const resourceId = instance.DBInstanceIdentifier || "unknown-rds-instance";
      
      // Create resource entry
      resources.push({
        resourceId: `rds-${resourceId}`,
        name: resourceId,
        type: "RDS",
        region,
        monthlyCost: estimateRDSCost(instance.DBInstanceClass, instance.AllocatedStorage),
        status: instance.DBInstanceStatus || "unknown",
        riskLevel: "Safe",
        metadata: {
          engine: instance.Engine,
          engineVersion: instance.EngineVersion,
          instanceClass: instance.DBInstanceClass,
          allocatedStorage: instance.AllocatedStorage,
          publiclyAccessible: instance.PubliclyAccessible,
          storageEncrypted: instance.StorageEncrypted,
          backupRetentionPeriod: instance.BackupRetentionPeriod,
          dbInstanceIdentifier: instance.DBInstanceIdentifier,
        },
      });

      // Security Findings: Publicly Accessible Database (HIGH)
      if (instance.PubliclyAccessible === true) {
        findings.push({
          resource: resourceId,
          resourceType: "RDS Instance",
          issue: "Publicly Accessible Database",
          severity: "High",
          category: "Security",
          impact: "Database is accessible from the internet, increasing exposure to unauthorized access attempts and data breaches.",
          recommendation: `Set PubliclyAccessible to false for ${resourceId} and restrict access via security groups.`,
          status: "Open",
        });
      }

      // Security Findings: Encryption Disabled (HIGH)
      if (instance.StorageEncrypted === false) {
        findings.push({
          resource: resourceId,
          resourceType: "RDS Instance",
          issue: "Encryption Disabled",
          severity: "High",
          category: "Security",
          impact: "Database data is stored unencrypted, violating compliance requirements and exposing sensitive data.",
          recommendation: `Enable encryption at rest for ${resourceId} by enabling StorageEncrypted in RDS settings.`,
          status: "Open",
        });
      }

      // Security Findings: Backup Retention Disabled (MEDIUM)
      if (instance.BackupRetentionPeriod === 0) {
        findings.push({
          resource: resourceId,
          resourceType: "RDS Instance",
          issue: "Backup Retention Disabled",
          severity: "Medium",
          category: "Reliability",
          impact: "No automated backups are retained, making it impossible to recover from data loss or corruption.",
          recommendation: `Configure backup retention for ${resourceId} to at least 7 days (recommended 30 days).`,
          status: "Open",
        });
      }

      // Security Findings: Outdated Engine Version (MEDIUM)
      if (instance.Engine && instance.EngineVersion) {
        const isOutdated = isOutdatedEngineVersion(instance.Engine, instance.EngineVersion);
        if (isOutdated) {
          findings.push({
            resource: resourceId,
            resourceType: "RDS Instance",
            issue: `Outdated ${instance.Engine} Engine Version`,
            severity: "Medium",
            category: "Security",
            impact: `Running outdated engine version ${instance.EngineVersion} exposes database to known security vulnerabilities.`,
            recommendation: `Upgrade ${resourceId} to a supported engine version for ${instance.Engine}.`,
            status: "Open",
          });
        }
      }

      // Cost Optimization: Oversized Instance
      if (instance.DBInstanceClass && isOversizedInstance(instance.DBInstanceClass)) {
        costOptimizations.push({
          resource: resourceId,
          suggestion: `Downsize instance class from ${instance.DBInstanceClass}`,
          potentialSavings: "Up to 40% reduction in compute costs",
        });
      }

      // Cost Optimization: Idle Database
      if (instance.DBInstanceStatus === "available" && isLikelyIdle(instance)) {
        costOptimizations.push({
          resource: resourceId,
          suggestion: `Database appears idle. Consider stopping or deleting if no longer needed`,
          potentialSavings: `Save ${estimateRDSCost(instance.DBInstanceClass, instance.AllocatedStorage)} monthly`,
        });
      }

      // Cost Optimization: Underutilized Database
      if (instance.DBInstanceClass && instance.AllocatedStorage) {
        costOptimizations.push({
          resource: resourceId,
          suggestion: `Database is allocated ${instance.AllocatedStorage}GB but may be underutilized`,
          potentialSavings: "20-30% reduction by rightsizing storage",
        });
      }
    }

    // Scan DB Clusters
    const dbClustersResponse = await rdsClient.send(new DescribeDBClustersCommand({}), { abortSignal });
    const dbClusters = dbClustersResponse.DBClusters || [];

    for (const cluster of dbClusters) {
      const resourceId = cluster.DBClusterIdentifier || "unknown-rds-cluster";
      
      resources.push({
        resourceId: `rds-${resourceId}`,
        name: resourceId,
        type: "RDS",
        region,
        monthlyCost: estimateRDSClusterCost(cluster),
        status: cluster.Status || "unknown",
        riskLevel: "Safe",
        metadata: {
          engine: cluster.Engine,
          engineVersion: cluster.EngineVersion,
          storageEncrypted: cluster.StorageEncrypted,
          backupRetentionPeriod: cluster.BackupRetentionPeriod,
          dbClusterIdentifier: cluster.DBClusterIdentifier,
        },
      });

      // Security Findings for Cluster
      if (cluster.StorageEncrypted === false) {
        findings.push({
          resource: resourceId,
          resourceType: "RDS Cluster",
          issue: "Encryption Disabled",
          severity: "High",
          category: "Security",
          impact: "Cluster data is stored unencrypted, exposing all databases in the cluster.",
          recommendation: `Enable encryption at rest for cluster ${resourceId}.`,
          status: "Open",
        });
      }

      if (cluster.BackupRetentionPeriod === 0) {
        findings.push({
          resource: resourceId,
          resourceType: "RDS Cluster",
          issue: "Backup Retention Disabled",
          severity: "Medium",
          category: "Reliability",
          impact: "Cluster has no backup retention, risking complete data loss.",
          recommendation: `Set backup retention for ${resourceId} to at least 7 days.`,
          status: "Open",
        });
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    console.error("RDS Scan Error:", err.message);
    // Graceful degradation - warning finding for permission issues
    if (err.name === "UnauthorizedOperation" || err.name === "AccessDenied" || err.name === "AccessDeniedException") {
      findings.push({
        resource: "RDS",
        resourceType: "RDS Service",
        issue: "Insufficient IAM Permissions",
        severity: "Medium",
        category: "Configuration",
        impact: "Unable to scan RDS resources due to missing IAM permissions (rds:DescribeDBInstances, rds:DescribeDBClusters).",
        recommendation: "Add required RDS permissions to IAM user/role and retry scan.",
        status: "Open",
      });
    }
  }

  return { resources, findings, costOptimizations };
};

// Helper functions
const estimateRDSCost = (instanceClass?: string, storage?: number): number => {
  if (!instanceClass || !storage) return 0;
  
  const instanceCosts: { [key: string]: number } = {
    "db.t3.micro": 30,
    "db.t3.small": 60,
    "db.t3.medium": 120,
    "db.t4g.micro": 25,
    "db.t4g.small": 50,
    "db.m6i.large": 250,
    "db.m6i.xlarge": 500,
    "db.r6i.large": 350,
    "db.r6i.xlarge": 700,
  };

  const computeCost = instanceCosts[instanceClass] || 100;
  const storageCost = (storage || 20) * 0.115; // Roughly $0.115 per GB per month for standard storage

  return computeCost + storageCost;
};

const estimateRDSClusterCost = (cluster: any): number => {
  const memberCount = cluster.DBClusterMembers?.length || 1;
  return 150 * memberCount; // Rough estimate
};

const isOversizedInstance = (instanceClass: string): boolean => {
  const largeInstances = ["db.r6i.xlarge", "db.r6i.2xlarge", "db.m6i.xlarge", "db.m6i.2xlarge"];
  return largeInstances.includes(instanceClass);
};

const isLikelyIdle = (instance: any): boolean => {
  // Check if last modified is old (placeholder - would need real metrics)
  return false;
};

const isOutdatedEngineVersion = (engine: string, version: string): boolean => {
  // Define minimum supported versions
  const minVersions: { [key: string]: string } = {
    "mysql": "5.7",
    "postgres": "12",
    "mariadb": "10.5",
    "oracle-ee": "19",
    "sqlserver-ex": "2016",
  };

  const minVersion = minVersions[engine];
  if (!minVersion) return false;

  // Simple version comparison (production would use semantic versioning)
  const currentMajor = parseInt(version.split(".")[0]);
  const minMajor = parseInt(minVersion.split(".")[0]);

  return currentMajor < minMajor;
};
