import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2Success() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('jwtToken', token);
      console.log('Token guardado en localStorage:', token);

      // Opcional: guardar nombre o email si viene en la URL o hacer fetch al backend

      navigate('/dashboard');
    } else {
      console.error("No se encontró el token en la URL.");
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div className="oauth2-success-message">
      <h2>Iniciando sesión...</h2>
      <p>Redirigiendo al dashboard...</p>
    </div>
  );
}

export default OAuth2Success;
