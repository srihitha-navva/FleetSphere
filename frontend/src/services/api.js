import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
rawUrl = rawUrl.trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl += '/api';
}

const api = axios.create({
  baseURL: rawUrl,
  withCredentials: true,
  timeout: 15000
});
api.interceptors.response.use((response) => response.data, (error) => Promise.reject(error.response?.data || { message: 'Network error. Is the API running?' }));
export default api;
