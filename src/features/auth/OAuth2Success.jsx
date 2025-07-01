import { useEffect, useRef } from 'react'; // Importar useRef
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2Success({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    const hasNavigated = useRef(false); // Usar useRef para un flag persistente

    useEffect(() => {
        // Si ya hemos intentado navegar, salimos para evitar redirecciones múltiples.
        if (hasNavigated.current) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const nombreCompleto = params.get('name');
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
            
            const rolesToPass = roleFromUrl ? [roleFromUrl.replace('ROLE_', '')] : ['USER'];
            
            if (onLoginSuccess) {
                onLoginSuccess(token, username, nombreCompleto, rolesToPass);
            }

            // Marcar que ya hemos intentado navegar y luego navegar.
            hasNavigated.current = true; 
            navigate('/dashboard');

        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            // Si no hay token, marcamos que no se intentó navegar por éxito y redirigimos a login
            hasNavigated.current = true; // También marcar aquí para evitar reintentos si no hay token
            navigate('/login?error=oauth_failed');
        }
    }, [location, navigate, onLoginSuccess]); // Dependencias del useEffect

    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión con Google...</h2>
            <p>Redirigiendo al dashboard...</p>
            {/* Puedes añadir un spinner o un mensaje más elaborado aquí */}
        </div>
    );
}

export default OAuth2Success;