import Notification from '../models/Notification.js';

export const notify = (user, title, message, type, relatedId) => user && Notification.create({ user, title, message, type, relatedId }).catch(() => {});
