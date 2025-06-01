// frontend/src/components/CanchaCard/CanchaCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CanchaCard.css';

// Imagen por defecto si falta fotoUrl o para tipos específicos
const placeholderImage = '/imagenes/default-cancha.png'; // Asegúrate que esta imagen exista en public/imagenes

function CanchaCard({ cancha }) {
  const navigate = useNavigate();

  // Función para obtener imagen según el tipo de cancha
  const getCanchaImage = (tipoCancha) => {
    switch (tipoCancha.toLowerCase()) {
        case 'futbol 5':
            return 'https://images.unsplash.com/photo-1543714271-9c6001099684?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        case 'futbol 7':
            return 'https://images.unsplash.com/photo-1579952528751-68997a61d612?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8fHx8fA%3D%3D';
        case 'futbol 11':
            return 'https://images.unsplash.com/photo-1551083984-b0409a6333e6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        case 'padel':
            return 'https://images.unsplash.com/photo-1629853966551-b8449c25608c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        default:
            return placeholderImage; // Fallback a tu placeholder si el tipo no coincide
    }
  };

  const handleReserveClick = () => {
    navigate(`/reservar/${cancha.id}`);
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
        return 'Precio no disp.';
    }
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numericPrice);
  };

  return (
    <div className="cancha-card-item">
      <img
        src={cancha.fotoUrl || getCanchaImage(cancha.tipoCancha)} // Prioriza fotoUrl, luego imagen por tipo
        alt={`Cancha ${cancha.nombre}`}
        className="cancha-card-img"
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
      />
      {(typeof cancha.precioPorHora === 'number' || typeof cancha.precioPorHora === 'string' && !isNaN(Number(cancha.precioPorHora)) ) && (
         <span className="cancha-card-price">{formatPrice(cancha.precioPorHora)}/hr</span>
      )}
      <div className="cancha-card-content">
        <h3 className="cancha-card-title">{cancha.nombre || 'Nombre no disponible'}</h3>
        <p className="cancha-card-description">{cancha.descripcion || 'Descripción no disponible.'}</p>
        <div className="cancha-details-grid"> {/* Nuevo contenedor para detalles */}
            <p><strong>Tipo:</strong> {cancha.tipoCancha || 'N/A'}</p>
            <p><strong>Superficie:</strong> {cancha.superficie || 'N/A'}</p>
            <p><strong>Iluminación:</strong> {cancha.iluminacion ? 'Sí' : 'No'}</p>
            <p><strong>Techo:</strong> {cancha.techo ? 'Sí' : 'No'}</p>
        </div>
        <p className="cancha-card-location">Ubicación: {cancha.ubicacion || 'No disponible'}</p>
        {cancha.telefono && <p className="cancha-card-phone">Tel: {cancha.telefono}</p>}
        {cancha.ubicacionMaps && (
            <a href={cancha.ubicacionMaps} target="_blank" rel="noopener noreferrer" className="cancha-card-map-link">
                Ver en Mapa
            </a>
        )}
        <button
          onClick={handleReserveClick}
          className="cancha-card-button"
          disabled={!cancha.disponible}
        >
          {cancha.disponible ? 'Reservar Ahora' : 'No Disponible'}
        </button>
      </div>
    </div>
  );
}

export default CanchaCard;