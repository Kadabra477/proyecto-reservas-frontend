import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ComplejoCard.css'; // Asegúrate de que esta ruta sea correcta

const placeholderImage = '/imagenes/default-complejo.png'; // Imagen por defecto si no hay foto

function ComplejoCard({ complejo }) {
    const navigate = useNavigate();

    const handleReserveClick = () => {
        navigate('/reservar', { state: { preselectedComplejoId: complejo.id } });
    };

    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice === 0) {
            return 'Consultar';
        }
        return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericPrice);
    };

    const renderCanchaTypes = () => {
        if (!complejo.canchaCounts || Object.keys(complejo.canchaCounts).length === 0) {
            return <p className="no-canchas-info">No hay tipos de canchas configurados.</p>;
        }

        return (
            <ul className="complejo-card-cancha-types">
                {Object.keys(complejo.canchaCounts).map(tipo => (
                    <li key={tipo} className="cancha-type-item">
                        <span className="type-name"><strong>{tipo}</strong>: {complejo.canchaCounts[tipo]} canchas</span>
                        {complejo.canchaPrices && complejo.canchaPrices[tipo] != null && (
                            <span className="type-price"> - ${formatPrice(complejo.canchaPrices[tipo])}/hr</span>
                        )}
                        <div className="type-features">
                            {complejo.canchaSurfaces && complejo.canchaSurfaces[tipo] && (
                                <span className="type-surface"> ({complejo.canchaSurfaces[tipo]})</span>
                            )}
                            {complejo.canchaIluminacion && complejo.canchaIluminacion[tipo] ? <span title="Con Iluminación">💡</span> : ''}
                            {complejo.canchaTecho && complejo.canchaTecho[tipo] ? <span title="Con Techo">☂️</span> : ''}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="complejo-card-item">
            <img
                src={complejo.fotoUrl || placeholderImage}
                alt={`Complejo ${complejo.nombre}`}
                className="complejo-card-img"
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
            />
            
            <div className="complejo-card-content">
                <h3 className="complejo-card-title">{complejo.nombre || 'Nombre no disponible'}</h3>
                {complejo.descripcion && complejo.descripcion.trim() !== '' && ( 
                    <p className="complejo-card-description">{complejo.descripcion}</p>
                )}
                
                <div className="complejo-details-grid">
                    <p><strong>Ubicación:</strong> {complejo.ubicacion || 'No disponible'}</p>
                    <p><strong>Horario:</strong> {complejo.horarioApertura ? complejo.horarioApertura.substring(0, 5) : 'N/A'} - {complejo.horarioCierre ? complejo.horarioCierre.substring(0, 5) : 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {complejo.telefono || 'No disponible'}</p>
                </div>

                <h4>Tipos de Canchas:</h4>
                {renderCanchaTypes()}

                <button
                    onClick={handleReserveClick}
                    className="complejo-card-button"
                >
                    Reservar en este Complejo
                </button>
            </div>
        </div>
    );
}

export default ComplejoCard;