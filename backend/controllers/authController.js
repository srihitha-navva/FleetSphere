import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { audit } from '../utils/audit.js';

const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
const sendUser = (res, user, status = 200) => { const token = jwt.sign({ id: user._id, role: user.role, organizationId: user.organization, branchId: user.branch }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); res.status(status).cookie('token', token, cookieOptions()).json({ success: true, message: 'Authenticated successfully', data: { user } }); };
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required');
  if (await User.exists({ email: email.toLowerCase() })) throw new AppError('Email already registered', 409);
  const organization = await Organization.findOne({ isActive: true });
  if (!organization) throw new AppError('An organization must be created by a Super Admin before users can register', 400);
  const user = await User.create({ name, email, password, phone, role: 'DRIVER', organization: organization._id });
  await audit({ ...req, user }, 'REGISTER', 'User', user._id, 'Self-registered driver account'); sendUser(res, user, 201);
});
export const login = asyncHandler(async (req, res) => { const { email, password } = req.body; if (!email || !password) throw new AppError('Email and password are required'); const user = await User.findOne({ email: email.toLowerCase() }).select('+password'); if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401); if (!user.isActive) throw new AppError('Your account is inactive', 403); const safeUser = await User.findById(user._id).populate('organization branch'); await audit({ ...req, user: safeUser }, 'LOGIN', 'User', safeUser._id, 'User signed in'); sendUser(res, safeUser); });
export const logout = asyncHandler(async (req, res) => { await audit(req, 'LOGOUT', 'User', req.user._id, 'User signed out'); res.clearCookie('token', { httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true' }).json({ success: true, message: 'Logged out successfully' }); });
export const me = asyncHandler(async (req, res) => res.json({ success: true, data: { user: await User.findById(req.user._id).populate('organization branch') } }));
