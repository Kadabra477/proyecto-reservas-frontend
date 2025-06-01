// frontend/src/features/admin/AdminPanel.jsx (MODIFICAR)
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import AdminEstadisticas from './AdminEstadisticas'; // Importa el nuevo componente
import './AdminPanel.css';

// Estado inicial para un formulario de cancha nueva
const estadoInicialCancha = {
  nombre: '',
  descripcion: '',
  fotoUrl: '',
  ubicacionMaps: '',
  telefono: '',
  ubicacion: '',
  precioPorHora: '',
  disponible: true,
  // Añadir campos para tipoCancha, superficie, iluminacion, techo si aplican
  // Asegúrate de que estos campos existan en tu modelo de Cancha en el backend
  tipoCancha: '', 
  superficie: '',
  iluminacion: false,
  techo: false,
};

function AdminPanel() {
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  // 'canchas', 'reservas', 'estadisticas'
  const [activeTab, setActiveTab] = useState('canchas'); 
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [isLoadingCanchas, setIsLoadingCanchas] = useState(false);
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);
  const [editingCancha, setEditingCancha] = useState(null);
  const [nuevaCancha, setNuevaCancha] = useState(estadoInicialCancha);

  // Efecto para limpiar el mensaje después de unos segundos
  useEffect(() => {
    let timer;
    if (mensaje.text) {
      timer = setTimeout(() => {
        setMensaje({ text: '', type: '' });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [mensaje]);

  const fetchCanchas = useCallback(async () => {
    setIsLoadingCanchas(true);
    setMensaje({ text: '', type: '' });
    try {
      const res = await api.get('/canchas');
      setCanchas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al obtener canchas:', err);
      setMensaje({ text: 'Error al cargar la lista de canchas.', type: 'error' });
    } finally {
      setIsLoadingCanchas(false);
    }
  }, []);

  const fetchReservas = useCallback(async () => {
    setIsLoadingReservas(true);
    setMensaje({ text: '', type: '' });
    try {
      const res = await api.get('/reservas/admin/todas');
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al obtener reservas:', err);
      if (err.response && err.response.status === 403) {
        setMensaje({ text: 'No tienes permiso para ver las reservas.', type: 'error' });
      } else {
        setMensaje({ text: 'Error al cargar la lista de reservas.', type: 'error' });
      }
    } finally {
      setIsLoadingReservas(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setMensaje({ text: 'Acceso denegado. Necesitas iniciar sesión como administrador.', type: 'error' });
      return;
    }

    if (activeTab === 'canchas') {
      fetchCanchas();
    } else if (activeTab === 'reservas') {
      fetchReservas();
    }
    // No llamar a fetch de estadísticas aquí, ya que el componente AdminEstadisticas lo hace por sí mismo.
  }, [activeTab, fetchCanchas, fetchReservas]);

  const handleCanchaChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (editingCancha) {
      setEditingCancha({ ...editingCancha, [name]: newValue });
    } else {
      setNuevaCancha({ ...nuevaCancha, [name]: newValue });
    }
  };

  const handleSaveCancha = async (e) => {
    e.preventDefault();
    setMensaje({ text: '', type: '' });

    const canchaDataToSave = { ...(editingCancha || nuevaCancha) };

    const precioNum = parseFloat(canchaDataToSave.precioPorHora);
    if (isNaN(precioNum) || precioNum < 0) {
      setMensaje({ text: 'El Precio por Hora debe ser un número válido no negativo.', type: 'error' });
      return;
    }
    canchaDataToSave.precioPorHora = precioNum;

    if (!canchaDataToSave.nombre?.trim()) {
      setMensaje({ text: 'El Nombre de la cancha es obligatorio.', type: 'error' });
      return;
    }

    const request = editingCancha
      ? api.put(`/canchas/${editingCancha.id}`, canchaDataToSave)
      : api.post('/canchas', canchaDataToSave);

    try {
      await request;
      setMensaje({
        text: editingCancha ? 'Cancha actualizada correctamente.' : 'Cancha creada correctamente.',
        type: 'success'
      });
      fetchCanchas();
      setEditingCancha(null);
      setNuevaCancha(estadoInicialCancha);
    } catch (err) {
      console.error('Error al guardar la cancha:', err);
      const errorMsg = err.response?.data?.message || 'Ocurrió un error al guardar la cancha.';
      setMensaje({ text: errorMsg, type: 'error' });
    }
  };

  const handleDeleteCancha = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar la cancha con ID: ${id}? Esta acción es irreversible.`)) {
      setMensaje({ text: '', type: '' });
      try {
        await api.delete(`/canchas/${id}`);
        setMensaje({ text: 'Cancha eliminada correctamente.', type: 'success' });
        fetchCanchas();
        if (editingCancha && editingCancha.id === id) {
          setEditingCancha(null);
          setNuevaCancha(estadoInicialCancha);
        }
      } catch (err) {
        console.error('Error al eliminar la cancha:', err);
        const errorMsg = err.response?.data?.message || 'Ocurrió un error al eliminar la cancha.';
        setMensaje({ text: errorMsg, type: 'error' });
      }
    }
  };

  const startEditing = (canchaParaEditar) => {
    const canchaConPrecioString = {
      ...canchaParaEditar,
      precioPorHora: canchaParaEditar.precioPorHora != null ? String(canchaParaEditar.precioPorHora) : ''
    };
    setEditingCancha(canchaConPrecioString);
    setNuevaCancha(estadoInicialCancha);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingCancha(null);
    setNuevaCancha(estadoInicialCancha);
  };

  const handleConfirmReserva = async (id) => {
    setMensaje({ text: '', type: '' });
    try {
      await api.put(`/reservas/${id}/confirmar`);
      setMensaje({ text: 'Reserva confirmada correctamente.', type: 'success' });
      fetchReservas();
    } catch (err) {
      console.error('Error al confirmar la reserva:', err);
      const errorMsg = err.response?.data?.message || 'Ocurrió un error al confirmar la reserva.';
      setMensaje({ text: errorMsg, type: 'error' });
    }
  };

  const handleDeleteReserva = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar la reserva con ID: ${id}?`)) {
      setMensaje({ text: '', type: '' });
      try {
        await api.delete(`/reservas/${id}`);
        setMensaje({ text: 'Reserva eliminada correctamente.', type: 'success' });
        fetchReservas();
      } catch (err) {
        console.error('Error al eliminar la reserva:', err);
        const errorMsg = err.response?.data?.message || 'Ocurrió un error al eliminar la reserva.';
        setMensaje({ text: errorMsg, type: 'error' });
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      };
      return new Date(dateStr).toLocaleString('es-AR', options);
    } catch (e) {
      console.error("Error al formatear fecha:", dateStr, e);
      return dateStr;
    }
  };

  const currentFormData = editingCancha || nuevaCancha;

  return (
    <div className="admin-panel">
      <h1>Panel de Administración</h1>
      {mensaje.text && <div className={`admin-mensaje ${mensaje.type}`}>{mensaje.text}</div>}

      <div className="admin-tabs">
        <button
          className={`admin-tab-button ${activeTab === 'canchas' ? 'active' : ''}`}
          onClick={() => setActiveTab('canchas')}
          disabled={isLoadingCanchas || isLoadingReservas}
        >
          Gestionar Canchas
        </button>
        <button
          className={`admin-tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
          disabled={isLoadingCanchas || isLoadingReservas}
        >
          Gestionar Reservas
        </button>
        <button
          className={`admin-tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setActiveTab('estadisticas')}
          disabled={isLoadingCanchas || isLoadingReservas}
        >
          Ver Estadísticas
        </button>
      </div>

      {activeTab === 'canchas' && (
        <div className="admin-tab-content">
          <h2>{editingCancha ? `Editando Cancha: ${editingCancha.nombre}` : 'Agregar Nueva Cancha'}</h2>

          <form className="admin-cancha-form" onSubmit={handleSaveCancha}>
            {['nombre', 'descripcion', 'tipoCancha', 'superficie', 'ubicacion', 'telefono', 'fotoUrl', 'ubicacionMaps', 'precioPorHora'].map((field) => (
              <div key={field} className="admin-form-group">
                <label htmlFor={field}>
                  {field === 'fotoUrl' ? 'URL de Foto' : field === 'ubicacionMaps' ? 'URL Google Maps' : field === 'precioPorHora' ? 'Precio por Hora' : field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                {field === 'descripcion' ? (
                  <textarea
                    id={field}
                    name={field}
                    value={currentFormData[field] || ''}
                    onChange={handleCanchaChange}
                    rows={3}
                    placeholder='Breve descripción de la cancha...'
                  />
                ) : (
                  <input
                    type={
                      field === 'precioPorHora' ? 'number'
                      : field.includes('Url') || field.includes('Maps') ? 'url'
                      : field === 'telefono' ? 'tel'
                      : 'text'
                    }
                    id={field}
                    name={field}
                    value={currentFormData[field] || ''}
                    onChange={handleCanchaChange}
                    required={field === 'nombre' || field === 'tipoCancha' || field === 'superficie' || field === 'precioPorHora'} // Nombre, tipo, superficie, precio ahora son requeridos
                    step={field === 'precioPorHora' ? '0.01' : undefined}
                    min={field === 'precioPorHora' ? '0' : undefined}
                    placeholder={
                      field === 'nombre' ? 'Ej: La Redonda F5'
                      : field === 'tipoCancha' ? 'Ej: Fútbol 5, Pádel, Tenis'
                      : field === 'superficie' ? 'Ej: Césped Sintético, Polvo de ladrillo'
                      : field === 'ubicacion' ? 'Ej: Calle Falsa 123, San Martín'
                      : field === 'telefono' ? 'Ej: 2634...'
                      : field === 'fotoUrl' ? 'https://ejemplo.com/foto_cancha.jpg'
                      : field === 'ubicacionMaps' ? 'https://goo.gl/maps/...'
                      : field === 'precioPorHora' ? 'Ej: 5000.00'
                      : ''
                    }
                  />
                )}
              </div>
            ))}

            {/* Checkboxes para iluminacion, techo, disponible */}
            {['iluminacion', 'techo', 'disponible'].map((field) => (
                <div key={field} className="admin-form-group checkbox">
                    <input
                        type="checkbox"
                        id={field}
                        name={field}
                        checked={currentFormData[field]}
                        onChange={handleCanchaChange}
                    />
                    <label htmlFor={field}>
                        {field === 'iluminacion' ? 'Tiene Iluminación' : field === 'techo' ? 'Tiene Techo' : 'Disponible para reservas'}
                    </label>
                </div>
            ))}

            <div className="admin-form-buttons">
              <button type="submit" className="admin-btn-save">
                {editingCancha ? 'Actualizar Cancha' : 'Crear Cancha'}
              </button>
              {editingCancha && (
                <button type="button" className="admin-btn-cancel" onClick={cancelEditing}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>

          <div className="admin-cancha-list">
            <h3>Listado de Canchas</h3>
            {isLoadingCanchas ? <p>Cargando canchas...</p> : (
                <div className="admin-table-container">
                    <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Tipo</th> {/* Nueva columna */}
                            <th>Superficie</th> {/* Nueva columna */}
                            <th>Precio/hr</th>
                            <th>Luz</th> {/* Nueva columna */}
                            <th>Techo</th> {/* Nueva columna */}
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {canchas.length > 0 ? canchas.map(c => (
                        <tr key={c.id}>
                            <td data-label="ID">{c.id}</td>
                            <td data-label="Nombre">{c.nombre}</td>
                            <td data-label="Tipo">{c.tipoCancha || '-'}</td> {/* Mostrar tipoCancha */}
                            <td data-label="Superficie">{c.superficie || '-'}</td> {/* Mostrar superficie */}
                            <td data-label="Precio/hr">{c.precioPorHora != null ? `$${Number(c.precioPorHora).toLocaleString('es-AR')}` : '-'}</td>
                            <td data-label="Luz">{c.iluminacion ? 'Sí' : 'No'}</td> {/* Mostrar iluminacion */}
                            <td data-label="Techo">{c.techo ? 'Sí' : 'No'}</td> {/* Mostrar techo */}
                            <td data-label="Estado">
                            <span className={`admin-badge ${c.disponible ? 'available' : 'unavailable'}`}>
                                {c.disponible ? 'Disponible' : 'No disponible'}
                            </span>
                            </td>
                            <td data-label="Acciones">
                            <button className="admin-btn-edit" onClick={() => startEditing(c)}>Editar</button>
                            <button className="admin-btn-delete" onClick={() => handleDeleteCancha(c.id)}>Eliminar</button>
                            </td>
                        </tr>
                        )) : (
                            <tr><td colSpan="9" className="admin-no-data">No se encontraron canchas registradas.</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reservas' && (
        <div className="admin-tab-content">
          <h2>Reservas Registradas</h2>
          {isLoadingReservas ? <p>Cargando reservas...</p> : (
                <div className="admin-table-container">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cancha</th>
                            <th>Cliente</th>
                            <th>Teléfono</th>
                            <th>Fecha y Hora</th>
                            <th>Precio Total</th> {/* Nuevo: para ver el precio pagado */}
                            <th>Método Pago</th> {/* Nuevo: para ver el método */}
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reservas.length > 0 ? reservas.map(r => (
                            <tr key={r.id}>
                            <td data-label="ID">{r.id}</td>
                            <td data-label="Cancha">{r.canchaNombre || 'N/A'}</td>
                            <td data-label="Cliente">{r.cliente || 'N/A'}</td>
                            <td data-label="Teléfono">{r.telefono || 'N/A'}</td>
                            <td data-label="Fecha y Hora">{formatDate(r.fechaHora)}</td>
                            <td data-label="Precio Total">${r.precioTotal ? r.precioTotal.toLocaleString('es-AR') : 'N/A'}</td> {/* Mostrar precioTotal */}
                            <td data-label="Método Pago">{r.metodoPago || 'N/A'}</td> {/* Mostrar métodoPago */}
                            <td data-label="Estado">
                                <span className={`admin-badge ${r.confirmada ? 'confirmed' : 'pending'}`}>
                                {r.confirmada ? 'Confirmada' : 'Pendiente'}
                                </span>
                            </td>
                            <td data-label="Acciones">
                                {!r.confirmada && (
                                    <button className="admin-btn-confirm" onClick={() => handleConfirmReserva(r.id)}>
                                        Confirmar
                                    </button>
                                )}
                                <button className="admin-btn-delete" onClick={() => handleDeleteReserva(r.id)}>
                                    Eliminar
                                </button>
                            </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="9" className="admin-no-data">No hay reservas registradas.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}

      {activeTab === 'estadisticas' && (
        <AdminEstadisticas /> // Renderiza el nuevo componente de estadísticas
      )}
    </div>
  );
}

export default AdminPanel;