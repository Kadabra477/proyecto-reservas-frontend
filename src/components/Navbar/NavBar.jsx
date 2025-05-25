import React from 'react'; // Eliminamos useState y useEffect de aquí, ya no son necesarios en Navbar
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';

// Navbar ahora recibe props para determinar el estado de autenticación y el nombre de usuario
function Navbar({ isLoggedIn, nombreUsuario, onLogout }) {
    const navigate = useNavigate();

    // La lógica de logout sigue siendo la misma, pero ahora solo la llama si está logueado
    const handleLogoutClick = () => {
        // La limpieza del localStorage y el seteo de estados se hace en App.js a través de onLogout
        if (onLogout) onLogout();
        navigate('/'); // Redirige a la página principal después de cerrar sesión
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className="navbar-logo">¿DÓNDE JUEGO?</NavLink>
                <nav className="navbar-menu">
                    {/* Links que siempre están visibles */}
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

                    {/* Renderización condicional de links según el estado de autenticación */}
                    {isLoggedIn ? (
                        <>
                            {/* Links para usuarios logueados */}
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