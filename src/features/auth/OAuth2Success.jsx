import { useEffect, useState, useCallback } from 'react'; // Añadir useState
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2Success({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    // Usamos un estado local para controlar si ya se procesó la redirección.
    // Esto es más reactivo que useRef para controlar el flujo de renderizado.
    const [isProcessing, setIsProcessing] = useState(true); 

    useEffect(() => {
        // Si ya estamos procesando o ya hemos redirigido, no hacemos nada más.
        // Esto previene múltiples ejecuciones y el "throttling".
        if (!isProcessing) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const nombreCompleto = params.get('name');
        const roleFromUrl = params.get('role'); 

        // Limpiamos los parámetros de la URL para evitar re-procesamiento
        // Esto es crucial para que el componente no se re-ejecute con los mismos params
        // y el navegador no detecte un bucle de redirección.
        const cleanUrl = location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);


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

            setIsProcessing(false); // Marcar como procesado
            navigate('/dashboard', { replace: true }); // Usar replace para no dejar la URL de OAuth en el historial
                                                      // y evitar ir hacia atrás a ella.

        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            setIsProcessing(false); // Marcar como procesado (fallido)
            navigate('/login?error=oauth_failed', { replace: true });
        }
    }, [location, navigate, onLoginSuccess, isProcessing]); // Añadir isProcessing a las dependencias

    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión con Google...</h2>
            <p>Redirigiendo al dashboard...</p>
            {/* Puedes añadir un spinner o un mensaje más elaborado aquí */}
        </div>
    );
}

export default OAuth2Success;