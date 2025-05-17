import axios from 'axios';

// Crear una instancia de Axios
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Interceptor de Solicitud (Sin cambios)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Ignorar errores SSL (solo en desarrollo)
    if (error.message.includes('SSL')) {
      console.warn('Advertencia: Error SSL ignorado (solo en desarrollo)');
      return Promise.resolve(error.response);
    }

    // Procesar otros errores como de costumbre
    return Promise.reject(error);
  }
);


// --- Interceptor de Respuesta (MODIFICADO) ---
api.interceptors.response.use(
  (response) => {
    // Petición exitosa
    return response;
  },
  (error) => {
    // Petición fallida
    if (error.response && error.response.status === 401) {
      // --- NUEVA CONDICIÓN: No redirigir si el error fue en la propia API de login ---
      const originalRequestUrl = error.config.url;
      // Comprueba si la URL original (relativa a la baseURL) es la de login
      if (originalRequestUrl !== '/auth/login') {
        // Si el 401 NO fue en login, entonces sí redirigimos
        console.error("Interceptor: Acceso no autorizado (401) en ruta protegida - Redirigiendo al login...");
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        // Usar window.location para forzar recarga y limpiar estado
        if (typeof window !== 'undefined') {
           window.location.href = '/login';
        }
      } else {
         // Si el 401 FUE en login, no hacemos nada aquí.
         // Dejamos que el .catch() del componente Login maneje el error.
         console.log("Interceptor: Error 401 en /auth/login, manejado por el componente.");
      }
      // --- FIN CONDICIÓN ---
    }
    // Rechazar siempre la promesa para que el .catch() original pueda manejarla
    return Promise.reject(error);
  }
);
// --- FIN Interceptor ---

export default api;