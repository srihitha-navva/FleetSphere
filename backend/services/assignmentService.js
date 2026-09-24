import Assignment from '../models/Assignment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import AppError from '../utils/AppError.js';

export async function assignVehicle({ vehicleId, driverId, user }) {
  const [vehicle, driver] = await Promise.all([Vehicle.findById(vehicleId), Driver.findById(driverId)]);
  if (!vehicle || !driver) throw new AppError('Vehicle or driver was not found', 404);
  if (String(vehicle.organization) !== String(user.organization) || String(driver.organization) !== String(user.organization)) throw new AppError('Resources must belong to your organization', 403);
  if (user.role === 'BRANCH_MANAGER' && (String(vehicle.branch) !== String(user.branch) || String(driver.branch) !== String(user.branch))) throw new AppError('Resources must belong to your branch', 403);
  if (['MAINTENANCE', 'INACTIVE'].includes(vehicle.status)) throw new AppError('This vehicle cannot be assigned in its current status', 409);
  if (driver.status === 'INACTIVE') throw new AppError('This driver cannot be assigned', 409);
  const existing = await Assignment.findOne({ isActive: true, $or: [{ vehicle: vehicle._id }, { driver: driver._id }] });
  if (existing) throw new AppError('Vehicle or driver already has an active assignment', 409);
  const assignment = await Assignment.create({ vehicle: vehicle._id, driver: driver._id, organization: vehicle.organization, branch: vehicle.branch, assignedBy: user._id });
  await Promise.all([Vehicle.findByIdAndUpdate(vehicle._id, { assignedDriver: driver._id, status: 'ASSIGNED' }), Driver.findByIdAndUpdate(driver._id, { assignedVehicle: vehicle._id, status: 'ASSIGNED' })]);
  return assignment;
}

export async function unassignVehicle(assignment) {
  if (!assignment.isActive) throw new AppError('Assignment is already inactive', 409);
  assignment.isActive = false; assignment.unassignedAt = new Date(); await assignment.save();
  await Promise.all([Vehicle.findByIdAndUpdate(assignment.vehicle, { assignedDriver: null, status: 'AVAILABLE' }), Driver.findByIdAndUpdate(assignment.driver, { assignedVehicle: null, status: 'AVAILABLE' })]);
  return assignment;
}
