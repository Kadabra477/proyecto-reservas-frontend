import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ComplejoCard from '../ComplejoCard/ComplejoCard'; // Asegúrate que la ruta sea correcta si es necesario
import './Canchas.css';

function Canchas() {
    const [complejos, setComplejos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchComplejos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/complejos');
            if (Array.isArray(response.data)) {
                setComplejos(response.data);
            } else {
                console.error("La respuesta de la API de complejos no es un array:", response.data);
                setComplejos([]);
            }
        } catch (err) {
            console.error("Error al cargar complejos:", err);
            setError('Error al cargar los complejos disponibles. Intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplejos();
    }, [fetchComplejos]);

    const handleReserveAnyCancha = () => {
        navigate('/reservar');
    };

    if (loading) {
        return <div className="canchas-container loading-message">Cargando complejos...</div>;
    }

    if (error) {
        return <div className="canchas-container error-message">{error}</div>;
    }

    // Determina si el botón de reservar debe estar deshabilitado
    const isReserveButtonDisabled = complejos.length === 0; // Deshabilita si no hay complejos

    return (
        <div className="canchas-container">
            <h1 className="canchas-title">Nuestros Complejos Deportivos</h1>

            <button
                className="btn-main-reserve"
                onClick={handleReserveAnyCancha}
                disabled={isReserveButtonDisabled} // Deshabilita si no hay complejos
            >
                Reservar una Cancha por Tipo
            </button>
            
            {/* Mensaje informativo si el botón está deshabilitado */}
            {isReserveButtonDisabled && (
                <p className="info-message-no-complejos">
                    No hay complejos disponibles para reservar en este momento. Por favor, revisa más tarde o contacta al administrador.
                </p>
            )}

            {complejos.length > 0 ? (
                <div className="complejos-grid">
                    {complejos.map(complejo => (
                        <ComplejoCard key={complejo.id} complejo={complejo} />
                    ))}
                </div>
            ) : (
                // Este mensaje se muestra si no hay complejos, complementa al del botón
                <p className="no-canchas-message">No hay complejos registrados en el sistema. Contacta al administrador.</p>
            )}
        </div>
    );
}

export default Canchas;