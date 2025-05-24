import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message.includes('SSL')) {
      console.warn('Advertencia: Error SSL ignorado (solo en desarrollo)');
      return Promise.resolve(error.response);
    }

    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config.url;
      if (originalRequestUrl !== '/auth/login') {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
