import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'backend', 'data', 'localDb.json');

// Helper to ensure database file exists
const ensureDbFile = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      awsConnections: [],
      scans: [],
      securityFindings: [],
      notifications: [],
      auditLogs: [],
      cloudResources: [],
      terraformFixes: []
    }, null, 2));
  }
};

// Read database
export const readLocalDb = (): any => {
  try {
    ensureDbFile();
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.users) parsed.users = [];
    if (!parsed.awsConnections) parsed.awsConnections = [];
    if (!parsed.scans) parsed.scans = [];
    if (!parsed.securityFindings) parsed.securityFindings = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.auditLogs) parsed.auditLogs = [];
    if (!parsed.cloudResources) parsed.cloudResources = [];
    if (!parsed.terraformFixes) parsed.terraformFixes = [];
    return parsed;
  } catch (error) {
    console.error('Error reading local db file:', error);
    return {
      users: [],
      awsConnections: [],
      scans: [],
      securityFindings: [],
      notifications: [],
      auditLogs: [],
      cloudResources: [],
      terraformFixes: []
    };
  }
};

// Write database
export const writeLocalDb = (data: any) => {
  try {
    ensureDbFile();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing local db file:', error);
  }
};

// User Operations
export const localFindUserByEmail = async (email: string) => {
  const db = readLocalDb();
  return db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const localFindUserById = async (id: string) => {
  const db = readLocalDb();
  return db.users.find((u: any) => u._id === id) || null;
};

export const localCreateUser = async (userData: any) => {
  const db = readLocalDb();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const newUser = {
    _id: 'local_user_' + Math.random().toString(36).substring(2, 11),
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    profileImage: '',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  writeLocalDb(db);
  
  // Return without secret password
  const { password, ...result } = newUser;
  return result;
};

export const localComparePassword = async (enteredPassword: string, hashed: string) => {
  return await bcrypt.compare(enteredPassword, hashed);
};

export const localUpdateUserProfile = async (id: string, updates: any) => {
  const db = readLocalDb();
  const index = db.users.findIndex((u: any) => u._id === id);
  if (index === -1) return null;
  
  const user = db.users[index];
  if (updates.name) user.name = updates.name;
  if (updates.email) user.email = updates.email;
  if (updates.profileImage !== undefined) user.profileImage = updates.profileImage;
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(updates.password, salt);
  }
  
  db.users[index] = user;
  writeLocalDb(db);
  
  const { password, ...result } = user;
  return result;
};

// AWS Connections
export const localFindAWSConnection = async (userId: string) => {
  const db = readLocalDb();
  return db.awsConnections.find((c: any) => c.userId === userId) || null;
};

export const localSaveAWSConnection = async (userId: string, data: any) => {
  const db = readLocalDb();
  let connIndex = db.awsConnections.findIndex((c: any) => c.userId === userId);
  
  const conn = {
    _id: connIndex !== -1 ? db.awsConnections[connIndex]._id : 'local_conn_' + Math.random().toString(36).substring(2, 11),
    userId,
    accessKeyId: data.accessKeyId,
    secretAccessKey: data.secretAccessKey,
    region: data.region || 'us-east-1',
    selectedServices: data.selectedServices || ['EC2', 'S3', 'IAM', 'SG'],
    status: data.status || 'Connected',
    accountId: data.accountId || '882100451922',
    lastScan: data.lastScan || new Date().toISOString(),
    createdAt: connIndex !== -1 ? db.awsConnections[connIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (connIndex !== -1) {
    db.awsConnections[connIndex] = conn;
  } else {
    db.awsConnections.push(conn);
  }
  writeLocalDb(db);
  return conn;
};

// Scans
export const localCreateScan = async (userId: string, data: any) => {
  const db = readLocalDb();
  const scan = {
    _id: 'local_scan_' + Date.now(),
    userId,
    status: data.status || 'running',
    progress: data.progress || 0,
    currentStep: data.currentStep || 'Starting Cloud Reconnaissance...',
    servicesScanned: data.servicesScanned || [],
    findingsCount: data.findingsCount || { critical: 0, high: 0, medium: 0, low: 0 },
    createdAt: new Date().toISOString(),
    completedAt: data.completedAt || null
  };
  db.scans.push(scan);
  writeLocalDb(db);
  return scan;
};

export const localFindScanById = async (id: string) => {
  const db = readLocalDb();
  return db.scans.find((s: any) => s._id === id) || null;
};

export const localUpdateScan = async (id: string, updates: any) => {
  const db = readLocalDb();
  const index = db.scans.findIndex((s: any) => s._id === id);
  if (index === -1) return null;
  const scan = { ...db.scans[index], ...updates, updatedAt: new Date().toISOString() };
  db.scans[index] = scan;
  writeLocalDb(db);
  return scan;
};

export const localGetScans = async (userId: string) => {
  const db = readLocalDb();
  return db.scans.filter((s: any) => s.userId === userId).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
};

// Cloud Resources and Findings
export const localGetCloudResources = async (userId: string) => {
  const db = readLocalDb();
  return db.cloudResources.filter((r: any) => r.userId === userId);
};

export const localSaveCloudResource = async (userId: string, r: any) => {
  const db = readLocalDb();
  const index = db.cloudResources.findIndex((item: any) => item.userId === userId && item.resourceId === r.resourceId);
  const resource = {
    _id: index !== -1 ? db.cloudResources[index]._id : 'local_res_' + Math.random().toString(36).substring(2, 11),
    userId,
    resourceId: r.resourceId,
    name: r.name,
    type: r.type,
    region: r.region,
    monthlyCost: r.monthlyCost,
    status: r.status,
    riskLevel: r.riskLevel || 'Safe',
    createdAt: index !== -1 ? db.cloudResources[index].createdAt : new Date().toISOString()
  };
  if (index !== -1) {
    db.cloudResources[index] = resource;
  } else {
    db.cloudResources.push(resource);
  }
  writeLocalDb(db);
  return resource;
};

export const localSaveMultipleResources = async (userId: string, resources: any[]) => {
  const db = readLocalDb();
  // Clear existing resources for this user to avoid stale lists
  db.cloudResources = db.cloudResources.filter((r: any) => r.userId !== userId);
  for (const r of resources) {
    db.cloudResources.push({
      _id: 'local_res_' + Math.random().toString(36).substring(2, 11),
      userId,
      ...r,
      createdAt: new Date().toISOString()
    });
  }
  writeLocalDb(db);
};

export const localGetSecurityFindings = async (userId: string) => {
  const db = readLocalDb();
  return db.securityFindings.filter((f: any) => f.userId === userId);
};

export const localSaveMultipleFindings = async (userId: string, findings: any[]) => {
  const db = readLocalDb();
  // Clear existing findings for user to keep lists clean
  db.securityFindings = db.securityFindings.filter((f: any) => f.userId !== userId);
  for (const f of findings) {
    db.securityFindings.push({
      _id: 'local_finding_' + Math.random().toString(36).substring(2, 11),
      userId,
      ...f,
      createdAt: new Date().toISOString()
    });
  }
  writeLocalDb(db);
};

// Notifications and Audit Logs
export const localCreateNotification = async (userId: string, n: any) => {
  const db = readLocalDb();
  const notification = {
    _id: 'local_notif_' + Math.random().toString(36).substring(2, 11),
    userId,
    title: n.title,
    message: n.message,
    type: n.type || 'scan',
    severity: n.severity || 'Info',
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);
  writeLocalDb(db);
  return notification;
};

export const localCreateAuditLog = async (userId: string, log: any) => {
  const db = readLocalDb();
  const audit = {
    _id: 'local_audit_' + Math.random().toString(36).substring(2, 11),
    userId,
    action: log.action,
    service: log.service,
    details: log.details,
    severity: log.severity || 'Info',
    createdAt: new Date().toISOString()
  };
  db.auditLogs.push(audit);
  writeLocalDb(db);
  return audit;
};

export const localCreateTerraformFix = async (userId: string, fix: any) => {
  const db = readLocalDb();
  const fixObj = {
    _id: 'local_tf_' + Math.random().toString(36).substring(2, 11),
    userId,
    resourceId: fix.resourceId,
    issueType: fix.issueType,
    code: fix.code,
    status: fix.status || 'Generated',
    createdAt: new Date().toISOString()
  };
  db.terraformFixes.push(fixObj);
  writeLocalDb(db);
  return fixObj;
};

export const localGetTerraformHistory = async (userId: string) => {
  const db = readLocalDb();
  return db.terraformFixes.filter((f: any) => f.userId === userId).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
};
