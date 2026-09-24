import { Router } from 'express';
import { createUser, deleteUser, listUsers, profile, updateUser } from '../controllers/userController.js';
import { allow, protect } from '../middleware/auth.js';
const router = Router(); router.use(protect); router.get('/profile', profile); router.route('/').get(allow('SUPER_ADMIN', 'FLEET_MANAGER', 'BRANCH_MANAGER'), listUsers).post(allow('SUPER_ADMIN', 'FLEET_MANAGER'), createUser); router.route('/:id').put(allow('SUPER_ADMIN', 'FLEET_MANAGER'), updateUser).delete(allow('SUPER_ADMIN', 'FLEET_MANAGER'), deleteUser); export default router;
