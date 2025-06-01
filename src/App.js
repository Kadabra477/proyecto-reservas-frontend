import React, { useState, useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar/NavBar';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/home/Home';
import ReservaForm from './features/reservas/ReservaForm';
import AdminPanel from './features/admin/AdminPanel';
import Canchas from './components/Canchas/Canchas';
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';
import PerfilForm from './components/Perfil/PerfilForm';

import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';

// Helpers
function RedireccionSiAutenticado({ children, destino = "/dashboard" }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (estaAutenticado) {
        const from = location.state?.from?.pathname || destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

// NUEVA FUNCIÓN: Para verificar si el usuario tiene el rol requerido
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

// MODIFICADA: Ruta Protegida para manejar roles
function RutaProtegida({ children, rolesRequeridos }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole'); // Obtener el rol del localStorage
    const location = useLocation();

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si está autenticado pero no tiene el rol requerido, redirige a una página de acceso denegado o al dashboard
    if (!hasRequiredRole(userRole, rolesRequeridos)) {
        // Podrías redirigir a una página 403 (Acceso Denegado) o al dashboard
        console.warn(`Acceso denegado: Rol ${userRole} no autorizado para ${location.pathname}. Roles requeridos: ${rolesRequeridos}`);
        return <Navigate to="/dashboard" replace />; // Redirige al dashboard si no tiene permisos
    }

    return children;
}


function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [userRole, setUserRole] = useState(null); // Nuevo estado para el rol del usuario
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Nuevo estado para la carga de autenticación

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');
            const role = localStorage.getItem('userRole'); // Recuperar el rol

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRole(null);
                setIsLoadingAuth(false);
                return;
            }

            try {
                // Aquí usamos fetch directo, no api de axios, porque no queremos que el interceptor maneje un 401 para esta validación inicial.
                const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Token inválido");
                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
                setUserRole(role); // Establecer el rol
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('username');
                localStorage.removeItem('nombreCompleto');
                localStorage.removeItem('userRole'); // Limpiar el rol también
                setEstaAutenticado(false);
                setNombreUsuario('');
                setUserRole(null);
            } finally {
                setIsLoadingAuth(false); // Siempre finaliza la carga
            }
        };

        verificarToken();
    }, []);

    // MODIFICADA: handleLogin para guardar el rol
    const handleLogin = (token, username, nombreCompleto, role) => {
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompleto);
        setUserRole(role); // Guardar el rol en el estado
        localStorage.setItem('userRole', role); // Guardar el rol en localStorage
    };

    // MODIFICADA: handleLogout para limpiar el rol
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        localStorage.removeItem('userRole'); // Limpiar el rol
        setEstaAutenticado(false);
        setNombreUsuario('');
        setUserRole(null);
    };

    const ContenidoApp = () => {
        const navigate = useNavigate();
        const location = useLocation(); // Hook para obtener la ruta actual

        // Mostrar un estado de carga mientras se verifica la autenticación
        if (isLoadingAuth) {
            return (
                <>
                    {/* Puedes mostrar una Navbar básica o un placeholder */}
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} />
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>Verificando sesión...</p>
                        {/* Aquí podrías añadir un spinner de carga */}
                    </div>
                </>
            );
        }

        // Determinar si la Navbar debe mostrarse en la ruta actual
        // Por ejemplo, no mostrarla en /login, /register, etc.
        const shouldShowNavbar = ![
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/oauth2-success'
        ].includes(location.pathname);


        return (
            <>
                {/* Renderiza la Navbar solo si shouldShowNavbar es true */}
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
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLogin} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    {/* A OAuth2Success se le pasa onLoginSuccess para que notifique a App.js y guarde el rol */}
                    <Route path="/oauth2-success" element={<OAuth2Success onLoginSuccess={handleLogin} />} /> 

                    {/* Rutas protegidas (que tendrán Navbar por defecto, ya que no están en la lista de exclusión) */}
                    <Route path="/dashboard" element={<RutaProtegida><DashboardUsuario /></RutaProtegida>} />
                    <Route path="/canchas" element={<RutaProtegida><Canchas /></RutaProtegida>} />
                    <Route path="/reservar/:canchaId" element={<RutaProtegida><ReservaForm /></RutaProtegida>} />
                    {/* Ruta de Admin ahora requiere el rol 'ADMIN' */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN']}><AdminPanel /></RutaProtegida>} />
                    <Route path="/perfil" element={<RutaProtegida><PerfilForm /></RutaProtegida>} />

                    {/* Rutas de pago */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    {/* Redirección para rutas no encontradas */}
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