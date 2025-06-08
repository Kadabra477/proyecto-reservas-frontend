import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ComplejoCard from '../ComplejoCard/ComplejoCard'; // ¡Ruta corregida si ComplejoCard está en su propia carpeta!
// Si tu carpeta de ComplejoCard también se renombró a kebab-case como 'complejo-card', la ruta sería:
// import ComplejoCard from '../complejo-card/ComplejoCard';
import './Complejos.css'; // Asegúrate que el CSS también se llame Complejos.css

function Complejos() { // ¡CAMBIO AQUÍ! La función ahora se llama Complejos
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
        return <div className="complejos-container loading-message">Cargando complejos...</div>;
    }

    if (error) {
        return <div className="complejos-container error-message">{error}</div>;
    }

    const isReserveButtonDisabled = complejos.length === 0;
    
    return (
        <div className="complejos-container">
            <h1 className="complejos-title">Nuestros Complejos Deportivos</h1>

            <button
                className="btn-main-reserve"
                onClick={handleReserveAnyCancha}
                disabled={isReserveButtonDisabled}
            >
                Reservar una Cancha por Tipo
            </button>
            
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
                <p className="no-complejos-message">No hay complejos registrados en el sistema. Contacta al administrador.</p>
            )}
        </div>
    );
}

export default Complejos;