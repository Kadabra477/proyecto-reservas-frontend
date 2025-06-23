import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2Success({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const nombreCompleto = params.get('name');
        const userRole = params.get('role'); // <-- Captura el rol desde la URL

        if (token) {
            localStorage.setItem('jwtToken', token);
            console.log('Token guardado en localStorage (OAuth2Success):', token);

            if (username) {
                localStorage.setItem('username', username);
            }
            if (nombreCompleto) {
                localStorage.setItem('nombreCompleto', nombreCompleto);
            }
            if (userRole) {
                localStorage.setItem('userRole', userRole); // <-- Guarda el rol en localStorage
            } else {
                console.warn("OAuth2Success: El rol no se recibió de la URL. Asumiendo 'USER'.");
                localStorage.setItem('userRole', 'USER'); // Rol por defecto si no viene
            }

            if (onLoginSuccess) {
                onLoginSuccess(token, username, nombreCompleto, userRole || 'USER');
            }

            navigate('/dashboard'); // Redirige al dashboard después del éxito
        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            navigate('/login?error=oauth_failed'); // Redirige a login con error
        }
    }, [location, navigate, onLoginSuccess]);

    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión con Google...</h2>
            <p>Redirigiendo al dashboard...</p>
        </div>
    );
}

export default OAuth2Success;