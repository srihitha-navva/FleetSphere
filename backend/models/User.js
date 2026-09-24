import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const roles = ['SUPER_ADMIN', 'FLEET_MANAGER', 'BRANCH_MANAGER', 'DRIVER', 'FINANCE_OFFICER'];
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, phone: String,
  password: { type: String, required: true, minlength: 8, select: false }, role: { type: String, enum: roles, default: 'DRIVER' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true }, branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true }, profileImage: String, isActive: { type: Boolean, default: true }
}, { timestamps: true });
schema.pre('save', async function hashPassword(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
schema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.password); };
schema.methods.toJSON = function safeJSON() { const obj = this.toObject(); delete obj.password; return obj; };
export { roles };
export default mongoose.model('User', schema);
