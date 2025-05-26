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
import MisReservas from './features/pages/MisReservas';

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

function RutaProtegida({ children }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

function App() {
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Nuevo estado para la carga de autenticación

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto');

            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                setIsLoadingAuth(false); // Finaliza la carga si no hay token
                return;
            }

            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Token inválido");
                setEstaAutenticado(true);
                setNombreUsuario(nombre || '');
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('username');
                localStorage.removeItem('nombreCompleto');
                setEstaAutenticado(false);
                setNombreUsuario('');
            } finally {
                setIsLoadingAuth(false); // Siempre finaliza la carga
            }
        };

        verificarToken();
    }, []);

    const handleLogin = (token, username, nombreCompleto) => {
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompleto);
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        setEstaAutenticado(false);
        setNombreUsuario('');
    };

    const ContenidoApp = () => {
        const navigate = useNavigate();

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

        return (
            <>
                <Navbar
                    isLoggedIn={estaAutenticado}
                    nombreUsuario={nombreUsuario}
                    onLogout={() => {
                        handleLogout();
                        navigate('/');
                    }}
                />

                <Routes>
                    <Route path="/" element={<Home estaAutenticado={estaAutenticado} />} />
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLogin} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />

                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2-success" element={<OAuth2Success onLoginSuccess={handleLogin} />} />

                    <Route path="/dashboard" element={<RutaProtegida><DashboardUsuario /></RutaProtegida>} />
                    <Route path="/canchas" element={<RutaProtegida><Canchas /></RutaProtegida>} />
                    <Route path="/reservar/:canchaId" element={<RutaProtegida><ReservaForm /></RutaProtegida>} />
                    <Route path="/admin" element={<RutaProtegida><AdminPanel /></RutaProtegida>} />
                    {/* Si PerfilForm es para la edición separada y quieres un link directo en el navbar, esta ruta sería útil */}
                    <Route path="/perfil" element={<RutaProtegida><PerfilForm /></RutaProtegida>} />
                    <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />

                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

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