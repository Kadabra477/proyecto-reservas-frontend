// frontend/src/components/Complejos/ComplejoCard/ComplejoCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './ComplejoCard.css'; 

const placeholderImage = 'https://placehold.co/800x600/e0e0e0/555555?text=Complejo+sin+Imagen';

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
        <div className="complejo-card"> {/* Clase principal renombrada */}
            <div className="complejo-card-image-wrapper"> {/* Contenedor de imagen renombrado */}
                <img
                    src={cardImageUrl}
                    alt={`Complejo ${complejo.nombre}`}
                    className="complejo-card-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
            </div>
            
            <div className="complejo-card-content">
                <h3 className="complejo-card-title">{complejo.nombre || 'Nombre no disponible'}</h3>
                <p className="complejo-card-location">
                    <span className="material-symbols-outlined card-icon-location">location_on</span> {/* Icono de Material Symbols */}
                    {complejo.ubicacion || 'Ubicación no disponible'}
                </p> 
                {complejo.descripcion && complejo.descripcion.trim() !== '' && ( 
                    <p className="complejo-card-description-short">{complejo.descripcion}</p>
                )}
                {complejo.canchaCounts && Object.keys(complejo.canchaCounts).length > 0 && (
                    <p className="complejo-card-canchas-summary">
                        <span className="material-symbols-outlined card-icon-sports">sports_soccer</span> {/* Icono de Material Symbols */}
                        {Object.values(complejo.canchaCounts).reduce((sum, count) => sum + count, 0)} canchas disponibles
                    </p>
                )}
                <div className="complejo-card-buttons"> {/* Contenedor de botones renombrado */}
                    <button
                        onClick={handleViewDetailsClick}
                        className="btn btn-secondary card-button" // Usando clases globales
                    >
                        <span className="material-symbols-outlined">info</span> Ver Detalles
                    </button>
                    <button
                        onClick={handleReserveClick}
                        className="btn btn-primary card-button" // Usando clases globales
                    >
                        <span className="material-symbols-outlined">calendar_month</span> Reservar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ComplejoCard;
