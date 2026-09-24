import mongoose from 'mongoose';
const schema = new mongoose.Schema({ vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true }, driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true }, assignedAt: { type: Date, default: Date.now }, unassignedAt: Date, isActive: { type: Boolean, default: true }, organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }, branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true }, assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, notes: String }, { timestamps: true });
schema.index({ vehicle: 1, isActive: 1 }); schema.index({ driver: 1, isActive: 1 });
export default mongoose.model('Assignment', schema);
