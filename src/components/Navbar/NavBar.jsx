import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css'; // Asegúrate de que tus estilos estén aquí

function Navbar({ isLoggedIn, nombreUsuario, onLogout }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        if (onLogout) onLogout();
        navigate('/');
    };

    // Función para obtener solo el primer nombre
    const getFirstName = (fullName) => {
        if (!fullName) return 'Usuario';
        return fullName.split(' ')[0];
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                {/* Logo con el nuevo nombre y estructura para aplicar estilos */}
                <NavLink to="/" className="navbar-logo">
                    ¿DÓNDE <span className="navbar-logo-span">JUEGO?</span>
                </NavLink>
                <nav className="navbar-menu">
                    {/* Renderización condicional del enlace "Complejos" */}
                    {isLoggedIn && ( // Solo muestra el enlace 'Complejos' si el usuario está logueado
                        <NavLink
                            // ¡CORRECCIÓN CRÍTICA AQUÍ! La ruta ahora es /complejos
                            to="/complejos" 
                            className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                        >
                            Complejos {/* ¡TEXTO CORREGIDO! */}
                        </NavLink>
                    )}

                    {/* Renderización condicional de links según el estado de autenticación */}
                    {isLoggedIn ? (
                        <>
                            {/* Enlace al Dashboard */}
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                            >
                                Dashboard
                            </NavLink>
                            <div className="navbar-user-section">
                                {/* Muestra solo el primer nombre */}
                                <span className="navbar-greeting">Hola, {getFirstName(nombreUsuario)}!</span>
                                <button onClick={handleLogoutClick} className="btn btn-outline-primary">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Links para usuarios NO logueados */}
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