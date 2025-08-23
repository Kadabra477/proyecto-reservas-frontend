// frontend/src/components/Complejos/ComplejoDetalle/ComplejoDetalle.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './ComplejoDetalle.css'; 
import { FaPhone, FaMapMarkerAlt, FaClock, FaFutbol, FaSun, FaCloud, FaRulerCombined } from 'react-icons/fa';

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
        return <div className="loading-container"><div className="spinner"></div><p>Cargando detalles del complejo...</p></div>;
    }

    if (error) {
        return <div className="error-container"><p>{error}</p><button className="retry-button" onClick={() => navigate('/complejos')}>Volver</button></div>;
    }

    if (!complejo) {
        return <div className="error-container"><p>Complejo no encontrado.</p><button className="retry-button" onClick={() => navigate('/complejos')}>Volver</button></div>;
    }
    
    const heroImageSrc = complejo.portadaUrl || placeholderImage;
    const carouselImages = (complejo.carruselUrls && complejo.carruselUrls.length > 0) ? complejo.carruselUrls : [placeholderImage];

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true
    };
    
    return (
        <div className="complejo-detalle-container">
            <div className="hero-banner" style={{ backgroundImage: `url(${heroImageSrc})` }}>
                <div className="hero-content">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        ← Volver a Complejos
                    </button>
                    <h1 className="hero-title">{complejo.nombre}</h1>
                    <p className="hero-subtitle"><FaMapMarkerAlt /> {complejo.ubicacion || 'Ubicación no disponible'}</p>
                </div>
            </div>
            
            <div className="main-content">
                <section className="image-carousel-section">
                    <Slider {...sliderSettings}>
                        {carouselImages.map((img, index) => (
                            <div key={index}>
                                <img
                                    src={img}
                                    alt={`Imagen ${index + 1} de ${complejo.nombre}`}
                                    className="carousel-img"
                                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                                />
                            </div>
                        ))}
                    </Slider>
                </section>
                
                <section className="info-card">
                    <h2>Descripción</h2>
                    <p>{complejo.descripcion || 'No hay descripción disponible.'}</p>
                    
                    <div className="info-grid">
                        <div className="info-item">
                            <FaPhone className="info-icon" />
                            <span>{complejo.telefono || 'No disponible'}</span>
                        </div>
                        <div className="info-item">
                            <FaClock className="info-icon" />
                            <span>{complejo.horarioApertura ? complejo.horarioApertura.substring(0, 5) : 'N/A'} - {complejo.horarioCierre ? complejo.horarioCierre.substring(0, 5) : 'N/A'}</span>
                        </div>
                    </div>
                </section>

                <section className="canchas-section">
                    <h2>Canchas Disponibles</h2>
                    {Object.keys(complejo.canchaCounts || {}).length > 0 ? (
                        <div className="cancha-grid-container">
                            {Object.keys(complejo.canchaCounts).map(tipo => (
                                <div key={tipo} className="cancha-card">
                                    <div className="cancha-header">
                                        <FaFutbol className="cancha-icon" />
                                        <h3 className="cancha-type">{tipo}</h3>
                                        <span className="cancha-count">({complejo.canchaCounts[tipo]})</span>
                                    </div>
                                    <div className="cancha-body">
                                        <div className="price-tag">
                                            <span>${formatPrice(complejo.canchaPrices[tipo])}</span>
                                            <small>/ hora</small>
                                        </div>
                                        <ul className="cancha-features">
                                            <li>
                                                <FaRulerCombined className="feature-icon" />
                                                <span>Superficie: <strong>{complejo.canchaSurfaces[tipo]}</strong></span>
                                            </li>
                                            {complejo.canchaIluminacion[tipo] && (
                                                <li>
                                                    <FaSun className="feature-icon" />
                                                    <span>Con Iluminación</span>
                                                </li>
                                            )}
                                            {complejo.canchaTecho[tipo] && (
                                                <li>
                                                    <FaCloud className="feature-icon" />
                                                    <span>Con Techo</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-canchas-info">Este complejo no tiene canchas configuradas aún.</p>
                    )}
                </section>

                <div className="reserve-button-container">
                    <button
                        onClick={() => navigate('/reservar', { state: { preselectedComplejoId: complejo.id } })}
                        className="reserve-button"
                    >
                        Reservar en este Complejo
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComplejoDetalle;