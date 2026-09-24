import api from './api';
export const resource = (path) => ({ list: (params) => api.get(path, { params }), get: (id) => api.get(`${path}/${id}`), create: (data) => api.post(path, data), update: (id, data) => api.put(`${path}/${id}`, data), remove: (id) => api.delete(`${path}/${id}`) });
export const dashboard = { overview: (params) => api.get('/dashboard/overview', { params }) };
export const notifications = { list: (params) => api.get('/notifications', { params }), read: (id) => api.patch(`/notifications/${id}/read`), readAll: () => api.patch('/notifications/read-all') };
