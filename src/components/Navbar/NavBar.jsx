import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

// `userRole` en este componente ahora se espera que sea un ARRAY de strings (ej: ['ADMIN', 'USER'])
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

    // **CAMBIO CLAVE AQUÍ:** Las comprobaciones de rol ahora usan `includes()` en el array `userRole`
    const hasAdminRole = userRole && userRole.includes && userRole.includes('ADMIN');
    const hasComplexOwnerRole = userRole && userRole.includes && userRole.includes('COMPLEX_OWNER');


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
                            {(hasAdminRole || hasComplexOwnerRole) && (
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