import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listResponse, pagination } from '../utils/query.js';
import AppError from '../utils/AppError.js';
export const listNotifications = asyncHandler(async (req, res) => { const { page, limit, skip } = pagination(req.query); const filter = { user: req.user._id, ...(req.query.unread === 'true' && { isRead: false }) }; const [data, total] = await Promise.all([Notification.find(filter).sort('-createdAt').skip(skip).limit(limit), Notification.countDocuments(filter)]); listResponse(res, data, total, page, limit); });
export const markRead = asyncHandler(async (req, res) => { const data = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true }); if (!data) throw new AppError('Notification not found', 404); res.json({ success: true, data }); });
export const markAllRead = asyncHandler(async (req, res) => { await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true }); res.json({ success: true, message: 'Notifications marked as read' }); });
