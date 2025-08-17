// frontend/src/components/Complejos/ComplejoDetalle/ComplejoDetalle.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './ComplejoDetalle.css'; 
import api from '../../../api/axiosConfig';

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
    
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true
    };
    
    const images = (complejo.fotoUrls && complejo.fotoUrls.length > 0)
        ? complejo.fotoUrls
        : [complejo.fotoUrl || placeholderImage];
        

    return (
        <div className="complejo-detalle-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← Volver a Complejos
            </button>
            <h1 className="complejo-detalle-title">{complejo.nombre}</h1>
            
            <div className="complejo-detalle-header">
                {images.length > 1 ? (
                    <Slider {...settings} className="complejo-detalle-slider">
                        {images.map((img, index) => (
                            <div key={index}>
                                <img
                                    src={img}
                                    alt={`Complejo ${complejo.nombre} - Foto ${index + 1}`}
                                    className="complejo-detalle-img"
                                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                                />
                            </div>
                        ))}
                    </Slider>
                ) : (
                    <div className="complejo-detalle-single-image">
                        <img
                            src={images[0]}
                            alt={`Complejo ${complejo.nombre}`}
                            className="complejo-detalle-img"
                            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                        />
                    </div>
                )}
            </div>
            
            <div className="complejo-detalle-info">
                <p><strong>Descripción:</strong> {complejo.descripcion || 'No hay descripción disponible.'}</p>
                <p><strong>Ubicación:</strong> {complejo.ubicacion || 'No disponible'}</p>
                <p><strong>Teléfono:</strong> {complejo.telefono || 'No disponible'}</p>
                <p><strong>Horario:</strong> {complejo.horarioApertura ? complejo.horarioApertura.substring(0, 5) : 'N/A'} - {complejo.horarioCierre ? complejo.horarioCierre.substring(0, 5) : 'N/A'}</p>
            </div>

            <div className="complejo-detalle-canchas">
                <h2>Canchas Disponibles</h2>
                {Object.keys(complejo.canchaCounts || {}).length > 0 ? (
                    <ul className="cancha-list">
                        {Object.keys(complejo.canchaCounts).map(tipo => (
                            <li key={tipo} className="cancha-item">
                                <h3>{tipo} ({complejo.canchaCounts[tipo]} canchas)</h3>
                                <p><strong>Precio por hora:</strong> ${formatPrice(complejo.canchaPrices[tipo])}</p>
                                <div className="cancha-features-detail">
                                    <span className="feature-detail-chip">Superficie: {complejo.canchaSurfaces[tipo]}</span>
                                    {complejo.canchaIluminacion[tipo] && <span className="feature-detail-chip success">💡 Con Iluminación</span>}
                                    {complejo.canchaTecho[tipo] && <span className="feature-detail-chip info">☂️ Con Techo</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-canchas-info">Este complejo no tiene canchas configuradas aún.</p>
                )}
            </div>

            <button
                onClick={() => navigate('/reservar', { state: { preselectedComplejoId: complejo.id } })}
                className="reserve-button-detail"
            >
                Reservar en este Complejo
            </button>
        </div>
    );
}

export default ComplejoDetalle;