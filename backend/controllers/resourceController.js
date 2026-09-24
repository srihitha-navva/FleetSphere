import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyOwnership, ensureScope, scopedFilter } from '../middleware/scope.js';
import { audit } from '../utils/audit.js';
import { dateFilter, listResponse, pagination } from '../utils/query.js';
import Driver from '../models/Driver.js';

const validId = (id) => mongoose.isValidObjectId(id);
const cleanBody = (obj) => {
  if (!obj || typeof obj !== 'object' || obj instanceof FormData) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== '' && value !== 'undefined' && value !== 'null' && value !== null && value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
};

export function resourceController(Model, entity, options = {}) {
  const populate = options.populate || '';
  const fileField = options.fileField;
  const queryFilter = async (req) => {
    const filter = scopedFilter(req);
    if (req.user.role === 'DRIVER' && options.driverField) {
      const driver = await Driver.findOne({ user: req.user._id });
      filter[options.driverField] = driver?._id || null;
    }
    for (const key of options.filters || ['status', 'branch', 'vehicleType', 'category', 'type', 'driver', 'vehicle']) if (req.query[key] && !(key === 'branch' && req.user.role === 'BRANCH_MANAGER')) filter[key] = req.query[key];
    if (req.query.search && options.searchFields?.length) filter.$or = options.searchFields.map((field) => ({ [field]: { $regex: req.query.search, $options: 'i' } }));
    return { ...filter, ...dateFilter(req.query, options.dateField || 'date') };
  };
  return {
    list: asyncHandler(async (req, res) => { const filter = await queryFilter(req); const { page, limit, skip } = pagination(req.query); const sort = req.query.sort || '-createdAt'; const [data, total] = await Promise.all([Model.find(filter).populate(populate).sort(sort).skip(skip).limit(limit), Model.countDocuments(filter)]); listResponse(res, data, total, page, limit); }),
    get: asyncHandler(async (req, res) => { if (!validId(req.params.id)) throw new AppError('Invalid resource identifier'); const data = await Model.findById(req.params.id).populate(populate); if (!data) throw new AppError(`${entity} not found`, 404); ensureScope(req, data); if (req.user.role === 'DRIVER' && options.driverField) { const driver = await Driver.findOne({ user: req.user._id }); if (String(data[options.driverField]?._id || data[options.driverField]) !== String(driver?._id)) throw new AppError('You can only access your own records', 403); } res.json({ success: true, data }); }),
    create: asyncHandler(async (req, res) => { let body = applyOwnership(req, cleanBody(req.body)); if (req.user.role === 'DRIVER' && options.driverField) { const driver = await Driver.findOne({ user: req.user._id }); if (!driver) throw new AppError('Driver profile not found', 404); body[options.driverField] = driver._id; } if (fileField && req.file) body[fileField] = `/uploads/${req.file.filename}`; if (options.beforeCreate) body = await options.beforeCreate(req, body); const data = await Model.create(body); if (options.afterSave) await options.afterSave(data, req); await audit(req, 'CREATE', entity, data._id, `Created ${entity}`); res.status(201).json({ success: true, message: `${entity} created`, data }); }),
    update: asyncHandler(async (req, res) => { if (!validId(req.params.id)) throw new AppError('Invalid resource identifier'); const existing = await Model.findById(req.params.id); if (!existing) throw new AppError(`${entity} not found`, 404); ensureScope(req, existing); if (req.user.role === 'DRIVER' && options.driverField) { const driver = await Driver.findOne({ user: req.user._id }); if (String(existing[options.driverField]) !== String(driver?._id)) throw new AppError('You can only update your own records', 403); } let body = cleanBody(req.body); delete body.organization; delete body.branch; if (fileField && req.file) body[fileField] = `/uploads/${req.file.filename}`; if (options.beforeUpdate) body = await options.beforeUpdate(req, existing, body); const data = await Model.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true }); if (options.afterSave) await options.afterSave(data, req); await audit(req, 'UPDATE', entity, data._id, `Updated ${entity}`); res.json({ success: true, message: `${entity} updated`, data }); }),
    remove: asyncHandler(async (req, res) => { if (!validId(req.params.id)) throw new AppError('Invalid resource identifier'); const data = await Model.findById(req.params.id); if (!data) throw new AppError(`${entity} not found`, 404); ensureScope(req, data); if (req.user.role === 'DRIVER' && options.driverField) { const driver = await Driver.findOne({ user: req.user._id }); if (String(data[options.driverField]) !== String(driver?._id)) throw new AppError('You can only delete your own records', 403); } await data.deleteOne(); await audit(req, 'DELETE', entity, data._id, `Deleted ${entity}`); res.json({ success: true, message: `${entity} deleted` }); })
  };
}
