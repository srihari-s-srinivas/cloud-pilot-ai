import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";

interface CloudFrontResource {
  resourceId: string;
  name: string;
  type: string;
  region: string;
  monthlyCost: number;
  status: string;
  riskLevel: string;
  metadata?: {
    distributionId?: string;
    domainName?: string;
    aliases?: string[];
    enabled?: boolean;
    viewerProtocolPolicy?: string;
    origins?: Array<{
      id: string;
      domainName: string;
      originProtocolPolicy?: string;
    }>;
    lastModifiedTime?: string;
  };
}

interface CloudFrontFinding {
  resource: string;
  resourceType: string;
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  impact: string;
  recommendation: string;
  status: "Open";
}

interface CloudFrontCostOptimization {
  resource: string;
  suggestion: string;
  potentialSavings: string;
}

export const scanCloudFrontDistributions = async (
  cloudFrontClient: CloudFrontClient,
  abortSignal?: AbortSignal
): Promise<{ resources: CloudFrontResource[]; findings: CloudFrontFinding[]; costOptimizations: CloudFrontCostOptimization[] }> => {
  const resources: CloudFrontResource[] = [];
  const findings: CloudFrontFinding[] = [];
  const costOptimizations: CloudFrontCostOptimization[] = [];

  try {
    const response = await cloudFrontClient.send(new ListDistributionsCommand({}), { abortSignal });
    const distributions = response.DistributionList?.Items || [];

    for (const distribution of distributions) {
      const distributionId = distribution.Id || "unknown-distribution";
      const domainName = distribution.DomainName || distributionId;

      // Create resource entry
      resources.push({
        resourceId: `cloudfront-${distributionId}`,
        name: domainName,
        type: "CloudFront",
        region: "Global",
        monthlyCost: estimateCloudFrontCost(distribution),
        status: distribution.Status || "Deployed",
        riskLevel: "Safe",
        metadata: {
          distributionId,
          domainName,
          aliases: distribution.Aliases?.Items || [],
          enabled: distribution.Enabled,
          viewerProtocolPolicy: distribution.DefaultCacheBehavior?.ViewerProtocolPolicy,
          origins: distribution.Origins?.Items?.map((origin) => ({
            id: origin.Id || "",
            domainName: origin.DomainName || "",
            originProtocolPolicy: origin.CustomOriginConfig?.OriginProtocolPolicy,
          })),
          lastModifiedTime: distribution.LastModifiedTime?.toISOString(),
        },
      });

      // Security Finding: No HTTPS Redirect (MEDIUM)
      if (
        distribution.DefaultCacheBehavior?.ViewerProtocolPolicy === "allow-all"
      ) {
        findings.push({
          resource: domainName,
          resourceType: "CloudFront Distribution",
          issue: "No HTTPS Redirect Policy",
          severity: "Medium",
          category: "Security",
          impact: `Distribution ${distributionId} allows HTTP traffic without automatic redirect to HTTPS, exposing data in transit.`,
          recommendation: `Set viewer protocol policy to 'https-only' or 'redirect-to-https' for ${distributionId}.`,
          status: "Open",
        });
      }

      // Security Finding: Insecure Origin Policies (MEDIUM)
      if (distribution.Origins?.Items) {
        for (const origin of distribution.Origins.Items) {
          if (origin.CustomOriginConfig?.OriginProtocolPolicy === "http-only") {
            findings.push({
              resource: domainName,
              resourceType: "CloudFront Distribution",
              issue: "Insecure Origin Protocol Policy",
              severity: "Medium",
              category: "Security",
              impact: `Origin ${origin.DomainName} is configured to use HTTP-only, exposing communication to the origin to interception.`,
              recommendation: `Use HTTPS protocol policy for origin ${origin.DomainName} in distribution ${distributionId}.`,
              status: "Open",
            });
          }
        }
      }

      // Security Finding: Missing Cache Optimization (LOW)
      if (!distribution.DefaultCacheBehavior?.CachePolicyId && !distribution.DefaultCacheBehavior?.ForwardedValues?.QueryString) {
        findings.push({
          resource: domainName,
          resourceType: "CloudFront Distribution",
          issue: "Missing Cache Optimization Configuration",
          severity: "Low",
          category: "Performance",
          impact: `Distribution ${distributionId} may not have optimal caching configured, leading to higher origin load and costs.`,
          recommendation: `Review cache behavior policies and TTL settings for ${distributionId} to improve cache hit ratio.`,
          status: "Open",
        });
      }

      // Cost Optimization: Disabled Distribution
      if (distribution.Enabled === false) {
        costOptimizations.push({
          resource: domainName,
          suggestion: "Distribution is disabled but still incurs minimal costs",
          potentialSavings: "Consider deleting if no longer needed",
        });
      }

      // Cost Optimization: Poor Cache Utilization
      if (!distribution.DefaultCacheBehavior?.CachePolicyId) {
        costOptimizations.push({
          resource: domainName,
          suggestion: "Optimize cache policies to reduce origin requests",
          potentialSavings: "Potential 20-50% reduction in data transfer costs",
        });
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    console.error("CloudFront Scan Error:", err.message);
    // Graceful degradation - warning finding for permission issues
    if (err.name === "UnauthorizedOperation" || err.name === "AccessDenied" || err.name === "AccessDeniedException") {
      findings.push({
        resource: "CloudFront",
        resourceType: "CloudFront Service",
        issue: "Insufficient IAM Permissions",
        severity: "Medium",
        category: "Configuration",
        impact: "Unable to scan CloudFront distributions due to missing IAM permissions (cloudfront:ListDistributions).",
        recommendation: "Add required CloudFront permissions to IAM user/role and retry scan.",
        status: "Open",
      });
    }
  }

  return { resources, findings, costOptimizations };
};

// Helper functions
const estimateCloudFrontCost = (distribution: any): number => {
  // Rough estimation based on typical CloudFront usage
  // This would need real CloudWatch metrics for accurate calculation
  const baseMonthly = 0.085; // Data transfer out per GB
  const estimatedMonthlyTransfer = 100; // GB (placeholder)
  
  return baseMonthly * estimatedMonthlyTransfer;
};
