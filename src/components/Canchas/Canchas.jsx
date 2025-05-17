// src/features/canchas/Canchas.jsx (Modificado)
import React, { useState, useEffect } from 'react';
// import './canchas.css'; // ELIMINADO: Usaremos CanchaCard y sus estilos
import api from '../../api/axiosConfig'; // Importar instancia de Axios
import CanchaCard from '../../components/CanchaCard/CanchaCard'; // Importar el componente CanchaCard (ajusta ruta si es necesario)
import './CanchasList.css'; // NUEVO: Crear un CSS simple para el contenedor si es necesario

function Canchas() {
  const [canchas, setCanchas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCanchas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Usar la instancia 'api' para obtener las canchas
        const response = await api.get('/canchas');
        if (Array.isArray(response.data)) {
          // Filtrar opcionalmente canchas no disponibles si se desea
          // setCanchas(response.data.filter(c => c.disponible));
          setCanchas(response.data);
        } else {
          console.error("La respuesta de la API no es un array:", response.data);
          setCanchas([]); // Establecer array vacío si la respuesta no es válida
        }
      } catch (err) {
        console.error("Error fetching canchas:", err);
        setError("No se pudieron cargar las canchas. Intenta de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanchas();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // Renderizar estado de carga
  if (isLoading) {
    // Puedes usar un componente Spinner aquí si tienes uno
    return <div className="loading-message">Cargando canchas...</div>;
  }

  // Renderizar estado de error
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Renderizar lista de canchas o mensaje si no hay
  return (
    // Usar un contenedor para aplicar estilos de layout (ej: grid)
    <div className="canchas-list-container">
      <h2>Nuestras Canchas Disponibles</h2>
      {canchas.length > 0 ? (
        <div className="canchas-grid">
          {canchas.map((cancha) => (
            // Renderizar CanchaCard para cada cancha obtenida
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