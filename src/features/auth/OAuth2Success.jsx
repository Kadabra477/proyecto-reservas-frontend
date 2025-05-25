import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Importar axiosConfig para hacer llamadas a la API

function OAuth2Success({ onLoginSuccess }) { // Recibe onLoginSuccess como prop
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const username = params.get('username'); // Asumiendo que el backend envía el username (email)
        const nombreCompleto = params.get('name'); // Asumiendo que el backend envía el nombre completo

        if (token) {
            localStorage.setItem('jwtToken', token);
            console.log('Token guardado en localStorage:', token);

            // Guardar nombre y username si vienen en la URL
            if (username) {
                localStorage.setItem('username', username);
            }
            if (nombreCompleto) {
                localStorage.setItem('nombreCompleto', nombreCompleto);
            }

            // Notificar a App.js que el login fue exitoso, pasando los datos
            if (onLoginSuccess) {
                onLoginSuccess(token, username, nombreCompleto);
            }

            navigate('/dashboard');
        } else {
            console.error("No se encontró el token en la URL.");
            navigate('/login');
        }
    }, [location, navigate, onLoginSuccess]); // Añadir onLoginSuccess a las dependencias

    return (
        <div className="oauth2-success-message">
            <h2>Iniciando sesión...</h2>
            <p>Redirigiendo al dashboard...</p>
        </div>
    );
}

export default OAuth2Success;