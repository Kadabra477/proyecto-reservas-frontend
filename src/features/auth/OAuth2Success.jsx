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
        // 'role' desde Google OAuth puede venir como una cadena simple (ej: "USER" o "ROLE_USER")
        const roleFromUrl = params.get('role'); 

        if (token) {
            localStorage.setItem('jwtToken', token);
            console.log('Token guardado en localStorage (OAuth2Success):', token);

            if (username) {
                localStorage.setItem('username', username);
            }
            if (nombreCompleto) {
                localStorage.setItem('nombreCompleto', nombreCompleto);
            }
            
            // **CAMBIO CLAVE AQUÍ:** Aseguramos que 'roleFromUrl' se convierta en un array para pasar a onLoginSuccess
            const rolesToPass = roleFromUrl ? [roleFromUrl.replace('ROLE_', '')] : ['USER']; // Asume "USER" si no hay rol y limpia "ROLE_"
            
            // Llama a onLoginSuccess con el array de roles
            if (onLoginSuccess) {
                onLoginSuccess(token, username, nombreCompleto, rolesToPass);
            }

            navigate('/dashboard');
        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            navigate('/login?error=oauth_failed');
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