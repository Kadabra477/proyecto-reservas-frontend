import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate
import api from '../../api/axiosConfig';
import './Register.css';
import '../../styles/AuthForm.css';

function Register() { // onGoToLogin no se usa, lo quité de los props
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate(); // Hook para la navegación

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validaciones del lado del cliente
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
                username: email.trim(), // Asegúrate de que el backend espere 'username' para el email
                password: password,
            });

            // Una vez registrado, redirige al login con un mensaje de éxito
            navigate('/login?validated=true'); // Usa 'validated=true' para mostrar el mensaje de éxito en el login
            // Opcional: podrías mostrar un mensaje aquí y luego un botón para ir al login.
            // setSuccessMessage(`✅ ¡Registro casi completo! Un administrador habilitará tu cuenta en breve.`);
            // setError('');
            // setNombreCompleto('');
            // setEmail('');
            // setPassword('');
            // setConfirmPassword('');

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

                <form onSubmit={handleSubmit} className="auth-form register-form" autoComplete="off">
                    <p className="auth-title">Crear Cuenta</p>

                    {error && (
                        <p className="auth-message error" style={{ marginBottom: '1.5em' }}>
                            {error}
                        </p>
                    )}
                    {successMessage && !error && (
                        <p className="auth-message success" style={{ marginBottom: '1.5em' }}>
                            {successMessage}
                        </p>
                    )}

                    {/* Mostrar campos solo si no hay mensaje de éxito para que el usuario no intente reenviar */}
                    {!successMessage && (
                        <>
                            <div className="input-group">
                                <i className="fas fa-user-circle auth-icon"></i> {/* Icono de persona */}
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
                                <i className="fas fa-envelope auth-icon"></i> {/* Icono de email */}
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
                                <i className="fas fa-key auth-icon"></i> {/* Icono de llave/contraseña */}
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
                                <i className="fas fa-key auth-icon"></i> {/* Icono de llave/contraseña */}
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

                    {!successMessage && ( // Mostrar la opción de Google solo si no hay un mensaje de éxito (registro completado)
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