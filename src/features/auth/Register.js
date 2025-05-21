// src/features/auth/Register.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './Register.css';
import '../../styles/AuthForm.css';

function Register({ onGoToLogin }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      await api.post('/api/auth/register', {
        nombreCompleto: nombreCompleto.trim(),
        username: email,
        password: password,
      });

      setSuccessMessage(`✅ ¡Registro casi completo! Revisa tu correo (${email}) para validar tu cuenta.`);
      setError('');
      setNombreCompleto('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error al registrar:', err);
      let errorMessage = 'Error al registrar la cuenta.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string' && err.response.data.startsWith('❌')) {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 409) {
        errorMessage = '❌ El correo electrónico ya está registrado.';
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
    <div className="auth-background register-background">
      <div className="auth-container">
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

          {!successMessage && (
            <>
              <input
                className="auth-input"
                type="text"
                placeholder="Nombre completo"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
                disabled={isLoading}
              />
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
                placeholder="Contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </button>
            </>
          )}

          <Link to="/login" className="auth-link" style={{ marginTop: '20px' }}>
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>

          {!successMessage && (
            <div
              style={{
                marginTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '20px',
              }}
            >
              <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>O registrate con:</p>
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
          )}
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

export default Register;
