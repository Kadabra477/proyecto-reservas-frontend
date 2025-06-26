import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './Login.css';
import '../../styles/AuthForm.css';

// Importa los iconos que podrías usar (ejemplo: si usas FontAwesome, necesitas instalarlos y configurarlos)
// Para el ejemplo, usaremos SVGs directamente o clases de una librería de iconos.
// Si no tienes una librería, los iconos se mostrarán como texto o no se verán.
// Asegúrate de que los iconos de usuario y candado estén disponibles.

function Login({ onLoginSuccess }) {
    const [emailInput, setEmailInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [validationMessageType, setValidationMessageType] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const validatedParam = searchParams.get('validated');
        const errorParam = searchParams.get('error');
        const resetSuccessParam = searchParams.get('reset');
        const unauthorizedParam = searchParams.get('unauthorized'); // Nuevo: para manejar redirecciones de seguridad

        let message = '';
        let type = '';

        if (validatedParam === 'true') {
            message = '✅ ¡Cuenta validada con éxito! Ya puedes iniciar sesión.';
            type = 'success';
        } else if (errorParam === 'validation_failed') {
            message = '❌ Error al validar la cuenta. El enlace puede ser inválido o haber expirado.';
            type = 'error';
        } else if (resetSuccessParam === 'success') {
            message = '✅ ¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.';
            type = 'success';
        } else if (errorParam === 'oauth_failed') {
            message = '❌ Error durante el inicio de sesión con Google. Intenta de nuevo.';
            type = 'error';
        } else if (unauthorizedParam === 'true') { // Mensaje específico para 401
            message = 'Acceso denegado. Por favor, inicia sesión para continuar.';
            type = 'error';
        }

        if (message) {
            setValidationMessage(message);
            setValidationMessageType(type);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                username: emailInput,
                password: password,
            });

            const { token, username, nombreCompleto, role, error: loginError } = response.data; 

            if (loginError) {
                setIsLoading(false);
                setError(loginError);
            } else if (token && username && nombreCompleto) {
                const rolesArray = Array.isArray(role) ? role : [role]; 
                onLoginSuccess(token, username, nombreCompleto, rolesArray);
                navigate('/dashboard'); 
            } else {
                setIsLoading(false);
                setError('Respuesta inesperada del servidor o datos incompletos.');
            }
        } catch (err) {
            console.error('Error en catch de handleSubmit:', err);
            let errorMessage = 'Error de conexión o respuesta inesperada.';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.data) { 
                errorMessage = err.response.data;
            } else if (err.response?.status === 401) {
                errorMessage = 'Credenciales incorrectas o cuenta no activa.';
            } else {
                errorMessage = 'Error desconocido al iniciar sesión.';
            }
            setIsLoading(false);
            setError(errorMessage);
        }
    };

    return (
        // Se añade una clase para el background de login que podría tener una imagen
        <div className="auth-background login-background sport-theme-background">
            <div className="auth-container">
                <div className="login-image-banner">
                    {/* Puedes poner una imagen de una cancha de fútbol, una pelota, etc. */}
                    {/* Por ahora, un simple título para el banner */}
                    <h2 className="login-banner-title">¡Juega tu partido!</h2>
                    <p className="login-banner-subtitle">Reserva tu cancha favorita al instante.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form login-form" autoComplete="off">
                    <p className="auth-title">Iniciar Sesión</p> {/* Título más directo */}

                    {validationMessage && (
                        <p className={`auth-message ${validationMessageType}`} style={{ marginBottom: '1.5em' }}>
                            {validationMessage}
                        </p>
                    )}

                    <div className="input-group"> {/* Nuevo: Para agrupar input e icono */}
                        <i className="fas fa-user auth-icon"></i> {/* Icono de usuario */}
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="Correo electrónico"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="input-group"> {/* Nuevo: Para agrupar input e icono */}
                        <i className="fas fa-lock auth-icon"></i> {/* Icono de candado */}
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>

                    {error && <p className="auth-message error">{error}</p>}

                    <div className="auth-links-group"> {/* Agrupar los links para mejor espaciado */}
                        <Link to="/forgot-password" className="auth-link">
                            ¿Olvidaste tu contraseña?
                        </Link>
                        <Link to="/register" className="auth-link">
                            ¿No tienes cuenta? Regístrate aquí
                        </Link>
                    </div>

                    <div className="auth-divider">
                        <span>O</span>
                    </div>

                    <a
                        href={`${process.env.REACT_APP_API_URL.replace('/api', '')}/oauth2/authorization/google`}
                        className="google-auth-button"
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Google logo"
                            style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle' }}
                        />
                        Iniciar Sesión con Google
                    </a>
                </form>

                {/* Las gotas decorativas se mantienen */}
                <div className="auth-drops">
                    <div className="drop drop-1"></div>
                    <div className="drop drop-2"></div>
                    <div className="drop drop-3"></div>
                    <div className="drop drop-4"></div>
                    <div className="drop drop-5"></div>
                </div>
            </div>
        </div>
    );
}

export default Login;