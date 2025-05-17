// src/features/auth/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import '../../styles/AuthForm.css'; // Reutilizar estilos
// import './ResetPassword.css'; // O crear CSS específico

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Efecto para obtener el token de la URL al montar
  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError('Token de restablecimiento no encontrado o inválido. Solicita un nuevo enlace.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
         setError('Token inválido. No se puede restablecer la contraseña.');
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
      // Llama al endpoint del backend
      const response = await api.post('/auth/reset-password', {
        token: token,
        newPassword: password
      });
      setMessage(response.data.message || '¡Contraseña actualizada con éxito!');
      setPassword('');
      setConfirmPassword('');
      // Redirigir a Login después de un momento
      setTimeout(() => {
        navigate('/login?reset=success'); // Añadir parámetro opcional para Login
      }, 3000);

    } catch (err) {
      console.error('Error al resetear contraseña:', err);
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || 'No se pudo restablecer la contraseña. El enlace puede haber expirado o ser inválido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
     // Puedes reutilizar el fondo y contenedor de AuthForm
     <div className="auth-background login-background"> {/* O un fondo diferente */}
      <div className="auth-container">
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <p className="auth-title">Nueva Contraseña</p>

          {/* Mostrar mensajes */}
          {message && !error && <p className="auth-message success" style={{ marginBottom: '1.5em' }}>{message}</p>}
          {error && <p className="auth-message error" style={{ marginBottom: '1.5em' }}>{error}</p>}

          {/* Mostrar formulario solo si hay token y no hay mensaje de éxito */}
          {token && !message && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '1.5em' }}>
                Ingresa tu nueva contraseña.
              </p>
              <input
                className="auth-input"
                type="password"
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </>
          )}

           {/* Enlace para volver a Login si hay error o ya se completó */}
           {(error || message) && (
              <Link to="/login" className="auth-link" style={{marginTop: '20px'}}>
                Volver a Iniciar Sesión
              </Link>
            )}

        </form>
         {/* Gotas opcionales */}
         <div className="auth-drops">
            {/* ... gotas ... */}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;