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
import PerfilForm from './components/Perfil/PerfilForm'; // Este componente parece no usarse directamente en las rutas, pero lo dejo.
import MisReservas from './features/pages/MisReservas';

import PagoExitoso from './features/pago/PagoExitoso';
import PagoFallido from './features/pago/PagoFallido';
import PagoPendiente from './features/pago/PagoPendiente';

// Helpers
function RedireccionSiAutenticado({ children, destino = "/dashboard" }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (estaAutenticado) {
        // Redirigir a 'destino' si está autenticado, a menos que ya estés en una ruta de login/register
        // y vengas de una ruta protegida. En ese caso, redirige al dashboard.
        const from = location.state?.from?.pathname || destino;
        return <Navigate to={from} replace />;
    }
    return children;
}

function RutaProtegida({ children }) {
    const estaAutenticado = !!localStorage.getItem('jwtToken');
    const location = useLocation();
    if (!estaAutenticado) {
        // Si no está autenticado, redirige al login, guardando la ruta actual para volver.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

function App() {
    // El estado de autenticación se usa aquí para pasarlo a Navbar
    const [estaAutenticado, setEstaAutenticado] = useState(false);
    const [nombreUsuario, setNombreUsuario] = useState(''); // Estado para el nombre del usuario logueado

    useEffect(() => {
        const verificarToken = async () => {
            const token = localStorage.getItem('jwtToken');
            const nombre = localStorage.getItem('nombreCompleto'); // Obtener el nombre del usuario
            if (!token) {
                setEstaAutenticado(false);
                setNombreUsuario('');
                return;
            }

            try {
                // Validación de token al backend
                const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/validate-token`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("Token inválido");
                setEstaAutenticado(true);
                setNombreUsuario(nombre || ''); // Setear el nombre si el token es válido
            } catch (error) {
                console.log("Token inválido o expirado:", error);
                // Limpiar localStorage y estados si el token no es válido
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('username');
                localStorage.removeItem('nombreCompleto');
                setEstaAutenticado(false);
                setNombreUsuario('');
            }
        };

        verificarToken();
    }, []); // Se ejecuta una vez al montar el componente

    // Función para manejar el login exitoso (actualiza el estado de autenticación y nombre)
    const handleLogin = (token, username, nombreCompleto) => {
        setEstaAutenticado(true);
        setNombreUsuario(nombreCompleto); // Guarda el nombre completo
        // No es necesario guardar el token y username aquí, ya se hace en Login/OAuth2Success
    };

    // Función para manejar el logout
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('nombreCompleto');
        setEstaAutenticado(false);
        setNombreUsuario('');
    };

    const ContenidoApp = () => {
        const navigate = useNavigate();

        return (
            <>
                {/* La Navbar se renderiza siempre, pero sus elementos internos cambian */}
                <Navbar
                    isLoggedIn={estaAutenticado} // Pasamos el estado de autenticación a Navbar
                    nombreUsuario={nombreUsuario} // Pasamos el nombre del usuario a Navbar
                    onLogout={() => {
                        handleLogout(); // Llama a la función de logout definida en App
                        navigate('/'); // Redirige a la página principal
                    }}
                />

                <Routes>
                    <Route path="/" element={<Home estaAutenticado={estaAutenticado} />} />
                    {/* Las rutas de login y registro usan RedireccionSiAutenticado */}
                    <Route path="/login" element={<RedireccionSiAutenticado><Login onLoginSuccess={handleLogin} /></RedireccionSiAutenticado>} />
                    <Route path="/register" element={<RedireccionSiAutenticado><Register /></RedireccionSiAutenticado>} />
                    
                    {/* Rutas de recuperación de contraseña y OAuth2 Success */}
                    <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/oauth2-success" element={<OAuth2Success onLoginSuccess={handleLogin} />} /> {/* Pasar onLoginSuccess */}

                    {/* Rutas Protegidas que requieren autenticación */}
                    <Route path="/dashboard" element={<RutaProtegida><DashboardUsuario /></RutaProtegida>} />
                    <Route path="/canchas" element={<RutaProtegida><Canchas /></RutaProtegida>} />
                    <Route path="/reservar/:canchaId" element={<RutaProtegida><ReservaForm /></RutaProtegida>} />
                    <Route path="/admin" element={<RutaProtegida><AdminPanel /></RutaProtegida>} />
                    {/* El perfil ahora se edita dentro del Dashboard o será un componente aparte?
                        Si PerfilForm es para la edición separada, mantenlo así:
                    */}
                    <Route path="/perfil" element={<RutaProtegida><PerfilForm /></RutaProtegida>} />
                    <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />

                    {/* Rutas de pago */}
                    <Route path="/pago-exitoso" element={<PagoExitoso />} />
                    <Route path="/pago-fallido" element={<PagoFallido />} />
                    <Route path="/pago-pendiente" element={<PagoPendiente />} />

                    {/* Redirección por defecto para cualquier ruta no encontrada */}
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