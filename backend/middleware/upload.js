import multer from 'multer';
import path from 'path';
import AppError from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const allowed = /jpeg|jpg|png|pdf|doc|docx/;
const filter = (req, file, cb) => allowed.test(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new AppError('Unsupported file type', 400));
export const upload = multer({ storage, fileFilter: filter, limits: { fileSize: 5 * 1024 * 1024 } });
