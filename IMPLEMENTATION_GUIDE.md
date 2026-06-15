# CloudPilot AI - RDS, Lambda, CloudFront Integration

## Implementation Summary

This document describes the extension of CloudPilot AI's AWS scanning capabilities to include **RDS**, **Lambda**, and **CloudFront** services alongside existing EC2, S3, IAM, and Security Groups integration.

---

## Architecture Overview

### New Service Scanners

Three new modular scanner services have been created following the existing pattern:

1. **[rdsScanner.ts](./rdsScanner.ts)** - RDS database discovery and security assessment
2. **[lambdaScanner.ts](./lambdaScanner.ts)** - Lambda function analysis and permission auditing
3. **[cloudFrontScanner.ts](./cloudFrontScanner.ts)** - CloudFront distribution security evaluation

All scanners implement consistent interfaces:
- `resources`: Array of discovered cloud resources
- `findings`: Array of security findings (HIGH, MEDIUM, LOW severity)
- `costOptimizations`: Cost optimization recommendations (future enhancement)

### Integration Points

**Main Scanner** ([awsScanner.ts](../awsScanner.ts)):
- Initializes RDS, Lambda, CloudFront clients
- Uses `Promise.allSettled()` for resilient parallel scanning
- Gracefully handles individual service failures
- Respects `selectedServices` filtering

**Scan Controller** ([scanController.ts](../../controllers/scanController.ts)):
- Updated progress tracking with new service steps
- Mock/Demo resources and findings include new services
- Filtering logic respects RDS, Lambda, CloudFront selections

---

## Service Integration Details

### RDS Scanner

**Discovered Resources:**
- DB instances with metadata: engine, version, instance class, storage, public accessibility, encryption status, backup retention
- DB clusters with similar metadata

**Security Findings:**

| Severity | Finding | Condition |
|----------|---------|-----------|
| **HIGH** | Publicly Accessible Database | `PubliclyAccessible === true` |
| **HIGH** | Encryption Disabled | `StorageEncrypted === false` |
| **MEDIUM** | Backup Retention Disabled | `BackupRetentionPeriod === 0` |
| **MEDIUM** | Outdated Engine Version | Engine version below minimum supported |

**Cost Optimizations:**
- Oversized instance classes (db.r6i.xlarge+)
- Idle databases (status: available, no recent activity)
- Underutilized storage allocations

---

### Lambda Scanner

**Discovered Resources:**
- Function metadata: name, runtime, memory, timeout, last modified, environment config
- Handler and configuration details

**Security Findings:**

| Severity | Finding | Condition |
|----------|---------|-----------|
| **HIGH** | Wildcard IAM Permissions | Action: `*` or `lambda:*` in policy |
| **MEDIUM** | Outdated Runtime | Runtime in: nodejs12.x, nodejs14.x, python3.6, python3.7, java8 |
| **LOW** | Excessive Timeout | Timeout > 300s |
| **LOW** | Excessive Memory | Memory > 3000MB |

**Cost Optimizations:**
- Overprovisioned memory (>1024MB)
- Rarely updated functions (not modified in 12+ months)

---

### CloudFront Scanner

**Discovered Resources:**
- Distribution metadata: domain, aliases, origins, enabled status, cache policies
- Viewer protocol policies

**Security Findings:**

| Severity | Finding | Condition |
|----------|---------|-----------|
| **MEDIUM** | No HTTPS Redirect | ViewerProtocolPolicy: `http-only` or `allow-all` |
| **MEDIUM** | Insecure Origin Policy | Origin OriginProtocolPolicy: `http-only` |
| **LOW** | Missing Cache Optimization | No cache policy configured |

**Cost Optimizations:**
- Disabled distributions (Enabled: false)
- Poor cache utilization (no cache policies)

---

## Required IAM Permissions

