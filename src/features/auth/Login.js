// src/features/auth/Login.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'; // Asegurar imports
import api from '../../api/axiosConfig';
import './Login.css'; // CSS específico si existe
import '../../styles/AuthForm.css'; // Estilos compartidos

// Espera onLoginSuccess y onGoToRegister como props desde App.js
function Login({ onLoginSuccess, onGoToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Error para intentos de login
    const [isLoading, setIsLoading] = useState(false);
    const [validationMessage, setValidationMessage] = useState(''); // Mensaje de validación/reseteo
    const [validationMessageType, setValidationMessageType] = useState(''); // 'success' o 'error'
    const [searchParams] = useSearchParams(); // Hook para leer URL
    const navigate = useNavigate(); // Hook para navegar si es necesario (ej. para limpiar URL)

    // Efecto para leer parámetros de URL al cargar (para mensajes post-validación/reseteo)
    useEffect(() => {
        const validatedParam = searchParams.get('validated');
        const errorParam = searchParams.get('error');
        const resetSuccessParam = searchParams.get('reset');

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
        } else if (errorParam === 'oauth_failed') { // Error desde OAuth handler
            message = '❌ Error durante el inicio de sesión con Google. Intenta de nuevo.';
            type = 'error';
        }

        if (message) {
            setValidationMessage(message);
            setValidationMessageType(type);
            // Opcional: Limpiar los parámetros de la URL para que el mensaje no reaparezca si el usuario recarga
            // navigate('/login', { replace: true });
        }

    // Solo se ejecuta al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar error de intento previo
        setIsLoading(true);

        try {
            // Llamada a la API de login
            const response = await api.post('/auth/login', {
                username: email,
                password: password,
            });

            // Extraer datos de la respuesta del backend
            // Asumimos que devuelve { token, username, nombreCompleto } o { error: "mensaje" }
            const { token, username, nombreCompleto, error: loginError } = response.data;

            // Si el backend devuelve un error específico en la respuesta exitosa (ej: cuenta inactiva)
            if (loginError) {
                 setIsLoading(false);
                 setError(loginError);
            }
            // Si devuelve token, username y nombreCompleto -> Éxito
            else if (token && username && nombreCompleto) {
                 localStorage.setItem('jwtToken', token);
                 localStorage.setItem('username', username); // Guardar email
                 localStorage.setItem('nombreCompleto', nombreCompleto); // Guardar nombre
                 if (onLoginSuccess) {
                      onLoginSuccess(token, username, nombreCompleto); // Notificar a App.js
                 }
                 // La redirección la maneja App.js (RedireccionSiAutenticado)
            } else {
                 // Respuesta inesperada del backend
                 setIsLoading(false);
                 setError('Respuesta inesperada del servidor.');
            }
        } catch (err) {
            console.error('Error en catch de handleSubmit:', err);
            let errorMessage = 'Error de conexión o respuesta inesperada.';
            if (err.response?.data?.error) { // Captura errores como { "error": "mensaje" }
                errorMessage = err.response.data.error;
            } else if (err.response?.status === 401) { // 401 generalmente significa credenciales incorrectas/no autorizado
                errorMessage = 'Credenciales incorrectas o cuenta no activa.'; // Mensaje genérico para 401
            }
            setIsLoading(false);
            setError(errorMessage);
        }
    };

    return (
        <div className="auth-background login-background">
            <div className="auth-container">

                {/* Mostrar mensaje de validación/reseteo (si existe) */}
                {validationMessage && (
                    <p className={`auth-message ${validationMessageType}`} style={{ marginBottom: '1.5em' }}>
                        {validationMessage}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="auth-form login-form" autoComplete="off">
                    <p className="auth-title">Bienvenido</p>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>

                    {/* Mostrar error de INTENTO de login */}
                    {error && <p className="auth-message error">{error}</p>}

                    {/* Enlace para ir a Registro */}
                    <Link to="/register" className="auth-link" style={{ marginTop: '10px' }}>
                    ¿No tienes cuenta? Regístrate aquí
                    </Link>

                    {/* Enlace Olvidé Contraseña */}
                    <Link to="/forgot-password" className="auth-link" style={{ marginTop: '10px' }}>
                    ¿Olvidaste tu contraseña?
                    </Link>


                    {/* Botón Google */}
                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>O inicia sesión con:</p>
                        <a href="http://localhost:8080/oauth2/authorization/google" className="google-auth-button">
                        <img
                             src="https://developers.google.com/identity/images/g-logo.png"
                             alt="Google logo"
                             style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle' }}
                             />
                        </a>
                    </div>

                </form>
                {/* Gotas decorativas */}
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