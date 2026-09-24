import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw new AppError('Authentication required', 401);
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id).select('-password');
  if (!user || !user.isActive) throw new AppError('Your account is unavailable', 401);
  req.user = user;
  next();
});

export const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : next(new AppError('You do not have permission for this action', 403));
export const staffRoles = ['SUPER_ADMIN', 'FLEET_MANAGER', 'BRANCH_MANAGER'];
export const financeRoles = ['SUPER_ADMIN', 'FLEET_MANAGER', 'BRANCH_MANAGER', 'FINANCE_OFFICER'];