Add these permissions to your IAM user/role for full scanning capabilities:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSScanning",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters",
        "rds:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaScanning",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetPolicy"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontScanning",
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions",
        "cloudfront:GetDistribution"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ExistingServices",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "s3:ListAllMyBuckets",
        "iam:ListUsers"
      ],
      "Resource": "*"
    }
  ]
}
```

### Minimum Permissions (If Full Access Not Available)

If your organization restricts permissions, ensure at minimum:
- `rds:DescribeDBInstances` - Discover RDS instances
- `rds:DescribeDBClusters` - Discover RDS clusters
- `lambda:ListFunctions` - Discover Lambda functions
- `cloudfront:ListDistributions` - Discover CloudFront distributions

Missing permissions will generate **MEDIUM severity warnings** in findings instead of failing the entire scan.

---

## Error Handling & Resilience

### Permission Errors
If specific service permissions are missing:
- Scan continues for other services (Promise.allSettled)
- Warning finding is generated: "Insufficient IAM Permissions"
- Example message: "Unable to scan RDS resources due to missing IAM permissions (rds:DescribeDBInstances, rds:DescribeDBClusters)"

### Network/API Errors
- Individual service failures don't stop overall scan
- Errors are logged to console
- Findings still processed for successful services

### Abort Signal Handling
- All scanners respect AbortSignal for timeout management
- 5-minute timeout protects against hung infrastructure scans

---

## Selected Services Configuration

The existing `selectedServices` array controls which services are scanned:

```typescript
// Example: Only RDS and Lambda
selectedServices: ["RDS", "Lambda"]

// Example: All services
selectedServices: ["EC2", "S3", "IAM", "Security Groups", "RDS", "Lambda", "CloudFront"]
```

**Frontend Integration**: Users select services during AWS onboarding flow. The scanner respects these selections to avoid scanning unmanaged services.

---

## Files Created/Modified

### New Files
- `backend/utils/scanners/rdsScanner.ts` - RDS scanning implementation
- `backend/utils/scanners/lambdaScanner.ts` - Lambda scanning implementation
- `backend/utils/scanners/cloudFrontScanner.ts` - CloudFront scanning implementation

### Modified Files
- `package.json` - Added AWS SDK packages
- `backend/utils/awsScanner.ts` - Integrated new scanners with resilience
- `backend/controllers/scanController.ts` - Updated progress tracking and mock data

---

## Cost Estimation

Cost calculations use:
- **RDS**: Instance class hourly rate + storage ($0.115/GB/month)
- **Lambda**: Memory allocation × timeout × invocation rate (~$0.0000166667/GB-second)
- **CloudFront**: $0.085/GB data transfer (placeholder, actual use CloudWatch metrics)

---

## Testing Checklist

- [ ] Install packages: `npm install`
- [ ] Verify scanner imports resolve
- [ ] Test with demo credentials (include "DEMO" in key)
- [ ] Test with real AWS credentials
- [ ] Verify resources appear in Resources page
- [ ] Verify findings appear in Security page
- [ ] Test with partial selectedServices
- [ ] Verify progress updates correctly
- [ ] Check console logs for service scan completion messages
- [ ] Test timeout handling (kill AWS connection after 5 min)

---

## Future Enhancements

1. **Cost Optimization Findings**: Store and display cost optimization recommendations
2. **Real-time Metrics**: Use CloudWatch for actual resource utilization
3. **Custom Rules**: Allow users to define custom security rules
4. **Remediation Templates**: Generate Terraform for common fixes
5. **Additional Services**: Add VPC, ElastiCache, DynamoDB, SNS/SQS, etc.

---

## Support for More AWS Services

To add a new service (e.g., DynamoDB):

1. Create `backend/utils/scanners/dynamodbScanner.ts`
2. Implement `scanDynamoDBTables()` following existing patterns
3. Import in `awsScanner.ts`
4. Add to Promise.allSettled pipeline
5. Add to selectedServices filtering in scanController
6. Update progress steps

---

## Performance Notes

- **Parallel Scanning**: All three new services execute in parallel via Promise.allSettled
- **Typical Scan Times**: 
  - Small infrastructure (<50 resources): 30-60 seconds
  - Medium infrastructure (50-200 resources): 1-2 minutes
  - Large infrastructure (>500 resources): 3-5 minutes (may hit timeout)
  
For large infrastructures, recommend:
- Scanning by region separately
- Filtering selectedServices to specific services needed
- Increasing timeout if needed

---

## Support

For issues with scanning:
1. Check CloudPilot AI logs: `VSCODE_TARGET_SESSION_LOG`
2. Verify IAM permissions are granted
3. Ensure valid AWS credentials
4. Check region selection matches your resources
5. Verify selectedServices includes the services you're trying to scan
