import { Router } from 'express';
import { protect, allow, financeRoles, staffRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
export const makeCrudRoutes = (controller, roles, fileField, multi = false) => { const router = Router(); router.use(protect); router.route('/').get(allow(...roles), controller.list).post(allow(...roles), fileField ? (multi ? upload.array(fileField, 5) : upload.single(fileField)) : (req, res, next) => next(), controller.create); router.route('/:id').get(allow(...roles), controller.get).put(allow(...roles), fileField ? upload.single(fileField) : (req, res, next) => next(), controller.update).delete(allow(...roles), controller.remove); return router; };
export { staffRoles, financeRoles };
