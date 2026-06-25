import mongoose from 'mongoose';
import { Response } from 'express';
import CloudResource from '../models/CloudResource.ts';
import AWSConnection from '../models/AWSConnection.ts';
import { localFindAWSConnection } from '../utils/localStore.ts';

const serviceTypeMap: Record<string, string> = {
  'EC2': 'EC2',
  'S3': 'S3', 
  'IAM': 'IAM',
  'RDS': 'RDS',
  'SG': 'Security Group',
  'EBS': 'EBS',
};

const isSelected = (resourceType: string, selectedServices?: string[]): boolean => {
  if (!selectedServices || !Array.isArray(selectedServices)) return false;
  return Object.entries(serviceTypeMap).some(([serviceName, mappedType]) => {
    return mappedType === resourceType && selectedServices.includes(serviceName);
  });
};

/**
 * @desc    Get cloud resources inventory
 * @route   GET /api/resources
 */
export const getResources = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    const hardcodedResources = [
      {
        resourceId: 'i-09f8e7d6c5b4a3',
        name: 'prod-frontend-01',
        type: 'EC2',
        region: 'us-east-1',
        status: 'running',
        riskLevel: 'Medium',
        monthlyCost: 85.50,
        tags: { 'Environment': 'Production', 'Service': 'Frontend' },
      },
      {
        resourceId: 's3-bucket-customer-data-v2',
        name: 'Customer-Storage',
        type: 'S3',
        region: 'us-west-2',
        status: 'active',
        riskLevel: 'Critical',
        monthlyCost: 240.10,
        tags: { 'Compliance': 'GDPR' },
      },
      {
        resourceId: 'db-aurora-cluster-main',
        name: 'Core-Database',
        type: 'RDS',
        region: 'eu-central-1',
        status: 'available',
        riskLevel: 'Low',
        monthlyCost: 450.00,
        tags: { 'App': 'Core' },
      },
      {
        resourceId: 'iam-role-admin-temp',
        name: 'Temporary-Admin',
        type: 'IAM',
        region: 'global',
        status: 'active',
        riskLevel: 'High',
        monthlyCost: 0,
      },
      {
        resourceId: 'sg-0a2b3c4d5e6f7',
        name: 'ssh-allow-all',
        type: 'Security Group',
        region: 'us-east-1',
        status: 'active',
        riskLevel: 'Critical',
        monthlyCost: 0,
      },
      {
        resourceId: 'vol-321456987',
        name: 'unused-data-vol',
        type: 'EBS',
        region: 'us-east-1',
        status: 'available',
        riskLevel: 'Safe',
        monthlyCost: 35.40,
      }
    ];

    if (mongoose.connection.readyState !== 1) {
       const awsConn = await localFindAWSConnection(userId);
       if (!awsConn) {
         return res.json([]);
       }
       const selected = awsConn.selectedServices || [];
       const filtered = hardcodedResources.filter(r => isSelected(r.type, selected));
       return res.json(filtered);
    }

    // Checking of AWSConnection presence for the database path
    const dbAWSConn = await AWSConnection.findOne({ userId }).maxTimeMS(2000);
    if (!dbAWSConn) {
      return res.json([]);
    }

    let resources = await CloudResource.find({ userId });

    // Seed mock data if none exists
    if (resources.length === 0) {
      resources = (await seedMockResources(userId)) as any;
    }

    res.json(resources);
  } catch (error: any) {
    console.error('[resourceController][getResources]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const seedMockResources = async (userId: any) => {
  const dbAWSConn = await AWSConnection.findOne({ userId }).maxTimeMS(2000);
  if (!dbAWSConn) {
    return [];
  }
  const selected = dbAWSConn.selectedServices || [];

  const mockResources = [
    {
      userId,
      resourceId: 'i-09f8e7d6c5b4a3',
      name: 'prod-frontend-01',
      type: 'EC2',
      region: 'us-east-1',
      status: 'running',
      riskLevel: 'Medium',
      monthlyCost: 85.50,
      tags: { 'Environment': 'Production', 'Service': 'Frontend' },
    },
    {
      userId,
      resourceId: 's3-bucket-customer-data-v2',
      name: 'Customer-Storage',
      type: 'S3',
      region: 'us-west-2',
      status: 'active',
      riskLevel: 'Critical',
      monthlyCost: 240.10,
      tags: { 'Compliance': 'GDPR' },
    },
    {
      userId,
      resourceId: 'db-aurora-cluster-main',
      name: 'Core-Database',
      type: 'RDS',
      region: 'eu-central-1',
      status: 'available',
      riskLevel: 'Low',
      monthlyCost: 450.00,
      tags: { 'App': 'Core' },
    },
    {
      userId,
      resourceId: 'iam-role-admin-temp',
      name: 'Temporary-Admin',
      type: 'IAM',
      region: 'global',
      status: 'active',
      riskLevel: 'High',
      monthlyCost: 0,
    },
    {
      userId,
      resourceId: 'sg-0a2b3c4d5e6f7',
      name: 'ssh-allow-all',
      type: 'Security Group',
      region: 'us-east-1',
      status: 'active',
      riskLevel: 'Critical',
      monthlyCost: 0,
    },
    {
      userId,
      resourceId: 'vol-321456987',
      name: 'unused-data-vol',
      type: 'EBS',
      region: 'us-east-1',
      status: 'available',
      riskLevel: 'Safe',
      monthlyCost: 35.40,
    }
  ];

  const filtered = mockResources.filter(r => isSelected(r.type, selected));
  if (filtered.length === 0) {
    return [];
  }

  return await CloudResource.insertMany(filtered as any[]);
};
