import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanActionLiveAWS } from '../backend/utils/awsScanner.ts';

// Mock S3 Client
const mockS3Send = vi.fn();
vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send(cmd: any) {
      return mockS3Send(cmd);
    }
  }
  class ListBucketsCommand {
    constructor(public input: any) {}
  }
  return { S3Client, ListBucketsCommand };
});

// Mock EC2 Client
const mockEC2Send = vi.fn();
vi.mock('@aws-sdk/client-ec2', () => {
  class EC2Client {
    send(cmd: any) {
      return mockEC2Send(cmd);
    }
  }
  class DescribeInstancesCommand {
    constructor(public input: any) {}
  }
  class DescribeSecurityGroupsCommand {
    constructor(public input: any) {}
  }
  return { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand };
});

// Mock IAM Client
const mockIAMSend = vi.fn();
vi.mock('@aws-sdk/client-iam', () => {
  class IAMClient {
    send(cmd: any) {
      return mockIAMSend(cmd);
    }
  }
  class ListUsersCommand {
    constructor(public input: any) {}
  }
  return { IAMClient, ListUsersCommand };
});

describe('awsScanner unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 S3 resources when scopes is only EC2', async () => {
    mockEC2Send.mockResolvedValueOnce({ Reservations: [] });
    mockIAMSend.mockResolvedValue({ Users: [] });

    const result = await scanActionLiveAWS(
      'AKIA1234567890123456',
      'mock-secret-key-placeholder',
      'us-east-1',
      ['EC2']
    );

    const s3Resources = result.resources.filter(r => r.type === 'S3');
    expect(s3Resources.length).toBe(0);
  });

  it('should return S3 buckets when S3 scope is selected', async () => {
    mockS3Send.mockResolvedValueOnce({
      Buckets: [{ Name: 'my-test-bucket' }]
    });
    mockIAMSend.mockResolvedValue({ Users: [] });

    const result = await scanActionLiveAWS(
      'AKIA1234567890123456',
      'mock-secret-key-placeholder',
      'us-east-1',
      ['S3']
    );

    const s3Resources = result.resources.filter(r => r.type === 'S3');
    expect(s3Resources.length).toBe(1);
    expect(s3Resources[0].name).toBe('my-test-bucket');
  });

  it('should create a Critical finding when port 22 is open to the world', async () => {
    mockEC2Send.mockResolvedValueOnce({
      SecurityGroups: [{
        GroupId: 'sg-123',
        GroupName: 'ssh-open-sg',
        IpPermissions: [{
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0' }]
        }]
      }]
    });
    mockIAMSend.mockResolvedValue({ Users: [] });

    const result = await scanActionLiveAWS(
      'AKIA1234567890123456',
      'mock-secret-key-placeholder',
      'us-east-1',
      ['SG']
    );

    const criticalFindings = result.findings.filter(f => f.severity === 'Critical');
    expect(criticalFindings.length).toBe(1);
    expect(criticalFindings[0].issue).toContain('Port 22 open to the world');
  });

  it('should throw with AWS Signature Verification Failed when invalid credentials mock is encountered', async () => {
    const error = new Error('The request signature we calculated does not match');
    error.name = 'SignatureDoesNotMatch';
    mockS3Send.mockRejectedValueOnce(error);
    mockIAMSend.mockResolvedValue({ Users: [] });

    await expect(scanActionLiveAWS(
      'AKIA1234567890123456',
      'wrong-secret-access-key-format',
      'us-east-1',
      ['S3']
    )).rejects.toThrow('AWS Signature Verification Failed');
  });
});
