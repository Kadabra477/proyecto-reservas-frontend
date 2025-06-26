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
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';
import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';
import FAQPage from './features/pages/FAQPage/FAQPage'; // Ruta corregida según tu estructura de carpetas

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
    // **CAMBIO CLAVE AQUÍ:** Leer userRoles como un array JSON
    const userRolesFromStorage = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const location = useLocation();

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
        return children;
    }

    // Comprueba si AL MENOS UNO de los roles del usuario está en los roles requeridos
    const hasRequiredRole = rolesRequeridos.some(requiredRole => userRolesFromStorage.includes(requiredRole));

    if (!hasRequiredRole) {
        console.warn(`Acceso denegado: Roles del usuario [${userRolesFromStorage.join(', ')}] no autorizados para ${location.pathname}. Roles requeridos: [${rolesRequeridos.join(', ')}]`);
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    // **CAMBIO CLAVE AQUÍ:** userRoleArray siempre será un array de roles (ej: ['ADMIN', 'USER'])
    const [userRoleArray, setUserRoleArray] = useState([]); 
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        localStorage.removeItem('userRoles'); // **CAMBIO:** Limpiar 'userRoles' (el array JSON)
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRoleArray([]); // Limpia el array de roles en el estado
    }, []);

    // **CAMBIO CLAVE AQUÍ:** `roleOrRolesFromJwt` ahora puede ser una cadena simple o un array del backend.
    // Lo convertimos siempre a un array de roles limpios (sin "ROLE_").
    const handleLoginSuccess = useCallback((token, usernameFromJwt, nombreCompletoFromJwt, roleOrRolesFromJwt) => {
        let rolesToStore = [];
        if (Array.isArray(roleOrRolesFromJwt)) {
            // Si el backend ya devuelve un array (ej: ["ROLE_ADMIN", "ROLE_USER"]), lo limpiamos
            rolesToStore = roleOrRolesFromJwt.map(r => r.replace('ROLE_', '')); 
        } else if (typeof roleOrRolesFromJwt === 'string') {
            // Si el backend devuelve una cadena simple (ej: "ADMIN" o "ROLE_ADMIN"), lo hacemos un array
            rolesToStore = [roleOrRolesFromJwt.replace('ROLE_', '')]; 
        } else {
            console.warn("handleLoginSuccess: Tipo de rol inesperado, asumiendo 'USER'.");
            rolesToStore = ['USER'];
        }

        localStorage.setItem('jwtToken', token);
        localStorage.setItem('username', usernameFromJwt);
        localStorage.setItem('nombreCompleto', nombreCompletoFromJwt);
        // **CAMBIO CLAVE:** ALMACENAR SIEMPRE COMO ARRAY JSON STRING en 'userRoles'
        localStorage.setItem('userRoles', JSON.stringify(rolesToStore)); 
        
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompletoFromJwt);
        setUserRoleArray(rolesToStore); // Actualiza el estado con el array de roles
    }, []);

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            // **CAMBIO CLAVE:** Leer `userRoles` como un array JSON
            const rolesFromStorage = JSON.parse(localStorage.getItem('userRoles') || '[]'); 

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRoleArray([]);
                setIsLoadingAuth(false);
                return;
            }

            try {
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
                setUserRoleArray(rolesFromStorage); // Establece el array de roles desde localStorage
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                handleLogout();
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
                    {/* Pasa un array vacío al Navbar mientras carga, para evitar errores */}
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} userRole={[]} /> 
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
                        userRole={userRoleArray} // **CAMBIO CLAVE:** Pasa el ARRAY de roles a Navbar
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

                    {/* Rutas públicas o que se autoprotegen internamente */}
                    <Route path="/complejos" element={<Complejos />} /> 
                    
                    {/* Rutas que requieren autenticación y/o roles específicos */}
                    <Route path="/reservar/:complejoId/:canchaId" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaForm /></RutaProtegida>} />
                    <Route path="/reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><ReservaDetail /></RutaProtegida>} />
                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN', 'COMPLEX_OWNER']}><DashboardUsuario /></RutaProtegida>} />

                    {/* Rutas de pago */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    {/* Rutas de Administración Protegidas por Rol */}
                    {/* AdminPanel ahora usa el array de roles para su lógica interna de pestañas */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN', 'COMPLEX_OWNER']}><AdminPanel /></RutaProtegida>} />

                    {/* Ruta: Página de Preguntas Frecuentes (FAQ) */}
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