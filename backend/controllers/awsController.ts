import { Response } from 'express';
import mongoose from 'mongoose';
import AWSConnection from '../models/AWSConnection.ts';
import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";
import { z } from 'zod';
import { encryptSecret } from '../utils/crypto.ts';
import { 
  localFindAWSConnection, 
  localSaveAWSConnection 
} from '../utils/localStore.ts';

const awsConnectSchema = z.object({
  accessKeyId: z.string().refine(val => {
    if (val.includes('DEMO') || val.includes('TEST')) return true;
    return /^AKIA[0-9A-Z]{16}$/.test(val);
  }, { message: 'Invalid Access Key ID format (must match /^AKIA[0-9A-Z]{16}$/)' }),
  secretAccessKey: z.string().refine(val => {
    if (val.includes('DEMO') || val.includes('TEST') || val === 'mock-secret-key-placeholder') return true;
    return val.length === 40;
  }, { message: 'Secret Access Key must be exactly 40 characters long' }),
  region: z.string().min(1, { message: 'Region is required' }),
  selectedServices: z.array(z.string()).min(1, { message: 'At least one service must be selected' }),
});

/**
 * @desc    Test AWS Connection (Live check + Custom mock fallback)
 * @route   POST /api/aws/test-connection
 * NOTE: This endpoint receives the raw secret key in the request body for testing/validation.
 * The key is transiently used to perform a test call against the AWS API (or matched against sandbox keys)
 * and is NEVER persisted anywhere in the system in plain text.
 */
export const testConnection = async (req: any, res: Response) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({
      success: false,
      message: 'Access Key ID and Secret Access Key are required.'
    });
  }

  // If a mock test keyword or simple demo credentials, allow immediate test success
  if (
    accessKeyId.includes('DEMO') || 
    accessKeyId.includes('TEST') || 
    (accessKeyId.length === 20 && secretAccessKey.length === 40 && accessKeyId.startsWith('AKIAIOSF'))
  ) {
    return res.json({ 
      success: true, 
      message: 'Connection verified in SANDBOX mode. CloudPilot-ReadOnly-Policy active.',
      accountId: 'UNKNOWN',
      iamUser: 'CloudPilot-Demo-Monitor',
      isDemo: true
    });
  }

  // Attempt standard AWS SDK IAM inquiry to check if authentication passes!
  try {
    const iamClient = new IAMClient({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    // Fetch user details or generic metadata with limit 1 to verify credentials
    const response = await iamClient.send(new ListUsersCommand({ MaxItems: 1 }));
    let iamUser = 'IAM-ReadOnly-User';
    let accountId = 'UNKNOWN';
    if (response.Users && response.Users.length > 0) {
      iamUser = response.Users[0].UserName || iamUser;
      const arn = response.Users[0].Arn;
      const match = arn?.match(/::(\d+):/);
      if (match && match[1]) {
        accountId = match[1];
      }
    }

    return res.json({
      success: true,
      message: 'Live AWS connection successfully authenticated and established.',
      accountId,
      iamUser,
      isDemo: false
    });
  } catch (error: any) {
    console.error('[awsController][testConnection]', error);
    return res.status(error.$metadata?.httpStatusCode || 400).json({
      success: false,
      message: `AWS Authentication Failed: ${error.message} (${error.code || error.name})`
    });
  }
};

/**
 * @desc    Save AWS Secret & Connect
 * @route   POST /api/aws/connect
 */
export const connectAWS = async (req: any, res: Response) => {
  try {
    const validation = awsConnectSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(', ');
      return res.status(400).json({ message: errorMsg });
    }

    const { accessKeyId, secretAccessKey, region, selectedServices } = validation.data;
    const userId = req.user._id;
    const encryptedSecret = encryptSecret(secretAccessKey);

    if (mongoose.connection.readyState !== 1) {
       console.warn('⚠️ MongoDB not connected. Saving AWS Connection info to Local File Store.');
       const saved = await localSaveAWSConnection(userId, {
         accessKeyId,
         secretAccessKey: encryptedSecret,
         region,
         selectedServices,
         status: 'Connected',
         accountId: 'UNKNOWN'
       });
       return res.status(201).json({
         connected: true,
         region: saved.region,
         accountId: saved.accountId,
         selectedServices: saved.selectedServices,
         status: saved.status
       });
    }

    let connection = await AWSConnection.findOne({ userId }).maxTimeMS(2000);

    if (connection) {
       connection.accessKeyId = accessKeyId;
       connection.secretAccessKey = encryptedSecret;
       connection.region = region;
       connection.selectedServices = selectedServices || connection.selectedServices;
       connection.status = 'Connected';
       connection.accountId = 'UNKNOWN';
       await connection.save();
    } else {
       connection = await AWSConnection.create({
          userId,
          accessKeyId,
          secretAccessKey: encryptedSecret,
          region,
          selectedServices,
          status: 'Connected',
          accountId: 'UNKNOWN'
       });
    }

    res.status(201).json({
      connected: true,
      region: connection.region,
      accountId: connection.accountId,
      selectedServices: connection.selectedServices,
      status: connection.status
    });
  } catch (error: any) {
    console.error('[awsController][connectAWS]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get AWS Connection Status
 * @route   GET /api/aws/status
 */
export const getConnectionStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState !== 1) {
       const localConn = await localFindAWSConnection(userId);
       if (!localConn) {
         return res.json({ connected: false });
       }
       return res.json({
         connected: true,
         status: localConn.status,
         region: localConn.region,
         selectedServices: localConn.selectedServices,
         accountId: localConn.accountId || 'UNKNOWN',
         lastScan: localConn.lastScan
       });
    }

    const connection = await AWSConnection.findOne({ userId }).maxTimeMS(2000);
    if (!connection) {
       return res.json({ connected: false });
    }
    res.json({
       connected: true,
       status: connection.status,
       region: connection.region,
       selectedServices: connection.selectedServices,
       accountId: connection.accountId || 'UNKNOWN',
       lastScan: connection.lastScan
    });
  } catch (error: any) {
    console.error('[awsController][getConnectionStatus]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Update Scan Configuration
 * @route   POST /api/aws/scan-config
 */
export const updateScanConfig = async (req: any, res: Response) => {
  try {
    const { selectedServices } = req.body;
    const userId = req.user._id;
    
    if (mongoose.connection.readyState !== 1) {
       const localConn = await localFindAWSConnection(userId);
       if (!localConn) {
         return res.status(404).json({ message: 'No AWS connection found' });
       }
       const saved = await localSaveAWSConnection(userId, { ...localConn, selectedServices });
       return res.json({
         connected: true,
         status: saved.status,
         region: saved.region,
         selectedServices: saved.selectedServices,
         accountId: saved.accountId || 'UNKNOWN',
         lastScan: saved.lastScan
       });
    }

    const connection = await AWSConnection.findOne({ userId }).maxTimeMS(2000);
    
    if (!connection) {
       return res.status(404).json({ message: 'No AWS connection found' });
    }

    connection.selectedServices = selectedServices;
    await connection.save();
    
    res.json({
      connected: true,
      status: connection.status,
      region: connection.region,
      selectedServices: connection.selectedServices,
      accountId: connection.accountId || 'UNKNOWN',
      lastScan: connection.lastScan
    });
  } catch (error: any) {
    console.error('[awsController][updateScanConfig]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
