import axios from 'axios';

const API_URL_USERS = '/api/users';
const API_URL_AUTH = '/api/auth';

// Register user
const register = (userData) => {
  return axios.post(API_URL_USERS, userData);
};

// Login user
const login = (userData) => {
  return axios.post(API_URL_AUTH, userData);
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;
