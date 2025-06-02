// frontend/src/components/CanchaCard/CanchaCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CanchaCard.css';

// Imagen por defecto si falta fotoUrl o para tipos específicos
const placeholderImage = '/imagenes/default-cancha.png'; // Asegúrate que esta imagen exista en public/imagenes

// Función para generar la URL de un mapa estático de Google Maps
// ¡IMPORTANTE! Reemplaza 'TU_API_KEY_DE_Maps' con tu clave real.
// Necesitarás habilitar la "Maps Static API" en la consola de Google Cloud.
const getStaticMapImageUrl = (ubicacionMaps) => {
    // Es buena práctica obtener la API Key de una variable de entorno de Vercel (process.env.REACT_APP_...)
    const Maps_API_KEY = process.env.REACT_APP_Maps_API_KEY || 'TU_API_KEY_DE_Maps'; // <<-- ¡REEMPLAZA ESTO!

    if (!ubicacionMaps || !Maps_API_KEY || Maps_API_KEY === 'TU_API_KEY_DE_Maps') {
        console.warn("API Key de Google Maps no configurada o ubicacionMaps inválida. No se mostrará el mapa.");
        return null;
    }

    // Intenta extraer coordenadas o un query para el mapa estático
    let center = '';
    try {
        const mapUrl = new URL(ubicacionMaps);
        if (mapUrl.pathname.includes("/place/")) {
            const match = mapUrl.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
                center = `${match[1]},${match[2]}`;
            } else {
                // Si no hay coordenadas explícitas, usa el último segmento como posible lugar/query
                center = mapUrl.pathname.substring(mapUrl.pathname.lastIndexOf('/') + 1);
            }
        } else if (mapUrl.searchParams.has("q")) {
            center = mapUrl.searchParams.get("q");
        } else {
            center = ubicacionMaps; // Fallback si no hay un formato claro, puede que funcione
        }
    } catch (e) {
        console.error("Error al parsear ubicacionMaps URL:", ubicacionMaps, e);
        center = ubicacionMaps; // Usar la URL tal cual como fallback si no se pudo parsear
    }
    
    // Codifica el centro para la URL
    center = encodeURIComponent(center.replace(/\s/g, '+'));

    // Construye la URL de la imagen del mapa estático
    // Puedes ajustar el zoom (z), tamaño (size), y tipo de mapa (maptype)
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=400x200&maptype=roadmap&markers=color:red%7C${center}&key=${Maps_API_KEY}`;
};


function CanchaCard({ cancha }) {
    const navigate = useNavigate();

    // Función para obtener imagen según el tipo de cancha
    const getCanchaImage = (tipoCancha) => {
        // Estas son URLs de imágenes de stock, no se ven estiradas con object-fit: cover
        switch (tipoCancha.toLowerCase()) {
            case 'futbol 5':
                return 'https://images.unsplash.com/photo-1543714271-9c6001099684?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
            case 'futbol 7':
                return 'https://images.unsplash.com/photo-1579952528751-68997a61d612?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
            case 'futbol 11':
                return 'https://images.unsplash.com/photo-1551083984-b0409a6333e6?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
            case 'padel':
                return 'https://images.unsplash.com/photo-1629853966551-b8449c25608c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
            case 'tenis':
                return 'https://images.unsplash.com/photo-1579952975988-cf49c5950882?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
            case 'basquet':
                return 'https://images.unsplash.com/photo-1519782536-e8e04068393e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&h=500&fit=crop';
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

    const mapImageUrl = cancha.ubicacionMaps ? getStaticMapImageUrl(cancha.ubicacionMaps) : null;

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
                {/* Solo muestra la descripción si existe y no está vacía o solo espacios */}
                {cancha.descripcion && cancha.descripcion.trim() !== '' && ( 
                    <p className="cancha-card-description">{cancha.descripcion}</p>
                )}
                
                <div className="cancha-details-grid">
                    <p><strong>Tipo:</strong> {cancha.tipoCancha || 'N/A'}</p>
                    <p><strong>Superficie:</strong> {cancha.superficie || 'N/A'}</p>
                    <p><strong>Iluminación:</strong> {cancha.iluminacion ? 'Sí' : 'No'}</p>
                    <p><strong>Techo:</strong> {cancha.techo ? 'Sí' : 'No'}</p>
                </div>
                <p className="cancha-card-location">Ubicación: {cancha.ubicacion || 'No disponible'}</p>
                {cancha.telefono && <p className="cancha-card-phone">Tel: {cancha.telefono}</p>}
                
                {/* Integración del mapa estático de Google Maps */}
                {mapImageUrl ? (
                    <div className="cancha-card-map-container">
                        <a href={cancha.ubicacionMaps} target="_blank" rel="noopener noreferrer" className="cancha-card-map-link" title="Ver cancha en Google Maps">
                            <img src={mapImageUrl} alt="Ver en Mapa" className="cancha-card-static-map"/>
                            <span>Ver en Mapa</span>
                        </a>
                    </div>
                ) : (cancha.ubicacionMaps && ( // Si hay URL de mapa pero no se pudo generar la imagen (ej. por falta de API Key)
                    <a href={cancha.ubicacionMaps} target="_blank" rel="noopener noreferrer" className="cancha-card-map-link-fallback">
                        Ver en Google Maps
                    </a>
                ))}

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