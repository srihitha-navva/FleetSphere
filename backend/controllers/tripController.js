import Trip from '../models/Trip.js';
import Driver from '../models/Driver.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyOwnership, ensureScope, scopedFilter } from '../middleware/scope.js';
import { audit } from '../utils/audit.js';
import { createTrip, ensureTripAvailability, updateTripStatus } from '../services/tripService.js';
import { listResponse, pagination } from '../utils/query.js';
const populated = 'vehicle driver route createdBy';
export const listTrips = asyncHandler(async (req, res) => { const { page, limit, skip } = pagination(req.query); const filter = scopedFilter(req); if (req.user.role === 'DRIVER') { const driver = await Driver.findOne({ user: req.user._id }); filter.driver = driver?._id || null; } for (const key of ['status', 'vehicle', 'driver', 'branch']) if (req.query[key] && !(key === 'branch' && req.user.role === 'BRANCH_MANAGER')) filter[key] = req.query[key]; if (req.query.search) filter.$or = ['tripNumber', 'source', 'destination'].map((x) => ({ [x]: { $regex: req.query.search, $options: 'i' } })); if (req.query.startDate || req.query.endDate) filter.scheduledStart = { ...(req.query.startDate && { $gte: new Date(req.query.startDate) }), ...(req.query.endDate && { $lte: new Date(req.query.endDate) }) }; const [data, total] = await Promise.all([Trip.find(filter).populate(populated).sort('-scheduledStart').skip(skip).limit(limit), Trip.countDocuments(filter)]); listResponse(res, data, total, page, limit); });
export const getTrip = asyncHandler(async (req, res) => { const trip = await Trip.findById(req.params.id).populate(populated); if (!trip) throw new AppError('Trip not found', 404); ensureScope(req, trip); if (req.user.role === 'DRIVER') { const driver = await Driver.findOne({ user: req.user._id }); if (String(trip.driver._id) !== String(driver?._id)) throw new AppError('You can only view your own trips', 403); } res.json({ success: true, data: trip }); });
export const createTripController = asyncHandler(async (req, res) => { const body = applyOwnership(req, req.body); const trip = await createTrip(body, req.user); await audit(req, 'CREATE', 'Trip', trip._id, `Created trip ${trip.tripNumber}`); res.status(201).json({ success: true, message: 'Trip created', data: trip }); });
export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new AppError('Trip not found', 404);
  ensureScope(req, trip);
  if (['COMPLETED', 'CANCELLED'].includes(trip.status)) throw new AppError('Closed trips cannot be edited', 409);
  const body = { ...req.body };
  delete body.organization;
  delete body.branch;
  const requestedStatus = body.status;
  delete body.status;
  if (body.vehicle || body.driver || body.scheduledStart || body.scheduledEnd) {
    await ensureTripAvailability({
      vehicle: body.vehicle || trip.vehicle,
      driver: body.driver || trip.driver,
      scheduledStart: body.scheduledStart || trip.scheduledStart,
      scheduledEnd: body.scheduledEnd || trip.scheduledEnd,
      excludeId: trip._id
    });
  }
  Object.assign(trip, body);
  if (requestedStatus && requestedStatus !== trip.status) {
    await updateTripStatus(trip, requestedStatus, req.user);
  } else {
    await trip.save();
  }
  await audit(req, 'UPDATE', 'Trip', trip._id, 'Updated trip');
  res.json({ success: true, message: 'Trip updated', data: trip });
});
export const setTripStatus = asyncHandler(async (req, res) => { const trip = await Trip.findById(req.params.id); if (!trip) throw new AppError('Trip not found', 404); ensureScope(req, trip); if (req.user.role === 'DRIVER') { const driver = await Driver.findOne({ user: req.user._id }); if (String(trip.driver) !== String(driver?._id)) throw new AppError('You can only update your own trip', 403); } const data = await updateTripStatus(trip, req.body.status, req.user, req.body.note); await audit(req, 'STATUS_CHANGE', 'Trip', data._id, `Trip status changed to ${data.status}`); res.json({ success: true, message: 'Trip status updated', data }); });
export const deleteTrip = asyncHandler(async (req, res) => { const trip = await Trip.findById(req.params.id); if (!trip) throw new AppError('Trip not found', 404); ensureScope(req, trip); if (!['PLANNED', 'CANCELLED'].includes(trip.status)) throw new AppError('Only planned or cancelled trips can be deleted', 409); await trip.deleteOne(); await audit(req, 'DELETE', 'Trip', trip._id, 'Deleted trip'); res.json({ success: true, message: 'Trip deleted' }); });
