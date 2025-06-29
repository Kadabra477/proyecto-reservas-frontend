// frontend/src/components/Complejos/ComplejoCard/ComplejoCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
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

    // La función formatPrice se mantiene si la quieres usar para mostrar un precio general o mínimo,
    // pero para la vista compacta, no se usa aquí.
    /*
    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice === 0) {
            return 'Consultar';
        }
        return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericPrice);
    };
    */

    // renderCanchaTypes se elimina de la tarjeta para hacerla compacta, se vería en los detalles.
    /*
    const renderCanchaTypes = () => {
        if (!complejo.canchaCounts || Object.keys(complejo.canchaCounts).length === 0) {
            return <p className="no-canchas-info">No hay tipos de canchas configurados.</p>;
        }

        return (
            <ul className="complejo-card-cancha-types">
                {Object.keys(complejo.canchaCounts).map(tipo => (
                    <li key={tipo} className="cancha-type-item">
                        <div className="type-main-info">
                            <span className="type-name"><strong>{tipo}</strong>: {complejo.canchaCounts[tipo]} canchas</span>
                            {complejo.canchaPrices && complejo.canchaPrices[tipo] != null && (
                                <span className="type-price">${formatPrice(complejo.canchaPrices[tipo])}/hr</span>
                            )}
                        </div>
                        <div className="type-features">
                            {complejo.canchaSurfaces && complejo.canchaSurfaces[tipo] && (
                                <span className="feature-chip surface">{complejo.canchaSurfaces[tipo]}</span>
                            )}
                            {complejo.canchaIluminacion && complejo.canchaIluminacion[tipo] && <span className="feature-chip icon" title="Con Iluminación">💡 Iluminación</span>}
                            {complejo.canchaTecho && complejo.canchaTecho[tipo] && <span className="feature-chip icon" title="Con Techo">☂️ Techo</span>}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };
    */

    return (
        <div className="complejo-card-item">
            <div className="complejo-card-image-container"> {/* Nuevo contenedor para la imagen */}
                <img
                    src={complejo.fotoUrl || placeholderImage}
                    alt={`Complejo ${complejo.nombre}`}
                    className="complejo-card-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
            </div>
            
            <div className="complejo-card-content">
                <h3 className="complejo-card-title">{complejo.nombre || 'Nombre no disponible'}</h3>
                
                {/* Mostramos solo la ubicación de forma concisa */}
                <p className="complejo-card-location"><i className="fas fa-map-marker-alt"></i> {complejo.ubicacion || 'Ubicación no disponible'}</p> 

                {/* Descripción más corta */}
                {complejo.descripcion && complejo.descripcion.trim() !== '' && ( 
                    <p className="complejo-card-description-short">{complejo.descripcion}</p>
                )}
                
                {/* Aquí puedes añadir una pequeña indicación de canchas, por ejemplo, "Tiene X canchas" */}
                {complejo.canchaCounts && Object.keys(complejo.canchaCounts).length > 0 && (
                    <p className="complejo-card-canchas-summary">
                        Canchas: {Object.values(complejo.canchaCounts).reduce((sum, count) => sum + count, 0)} disponibles
                    </p>
                )}

                {/* Detalles como horario y teléfono, y tipos de canchas con precios se mueven a la página de detalles */}
                {/* <div className="complejo-details-grid">...</div> */}
                {/* <h4>Tipos de Canchas:</h4> {renderCanchaTypes()} */}

                <div className="complejo-card-buttons-container">
                    <button
                        onClick={handleViewDetailsClick}
                        className="complejo-card-button primary" // Hacemos "Ver Detalles" el botón principal
                    >
                        Ver Detalles
                    </button>
                    {/* El botón de reservar se puede dejar o mover si quieres que la reserva sea solo desde los detalles */}
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