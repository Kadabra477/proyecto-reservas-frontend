import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MisReservas.css';

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/reservas/mis-reservas', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReservas(response.data);
      } catch (error) {
        console.error('Error al obtener las reservas del usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, []);

  if (loading) return <p>Cargando reservas...</p>;

  return (
    <div className="mis-reservas-container">
      <h2>Mis Reservas</h2>
      {reservas.length === 0 ? (
        <p>No tenés reservas registradas.</p>
      ) : (
        <ul className="reservas-list">
          {reservas.map((reserva) => (
            <li key={reserva.id} className="reserva-item">
              <p><strong>Cancha:</strong> {reserva.cancha?.nombre}</p>
              <p><strong>Fecha:</strong> {reserva.fecha}</p>
              <p><strong>Hora:</strong> {reserva.hora}</p>
              <p><strong>DNI:</strong> {reserva.dni}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MisReservas;
