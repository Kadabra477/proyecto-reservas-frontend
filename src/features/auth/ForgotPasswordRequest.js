// src/features/auth/ForgotPasswordRequest.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Importa tu instancia de axios
import '../../styles/AuthForm.css'; // Reutiliza los estilos si aplican
// import './ForgotPassword.css'; // O crea un CSS específico si es necesario

function ForgotPasswordRequest() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setError('Por favor, ingresa un correo electrónico válido.');
        setIsLoading(false);
        return;
    }

    try {
      // Llama al endpoint del backend
      const response = await api.post('/auth/forgot-password', { email });
      // Muestra el mensaje genérico del backend
      setMessage(response.data.message || 'Solicitud enviada. Revisa tu correo.');
      setEmail(''); // Limpiar campo
    } catch (err) {
      console.error('Error al solicitar reseteo:', err);
      // Muestra un error genérico o el del backend si existe
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || 'Ocurrió un error al procesar tu solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Puedes reutilizar el fondo y contenedor de AuthForm
    <div className="auth-background login-background"> {/* O un fondo diferente */}
      <div className="auth-container">
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <p className="auth-title">Restablecer Contraseña</p>

          {/* Mensaje de éxito o error */}
          {message && !error && <p className="auth-message success" style={{ marginBottom: '1.5em' }}>{message}</p>}
          {error && <p className="auth-message error" style={{ marginBottom: '1.5em' }}>{error}</p>}

          {/* Solo muestra el formulario si no hay mensaje de éxito */}
          {!message && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '1.5em' }}>
                Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <input
                className="auth-input"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Enlace'}
              </button>
            </>
          )}

          {/* Enlace para volver a Login */}
          <Link to="/login" className="auth-link" style={{marginTop: '20px'}}>
            Volver a Iniciar Sesión
          </Link>
        </form>
        {/* Gotas opcionales */}
        <div className="auth-drops">
            {/* ... gotas ... */}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordRequest;