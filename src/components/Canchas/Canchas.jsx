// frontend/src/features/canchas/Canchas.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // Importar instancia de Axios
import CanchaCard from '../../components/CanchaCard/CanchaCard'; // Importar el componente CanchaCard
import './CanchasList.css'; // Asegúrate que este archivo exista

function Canchas() {
  const [canchas, setCanchas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCanchas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/canchas');
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
        setIsLoading(false);
      }
    };

    fetchCanchas();
  }, []);

  if (isLoading) {
    return <div className="canchas-list-container loading-message">Cargando canchas...</div>;
  }

  if (error) {
    return <div className="canchas-list-container error-message">{error}</div>;
  }

  return (
    <div className="canchas-list-container">
      <h2 className="canchas-list-title">Nuestras Canchas Disponibles</h2>
      {canchas.length > 0 ? (
        <div className="canchas-grid">
          {canchas.map((cancha) => (
            <CanchaCard key={cancha.id} cancha={cancha} />
          ))}
        </div>
      ) : (
        <p className="no-canchas-message">No hay canchas disponibles en este momento.</p>
      )}
    </div>
  );
}

export default Canchas;