import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fdrvault_token') || localStorage.getItem('securefdr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('fdrvault_token');
        localStorage.removeItem('fdrvault_user');
        localStorage.removeItem('securefdr_token');
        localStorage.removeItem('securefdr_user');
        window.location.href = '/login?sessionExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
