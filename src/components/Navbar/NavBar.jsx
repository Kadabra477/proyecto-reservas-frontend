import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

function Navbar({ isLoggedIn, nombreUsuario, onLogout }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        if (onLogout) onLogout();
        navigate('/');
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                {/* Logo con el nuevo nombre */}
                <NavLink to="/" className="navbar-logo">¿DÓNDE JUEGO?</NavLink>
                <nav className="navbar-menu">
                    {/* Links que siempre están visibles */}
                    <NavLink
                        to="/canchas"
                        className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                    >
                        Canchas
                    </NavLink>

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
                            {/* Enlace a Mis Reservas */}
                            <NavLink
                                to="/mis-reservas"
                                className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                            >
                                Mis Reservas
                            </NavLink>
                            {/* Sección de usuario logueado */}
                            <div className="navbar-user-section">
                                <span className="navbar-greeting">Hola, {nombreUsuario || 'Usuario'}!</span>
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