// frontend/src/components/Complejos/ComplejoCard/ComplejoCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick'; // Importado para el carrusel
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './ComplejoCard.css'; 

// Importa una imagen local para el placeholder
const placeholderImage = '/imagenes/default-complejo.png';

function ComplejoCard({ complejo }) {
    const navigate = useNavigate();

    const handleViewDetailsClick = () => {
        navigate(`/complejos/${complejo.id}`);
    };

    const handleReserveClick = () => {
        navigate('/reservar', { state: { preselectedComplejoId: complejo.id } });
    };

    // Configuración para el carrusel
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false // Flechas de navegación desactivadas en la vista de tarjeta para una apariencia más limpia
    };
    
    // Muestra todas las fotos del complejo, o una por defecto si no hay ninguna.
    const images = (complejo.fotoUrls && complejo.fotoUrls.length > 0)
        ? complejo.fotoUrls
        : [complejo.fotoUrl || placeholderImage];
        
    return (
        <div className="complejo-card-item">
            {images.length > 1 ? (
                <Slider {...settings} className="complejo-card-slider">
                    {images.map((img, index) => (
                        <div key={index}>
                            <img
                                src={img}
                                alt={`Imagen ${index + 1} de ${complejo.nombre}`}
                                className="complejo-card-img"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                            />
                        </div>
                    ))}
                </Slider>
            ) : (
                <div className="complejo-card-single-image-container">
                    <img
                        src={images[0]}
                        alt={`Complejo ${complejo.nombre}`}
                        className="complejo-card-img"
                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                    />
                </div>
            )}
            
            <div className="complejo-card-content">
                <h3 className="complejo-card-title">{complejo.nombre || 'Nombre no disponible'}</h3>
                
                <p className="complejo-card-location"><i className="fas fa-map-marker-alt"></i> {complejo.ubicacion || 'Ubicación no disponible'}</p> 

                {complejo.descripcion && complejo.descripcion.trim() !== '' && ( 
                    <p className="complejo-card-description-short">{complejo.descripcion}</p>
                )}
                
                {complejo.canchaCounts && Object.keys(complejo.canchaCounts).length > 0 && (
                    <p className="complejo-card-canchas-summary">
                        Canchas: {Object.values(complejo.canchaCounts).reduce((sum, count) => sum + count, 0)} disponibles
                    </p>
                )}

                <div className="complejo-card-buttons-container">
                    <button
                        onClick={handleViewDetailsClick}
                        className="complejo-card-button primary"
                    >
                        Ver Detalles
                    </button>
                    <button
                        onClick={handleReserveClick}
                        className="complejo-card-button secondary"
                    >
                        Reservar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComplejoCard;