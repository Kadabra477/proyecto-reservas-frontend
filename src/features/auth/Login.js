// src/features/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './Login.css';
import '../../styles/AuthForm.css';

function Login({ onLoginSuccess }) {
    const [emailInput, setEmailInput] = useState(''); // Ahora este input es para el email (que es el username de login)
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
                username: emailInput, // Envía el email del input como username para el backend
                password: password,
            });

            const { token, username, nombreCompleto, role, error: loginError } = response.data; // Recibe username (email) y nombreCompleto

            if (loginError) {
                setIsLoading(false);
                setError(loginError);
            } else if (token && username && nombreCompleto && role) {
                localStorage.setItem('jwtToken', token);
                localStorage.setItem('username', username); // Guarda el email (que es el username de login)
                localStorage.setItem('nombreCompleto', nombreCompleto); // Guarda el nombre completo
                localStorage.setItem('userRole', role);
                
                if (onLoginSuccess) {
                    onLoginSuccess(token, username, nombreCompleto, role); // Pasa username (email) y nombreCompleto
                }
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
        <div className="auth-background login-background">
            <div className="auth-container">

                {validationMessage && (
                    <p className={`auth-message ${validationMessageType}`} style={{ marginBottom: '1.5em' }}>
                        {validationMessage}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="auth-form login-form" autoComplete="off">
                    <p className="auth-title">Bienvenido</p>

                    <input
                        className="auth-input"
                        type="email" // Pedimos explícitamente el email
                        placeholder="Correo electrónico"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
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

                    {error && <p className="auth-message error">{error}</p>}

                    <Link to="/register" className="auth-link" style={{ marginTop: '10px' }}>
                        ¿No tienes cuenta? Regístrate aquí
                    </Link>

                    <Link to="/forgot-password" className="auth-link" style={{ marginTop: '10px' }}>
                        ¿Olvidaste tu contraseña?
                    </Link>

                    {/* Botón para iniciar sesión con Google */}
                    <div
                        style={{
                            marginTop: '20px',
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            paddingTop: '20px',
                        }}
                    >
                        <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>O inicia sesión con:</p>
                        <a
                            href={`${process.env.REACT_APP_API_URL.replace('/api', '')}/oauth2/authorization/google`}
                            className="google-auth-button"
                        >
                            <img
                                src="https://developers.google.com/identity/images/g-logo.png"
                                alt="Google logo"
                                style={{ width: '20px', height: '20px', marginRight: '10px', verticalAlign: 'middle' }}
                            />
                        </a>
                    </div>
                </form>

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