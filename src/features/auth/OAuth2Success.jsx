import { useEffect, useState } from 'react'; // Eliminamos 'useCallback' porque no lo usamos aquí
import { useLocation } from 'react-router-dom'; // Eliminamos 'useNavigate'

function OAuth2Success({ onLoginSuccess }) {
    const location = useLocation();
    const [isProcessed, setIsProcessed] = useState(false); 

    useEffect(() => {
        if (isProcessed) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const nombreCompleto = params.get('name');
        const roleFromUrl = params.get('role'); 

        const cleanUrl = location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (token) {
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('username', username || '');
            localStorage.setItem('nombreCompleto', nombreCompleto || '');
            
            const rolesToPass = roleFromUrl ? [roleFromUrl.replace('ROLE_', '')] : ['USER'];
            
            if (onLoginSuccess) {
                // Aquí el componente solo guarda el token y llama a la función de éxito.
                // onLoginSuccess ahora manejará la redirección.
                onLoginSuccess(token, username, nombreCompleto, rolesToPass);
            }
            // Marcamos como procesado para que el useEffect no se ejecute más
            setIsProcessed(true);

        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            setIsProcessed(true);
            // Si no hay token, deberíamos redirigir al login
            // Pero como la redirección la hará App.js ahora, no hacemos nada aquí.
        }
    }, [location, onLoginSuccess, isProcessed]);

    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión con Google...</h2>
            <p>Redirigiendo al dashboard...</p>
        </div>
    );
}

export default OAuth2Success;