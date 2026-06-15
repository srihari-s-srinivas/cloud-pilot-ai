# CloudPilot AI - Required IAM Permissions

## Overview

This document specifies all AWS IAM permissions required for CloudPilot AI to scan RDS, Lambda, CloudFront, and existing services (EC2, S3, IAM).

---

## Minimal Permissions Policy

For basic scanning capabilities, use this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSMinimalScanning",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaMinimalScanning",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetPolicy"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontMinimalScanning",
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2Scanning",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3Scanning",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMScanning",
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Comprehensive Permissions Policy

For extended functionality and metadata collection:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters",
        "rds:DescribeDBClusterMembers",
        "rds:DescribeDBParameterGroups",
        "rds:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetPolicy",
        "lambda:ListEventSourceMappings",
        "lambda:ListAliases"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributionsByRealtimeLogConfig"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2ComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeTags",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeNetworkInterfaces"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3ComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketPolicy",
        "s3:GetBucketAcl",
        "s3:ListBucket"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMComprehensiveScanning",
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers",
        "iam:ListRoles",
        "iam:GetRole",
        "iam:ListUserPolicies",
        "iam:ListAttachedUserPolicies"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Service-Specific Permissions

### RDS Permissions

**Required** (for basic discovery):
- `rds:DescribeDBInstances` - List RDS database instances
- `rds:DescribeDBClusters` - List RDS database clusters

**Optional** (for enhanced metadata):
- `rds:DescribeDBClusterMembers` - Get cluster members
- `rds:DescribeDBParameterGroups` - Get parameter group info
- `rds:ListTagsForResource` - Retrieve resource tags

**Rationale**:
- Instance/Cluster discovery needed for resource inventory
- Member info useful for multi-AZ configurations
- Parameter groups contain security configurations
- Tags help categorize resources

### Lambda Permissions

**Required** (for basic discovery):
- `lambda:ListFunctions` - List Lambda functions
- `lambda:GetPolicy` - Get function resource policy

**Optional** (for enhanced metadata):
- `lambda:ListEventSourceMappings` - Get trigger information
- `lambda:ListAliases` - Get function aliases

**Rationale**:
- Function listing needed for inventory
- Policy analysis detects wildcard permissions
- Event sources show dependencies
- Aliases useful for blue/green deployments

### CloudFront Permissions

**Required** (for basic discovery):
- `cloudfront:ListDistributions` - List CloudFront distributions

**Optional** (for enhanced metadata):
- `cloudfront:GetDistribution` - Get detailed distribution config
- `cloudfront:ListDistributionsByRealtimeLogConfig` - Get logging config

**Rationale**:
- Distribution listing needed for inventory
- Detailed config contains security policies
- Logging config shows monitoring setup

### EC2 Permissions

**Required**:
- `ec2:DescribeInstances` - List EC2 instances
- `ec2:DescribeSecurityGroups` - List security groups

**Optional**:
- `ec2:DescribeTags` - Get resource tags
- `ec2:DescribeInstanceStatus` - Get instance health
- `ec2:DescribeNetworkInterfaces` - Get network config

### S3 Permissions

**Required**:
- `s3:ListAllMyBuckets` - List all S3 buckets

**Optional**:
- `s3:GetBucketPolicy` - Get bucket policy
- `s3:GetBucketAcl` - Get bucket ACLs
- `s3:ListBucket` - List bucket contents

### IAM Permissions

**Required**:
- `iam:ListUsers` - List IAM users

**Optional**:
- `iam:ListRoles` - List IAM roles
- `iam:GetRole` - Get role details
- `iam:ListUserPolicies` - Get user policies
- `iam:ListAttachedUserPolicies` - Get attached policies

---

## Permission by Region

**Global Services** (available in all regions):
- IAM
- CloudFront

**Regional Services** (specify region):
- RDS
- Lambda
- EC2
- S3 (bucket operations are regional, though ListAllMyBuckets is global)

**Example**: For scanning in us-east-1:
- Use region: "us-east-1"
- IAM and CloudFront will work automatically (global)
- RDS, Lambda, EC2 will scan us-east-1 only

---

## Restricted/Production Policy

