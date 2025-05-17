import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

function Navbar({ onLogout }) {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('nombreCompleto');
    setIsLoggedIn(!!token);
    setNombreUsuario(storedName || '');

    const updateStorage = () => {
      const updatedName = localStorage.getItem('nombreCompleto');
      const updatedToken = localStorage.getItem('token');
      setIsLoggedIn(!!updatedToken);
      setNombreUsuario(updatedName || '');
    };

    window.addEventListener('storage', updateStorage);
    return () => window.removeEventListener('storage', updateStorage);
  }, []);

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombreCompleto');
    if (onLogout) onLogout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-logo">¿DÓNDE JUEGO?</NavLink>
        <nav className="navbar-menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/canchas"
            className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
          >
            Canchas
          </NavLink>

          {isLoggedIn ? (
            <>
              <NavLink
                to="/perfil"
                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
              >
                Perfil
              </NavLink>
              <NavLink
                to="/mis-reservas"
                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
              >
                Mis Reservas
              </NavLink>
              <div className="navbar-user-section">
                <span className="navbar-greeting">Hola, {nombreUsuario}!</span>
                <button onClick={handleLogoutClick} className="btn btn-outline-primary">
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
              >
                Iniciar Sesión
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
              >
                Registrarse
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
