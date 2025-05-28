import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

// Interceptor para agregar el token JWT en el header Authorization
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas, especialmente 401 Unauthorized
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

            // No hacer logout si la llamada es al login para evitar bucles
            if (!originalRequestUrl.endsWith('/auth/login')) {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('username');
                localStorage.removeItem('nombreCompleto');
                localStorage.removeItem('userRole'); // Limpiar el rol también
                if (typeof window !== 'undefined') {
                    window.location.assign('/login');
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;