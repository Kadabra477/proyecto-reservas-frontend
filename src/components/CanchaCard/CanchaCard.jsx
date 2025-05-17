import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CanchaCard.css'; // Asegúrate de crear este archivo CSS

// Imagen por defecto si falta fotoUrl
const placeholderImage = '/imagenes/default-cancha.png'; // Añade una imagen por defecto en public/imagenes

function CanchaCard({ cancha }) {
  const navigate = useNavigate();

  // Navega a la página de reserva para esta cancha
  const handleReserveClick = () => {
    navigate(`/reservar/${cancha.id}`);
  };

  // Formatea el precio a moneda local (ARS)
  const formatPrice = (price) => {
    // Verifica que price sea un número antes de formatear
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
        return 'Precio no disp.'; // O alguna otra indicación
    }
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numericPrice);
  };

  return (
    <div className="cancha-card-item">
      {/* Imagen de la cancha con manejo de errores y placeholder */}
      <img
        src={cancha.fotoUrl || placeholderImage}
        alt={`Cancha ${cancha.nombre}`}
        className="cancha-card-img"
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} // Evita bucles de error si el placeholder falla
      />
      {/* Muestra el precio si es un número válido */}
       {(typeof cancha.precioPorHora === 'number' || typeof cancha.precioPorHora === 'string' && !isNaN(Number(cancha.precioPorHora)) ) && (
         <span className="cancha-card-price">{formatPrice(cancha.precioPorHora)}/hr</span>
       )}
      {/* Contenido de la tarjeta */}
      <div className="cancha-card-content">
        <h3 className="cancha-card-title">{cancha.nombre || 'Nombre no disponible'}</h3>
        <p className="cancha-card-description">{cancha.descripcion || 'Descripción no disponible.'}</p>
        <p className="cancha-card-location">{cancha.ubicacion || 'Ubicación no disponible'}</p>
        {cancha.telefono && <p className="cancha-card-phone">Tel: {cancha.telefono}</p>}
        {/* Enlace a Google Maps si existe */}
        {cancha.ubicacionMaps && (
            <a href={cancha.ubicacionMaps} target="_blank" rel="noopener noreferrer" className="cancha-card-map-link">
                Ver en Mapa
            </a>
        )}
        {/* Botón de reservar, deshabilitado si la cancha no está disponible */}
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