import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './Register.css';
import '../../styles/AuthForm.css';

function Register() {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!nombreCompleto.trim()) {
            setError('El nombre completo es obligatorio.');
            return;
        }
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Por favor, ingresa un correo electrónico válido.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/register', {
                nombreCompleto: nombreCompleto.trim(),
                username: email.trim(),
                password: password,
            });

            // Redirige al login con un mensaje de éxito para que sea visible
            navigate('/login?validated=true'); // Reutilizamos el parámetro 'validated' para indicar éxito en el registro
                                             // Puedes cambiarlo por 'registered=true' si prefieres más claridad.
        } catch (err) {
            console.error('Error al registrar:', err);
            let errorMessage = 'Error al registrar la cuenta.';
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.response?.status === 400 || err.response?.status === 409) {
                errorMessage = '❌ El correo electrónico ya está registrado o los datos son inválidos.';
            } else {
                errorMessage = 'Error de conexión o respuesta inesperada.';
            }
            setError(errorMessage);
            setSuccessMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-background register-background sport-theme-background">
            <div className="auth-container">
                <div className="register-image-banner">
                    <h2 className="register-banner-title">Únete a la Comunidad</h2>
                    <p className="register-banner-subtitle">Tu próxima reserva te espera.</p>
                </div>

                {/* MODIFICACIÓN: Contenedor para el mensaje de notificación */}
                {error && (
                    <div className="notification-container error">
                        <p className="notification-message">
                            {error}
                        </p>
                    </div>
                )}
                {successMessage && !error && (
                    <div className="notification-container success">
                        <p className="notification-message">
                            {successMessage}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form register-form" autoComplete="off">
                    <p className="auth-title">Crear Cuenta</p>

                    {!successMessage && (
                        <>
                            <div className="input-group">
                                <i className="fas fa-user-circle auth-icon"></i>
                                <input
                                    className="auth-input"
                                    type="text"
                                    placeholder="Nombre completo"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="input-group">
                                <i className="fas fa-envelope auth-icon"></i>
                                <input
                                    className="auth-input"
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="input-group">
                                <i className="fas fa-key auth-icon"></i>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="Contraseña (mín. 6 caracteres)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="input-group">
                                <i className="fas fa-key auth-icon"></i>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="Confirmar contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <button type="submit" className="auth-button" disabled={isLoading}>
                                {isLoading ? 'Registrando...' : 'Registrarse'}
                            </button>
                        </>
                    )}

                    <Link to="/login" className="auth-link" style={{ marginTop: '20px' }}>
                        ¿Ya tienes una cuenta? Inicia sesión
                    </Link>

                    {!successMessage && (
                        <>
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
                                Registrarse con Google
                            </a>
                        </>
                    )}
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

export default Register;