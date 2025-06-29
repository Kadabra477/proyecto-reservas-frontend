// frontend/src/App.js
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
import AdminPanel from './features/admin/AdminPanel';
import Complejos from './components/Complejos/Complejos'; 
import ComplejoDetalle from './components/Complejos/ComplejoDetalle/ComplejoDetalle'; 
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
        // Asegúrate de que 'from' siempre tenga un valor seguro para evitar rutas no válidas
        const from = location.state?.from?.pathname && location.state.from.pathname !== '/' ? location.state.from.pathname : destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

// Helper: Ruta Protegida para manejar roles
function RutaProtegida({ children, rolesRequeridos }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const userRolesFromStorage = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const location = useLocation();

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
        return children;
    }

    const hasRequiredRole = rolesRequeridos.some(requiredRole => userRolesFromStorage.includes(requiredRole));

    if (!hasRequiredRole) {
        console.warn(`Acceso denegado: Roles del usuario [${userRolesFromStorage.join(', ')}] no autorizados para ${location.pathname}. Roles requeridos: [${rolesRequeridos.join(', ')}]`);
        // Redirige al dashboard si no tiene el rol, que es la acción por defecto para rutas no autorizadas
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [userRoleArray, setUserRoleArray] = useState([]); 
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        localStorage.removeItem('userRoles'); 
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRoleArray([]); 
    }, []);

    const handleLoginSuccess = useCallback((token, usernameFromJwt, nombreCompletoFromJwt, roleOrRolesFromJwt) => {
        let rolesToStore = [];
        if (Array.isArray(roleOrRolesFromJwt)) {
            rolesToStore = roleOrRolesFromJwt.map(r => r.replace('ROLE_', '')); 
        } else if (typeof roleOrRolesFromJwt === 'string') {
            rolesToStore = [roleOrRolesFromJwt.replace('ROLE_', '')]; 
        } else {
            console.warn("handleLoginSuccess: Tipo de rol inesperado, asumiendo 'USER'.");
            rolesToStore = ['USER'];
        }

        localStorage.setItem('jwtToken', token);
        localStorage.setItem('username', usernameFromJwt);
        localStorage.setItem('nombreCompleto', nombreCompletoFromJwt);
        localStorage.setItem('userRoles', JSON.stringify(rolesToStore)); 
        
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompletoFromJwt);
        setUserRoleArray(rolesToStore); 
    }, []);

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            const rolesFromStorage = JSON.parse(localStorage.getItem('userRoles') || '[]'); 

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRoleArray([]);
                setIsLoadingAuth(false);
                return;
            }

            try {
                // Modificado: Se elimina la validación explícita del token aquí
                // si el axios interceptor ya se encarga de los 401 y redirecciones.
                // Si este endpoint /auth/validate-token está dando 404 constantemente,
                // la validación real la hará el backend al intentar acceder a una ruta protegida.
                // const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                //     method: "GET",
                //     headers: {
                //         "Authorization": `Bearer ${token}`
                //     }
                // });
                // if (!res.ok) throw new Error("Token inválido o expirado");

                const decodedToken = jwtDecode(token);
                // Usar la hora actual en Argentina para verificar la expiración
                const currentTimeArgentinaSeconds = Math.floor(new Date().toLocaleString('en-US', {timeZone: 'America/Argentina/Buenos_Aires', hour12: false}).getTime() / 1000);
                
                if (decodedToken.exp < currentTimeArgentinaSeconds) {
                    throw new Error("Token expirado (hora de Argentina)");
                }

                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
                setUserRoleArray(rolesFromStorage); 
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                handleLogout(); // Forzar logout si el token no es válido o está expirado
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
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} userRole={[]} /> 
                    <div className="loading-message">
                        <p>Verificando sesión...</p>
                    </div>
                </>
            );
        }

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
                        userRole={userRoleArray} 
                    />
                )}

                <Routes>
                    <Route path="/" element={<Home estaAutenticado={estaAutenticado} />} />

                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLoginSuccess} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2/redirect" element={<OAuth2Success onLoginSuccess={handleLoginSuccess} />} />

                    <Route path="/complejos" element={<Complejos />} /> 
                    <Route path="/complejos/:id" element={<ComplejoDetalle />} />
                    
                    <Route 
                        path="/reservar" 
                        element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaForm /></RutaProtegida>} 
                    />
                    <Route 
                        path="/reservar/:complejoId/:canchaId" 
                        element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaForm /></RutaProtegida>} 
                    />

                    <Route path="/reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaDetail /></RutaProtegida>} />
                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><DashboardUsuario /></RutaProtegida>} />

                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN', 'COMPLEX_OWNER']}><AdminPanel /></RutaProtegida>} />

                    <Route path="/faq" element={<FAQPage />} />

                    {/* Ruta catch-all para cualquier otra cosa que no coincida */}
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