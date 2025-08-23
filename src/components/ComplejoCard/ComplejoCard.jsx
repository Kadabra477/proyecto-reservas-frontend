// frontend/src/components/Complejos/ComplejoCard/ComplejoCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './ComplejoCard.css'; 

const placeholderImage = '/imagenes/default-complejo.png';

function ComplejoCard({ complejo }) {
    const navigate = useNavigate();

    const handleViewDetailsClick = () => {
        navigate(`/complejos/${complejo.id}`);
    };

    const handleReserveClick = () => {
        navigate('/reservar', { state: { preselectedComplejoId: complejo.id } });
    };
    
    // Aquí se utiliza la URL de la portada del DTO
    const cardImageUrl = complejo.portadaUrl || placeholderImage;

    return (
        <div className="complejo-card-item">
            <div className="complejo-card-single-image-container">
                <img
                    src={cardImageUrl}
                    alt={`Complejo ${complejo.nombre}`}
                    className="complejo-card-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
            </div>
            
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