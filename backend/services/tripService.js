import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import AppError from '../utils/AppError.js';
import { notify } from '../utils/notifications.js';

const activeStatuses = ['PLANNED', 'ASSIGNED', 'STARTED', 'DELAYED'];
const transitions = { PLANNED: ['ASSIGNED', 'CANCELLED'], ASSIGNED: ['STARTED', 'DELAYED', 'CANCELLED'], STARTED: ['COMPLETED', 'DELAYED', 'CANCELLED'], DELAYED: ['STARTED', 'COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };

export async function ensureTripAvailability({ vehicle, driver, scheduledStart, scheduledEnd, excludeId }) {
  if (new Date(scheduledStart) >= new Date(scheduledEnd)) throw new AppError('Scheduled end must be after scheduled start');
  const [vehicleData, driverData] = await Promise.all([Vehicle.findById(vehicle), Driver.findById(driver)]);
  if (!vehicleData || !driverData) throw new AppError('Vehicle or driver was not found', 404);
  if (['MAINTENANCE', 'INACTIVE'].includes(vehicleData.status) || ['INACTIVE', 'ON_LEAVE'].includes(driverData.status)) throw new AppError('Vehicle or driver is unavailable for this trip', 409);
  const conflict = { status: { $in: activeStatuses }, scheduledStart: { $lt: new Date(scheduledEnd) }, scheduledEnd: { $gt: new Date(scheduledStart) }, ...(excludeId && { _id: { $ne: excludeId } }) };
  const [vehicleConflict, driverConflict] = await Promise.all([Trip.exists({ ...conflict, vehicle }), Trip.exists({ ...conflict, driver })]);
  if (vehicleConflict) throw new AppError('Vehicle has an overlapping trip', 409);
  if (driverConflict) throw new AppError('Driver has an overlapping trip', 409);
  return { vehicleData, driverData };
}

export async function updateTripStatus(trip, status, user, note = '') {
  if (!transitions[trip.status]?.includes(status)) throw new AppError(`Invalid transition from ${trip.status} to ${status}`, 400);
  trip.status = status; trip.statusHistory.push({ status, changedBy: user._id, note });
  if (status === 'STARTED') { trip.actualStart ||= new Date(); await Promise.all([Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'ON_TRIP' }), Driver.findByIdAndUpdate(trip.driver, { status: 'ON_TRIP' })]); }
  if (status === 'COMPLETED') {
    trip.actualEnd ||= new Date();
    if (trip.endOdometer != null && trip.startOdometer != null) trip.distance = trip.endOdometer - trip.startOdometer;
    await Promise.all([Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'ASSIGNED', ...(trip.endOdometer != null && { odometer: trip.endOdometer }) }), Driver.findByIdAndUpdate(trip.driver, { status: 'ASSIGNED' })]);
  }
  if (status === 'CANCELLED') await Promise.all([Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'ASSIGNED' }), Driver.findByIdAndUpdate(trip.driver, { status: 'ASSIGNED' })]);
  await trip.save();
  return trip;
}

export async function createTrip(body, user) {
  if (!body.tripNumber) body.tripNumber = `TRP-${Date.now().toString().slice(-6)}`;
  await ensureTripAvailability(body);
  const trip = await Trip.create({ ...body, createdBy: user._id, statusHistory: [{ status: body.status || 'PLANNED', changedBy: user._id }] });
  const driver = await Driver.findById(trip.driver).populate('user');
  if (driver?.user) notify(driver.user._id, 'Trip assigned', `You have been assigned to trip ${trip.tripNumber}`, 'TRIP_ASSIGNED', trip._id);
  return trip;
}
