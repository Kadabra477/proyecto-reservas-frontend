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
        if (isNaN(numericPrice)) {
            return 'Precio no disp.';
        }
        // <-- MEJORA DE DISEÑO: Formato de moneda consistente y sin el símbolo si ya lo pones en el CSS -->
        return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericPrice);
    };

    const renderCanchaTypes = () => {
        if (!complejo.canchaCounts || Object.keys(complejo.canchaCounts).length === 0) {
            return <p className="no-canchas-info">No hay tipos de canchas configurados.</p>; // <-- MEJORA: Clase para estilo
        }

        return (
            <ul className="complejo-card-cancha-types">
                {Object.keys(complejo.canchaCounts).map(tipo => (
                    <li key={tipo} className="cancha-type-item"> {/* <-- MEJORA: Clase para estilo de cada item */}
                        <span className="type-name"><strong>{tipo}</strong>: {complejo.canchaCounts[tipo]} canchas</span>
                        {complejo.canchaPrices && complejo.canchaPrices[tipo] != null && (
                            <span className="type-price"> - ${formatPrice(complejo.canchaPrices[tipo])}/hr</span> // <-- MEJORA: Clase y formato
                        )}
                        {complejo.canchaSurfaces && complejo.canchaSurfaces[tipo] && (
                            <span className="type-surface"> ({complejo.canchaSurfaces[tipo]})</span> // <-- MEJORA: Clase
                        )}
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
                    {/* <-- MEJORA DE DISEÑO: Más claridad en horarios --> */}
                    <p><strong>Horario:</strong> {complejo.horarioApertura || 'N/A'} - {complejo.horarioCierre || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {complejo.telefono || 'No disponible'}</p> {/* Mantener si es importante en la tarjeta */}
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