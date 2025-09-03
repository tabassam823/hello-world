import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['x-auth-token'] = user.token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
