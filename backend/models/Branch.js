import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true, trim: true }, organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }, address: String, city: String, state: String, pincode: String, manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, isActive: { type: Boolean, default: true } }, { timestamps: true });
schema.index({ organization: 1, name: 1 }, { unique: true });
export default mongoose.model('Branch', schema);
