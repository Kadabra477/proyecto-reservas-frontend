// frontend/src/App.js
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
import ReservaDetail from './features/reservas/ReservaDetail'; // Importa el nuevo ReservaDetail
import AdminPanel from './features/admin/AdminPanel';
import Canchas from './components/Canchas/Canchas';
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';
import PerfilForm from './components/Perfil/PerfilForm'; // Este es el componente que se usa para el perfil

import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';

import './App.css'; // Tu archivo CSS global

// Helper: Redirecciona si ya está autenticado
function RedireccionSiAutenticado({ children, destino = "/dashboard" }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (estaAutenticado) {
        // Redirigir a la página de origen si existe, de lo contrario al destino predeterminado
        const from = location.state?.from?.pathname || destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

// Helper: Para verificar si el usuario tiene el rol requerido
const hasRequiredRole = (userRole, requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No se requieren roles específicos, cualquier autenticado sirve
    }
    if (!userRole) {
        return false; // No tiene rol definido
    }
    // Asegurarse de que el rol de usuario coincida con alguno de los roles requeridos
    return requiredRoles.includes(userRole.toUpperCase());
};

// Helper: Ruta Protegida para manejar roles
function RutaProtegida({ children, rolesRequeridos }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole'); // Obtener el rol del localStorage
    const location = useLocation();

    if (!estaAutenticado) {
        // Redirige al login y guarda la ubicación actual para volver después de iniciar sesión
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si está autenticado pero no tiene el rol requerido, redirige a una página de acceso denegado o al dashboard
    if (!hasRequiredRole(userRole, rolesRequeridos)) {
        console.warn(`Acceso denegado: Rol ${userRole} no autorizado para ${location.pathname}. Roles requeridos: ${rolesRequeridos}`);
        // Puedes redirigir a una página 403 (Acceso Denegado) o al dashboard
        return <Navigate to="/dashboard" replace />; // Redirige al dashboard si no tiene permisos
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
        localStorage.removeItem('userRole');
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRole(null);
    }, []);

    const handleLoginSuccess = useCallback((token, usernameData, nombreCompletoData, roleData) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('username', usernameData);
        localStorage.setItem('nombreCompleto', nombreCompletoData);
        localStorage.setItem('userRole', roleData);
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompletoData);
        setUserRole(roleData);
    }, []);

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            const role = localStorage.getItem('userRole');

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
                
                // Si el token es válido, decodificar para verificar expiración (doble chequeo)
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    throw new Error("Token expirado");
                }

                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
                setUserRole(role);
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                handleLogout(); // Limpiar todo en caso de error
            } finally {
                setIsLoadingAuth(false);
            }
        };

        verificarToken();
    }, [handleLogout]);

    const ContenidoApp = () => {
        const navigate = useNavigate();
        const location = useLocation();

        if (isLoadingAuth) {
            return (
                <>
                    {/* Puedes mostrar una Navbar básica o un placeholder mientras carga */}
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} />
                    <div className="loading-message">
                        <p>Verificando sesión...</p>
                        {/* <div className="spinner"></div> */} {/* Si tienes un spinner */}
                    </div>
                </>
            );
        }

        const shouldShowNavbar = ![
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/oauth2-success' // Mantener fuera de la Navbar
        ].includes(location.pathname);

        return (
            <>
                {shouldShowNavbar && (
                    <Navbar
                        isLoggedIn={estaAutenticado}
                        nombreUsuario={nombreUsuario}
                        onLogout={() => {
                            handleLogout();
                            navigate('/');
                        }}
                    />
                )}

                <Routes>
                    <Route path="/" element={<Home estaAutenticado={estaAutenticado} />} />
                    
                    {/* Rutas de autenticación sin Navbar */}
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLoginSuccess} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2/redirect" element={<OAuth2Success onLoginSuccess={handleLoginSuccess} />} /> 

                    {/* Rutas protegidas (que tendrán Navbar por defecto) */}
                    <Route path="/canchas" element={<Canchas />} /> {/* Canchas puede ser pública, pero reservar no */}
                    <Route path="/reservar/:canchaId" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><ReservaForm /></RutaProtegida>} />
                    <Route path="/mis-reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><ReservaDetail /></RutaProtegida>} /> {/* Nueva ruta para ReservaDetail */}
                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><DashboardUsuario /></RutaProtegida>} />
                    <Route path="/perfil" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><PerfilForm /></RutaProtegida>} />


                    {/* Rutas de pago (generalmente no protegidas para el callback del MP) */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />
                    
                    {/* Rutas de Administración Protegidas por Rol 'ADMIN' */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN']}><AdminPanel /></RutaProtegida>} />
                    {/* No necesitas rutas separadas como /admin/crear-cancha o /admin/editar-cancha/:id si AdminPanel las maneja internamente con tabs */}
                    {/* Si decides tener rutas directas a estadísticas, sería así: */}
                    {/* <Route path="/admin/estadisticas" element={<RutaProtegida rolesRequeridos={['ADMIN']}><AdminEstadisticas /></RutaProtegida>} /> */}

                    {/* Ruta de fallback para 404 - redirige a home */}
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