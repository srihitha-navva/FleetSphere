import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, action: String, entity: String, entityId: mongoose.Schema.Types.ObjectId, description: String, ipAddress: String, organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true }, branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true } }, { timestamps: true });
export default mongoose.model('AuditLog', schema);
