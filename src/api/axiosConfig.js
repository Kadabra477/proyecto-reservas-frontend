import axios from 'axios';

// La URL base para el backend, SIN el '/api'
const API_BASE_URL = process.env.REACT_APP_API_URL; 

// Crea una instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL + '/api', // Añade '/api' aquí una sola vez
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Puedes cambiar a true si manejas cookies/sesiones en el backend
});

// Interceptor para añadir el token JWT a cada petición saliente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores 401 (No autorizado)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('401 Unauthorized - Token inválido o expirado. Redirigiendo a /login...');
      // Eliminar el token y otros datos de la sesión
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('username');
      localStorage.removeItem('nombreCompleto');
      localStorage.removeItem('userRole');
      // Redirigir al login
      window.location.href = '/login?unauthorized=true';
    }
    return Promise.reject(error);
  }
);

export default api;