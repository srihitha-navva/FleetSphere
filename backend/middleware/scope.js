import AppError from '../utils/AppError.js';

export function scopedFilter(req, extra = {}) {
  if (req.user.role === 'SUPER_ADMIN') return { ...extra };
  const filter = { ...extra, organization: req.user.organization };
  if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'DRIVER') filter.branch = req.user.branch;
  return filter;
}

export function applyOwnership(req, body = {}) {
  const owned = { ...body };
  if (req.user?.role === 'SUPER_ADMIN') {
    if (!owned.organization && req.user.organization) {
      owned.organization = req.user.organization;
    }
    return owned;
  }
  owned.organization = req.user.organization;
  if (req.user.branch && (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'DRIVER' || !owned.branch)) {
    owned.branch = req.user.branch;
  }
  return owned;
}

export function ensureScope(req, record) {
  if (req.user.role === 'SUPER_ADMIN') return;
  if (!record || String(record.organization) !== String(req.user.organization)) throw new AppError('Resource is outside your organization', 403);
  if ((req.user.role === 'BRANCH_MANAGER' || req.user.role === 'DRIVER') && String(record.branch) !== String(req.user.branch)) throw new AppError('Resource is outside your branch', 403);
}
