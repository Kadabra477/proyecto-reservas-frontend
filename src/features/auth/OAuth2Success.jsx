import { useEffect, useState, useCallback } from 'react'; // Asegúrate de importar useCallback si no lo usabas
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2Success({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    // Estado para controlar si ya hemos procesado la lógica de redirección.
    // Inicia en false, se pone en true una vez que intentamos la redirección.
    const [processed, setProcessed] = useState(false); 

    useEffect(() => {
        // Si ya hemos procesado la lógica, salimos para evitar re-ejecuciones.
        // Esto es crucial para el "run once".
        if (processed) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username');
        const nombreCompleto = params.get('name');
        const roleFromUrl = params.get('role'); 

        // CRÍTICO: Limpiamos los parámetros de la URL inmediatamente.
        // Esto previene que el useEffect se dispare de nuevo si `location.search` cambia.
        const cleanUrl = location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (token) {
            // Guardamos todo en localStorage
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('username', username || ''); // Asegura que no se guarde 'null'
            localStorage.setItem('nombreCompleto', nombreCompleto || ''); // Asegura que no se guarde 'null'
            
            const rolesToPass = roleFromUrl ? [roleFromUrl.replace('ROLE_', '')] : ['USER'];
            
            // Llamamos a la función de éxito para actualizar el estado global de la aplicación (App.js)
            if (onLoginSuccess) {
                onLoginSuccess(token, username, nombreCompleto, rolesToPass);
            }

            // Marcamos como procesado para que no se re-ejecute más
            setProcessed(true); 

            // Redireccionamos con un pequeño retardo para evitar el "Throttling navigation".
            // Esto le da un respiro al navegador.
            setTimeout(() => {
                navigate('/dashboard', { replace: true }); 
            }, 100); // 100 milisegundos de retardo

        } else {
            console.error("OAuth2Success: No se encontró el token en la URL.");
            // Marcamos como procesado (incluso si hubo un error)
            setProcessed(true); 
            // Redireccionamos con retardo al login con un mensaje de error
            setTimeout(() => {
                navigate('/login?error=oauth_failed', { replace: true });
            }, 100);
        }
    }, [location, navigate, onLoginSuccess, processed]); // 'processed' está en las dependencias para que el efecto se ejecute solo cuando cambie de false a true

    // Mientras se procesa la redirección, se muestra un mensaje
    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión con Google...</h2>
            <p>Redirigiendo al dashboard...</p>
            {/* Opcional: Podrías añadir un spinner aquí */}
        </div>
    );
}

export default OAuth2Success;