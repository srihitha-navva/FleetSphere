import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';

export async function refreshMaintenanceStatus(filter = {}) {
  await Maintenance.updateMany({ ...filter, status: 'SCHEDULED', serviceDate: { $lt: new Date() } }, { status: 'OVERDUE' });
}
export async function syncVehicleMaintenance(maintenance) {
  if (maintenance.status === 'IN_PROGRESS') await Vehicle.findByIdAndUpdate(maintenance.vehicle, { status: 'MAINTENANCE' });
  if (maintenance.status === 'COMPLETED' || maintenance.status === 'CANCELLED') await Vehicle.findOneAndUpdate({ _id: maintenance.vehicle, status: 'MAINTENANCE' }, { status: 'AVAILABLE' });
}
