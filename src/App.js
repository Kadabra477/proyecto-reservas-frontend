import React, { useState, useEffect, useCallback } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import Navbar from './components/Navbar/NavBar';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/home/Home';
import ReservaForm from './features/reservas/ReservaForm';
import ReservaDetail from './features/reservas/ReservaDetail';
import AdminPanel from './features/admin/AdminPanel'; // Componente de panel de administración
import Canchas from './components/Canchas/Canchas';
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';

import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';

import './App.css';

// Helper: Redirecciona si ya está autenticado
function RedireccionSiAutenticado({ children, destino = "/dashboard" }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (estaAutenticado) {
        // Redirige al dashboard si ya está autenticado, o al destino especificado
        const from = location.state?.from?.pathname || destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

// Helper: Ruta Protegida para manejar roles
function RutaProtegida({ children, rolesRequeridos }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole'); // Obtiene el rol del localStorage
    const location = useLocation();

    if (!estaAutenticado) {
        // Si no está autenticado, redirige al login, guardando la URL actual para después
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si se requieren roles y el rol del usuario no está entre ellos
    if (rolesRequeridos && !rolesRequeridos.includes(userRole)) {
        console.warn(`Acceso denegado: Rol ${userRole} no autorizado para ${location.pathname}. Roles requeridos: ${rolesRequeridos}`);
        // Redirige al dashboard por defecto para roles no autorizados
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [userRole, setUserRole] = useState(null); // Estado para almacenar el rol del usuario
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const handleLogout = useCallback(() => {
        // Limpia todos los datos de autenticación del localStorage
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        localStorage.removeItem('userRole'); // Limpia también el rol
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRole(null);
    }, []);

    const handleLoginSuccess = useCallback((token, usernameFromJwt, nombreCompletoFromJwt, roleFromJwt) => {
        // Almacena los datos de autenticación, incluyendo el rol
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('username', usernameFromJwt);
        localStorage.setItem('nombreCompleto', nombreCompletoFromJwt);
        localStorage.setItem('userRole', roleFromJwt); // Guarda el rol en localStorage
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompletoFromJwt);
        setUserRole(roleFromJwt); // Actualiza el estado del rol
    }, []);

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            const role = localStorage.getItem('userRole'); // Obtiene el rol del localStorage

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRole(null);
                setIsLoadingAuth(false);
                return;
            }

            try {
                // Validación del token contra el backend
                const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Token inválido o expirado");

                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    throw new Error("Token expirado");
                }

                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
                setUserRole(role); // Establece el rol en el estado
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                handleLogout(); // Cierra sesión si el token es inválido o expirado
            } finally {
                setIsLoadingAuth(false);
            }
        };

        verificarToken();
    }, [handleLogout]);

    const ContenidoApp = () => {
        const location = useLocation();

        // Muestra un mensaje de carga mientras se verifica la autenticación inicial
        if (isLoadingAuth) {
            return (
                <>
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => { }} />
                    <div className="loading-message">
                        <p>Verificando sesión...</p>
                    </div>
                </>
            );
        }

        // Define qué rutas NO deben mostrar la Navbar
        const shouldShowNavbar = ![
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/oauth2/redirect'
        ].includes(location.pathname);

        return (
            <>
                {shouldShowNavbar && (
                    <Navbar
                        isLoggedIn={estaAutenticado}
                        nombreUsuario={nombreUsuario}
                        onLogout={handleLogout} // Pasa la función de logout
                        userRole={userRole} // Pasa el rol a la Navbar para renderizado condicional
                    />
                )}

                <Routes>
                    <Route path="/" element={<Home />} />

                    {/* Rutas de autenticación */}
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLoginSuccess} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    {/* Esta ruta es específica para el redireccionamiento de OAuth2, donde se procesa el token */}
                    <Route path="/oauth2/redirect" element={<OAuth2Success onLoginSuccess={handleLoginSuccess} />} />

                    {/* Rutas principales y de usuario autenticado */}
                    <Route path="/complejos" element={<Canchas />} /> {/* Canchas.jsx ahora lista Complejos */}
                    <Route path="/reservar" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaForm /></RutaProtegida>} />
                    <Route path="/reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaDetail /></RutaProtegida>} />
                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><DashboardUsuario /></RutaProtegida>} />

                    {/* Rutas de pago */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    {/* Rutas de Administración Protegidas por Rol */}
                    {/* Ambos roles (ADMIN y COMPLEX_OWNER) pueden acceder al AdminPanel, la diferenciación se hace dentro del componente */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN', 'COMPLEX_OWNER']}><AdminPanel /></RutaProtegida>} />

                    {/* Ruta de fallback para 404 (redirecciona a Home) */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </>
        );
    };

    return (
        <Router>
            <div className="App">
                <ContenidoApp />
            </div>
        </Router>
    );
}

export default App;