// frontend/src/components/Complejos/Complejos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; 
import ComplejoCard from '../ComplejoCard/ComplejoCard'; // Importamos el nuevo componente
import './Complejos.css'; 

// Nuevo componente para el esqueleto de carga
const ComplejoCardSkeleton = () => (
    <div className="complejo-card-item skeleton-loading">
        <div className="skeleton-image"></div>
        <div className="complejo-card-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text short"></div>
            <div className="skeleton-text medium"></div>
            <div className="skeleton-text long"></div>
            <div className="skeleton-button"></div>
        </div>
    </div>
);

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
            if (err.response && err.response.status === 204) {
                setComplejos([]);
                setError(null); 
            } else if (err.response && err.response.status === 500) {
                setError('Hubo un problema con el servidor al cargar los complejos. Por favor, intenta de nuevo más tarde.');
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

    if (loading) {
        return (
            <div className="complejos-container">
                <h1 className="complejos-title">Encuentra Tu Cancha Ideal</h1>
                <p className="complejos-subtitle">Explora nuestros complejos deportivos y reserva tu espacio.</p>
                <div className="complejos-grid">
                    {Array.from({ length: 3 }).map((_, index) => ( 
                        <ComplejoCardSkeleton key={index} />
                    ))}
                </div>
                <div className="loading-message-box">
                    <div className="spinner"></div>
                    <h3>Cargando complejos...</h3>
                    <p>Estamos buscando las mejores opciones para vos.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="complejos-container">
                <div className="error-message-box">
                    <h3>❌ ¡Ups! Algo salió mal.</h3>
                    <p>{error}</p>
                    <button className="retry-button" onClick={fetchComplejos}>Intentar de Nuevo</button>
                </div>
            </div>
        );
    }

    return (
        <div className="complejos-container">
            <h1 className="complejos-title">Encuentra Tu Cancha Ideal</h1>
            <p className="complejos-subtitle">Explora nuestros complejos deportivos y reserva tu espacio.</p>

            {complejos.length > 0 ? (
                <div className="complejos-grid">
                    {complejos.map(complejo => (
                        <ComplejoCard key={complejo.id} complejo={complejo} />
                    ))}
                </div>
            ) : (
                <div className="no-complejos-section">
                    <span role="img" aria-label="emoji" className="no-complejos-icon">😔</span>
                    <p className="no-complejos-message">
                        Parece que no hay complejos deportivos disponibles en este momento.
                        <br />¡Vuelve a revisar más tarde o contacta al administrador!
                    </p>
                </div>
            )}
        </div>
    );
}

export default Complejos;