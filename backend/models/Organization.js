import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true, trim: true }, email: { type: String, required: true, lowercase: true }, phone: String, address: String, isActive: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('Organization', schema);
