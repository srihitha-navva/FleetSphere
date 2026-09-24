import AuditLog from '../models/AuditLog.js';

export async function audit(req, action, entity, entityId, description) {
  if (!req.user) return;
  await AuditLog.create({ user: req.user._id, action, entity, entityId, description, ipAddress: req.ip, organization: req.user.organization, branch: req.user.branch });
}
