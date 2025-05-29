import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (err) {
    return true; // If token is invalid, consider it expired
  }
};

// Request interceptor for JWT token
API.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.assign('/?session_expired=true');
        return Promise.reject(new Error('Token expired'));
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh if you implement refresh tokens
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Here you could add refresh token logic if implemented
      // return refreshToken().then(() => API(originalRequest));
      
      // For now, just clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.assign('/?session_expired=true');
    }
    
    // Handle other errors
    if (error.response) {
      switch (error.response.status) {
        case 403: // Forbidden
          if (window.location.pathname.startsWith('/admin')) {
            window.location.assign('/home');
          }
          break;
          
        case 404: // Not Found
          console.error('API endpoint not found:', error.config.url);
          break;
          
        case 500: // Server Error
          console.error('Server error:', error.response.data);
          break;
          
        default:
          break;
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default API;