If your organization requires more restrictive access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudPilotScanningReadOnly",
      "Effect": "Allow",
      "Action": [
        "rds:Describe*",
        "lambda:List*",
        "lambda:GetPolicy",
        "cloudfront:List*",
        "ec2:Describe*",
        "s3:List*",
        "s3:GetBucketPolicy",
        "s3:GetBucketAcl",
        "iam:List*",
        "iam:Get*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

---

## Denied/Restricted Permissions

CloudPilot AI will **NOT** attempt these operations:

- ❌ Modify any resources (`Create*`, `Update*`, `Delete*`)
- ❌ Write access to buckets
- ❌ Terminate instances
- ❌ Delete security groups
- ❌ Modify IAM policies
- ❌ Stop/Start resources

All scanning is **read-only**.

---

## Permission Error Handling

When CloudPilot AI encounters permission errors:

1. **Missing Single Permission**: 
   - That service scan is skipped
   - Warning finding generated
   - Example: "Unable to scan RDS: Missing permission rds:DescribeDBInstances"
   - Other services continue normally

2. **Missing Multiple Permissions**:
   - Service scan fails gracefully
   - Multiple warning findings generated
   - Scan completes for other services

3. **Credential Invalid**:
   - Entire scan fails with auth error
   - Error message shown to user
   - No findings generated

4. **Region Not Specified**:
   - Scan attempts default region (us-east-1)
   - May find fewer resources
   - Consider specifying region

---

## Testing Permissions

### Verify Permissions in AWS Console

1. Go to **IAM → Users → Your User**
2. Click **Permissions** tab
3. Verify policies include required actions
4. Test specific permission:
   ```bash
   aws rds describe-db-instances --region us-east-1
   aws lambda list-functions --region us-east-1
   aws cloudfront list-distributions
   ```

### CloudPilot AI Permission Test

1. Enter credentials in Cloud Onboarding
2. Run scan with specific services
3. Check CloudPilot console logs for permission errors
4. If warnings appear, add missing permissions and retry

---

## Common Permission Issues

### Issue: "Access Denied" for RDS
**Solution**: Add `rds:DescribeDBInstances` and `rds:DescribeDBClusters`

### Issue: Lambda functions not showing
**Solution**: Add `lambda:ListFunctions`

### Issue: CloudFront distributions not showing
**Solution**: Add `cloudfront:ListDistributions`

### Issue: All services fail
**Solution**: Verify credentials and ensure policies are attached (not just created)

---

## AWS CLI Commands to Verify Access

```bash
# Test RDS access
aws rds describe-db-instances --region us-east-1

# Test Lambda access
aws lambda list-functions --region us-east-1

# Test CloudFront access
aws cloudfront list-distributions

# Test EC2 access
aws ec2 describe-instances --region us-east-1

# Test S3 access
aws s3 ls

# Test IAM access
aws iam list-users
```

If any command returns "Access Denied", add the corresponding permission.

---

## Multi-Region Scanning

For scanning multiple regions, CloudPilot AI will:

1. Use the region specified in AWS Connection settings
2. Scan that region for: RDS, Lambda, EC2, S3 (regional)
3. Scan globally for: IAM, CloudFront

To scan multiple regions:
- Create separate AWS Connections (one per region)
- Run separate scans
- CloudPilot aggregates results

---

## Compliance Notes

### SOC 2 Compliance
- Ensure CloudPilot's AWS user has MFA enabled
- Log all CloudPilot scans in CloudTrail
- Restrict CloudPilot AWS account access

### PCI-DSS
- Use temporary credentials (STS)
- Rotate access keys regularly
- Enable CloudTrail logging

### HIPAA
- Ensure data is encrypted in transit
- Verify CloudPilot is deployed in HIPAA-eligible region
- Enable CloudTrail for compliance audits

---

## Summary

| Service | Minimum Actions | Optional Actions |
|---------|-----------------|------------------|
| RDS | 2 | 3 |
| Lambda | 2 | 2 |
| CloudFront | 1 | 2 |
| EC2 | 2 | 3 |
| S3 | 1 | 3 |
| IAM | 1 | 4 |
| **Total** | **9** | **17** |

---

## Support

For permission issues:
1. Copy the **Minimal Permissions Policy**
2. Attach to IAM user running CloudPilot
3. Test each AWS CLI command above
4. Contact AWS Support if issues persist
5. Review CloudTrail logs for access denials
