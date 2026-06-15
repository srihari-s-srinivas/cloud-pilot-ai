import axios from 'axios';

/**
 * Axios instance with base configuration.
 * Always utilize relative '/api' endpoint to guarantee requests are sent to the correct active host and HTTPS origin, 
 * bypassing incorrect VITE_API_URL variables such as localhost:5000 that trigger browser Mixed Content blocks.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const { token } = JSON.parse(savedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
