import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import '../../styles/AuthForm.css';

function VerifyAccount() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verificando tu cuenta...');
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setMessage('❌ Token de verificación no encontrado.');
            setMessageType('error');
            return;
        }

        const verifyUser = async () => {
            try {
                const response = await api.get(`/auth/verify-account?token=${token}`);

                if (response.status === 200) {
                    setMessage('✅ ¡Tu cuenta ha sido verificada exitosamente! Ya puedes iniciar sesión.');
                    setMessageType('success');
                    setTimeout(() => {
                        navigate('/login?validated=true'); // Redirige al login con el mensaje de éxito
                    }, 3000);
                } else {
                    setMessage('❌ Error al verificar la cuenta. El token puede ser inválido o haber expirado.');
                    setMessageType('error');
                }
            } catch (err) {
                console.error('Error durante la verificación de cuenta:', err);
                const errorMessage = err.response?.data?.message || err.response?.data || 'Error al verificar la cuenta. Intenta de nuevo más tarde.';
                setMessage(`❌ ${errorMessage}`);
                setMessageType('error');
            }
        };

        verifyUser();
    }, [searchParams, navigate]);

    return (
        <div className="auth-background">
            <div className="auth-container">
                <div className="auth-form" style={{ textAlign: 'center', padding: '30px' }}>
                    <p className={`auth-message ${messageType}`} style={{ marginBottom: '1em' }}>
                        {message}
                    </p>
                    {messageType === 'error' && (
                        <p>Si crees que hay un error, contacta a soporte o intenta registrarte de nuevo.</p>
                    )}
                    {messageType === 'success' && (
                        <p>Serás redirigido al inicio de sesión en breve...</p>
                    )}
                </div>
                <div className="auth-drops">
                    <div className="drop drop-1"></div>
                    <div className="drop drop-2"></div>
                    <div className="drop drop-3"></div>
                    <div className="drop drop-4"></div>
                    <div className="drop drop-5"></div>
                </div>
            </div>
        </div>
    );
}

export default VerifyAccount;