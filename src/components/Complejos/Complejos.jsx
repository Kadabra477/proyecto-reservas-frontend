import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Asegúrate de que esta ruta sea correcta
import ComplejoCard from '../ComplejoCard/ComplejoCard'; // Asegúrate de que esta ruta sea correcta
import './Complejos.css'; // Asegúrate de que esta ruta sea correcta

function Complejos() {
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
            if (err.response && err.response.status === 500) {
                setError('Hubo un problema con el servidor al cargar los complejos. Por favor, intenta de nuevo más tarde.');
            } else if (err.response && err.response.status === 204) {
                setComplejos([]);
                setError(null);
            } else {
                setError('Error al cargar los complejos disponibles. Intenta de nuevo más tarde.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplejos();
    }, [fetchComplejos]);

    // <-- ELIMINAR: Función para el botón "Reservar una Cancha por Tipo" -->
    // const handleReserveAnyCancha = () => {
    //     navigate('/reservar');
    // };

    if (loading) {
        return <div className="complejos-container loading-message">Cargando complejos...</div>;
    }

    if (complejos.length === 0 && !loading && !error) {
        return (
            <div className="complejos-container">
                <h1 className="complejos-title">Nuestros Complejos Deportivos</h1>
                <p className="no-complejos-message">
                    No hay complejos disponibles en este momento. Por favor, revisa más tarde o contacta al administrador.
                </p>
                {/* <-- ELIMINAR: Botón "Reservar una Cancha por Tipo" si no hay complejos -->
                <button
                    className="btn-main-reserve"
                    onClick={handleReserveAnyCancha}
                    disabled={true}
                >
                    Reservar una Cancha por Tipo
                </button>
                */}
            </div>
        );
    }
    
    if (error) {
        return <div className="complejos-container error-message">{error}</div>;
    }

    return (
        <div className="complejos-container">
            <h1 className="complejos-title">Nuestros Complejos Deportivos</h1>

            {/* <-- ELIMINAR: Botón "Reservar una Cancha por Tipo" -->
            <button
                className="btn-main-reserve"
                onClick={handleReserveAnyCancha}
                disabled={complejos.length === 0}
            >
                Reservar una Cancha por Tipo
            </button>
            */}
            
            {complejos.length > 0 ? (
                <div className="complejos-grid">
                    {complejos.map(complejo => (
                        <ComplejoCard key={complejo.id} complejo={complejo} />
                    ))}
                </div>
            ) : (
                // Este mensaje ya está cubierto por el `if (complejos.length === 0 && !loading && !error)` de arriba
                // Puedes eliminar esta parte si el `if` de arriba es suficiente para tu UX
                <p className="no-complejos-message">No hay complejos registrados en el sistema. Contacta al administrador.</p>
            )}
        </div>
    );
}

export default Complejos;