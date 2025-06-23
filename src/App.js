import React, { useState, useEffect, useCallback } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from './components/Navbar/NavBar';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/home/Home';
import ReservaForm from './features/reservas/ReservaForm';
import ReservaDetail from './features/reservas/ReservaDetail';
import AdminPanel from './features/admin/AdminPanel'; // Mantén esta importación
import Complejos from './components/Complejos/Complejos';
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';
import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';
import FAQPage from './features/pages/FAQPage/FAQPage';

import './App.css';

// Helper: Redirecciona si ya está autenticado
function RedireccionSiAutenticado({ children, destino = "/dashboard" }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (estaAutenticado) {
        const from = location.state?.from?.pathname || destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

// Helper: Ruta Protegida para manejar roles
function RutaProtegida({ children, rolesRequeridos }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole'); // Obtiene el rol desde localStorage
    const location = useLocation();

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si no se requieren roles específicos, cualquier usuario autenticado puede acceder
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
        return children;
    }

    // Verificar si el rol del usuario está en la lista de roles requeridos
    if (!rolesRequeridos.includes(userRole)) {
        console.warn(`Acceso denegado: Rol ${userRole} no autorizado para ${location.pathname}. Roles requeridos: ${rolesRequeridos.join(', ')}`);
        // Redirige al dashboard si el usuario no tiene el rol necesario
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        localStorage.removeItem('userRole'); // Asegúrate de limpiar el rol
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRole(null);
    }, []);

    const handleLoginSuccess = useCallback((token, usernameFromJwt, nombreCompletoFromJwt, roleFromJwt) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('username', usernameFromJwt);
        localStorage.setItem('nombreCompleto', nombreCompletoFromJwt);
        localStorage.setItem('userRole', roleFromJwt); // Guarda el rol recibido
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompletoFromJwt);
        setUserRole(roleFromJwt);
    }, []);

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            const role = localStorage.getItem('userRole'); // Lee el rol desde localStorage

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRole(null);
                setIsLoadingAuth(false);
                return;
            }

            try {
                // Validación del token en el backend
                const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Token inválido o expirado");

                // Decodificación del token para verificar la expiración en el frontend
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    throw new Error("Token expirado");
                }

                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
                setUserRole(role); // Establece el rol desde localStorage
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                handleLogout(); // Limpia la sesión si el token no es válido o está expirado
            } finally {
                setIsLoadingAuth(false);
            }
        };

        verificarToken();
    }, [handleLogout]);

    const ContenidoApp = () => {
        const location = useLocation();

        if (isLoadingAuth) {
            return (
                <>
                    {/* Puedes mostrar un spinner o un mensaje de carga aquí */}
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} userRole={null} />
                    <div className="loading-message">
                        <p>Verificando sesión...</p>
                    </div>
                </>
            );
        }

        // Determina si se debe mostrar la barra de navegación
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
                        onLogout={handleLogout}
                        userRole={userRole} // Pasa el userRole a Navbar para la visibilidad de enlaces
                    />
                )}

                <Routes>
                    <Route path="/" element={<Home estaAutenticado={estaAutenticado} />} />

                    {/* Rutas de autenticación */}
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLoginSuccess} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2/redirect" element={<OAuth2Success onLoginSuccess={handleLoginSuccess} />} />

                    {/* Rutas principales y de usuario autenticado */}
                    {/* Complejos no requiere autenticación para ser listado, solo para reservar */}
                    <Route path="/complejos" element={<Complejos />} /> 
                    
                    <Route path="/reservar/:complejoId/:canchaId" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaForm /></RutaProtegida>} />
                    <Route path="/reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaDetail /></RutaProtegida>} />
                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><DashboardUsuario /></RutaProtegida>} />

                    {/* Rutas de pago */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    {/* Rutas de Administración Protegidas por Rol */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN', 'COMPLEX_OWNER']}><AdminPanel /></RutaProtegida>} />

                    {/* NUEVA RUTA: Página de Preguntas Frecuentes (FAQ) */}
                    <Route path="/faq" element={<FAQPage />} />

                    {/* Ruta de fallback para 404 (o redireccionar a home) */}
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