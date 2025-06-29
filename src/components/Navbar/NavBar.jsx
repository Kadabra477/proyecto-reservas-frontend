import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css'; // Asegúrate de que esta ruta sea correcta

function Navbar({ isLoggedIn, nombreUsuario, onLogout, userRole }) { 
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        if (onLogout) onLogout();
        navigate('/');
    };

    const getFirstName = (fullName) => {
        if (!fullName) return 'Usuario';
        return fullName.split(' ')[0];
    };

    const hasAdminOrComplexOwnerRole = userRole && userRole.includes && (userRole.includes('ADMIN') || userRole.includes('COMPLEX_OWNER'));

    return (
        <header className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className="navbar-logo">
                    ¿DÓNDE <span className="navbar-logo-span">JUEGO?</span>
                </NavLink>
                <nav className="navbar-menu">
                    {/* El enlace a Complejos SOLO si está logueado */}
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
                            {/* Mostrar Admin link si tiene rol ADMIN o COMPLEX_OWNER */}
                            {hasAdminOrComplexOwnerRole && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
                                >
                                    Admin
                                </NavLink>
                            )}
                            <div className="navbar-user-section">
                                <span className="navbar-greeting">Hola, {getFirstName(nombreUsuario)}!</span>
                                <button onClick={handleLogoutClick} className="btn-navbar-logout"> {/* Clase cambiada */}
                                    Cerrar Sesión
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                className="btn-navbar-primary" // CLASE CAMBIADA a botón primario
                            >
                                Iniciar Sesión
                            </NavLink>
                            <NavLink
                                to="/register"
                                className="btn-navbar-secondary" // CLASE CAMBIADA a botón secundario
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