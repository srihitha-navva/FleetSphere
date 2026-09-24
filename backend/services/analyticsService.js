import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import FuelEntry from '../models/FuelEntry.js';
import Maintenance from '../models/Maintenance.js';
import Expense from '../models/Expense.js';
import Incident from '../models/Incident.js';
import { scopedFilter } from '../middleware/scope.js';

const sum = async (Model, match, field) => (await Model.aggregate([{ $match: match }, { $group: { _id: null, value: { $sum: `$${field}` } } }]))[0]?.value || 0;
export async function overview(req) {
  const scope = scopedFilter(req); const tripScope = { ...scope, ...(req.query.startDate || req.query.endDate ? { scheduledStart: { ...(req.query.startDate && { $gte: new Date(req.query.startDate) }), ...(req.query.endDate && { $lte: new Date(req.query.endDate) }) } } : {}) };
  const [vehicles, drivers, trips, fuelCost, maintenanceCost, expenseTotal, kilometers, liters, overdue, incidents] = await Promise.all([
    Vehicle.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]), Driver.countDocuments({ ...scope, status: { $ne: 'INACTIVE' } }), Trip.aggregate([{ $match: tripScope }, { $group: { _id: '$status', count: { $sum: 1 } } }]), sum(FuelEntry, scope, 'totalCost'), sum(Maintenance, scope, 'totalCost'), sum(Expense, scope, 'amount'), sum(Trip, { ...scope, status: 'COMPLETED' }, 'distance'), sum(FuelEntry, scope, 'liters'), Maintenance.countDocuments({ ...scope, status: 'OVERDUE' }), Incident.countDocuments({ ...scope, status: { $in: ['REPORTED', 'UNDER_INVESTIGATION'] } })
  ]);
  const count = (rows, key) => rows.find((x) => x._id === key)?.count || 0;
  const operationalCost = fuelCost + maintenanceCost + expenseTotal;
  return { totalVehicles: vehicles.reduce((n, x) => n + x.count, 0), availableVehicles: count(vehicles, 'AVAILABLE'), assignedVehicles: count(vehicles, 'ASSIGNED'), vehiclesOnTrip: count(vehicles, 'ON_TRIP'), vehiclesInMaintenance: count(vehicles, 'MAINTENANCE'), totalDrivers: drivers, completedTrips: count(trips, 'COMPLETED'), ongoingTrips: count(trips, 'STARTED') + count(trips, 'DELAYED'), cancelledTrips: count(trips, 'CANCELLED'), totalFuelCost: fuelCost, totalMaintenanceCost: maintenanceCost, totalExpenses: expenseTotal, totalKilometers: kilometers, totalLiters: liters, costPerKilometer: kilometers ? operationalCost / kilometers : 0, fuelEfficiency: liters ? kilometers / liters : 0, overdueMaintenance: overdue, openIncidents: incidents };
}
