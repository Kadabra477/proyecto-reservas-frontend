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

    // Eliminado: handleReserveAnyCancha

    if (loading) {
        // <-- MEJORA DE DISEÑO: Usar un mensaje de carga más visual si lo deseas -->
        return <div className="complejos-container loading-message">Cargando complejos...</div>;
    }

    if (error) {
        // <-- MEJORA DE DISEÑO: Estilo de mensaje de error más prominente -->
        return <div className="complejos-container error-message">{error}</div>;
    }

    return (
        <div className="complejos-container">
            {/* <-- MEJORA DE DISEÑO: Título más llamativo y descriptivo --> */}
            <h1 className="complejos-title">Encuentra Tu Cancha Ideal</h1>
            <p className="complejos-subtitle">Explora nuestros complejos deportivos y reserva tu espacio.</p>

            {complejos.length > 0 ? (
                <div className="complejos-grid">
                    {complejos.map(complejo => (
                        <ComplejoCard key={complejo.id} complejo={complejo} />
                    ))}
                </div>
            ) : (
                // <-- MEJORA DE DISEÑO: Mensaje cuando no hay complejos -->
                <div className="no-complejos-section">
                    <p className="no-complejos-message">
                        Parece que no hay complejos deportivos disponibles en este momento.
                        <br />¡Vuelve a revisar más tarde o contacta al administrador!
                    </p>
                    {/* Puedes añadir un icono o una ilustración aquí si lo deseas */}
                </div>
            )}
        </div>
    );
}

export default Complejos;