// frontend/src/features/canchas/Canchas.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
// import CanchaCard from '../../components/CanchaCard/CanchaCard'; // Ya no se usa directamente para listar canchas individuales
import ComplejoCard from '../../components/ComplejoCard/ComplejoCard'; // ¡NUEVO COMPONENTE!
import './Canchas.css'; // Estilos generales para la lista de complejos/canchas

function Canchas() {
    const [complejos, setComplejos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchComplejos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Llama al nuevo endpoint para obtener todos los complejos
            const response = await api.get('/api/complejos'); 
            if (Array.isArray(response.data)) {
                setComplejos(response.data);
            } else {
                console.error("La respuesta de la API de complejos no es un array:", response.data);
                setComplejos([]);
            }
        } catch (err) {
            console.error("Error al cargar complejos:", err);
            setError('Error al cargar los complejos disponibles. Intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplejos();
    }, [fetchComplejos]);

    // Manejador para el botón general de "Reservar una cancha" (redirige al form general)
    const handleReserveAnyCancha = () => {
        navigate('/reservar'); 
    };

    if (loading) {
        return <div className="canchas-container loading-message">Cargando complejos...</div>;
    }

    if (error) {
        return <div className="canchas-container error-message">{error}</div>;
    }

    return (
        <div className="canchas-container">
            <h1 className="canchas-title">Nuestros Complejos Deportivos</h1>
            
            {/* Botón para iniciar el flujo de reserva por tipo (sin seleccionar complejo primero) */}
            <button className="btn-main-reserve" onClick={handleReserveAnyCancha}>
                Reservar una Cancha por Tipo
            </button>

            {complejos.length > 0 ? (
                <div className="complejos-grid"> {/* Nueva clase para la grilla de complejos */}
                    {complejos.map(complejo => (
                        // Usamos un nuevo componente ComplejoCard
                        <ComplejoCard key={complejo.id} complejo={complejo} />
                    ))}
                </div>
            ) : (
                <p className="no-canchas-message">No hay complejos registrados en el sistema. Contacta al administrador.</p>
            )}
        </div>
    );
}

export default Canchas;