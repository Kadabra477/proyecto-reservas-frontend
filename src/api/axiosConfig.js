import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignorar errores SSL solo en desarrollo
    if (error.message && error.message.includes('SSL')) {
      console.warn('Advertencia: Error SSL ignorado (solo en desarrollo)');
      return Promise.resolve(error.response);
    }

    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config && error.config.url ? error.config.url : '';

      // Evitar logout si la URL es login (o similar)
      if (!originalRequestUrl.endsWith('/auth/login')) {
        // Limpio datos de sesión local
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');

        // Redirecciono a login
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
