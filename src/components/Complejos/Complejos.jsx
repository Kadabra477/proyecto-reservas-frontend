import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ComplejoCard from '../ComplejoCard/ComplejoCard';
import './Complejos.css';

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
            // MODIFICACIÓN CLAVE AQUÍ: Ajustar el mensaje de error según la respuesta o el estado
            if (err.response && err.response.status === 500) {
                // Si es un 500, podría ser un error interno del servidor, no necesariamente "no hay complejos"
                setError('Hubo un problema con el servidor al cargar los complejos. Por favor, intenta de nuevo más tarde.');
            } else if (err.response && err.response.status === 204) {
                // Si la API devuelve 204 No Content, significa que no hay complejos
                setComplejos([]); // Asegurarse de que la lista esté vacía
                setError(null); // No es un error, es una ausencia de datos
            } else {
                // Para otros errores, un mensaje más genérico
                setError('Error al cargar los complejos disponibles. Intenta de nuevo más tarde.');
            }
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

    // Lógica para mostrar "No hay complejos disponibles en este momento"
    // Esto se ejecutará si `complejos.length` es 0, ya sea porque la API devolvió una lista vacía (200 OK con [])
    // o un 204 No Content, o incluso si hubo un error pero la lista se forzó a vacía.
    if (complejos.length === 0 && !loading && !error) {
        return (
            <div className="complejos-container">
                <h1 className="complejos-title">Nuestros Complejos Deportivos</h1>
                <p className="no-complejos-message">
                    No hay complejos disponibles en este momento. Por favor, revisa más tarde o contacta al administrador.
                </p>
                <button
                    className="btn-main-reserve"
                    onClick={handleReserveAnyCancha}
                    disabled={true}
                >
                    Reservar una Cancha por Tipo
                </button>
            </div>
        );
    }
    
    // Muestra el error si existe y no se manejó como "no hay complejos"
    if (error) {
        return <div className="complejos-container error-message">{error}</div>;
    }

    return (
        <div className="complejos-container">
            <h1 className="complejos-title">Nuestros Complejos Deportivos</h1>

            <button
                className="btn-main-reserve"
                onClick={handleReserveAnyCancha}
                disabled={complejos.length === 0}
            >
                Reservar una Cancha por Tipo
            </button>
            
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