import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ComplejoCard.css';

const placeholderImage = '/imagenes/default-complejo.png';

function ComplejoCard({ complejo }) {
    const navigate = useNavigate();

    const handleReserveClick = () => {
        navigate('/reservar', { state: { preselectedComplejoId: complejo.id } });
    };

    const formatPrice = (price) => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice)) {
            return 'Precio no disp.';
        }
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numericPrice);
    };

    const renderCanchaTypes = () => {
        if (!complejo.canchaCounts || Object.keys(complejo.canchaCounts).length === 0) {
            return <p>No hay tipos de canchas configurados.</p>;
        }

        return (
            <ul className="complejo-card-cancha-types">
                {Object.keys(complejo.canchaCounts).map(tipo => (
                    <li key={tipo}>
                        <strong>{tipo}</strong>: {complejo.canchaCounts[tipo]} canchas
                        {complejo.canchaPrices && complejo.canchaPrices[tipo] != null &&
                            ` - ${formatPrice(complejo.canchaPrices[tipo])}/hr`}
                        {complejo.canchaSurfaces && complejo.canchaSurfaces[tipo] &&
                            ` (${complejo.canchaSurfaces[tipo]})`}
                        {complejo.canchaIluminacion && complejo.canchaIluminacion[tipo] ? ' 💡' : ''}
                        {complejo.canchaTecho && complejo.canchaTecho[tipo] ? ' ☂️' : ''}
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
                    <p><strong>Teléfono:</strong> {complejo.telefono || 'No disponible'}</p>
                    <p><strong>Horario:</strong> {complejo.horarioApertura || 'N/A'} - {complejo.horarioCierre || 'N/A'}</p>
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