import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: String, message: String, type: { type: String, enum: ['MAINTENANCE_DUE', 'MAINTENANCE_OVERDUE', 'DOCUMENT_EXPIRING', 'TRIP_ASSIGNED', 'INCIDENT_REPORTED', 'SYSTEM'], default: 'SYSTEM' }, isRead: { type: Boolean, default: false }, relatedId: mongoose.Schema.Types.ObjectId }, { timestamps: true });
export default mongoose.model('Notification', schema);
