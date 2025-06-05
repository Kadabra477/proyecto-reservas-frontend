// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate, // Asegúrate de importar Navigate
    useNavigate,
    useLocation,
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de tener 'jwt-decode' instalado

import Navbar from './components/Navbar/NavBar';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/home/Home';
import ReservaForm from './features/reservas/ReservaForm'; // Importar el componente ReservaForm
import ReservaDetail from './features/reservas/ReservaDetail'; 
import AdminPanel from './features/admin/AdminPanel';
import Canchas from './features/canchas/Canchas'; // Asegúrate de que esta ruta sea correcta
import DashboardUsuario from './features/dashboard/DashboardUsuario';
import ForgotPasswordRequest from './features/auth/ForgotPasswordRequest';
import ResetPassword from './features/auth/ResetPassword';
import OAuth2Success from './features/auth/OAuth2Success';
// import PerfilForm from './components/Perfil/PerfilForm'; // Si usas PerfilForm como una página separada

import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';

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
    const userRole = localStorage.getItem('userRole'); 
    const location = useLocation();

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (rolesRequeridos && !rolesRequeridos.includes(userRole)) {
        console.warn(`Acceso denegado: Rol ${userRole} no autorizado para ${location.pathname}. Roles requeridos: ${rolesRequeridos}`);
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
                    <Navbar isLoggedIn={false} nombreUsuario="" onLogout={() => {}} />
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
            '/oauth2/redirect' // Mantenemos esta también si es una página de "procesando"
        ].includes(location.pathname);

        return (
            <>
                {shouldShowNavbar && (
                    <Navbar
                        isLoggedIn={estaAutenticado}
                        nombreUsuario={nombreUsuario}
                        onLogout={() => {
                            handleLogout();
                            // Puedes redirigir a Home o Login después del logout
                            // navigate('/'); // No usar navigate directamente aquí
                        }}
                    />
                )}

                <Routes>
                    <Route path="/" element={<Home />} />
                    
                    {/* Rutas de autenticación sin Navbar */}
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLoginSuccess} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2/redirect" element={<OAuth2Success onLoginSuccess={handleLoginSuccess} />} /> 

                    {/* Rutas protegidas (que tendrán Navbar por defecto) */}
                    <Route path="/canchas" element={<Canchas />} /> 
                    
                    {/* RUTA MODIFICADA: Ahora ReservaForm no necesita un ID de cancha en la URL */}
                    <Route path="/reservar" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><ReservaForm /></RutaProtegida>} /> 
                    
                    {/* Ruta para ver el detalle de una reserva específica (mantiene el ID) */}
                    {/* Usamos 'reservas/:id' para consistencia con el backend */}
                    <Route path="/reservas/:id" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><ReservaDetail /></RutaProtegida>} />

                    <Route path="/dashboard" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><DashboardUsuario /></RutaProtegida>} />
                    {/* Si tienes un PerfilForm como página separada */}
                    {/* <Route path="/perfil" element={<RutaProtegida rolesRequeridos={['USER', 'ADMIN']}><PerfilForm /></RutaProtegida>} /> */}

                    {/* Rutas de pago (generalmente no protegidas para el callback del MP) */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />
                    
                    {/* Rutas de Administración Protegidas por Rol 'ADMIN' */}
                    <Route path="/admin" element={<RutaProtegida rolesRequeridos={['ADMIN']}><AdminPanel /></RutaProtegida>} />
                    
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