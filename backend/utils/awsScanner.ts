import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";
import { RDSClient } from "@aws-sdk/client-rds";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { scanRDSInstances } from "./scanners/rdsScanner";
import { scanLambdaFunctions } from "./scanners/lambdaScanner";
import { scanCloudFrontDistributions } from "./scanners/cloudFrontScanner";

interface AWSScannedData {
  resources: any[];
  findings: any[];
  accountId: string;
}

export const scanActionLiveAWS = async (
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  scopes: string[],
  abortSignal?: AbortSignal
): Promise<AWSScannedData> => {
  const credentials = {
    accessKeyId,
    secretAccessKey,
  };

  const results: any[] = [];
  const findings: any[] = [];
  let accountId = "UNKNOWN"; // default fallback ID if cannot retrieve - fix for hardcoded ID

  // Safety assignment
  const activeScopes = Array.isArray(scopes) ? scopes : [];

  // Initialize clients
  // Initialize clients — supports LocalStack via AWS_ENDPOINT_URL env var
const endpoint = process.env.AWS_ENDPOINT_URL;
const isLocalStack = !!endpoint;

const clientConfig = (isGlobal = false) => ({
  region: isGlobal ? "us-east-1" : region,
  credentials,
  ...(isLocalStack && {
    endpoint,
    forcePathStyle: true,
  }),
});

const s3Client = new S3Client(clientConfig());
const ec2Client = new EC2Client(clientConfig());
const iamClient = new IAMClient(clientConfig(true));
const rdsClient = new RDSClient(clientConfig());
const lambdaClient = new LambdaClient(clientConfig());
const cloudFrontClient = new CloudFrontClient(clientConfig(true));
  //const s3Client = new S3Client({ region, credentials });
  //const ec2Client = new EC2Client({ region, credentials });
  //const iamClient = new IAMClient({ region: "us-east-1", credentials }); // IAM is global, endpoint us-east-1 is standard
  //const rdsClient = new RDSClient({ region, credentials });
  //const lambdaClient = new LambdaClient({ region, credentials });
  //const cloudFrontClient = new CloudFrontClient({ region, credentials }); // CloudFront is global

  // Let's deduce Account ID if possible from dynamic calls
  try {
    const listUsers = await iamClient.send(new ListUsersCommand({ MaxItems: 1 }), { abortSignal });
    if (listUsers.Users && listUsers.Users.length > 0) {
      const arn = listUsers.Users[0].Arn;
      // Get account id from arn (e.g., arn:aws:iam::123456789012:user/username)
      const match = arn?.match(/::(\d+):/);
      if (match && match[1]) {
        accountId = match[1];
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn("Could not retrieve account ID from IAM user list. Proceeding...");
  }

  // Scan S3
  if (activeScopes.includes("S3")) {
    try {
      const s3Data = await s3Client.send(new ListBucketsCommand({}), { abortSignal });
      const buckets = s3Data.Buckets || [];
      for (const bucket of buckets) {
        results.push({
          resourceId: `s3-${bucket.Name}`,
          name: bucket.Name || "Unnamed S3 Bucket",
          type: "S3",
          region: region,
          monthlyCost: 0, // buckets storage costs are usage-based, default 0 in active scan
          status: "active",
          riskLevel: "Safe"
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error("AWS S3 Scan Error:", err.message);
      // If error is authentication/credential format error, let it propagate to warn user
      if (err.name === "InvalidSignatureException" || err.name === "SignatureDoesNotMatch") {
        throw new Error(`AWS Signature Verification Failed. Please verify your Secret Access Key. (${err.message})`);
      }
    }
  }

  // Scan EC2
  if (activeScopes.includes("EC2")) {
    try {
      const ec2Data = await ec2Client.send(new DescribeInstancesCommand({}), { abortSignal });
      const reservations = ec2Data.Reservations || [];
      for (const res of reservations) {
        const instances = res.Instances || [];
        for (const inst of instances) {
          const nameTag = inst.Tags?.find((t: any) => t.Key === "Name")?.Value;
          const instName = nameTag || inst.InstanceId || "Unnamed Instance";
          
          results.push({
            resourceId: inst.InstanceId || "ec2-instance",
            name: instName,
            type: "EC2",
            region: region,
            monthlyCost: inst.InstanceType === "t2.micro" ? 8.50 : 25.00, // Small realistic pricing estimation
            status: inst.State?.Name || "running",
            riskLevel: "Safe"
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error("AWS EC2 Scan Error:", err.message);
      if (err.name === "UnrecognizedClientException" || err.name === "AuthFailure") {
        throw new Error(`AWS EC2 Authentication Error: ${err.message}`);
      }
    }
  }

  // Security Groups (within SG scope)
  if (activeScopes.includes("SG") || activeScopes.includes("Security Groups")) {
    try {
      const sgData = await ec2Client.send(new DescribeSecurityGroupsCommand({}), { abortSignal });
      const sgs = sgData.SecurityGroups || [];
      for (const sg of sgs) {
        results.push({
          resourceId: sg.GroupId || "security-group",
          name: sg.GroupName || "default",
          type: "Security Group",
          region: region,
          monthlyCost: 0,
          status: "active",
          riskLevel: "Safe"
        });

        // Perform lightweight audit of IP rules
        const ipPermissions = sg.IpPermissions || [];
        for (const perm of ipPermissions) {
          const isAllProtocols = perm.IpProtocol === "-1";
          const isSshPort = perm.FromPort !== undefined && perm.ToPort !== undefined && perm.FromPort <= 22 && perm.ToPort >= 22;
          const permitsAnywhere = perm.IpRanges?.some((range: any) => range.CidrIp === "0.0.0.0/0");

          if (permitsAnywhere && (isSshPort || isAllProtocols)) {
            findings.push({
              resource: sg.GroupName || "security-group",
              resourceType: "Security Group",
              issue: `Port ${isAllProtocols ? "ALL" : "22"} open to the world in ${sg.GroupId}`,
              severity: "Critical",
              impact: "Allows potential malicious connection attempts over the internet directly to all servers belonging to this Security Group.",
              recommendation: `Restrict Security Group "${sg.GroupName}" inbound CIDR rules to specific authorized corporate subnet or VPN IPs rather than "0.0.0.0/0".`,
              category: "Network",
              status: "Open"
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error("AWS SG Scan Error:", err);
    }
  }

  // Scan IAM
  if (activeScopes.includes("IAM")) {
    try {
      const iamData = await iamClient.send(new ListUsersCommand({}), { abortSignal });
      const users = iamData.Users || [];
      for (const user of users) {
        results.push({
          resourceId: user.UserId || "iam-user",
          name: user.UserName || "iam-name",
          type: "IAM User",
          region: "Global",
          monthlyCost: 0,
          status: "active",
          riskLevel: "Safe"
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error("AWS IAM Scan Error:", err.message);
    }
  }

  // Scan RDS, Lambda, and CloudFront in parallel with resilience using Promise.allSettled
  const scanPromises: Array<Promise<any>> = [];

  if (activeScopes.includes("RDS")) {
    scanPromises.push(
      scanRDSInstances(rdsClient, region, abortSignal)
        .then(data => ({ service: "RDS", ...data }))
    );
  }

  if (activeScopes.includes("Lambda")) {
    scanPromises.push(
      scanLambdaFunctions(lambdaClient, region, abortSignal)
        .then(data => ({ service: "Lambda", ...data }))
    );
  }

  if (activeScopes.includes("CloudFront")) {
    scanPromises.push(
      scanCloudFrontDistributions(cloudFrontClient, abortSignal)
        .then(data => ({ service: "CloudFront", ...data }))
    );
  }
 
  // Execute all new service scans in parallel with error resilience
  if (scanPromises.length > 0) {
    const scanResults = await Promise.allSettled(scanPromises);

    for (const result of scanResults) {
      if (result.status === "fulfilled" && result.value) {
        const { service, resources: svcResources, findings: svcFindings, costOptimizations } = result.value;
        results.push(...svcResources);
        findings.push(...svcFindings);
        // Cost optimizations are currently stored but not returned - can be extended in future
        console.log(`✓ ${service} scan completed: ${svcResources.length} resources, ${svcFindings.length} findings`);
      } else if (result.status === "rejected") {
        console.error(`✗ Service scan failed:`, result.reason);
        // Gracefully continue - scan failure for one service doesn't stop others
      }
    }
  }

  return {
    resources: results,
    findings,
    accountId
  };
};
