import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  timeout: 10000
});
api.interceptors.response.use((response) => response.data, (error) => Promise.reject(error.response?.data || { message: 'Network error. Is the API running?' }));
export default api;
