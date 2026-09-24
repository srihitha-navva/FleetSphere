import Organization from '../models/Organization.js';
import Branch from '../models/Branch.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';
import FuelEntry from '../models/FuelEntry.js';
import Maintenance from '../models/Maintenance.js';
import Incident from '../models/Incident.js';
import Document from '../models/Document.js';
import Expense from '../models/Expense.js';
import AuditLog from '../models/AuditLog.js';
import { resourceController } from './resourceController.js';
import { syncVehicleMaintenance } from '../services/maintenanceService.js';
import { notify } from '../utils/notifications.js';
import AppError from '../utils/AppError.js';

const inheritVehicleBranch = async (body) => {
  if (!body.branch && body.vehicle) {
    const v = await Vehicle.findById(body.vehicle);
    if (v?.branch) body.branch = v.branch;
  }
};

export const organizations = resourceController(Organization, 'Organization', { searchFields: ['name', 'email'] });
export const branches = resourceController(Branch, 'Branch', { searchFields: ['name', 'city', 'state'], populate: 'organization manager' });
export const vehicles = resourceController(Vehicle, 'Vehicle', { searchFields: ['registrationNumber', 'make', 'model', 'vehicleType'], filters: ['status', 'branch', 'vehicleType'], populate: 'assignedDriver' , fileField: 'image' });
export const drivers = resourceController(Driver, 'Driver', { searchFields: ['licenseNumber', 'emergencyContact'], filters: ['status', 'branch'], populate: 'user assignedVehicle', beforeCreate: async (req, body) => ({ ...body, status: body.status || 'AVAILABLE' }) });
export const routes = resourceController(Route, 'Route', { searchFields: ['name', 'source', 'destination'], filters: ['branch', 'isActive'] });
export const fuel = resourceController(FuelEntry, 'Fuel entry', { dateField: 'date', filters: ['vehicle', 'driver', 'branch'], populate: 'vehicle driver createdBy', driverField: 'driver', fileField: 'receiptImage', beforeCreate: async (req, body) => { if (req.user.role === 'DRIVER') { const profile = await Driver.findOne({ user: req.user._id }); if (!profile?.assignedVehicle || String(body.vehicle) !== String(profile.assignedVehicle)) throw new AppError('Drivers can submit fuel only for their assigned vehicle', 403); } await inheritVehicleBranch(body); return { ...body, createdBy: req.user._id }; } });
export const maintenance = resourceController(Maintenance, 'Maintenance record', { dateField: 'serviceDate', filters: ['status', 'vehicle', 'branch', 'maintenanceType'], populate: 'vehicle createdBy', fileField: 'invoice', beforeCreate: async (req, body) => { await inheritVehicleBranch(body); return { ...body, createdBy: req.user._id }; }, afterSave: syncVehicleMaintenance });
export const incidents = resourceController(Incident, 'Incident', { dateField: 'date', filters: ['status', 'severity', 'vehicle', 'driver', 'branch'], populate: 'vehicle driver trip reportedBy', driverField: 'driver', fileField: 'evidence', beforeCreate: async (req, body) => { if (!body.incidentNumber) body.incidentNumber = `INC-${Date.now().toString().slice(-6)}`; await inheritVehicleBranch(body); if (req.files?.length) body.evidence = req.files.map((file) => `/uploads/${file.filename}`); return { ...body, reportedBy: req.user._id }; }, afterSave: async (data) => notify(data.reportedBy, 'Incident reported', `Incident ${data.incidentNumber} was recorded`, 'INCIDENT_REPORTED', data._id) });
export const documents = resourceController(Document, 'Document', { dateField: 'expiryDate', filters: ['type', 'vehicle', 'driver', 'branch'], populate: 'vehicle driver uploadedBy', fileField: 'fileUrl', beforeCreate: async (req, body) => { await inheritVehicleBranch(body); return { ...body, uploadedBy: req.user._id, ...(req.file && { fileName: req.file.originalname }) }; } });
export const expenses = resourceController(Expense, 'Expense', { dateField: 'date', filters: ['category', 'vehicle', 'driver', 'trip', 'branch'], populate: 'vehicle driver trip createdBy', driverField: 'driver', fileField: 'receipt', beforeCreate: async (req, body) => { await inheritVehicleBranch(body); return { ...body, createdBy: req.user._id }; } });
export const auditLogs = resourceController(AuditLog, 'Audit log', { filters: ['action', 'entity', 'branch'], populate: 'user organization branch', dateField: 'createdAt' });
