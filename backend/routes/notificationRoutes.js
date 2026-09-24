import { Router } from 'express'; import { protect } from '../middleware/auth.js'; import { listNotifications, markAllRead, markRead } from '../controllers/notificationController.js';
const router = Router(); router.use(protect); router.get('/', listNotifications); router.patch('/read-all', markAllRead); router.patch('/:id/read', markRead); export default router;
