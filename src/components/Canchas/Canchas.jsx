// frontend/src/features/canchas/Canchas.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import CanchaCard from '../../components/CanchaCard/CanchaCard'; // Asegúrate de la ruta correcta
import './Canchas.css'; // Asegúrate que este archivo exista y contenga los estilos necesarios para .btn-main-reserve

function Canchas() {
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchCanchas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/canchas'); // Asume que este endpoint devuelve todas las canchas
            if (Array.isArray(response.data)) {
                setCanchas(response.data);
            } else {
                console.error("La respuesta de la API no es un array:", response.data);
                setCanchas([]);
            }
        } catch (err) {
            console.error("Error fetching canchas:", err);
            setError("No se pudieron cargar las canchas. Intenta de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCanchas();
    }, [fetchCanchas]);

    // Manejador para el botón general de "Reservar una cancha"
    const handleReserveAnyCancha = () => {
        navigate('/reservar'); // Redirige a la página de reserva general por tipo
    };

    if (loading) {
        return <div className="canchas-container loading-message">Cargando canchas...</div>;
    }

    if (error) {
        return <div className="canchas-container error-message">{error}</div>;
    }

    return (
        <div className="canchas-container">
            <h1 className="canchas-title">Nuestras Canchas Disponibles</h1>
            
            {/* Botón para iniciar el flujo de reserva por tipo */}
            {/* Este botón puede ser más prominente o estratégico en tu diseño */}
            <button className="btn-main-reserve" onClick={handleReserveAnyCancha}>
                Reservar una Cancha
            </button>

            {canchas.length > 0 ? (
                <div className="canchas-grid">
                    {canchas.map(cancha => (
                        // CanchaCard ahora muestra información individual de la cancha, pero el botón de reservar redirige al flujo general.
                        <CanchaCard key={cancha.id} cancha={cancha} />
                    ))}
                </div>
            ) : (
                <p className="no-canchas-message">No hay canchas registradas en el sistema. Contacta al administrador.</p>
            )}
        </div>
    );
}

export default Canchas;