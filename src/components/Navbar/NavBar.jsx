// frontend/src/components/Navbar/NavBar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

function Navbar({ isLoggedIn, nombreUsuario, onLogout, userRole }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        if (onLogout) onLogout();
        navigate('/');
    };

    const getFirstName = (fullName) => {
        if (!fullName) return 'Usuario';
        // Simplemente toma la primera palabra para el saludo
        return fullName.split(' ')[0];
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className="navbar-logo">
                    ¿DÓNDE <span className="navbar-logo-span">JUEGO?</span>
                </NavLink>
                <nav className="navbar-menu">
                    {isLoggedIn && (
                        <NavLink
                            to="/complejos"
                            className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                        >
                            Complejos
                        </NavLink>
                    )}

                    {isLoggedIn ? (
                        <>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                            >
                                Dashboard
                            </NavLink>
                            {(userRole === 'ADMIN' || userRole === 'COMPLEX_OWNER') && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                                >
                                    Admin
                                </NavLink>
                            )}
                            <div className="navbar-user-section">
                                <span className="navbar-greeting">Hola, {getFirstName(nombreUsuario)}!</span>
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