import { LambdaClient, ListFunctionsCommand, GetPolicyCommand } from "@aws-sdk/client-lambda";

interface LambdaResource {
  resourceId: string;
  name: string;
  type: string;
  region: string;
  monthlyCost: number;
  status: string;
  riskLevel: string;
  metadata?: {
    functionName?: string;
    runtime?: string;
    memorySize?: number;
    timeout?: number;
    lastModified?: string;
    environment?: Record<string, any>;
    handler?: string;
  };
}

interface LambdaFinding {
  resource: string;
  resourceType: string;
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  impact: string;
  recommendation: string;
  status: "Open";
}

interface LambdaCostOptimization {
  resource: string;
  suggestion: string;
  potentialSavings: string;
}

export const scanLambdaFunctions = async (
  lambdaClient: LambdaClient,
  region: string,
  abortSignal?: AbortSignal
): Promise<{ resources: LambdaResource[]; findings: LambdaFinding[]; costOptimizations: LambdaCostOptimization[] }> => {
  const resources: LambdaResource[] = [];
  const findings: LambdaFinding[] = [];
  const costOptimizations: LambdaCostOptimization[] = [];

  try {
    const listResponse = await lambdaClient.send(new ListFunctionsCommand({}), { abortSignal });
    const functions = listResponse.Functions || [];

    for (const func of functions) {
      const functionName = func.FunctionName || "unknown-lambda";

      // Create resource entry
      resources.push({
        resourceId: `lambda-${functionName}`,
        name: functionName,
        type: "Lambda",
        region,
        monthlyCost: estimateLambdaCost(func.MemorySize, func.Timeout),
        status: func.State || "Active",
        riskLevel: "Safe",
        metadata: {
          functionName: func.FunctionName,
          runtime: func.Runtime,
          memorySize: func.MemorySize,
          timeout: func.Timeout,
          lastModified: func.LastModified,
          handler: func.Handler,
          environment: func.Environment?.Variables,
        },
      });

      // Security Findings: Wildcard IAM Permissions (HIGH)
      try {
        const policyResponse = await lambdaClient.send(new GetPolicyCommand({ FunctionName: functionName }), { abortSignal });
        if (policyResponse.Policy) {
          const policy = JSON.parse(policyResponse.Policy);
          const hasWildcardPermissions = checkForWildcardPermissions(policy);
          
          if (hasWildcardPermissions) {
            findings.push({
              resource: functionName,
              resourceType: "Lambda Function",
              issue: "Wildcard IAM Permissions Detected",
              severity: "High",
              category: "Security",
              impact: "Lambda function has overly permissive IAM policies (Action: *), violating least privilege principle.",
              recommendation: `Review and restrict resource policy for ${functionName} to only required permissions.`,
              status: "Open",
            });
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && err.name !== "ResourceNotFoundException") {
          console.warn("Could not retrieve Lambda policy:", err.message);
        }
      }

      // Security Findings: Outdated Runtime (MEDIUM)
      if (func.Runtime && isOutdatedRuntime(func.Runtime)) {
        findings.push({
          resource: functionName,
          resourceType: "Lambda Function",
          issue: `Outdated Runtime: ${func.Runtime}`,
          severity: "Medium",
          category: "Security",
          impact: `Runtime ${func.Runtime} is no longer supported by AWS and may contain security vulnerabilities.`,
          recommendation: `Update ${functionName} to a current supported runtime.`,
          status: "Open",
        });
      }

      // Security Findings: Excessive Timeout (LOW)
      if (func.Timeout && func.Timeout > 300) {
        findings.push({
          resource: functionName,
          resourceType: "Lambda Function",
          issue: "Excessive Timeout Value",
          severity: "Low",
          category: "Performance",
          impact: `Function timeout is set to ${func.Timeout}s, which is unusually high and may mask performance issues.`,
          recommendation: `Review and reduce timeout for ${functionName} to match typical execution time.`,
          status: "Open",
        });
      }

      // Security Findings: Excessive Memory Allocation (LOW)
      if (func.MemorySize && func.MemorySize > 3000) {
        findings.push({
          resource: functionName,
          resourceType: "Lambda Function",
          issue: "Excessive Memory Allocation",
          severity: "Low",
          category: "Optimization",
          impact: `Function is allocated ${func.MemorySize}MB which exceeds typical needs and increases costs.`,
          recommendation: `Test with lower memory settings for ${functionName} to optimize costs.`,
          status: "Open",
        });
      }

      // Cost Optimization: Overprovisioned Memory
      if (func.MemorySize && func.MemorySize > 1024) {
        costOptimizations.push({
          resource: functionName,
          suggestion: `Reduce memory from ${func.MemorySize}MB to lower tier`,
          potentialSavings: "10-20% cost reduction",
        });
      }

      // Cost Optimization: Rarely Updated Functions
      if (func.LastModified) {
        const lastModDate = new Date(func.LastModified);
        const monthsOld = (Date.now() - lastModDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsOld > 12) {
          costOptimizations.push({
            resource: functionName,
            suggestion: `Function not modified in ${Math.floor(monthsOld)} months. Consider if still needed`,
            potentialSavings: `Save ${estimateLambdaCost(func.MemorySize, func.Timeout)} monthly if deleted`,
          });
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    console.error("Lambda Scan Error:", err.message);
    // Graceful degradation - warning finding for permission issues
    if (err.name === "UnauthorizedOperation" || err.name === "AccessDenied" || err.name === "AccessDeniedException") {
      findings.push({
        resource: "Lambda",
        resourceType: "Lambda Service",
        issue: "Insufficient IAM Permissions",
        severity: "Medium",
        category: "Configuration",
        impact: "Unable to scan Lambda functions due to missing IAM permissions (lambda:ListFunctions).",
        recommendation: "Add required Lambda permissions to IAM user/role and retry scan.",
        status: "Open",
      });
    }
  }

  return { resources, findings, costOptimizations };
};

// Helper functions
const estimateLambdaCost = (memorySize?: number, timeout?: number): number => {
  if (!memorySize || !timeout) return 0.50;

  // Rough estimation based on AWS Lambda pricing
  const gbSeconds = ((memorySize || 128) / 1024) * (timeout || 30);
  const monthlyCost = gbSeconds * 0.0000166667 * 1000000; // ~$0.0000166667 per GB-second
  
  return Math.max(0.5, monthlyCost); // Minimum 50 cents
};

const isOutdatedRuntime = (runtime: string): boolean => {
  const outdatedRuntimes = [
    "nodejs12.x",
    "nodejs14.x",
    "python3.6",
    "python3.7",
    "java8",
  ];
  return outdatedRuntimes.includes(runtime);
};

const checkForWildcardPermissions = (policy: any): boolean => {
  if (!policy || !policy.Statement) return false;

  for (const statement of policy.Statement) {
    if (statement.Action === "*" || (Array.isArray(statement.Action) && statement.Action.includes("*"))) {
      return true;
    }
    if (statement.Action === "lambda:*" || (Array.isArray(statement.Action) && statement.Action.includes("lambda:*"))) {
      return true;
    }
  }

  return false;
};
