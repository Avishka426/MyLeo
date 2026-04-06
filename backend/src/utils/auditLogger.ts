import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

interface AuditEntry {
  userId: mongoose.Types.ObjectId | string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

const auditLogger = async (entry: AuditEntry): Promise<void> => {
  await AuditLog.create({
    user: entry.userId,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    details: entry.details,
    ipAddress: entry.ipAddress,
  });
};

export default auditLogger;
