// frontend/src/components/Complejos/ComplejoDetalle/ComplejoDetalle.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import './ComplejoDetalle.css';

const placeholderImage = '/imagenes/default-complejo.png';

function ComplejoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complejo, setComplejo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComplejo = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/complejos/${id}`);
                setComplejo(response.data);
            } catch (err) {
                console.error("Error al cargar detalles del complejo:", err);
                setError('No pudimos cargar los detalles de este complejo. Por favor, intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchComplejo();
        }
    }, [id]);

    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice === 0) {
            return 'Consultar';
        }
        return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericPrice);
    };

    if (loading) {
        return <div className="complejo-detalle-container loading-message">Cargando detalles del complejo...</div>;
    }

    if (error) {
        return <div className="complejo-detalle-container error-message">{error}</div>;
    }

    if (!complejo) {
        return <div className="complejo-detalle-container no-data-message">Complejo no encontrado.</div>;
    }
    
    const imageSrc = (complejo.fotoUrls && complejo.fotoUrls.length > 0)
        ? complejo.fotoUrls[0]
        : placeholderImage;

    return (
        <div className="complejo-detalle-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← Volver a Complejos
            </button>
            
            {/* Sección de Cabecera (Hero) */}
            <div className="complejo-hero-section" style={{ backgroundImage: `url(${imageSrc})` }}>
                <div className="hero-overlay">
                    <h1 className="complejo-title-hero">{complejo.nombre}</h1>
                    <p className="complejo-location-hero">📍 {complejo.ubicacion || 'Ubicación no disponible'}</p>
                </div>
            </div>

            <div className="complejo-main-content-grid">
                {/* Columna de la izquierda: Descripción y Horario */}
                <div className="left-column">
                    <section className="detalle-card descripcion-card">
                        <h2>Acerca de nosotros</h2>
                        <p>{complejo.descripcion || 'No hay descripción disponible.'}</p>
                        <hr />
                        <div className="contact-info">
                            <p><strong>Teléfono:</strong> {complejo.telefono || 'No disponible'}</p>
                            <p><strong>Horario:</strong> {complejo.horarioApertura ? complejo.horarioApertura.substring(0, 5) : 'N/A'} - {complejo.horarioCierre ? complejo.horarioCierre.substring(0, 5) : 'N/A'}</p>
                        </div>
                    </section>
                    
                    {/* Botón de Reservar - Flota en el diseño */}
                    <button
                        onClick={() => navigate('/reservar', { state: { preselectedComplejoId: complejo.id } })}
                        className="reserve-button-sticky"
                    >
                        ¡Reservar en este Complejo!
                    </button>
                </div>

                {/* Columna de la derecha: Canchas disponibles (en formato de tarjetas) */}
                <div className="right-column">
                    <section className="detalle-card canchas-card">
                        <h2>Canchas Disponibles</h2>
                        {Object.keys(complejo.canchaCounts || {}).length > 0 ? (
                            <div className="cancha-grid">
                                {Object.keys(complejo.canchaCounts).map(tipo => (
                                    <div key={tipo} className="cancha-item-card">
                                        <h3>{tipo}</h3>
                                        <p className="cancha-count">
                                            ({complejo.canchaCounts[tipo]} {complejo.canchaCounts[tipo] > 1 ? 'canchas' : 'cancha'})
                                        </p>
                                        <div className="cancha-price-tag">
                                            ${formatPrice(complejo.canchaPrices[tipo])} <small>/ hora</small>
                                        </div>
                                        <div className="cancha-features-badges">
                                            <span className="badge-chip">{complejo.canchaSurfaces[tipo]}</span>
                                            {complejo.canchaIluminacion[tipo] && <span className="badge-chip primary">💡 Iluminación</span>}
                                            {complejo.canchaTecho[tipo] && <span className="badge-chip secondary">☂️ Techo</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-canchas-info">Este complejo no tiene canchas configuradas aún.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ComplejoDetalle;