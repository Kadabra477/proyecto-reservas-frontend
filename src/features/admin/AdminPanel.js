import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import './AdminPanel.css'; // Asegurarse que la ruta al CSS es correcta

// Estado inicial para un formulario de cancha nueva
const estadoInicialCancha = {
  nombre: '',
  descripcion: '',
  fotoUrl: '',
  ubicacionMaps: '',
  telefono: '',
  ubicacion: '',
  precioPorHora: '', // Usar string vacío para permitir borrar el campo
  disponible: true
};

function AdminPanel() {
  const [canchas, setCanchas] = useState([]); // Lista de canchas
  const [reservas, setReservas] = useState([]); // Lista de reservas
  const [activeTab, setActiveTab] = useState('canchas'); // Pestaña activa ('canchas' o 'reservas')
  const [mensaje, setMensaje] = useState({ text: '', type: '' }); // Mensajes de feedback {texto, tipo: 'success' | 'error'}
  const [isLoadingCanchas, setIsLoadingCanchas] = useState(false); // Estado de carga para canchas
  const [isLoadingReservas, setIsLoadingReservas] = useState(false); // Estado de carga para reservas
  const [editingCancha, setEditingCancha] = useState(null); // Guarda la cancha que se está editando
  const [nuevaCancha, setNuevaCancha] = useState(estadoInicialCancha); // Estado para el formulario de cancha nueva

  // Efecto para limpiar el mensaje después de unos segundos
  useEffect(() => {
    let timer;
    if (mensaje.text) {
      timer = setTimeout(() => {
        setMensaje({ text: '', type: '' }); // Limpiar mensaje
      }, 5000); // Desaparece después de 5 segundos
    }
    // Limpiar el timer si el componente se desmonta o el mensaje cambia
    return () => clearTimeout(timer);
  }, [mensaje]);


  // useCallback para memorizar las funciones de fetch
  const fetchCanchas = useCallback(async () => {
    setIsLoadingCanchas(true);
    setMensaje({ text: '', type: '' }); // Limpiar mensaje antes de fetch
    try {
      const res = await api.get('/canchas');
      setCanchas(Array.isArray(res.data) ? res.data : []); // Asegurar que sea un array
    } catch (err) {
      console.error('Error al obtener canchas:', err);
      setMensaje({ text: 'Error al cargar la lista de canchas.', type: 'error' });
    } finally {
        setIsLoadingCanchas(false);
    }
  }, []); // Sin dependencias, se crea una vez

  const fetchReservas = useCallback(async () => {
     setIsLoadingReservas(true);
     setMensaje({ text: '', type: '' }); // Limpiar mensaje
    try {
      // Asegurarse que este endpoint existe y requiere permisos de admin en el backend
      const res = await api.get('/reservas/admin/reservas');
      setReservas(Array.isArray(res.data) ? res.data : []); // Asegurar que sea un array
    } catch (err) {
       console.error('Error al obtener reservas:', err);
       // Revisar errores específicos como 403 Forbidden (sin permisos)
       if (err.response && err.response.status === 403) {
            setMensaje({ text: 'No tienes permiso para ver las reservas.', type: 'error' });
       } else {
           setMensaje({ text: 'Error al cargar la lista de reservas.', type: 'error' });
       }
    } finally {
        setIsLoadingReservas(false);
    }
  }, []); // Sin dependencias, se crea una vez


  // Efecto para cargar datos cuando cambia la pestaña activa
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        setMensaje({ text: 'Acceso denegado. Necesitas iniciar sesión como administrador.', type: 'error' });
        // Aquí podrías redirigir al login si es necesario
        // navigate('/login');
        return; // Detener si no hay token
    }

    if (activeTab === 'canchas') {
      fetchCanchas();
    } else if (activeTab === 'reservas') {
      fetchReservas();
    }
  }, [activeTab, fetchCanchas, fetchReservas]); // Depende de la pestaña y las funciones de fetch


  // Manejador de cambios en los inputs del formulario (para crear y editar)
  const handleCanchaChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Determinar el nuevo valor según el tipo de input
    const newValue = type === 'checkbox'
        ? checked // Valor booleano para checkbox
        : name === 'precioPorHora'
        ? value // Mantener como string para permitir borrar, se validará/convertirá al guardar
        : value; // Valor directo para otros inputs

    if (editingCancha) {
      // Actualizar el estado de la cancha que se está editando
      setEditingCancha({ ...editingCancha, [name]: newValue });
    } else {
      // Actualizar el estado del formulario para cancha nueva
      setNuevaCancha({ ...nuevaCancha, [name]: newValue });
    }
  };

  // Guardar Cancha (Crear nueva o Actualizar existente)
  const handleSaveCancha = async (e) => {
    e.preventDefault(); // Prevenir envío por defecto
    setMensaje({ text: '', type: '' }); // Limpiar mensaje

    const canchaDataToSave = { ...(editingCancha || nuevaCancha) };

    // Validación y conversión de precioPorHora
    const precioNum = parseFloat(canchaDataToSave.precioPorHora);
    if (isNaN(precioNum) || precioNum < 0) {
        setMensaje({ text: 'El Precio por Hora debe ser un número válido no negativo.', type: 'error' });
        return;
    }
    canchaDataToSave.precioPorHora = precioNum; // Guardar como número

    // Validación de nombre (requerido)
    if (!canchaDataToSave.nombre?.trim()) {
        setMensaje({ text: 'El Nombre de la cancha es obligatorio.', type: 'error' });
        return;
    }

    // Determinar si es una creación (POST) o una actualización (PUT)
    const request = editingCancha
      ? api.put(`/canchas/${editingCancha.id}`, canchaDataToSave)
      : api.post('/canchas', canchaDataToSave);

    try {
        await request; // Ejecutar la petición
        setMensaje({
            text: editingCancha ? 'Cancha actualizada correctamente.' : 'Cancha creada correctamente.',
            type: 'success'
        });
        fetchCanchas(); // Recargar la lista de canchas
        setEditingCancha(null); // Salir del modo edición
        setNuevaCancha(estadoInicialCancha); // Resetear el formulario de nueva cancha
    } catch (err) {
       console.error('Error al guardar la cancha:', err);
       // Intentar obtener mensaje de error del backend
       const errorMsg = err.response?.data?.message || 'Ocurrió un error al guardar la cancha.';
       setMensaje({ text: errorMsg, type: 'error' });
    }
  };

  // Eliminar Cancha
  const handleDeleteCancha = async (id) => {
    // Usar window.confirm por simplicidad, reemplazar con modal si se prefiere
    if (window.confirm(`¿Estás seguro de eliminar la cancha con ID: ${id}? Esta acción es irreversible.`)) {
      setMensaje({ text: '', type: '' }); // Limpiar mensaje
      try {
        await api.delete(`/canchas/${id}`); // Petición DELETE
        setMensaje({ text: 'Cancha eliminada correctamente.', type: 'success' });
        fetchCanchas(); // Recargar lista
        // Si se eliminó la cancha que se estaba editando, salir del modo edición
        if (editingCancha && editingCancha.id === id) {
            setEditingCancha(null);
            setNuevaCancha(estadoInicialCancha); // Resetear form por si acaso
        }
      } catch (err) {
        console.error('Error al eliminar la cancha:', err);
        const errorMsg = err.response?.data?.message || 'Ocurrió un error al eliminar la cancha.';
        setMensaje({ text: errorMsg, type: 'error' });
      }
    }
  };

  // Iniciar la edición de una cancha
   const startEditing = (canchaParaEditar) => {
        // Asegurarse que precioPorHora sea string para el input
        const canchaConPrecioString = {
            ...canchaParaEditar,
            precioPorHora: canchaParaEditar.precioPorHora != null ? String(canchaParaEditar.precioPorHora) : ''
        };
        setEditingCancha(canchaConPrecioString); // Establecer la cancha a editar
        setNuevaCancha(estadoInicialCancha); // Resetear el formulario de nueva cancha
        // Hacer scroll hacia arriba para ver el formulario de edición
        window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   // Cancelar el modo edición
    const cancelEditing = () => {
        setEditingCancha(null); // Limpiar el estado de edición
        setNuevaCancha(estadoInicialCancha); // Resetear formulario por si acaso
    };

 // Confirmar una Reserva Pendiente
  const handleConfirmReserva = async (id) => {
    setMensaje({ text: '', type: '' });
    try {
      // Asegurarse que el endpoint sea correcto en el backend
      await api.put(`/reservas/admin/reservas/confirmar/${id}`);
      setMensaje({ text: 'Reserva confirmada correctamente.', type: 'success' });
      fetchReservas(); // Recargar la lista de reservas
    } catch (err) {
      console.error('Error al confirmar la reserva:', err);
      const errorMsg = err.response?.data?.message || 'Ocurrió un error al confirmar la reserva.';
      setMensaje({ text: errorMsg, type: 'error' });
    }
  };

  // Eliminar una Reserva
  const handleDeleteReserva = async (id) => {
     if (window.confirm(`¿Estás seguro de eliminar la reserva con ID: ${id}?`)) {
       setMensaje({ text: '', type: '' });
      try {
        // Asegurarse que el endpoint sea correcto en el backend
        await api.delete(`/reservas/admin/reservas/${id}`);
        setMensaje({ text: 'Reserva eliminada correctamente.', type: 'success' });
        fetchReservas(); // Recargar la lista de reservas
      } catch (err) {
        console.error('Error al eliminar la reserva:', err);
        const errorMsg = err.response?.data?.message || 'Ocurrió un error al eliminar la reserva.';
        setMensaje({ text: errorMsg, type: 'error' });
      }
     }
  };

  // Función auxiliar para formatear fechas y horas
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'; // Si no hay fecha, retornar 'N/A'
    try {
      // Opciones para formatear la fecha y hora en español de Argentina
      const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false // Formato 24 horas
      };
      return new Date(dateStr).toLocaleString('es-AR', options);
    } catch (e) {
        // Si hay error al formatear, devolver el string original
        console.error("Error al formatear fecha:", dateStr, e);
        return dateStr;
    }
   };

   // Determina qué datos usar para el formulario (los de edición o los de nueva cancha)
    const currentFormData = editingCancha || nuevaCancha;

  return (
    <div className="admin-panel">
      <h1>Panel de Administración</h1>
      {/* Muestra mensajes de feedback */}
      {mensaje.text && <div className={`admin-mensaje ${mensaje.type}`}>{mensaje.text}</div>}

      {/* Pestañas para cambiar entre gestión de Canchas y Reservas */}
      <div className="admin-tabs">
        <button
            className={`admin-tab-button ${activeTab === 'canchas' ? 'active' : ''}`}
            onClick={() => setActiveTab('canchas')}
            disabled={isLoadingCanchas || isLoadingReservas} // Deshabilitar si algo está cargando
        >
            Gestionar Canchas
        </button>
        <button
             className={`admin-tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
             onClick={() => setActiveTab('reservas')}
             disabled={isLoadingCanchas || isLoadingReservas} // Deshabilitar si algo está cargando
        >
            Gestionar Reservas
         </button>
      </div>

      {/* Contenido de la Pestaña de Canchas */}
      {activeTab === 'canchas' && (
        <div className="admin-tab-content">
          <h2>{editingCancha ? `Editando Cancha: ${editingCancha.nombre}` : 'Agregar Nueva Cancha'}</h2>

          {/* Formulario para Agregar/Editar Canchas */}
           <form className="admin-cancha-form" onSubmit={handleSaveCancha}>
             {/* Campos del formulario */}
            {['nombre', 'descripcion', 'ubicacion', 'telefono', 'fotoUrl', 'ubicacionMaps', 'precioPorHora'].map((field) => (
              <div key={field} className="admin-form-group">
                {/* Generar etiqueta legible */}
                <label htmlFor={field}>
                    {field === 'fotoUrl' ? 'URL de Foto' : field === 'ubicacionMaps' ? 'URL Google Maps' : field === 'precioPorHora' ? 'Precio por Hora' : field.charAt(0).toUpperCase() + field.slice(1)}:
                 </label>
                 {/* Usar textarea para descripción, input para los demás */}
                 {field === 'descripcion' ? (
                    <textarea
                        id={field}
                        name={field}
                        value={currentFormData[field] || ''}
                        onChange={handleCanchaChange}
                        rows={3} // Número de filas inicial
                        placeholder='Breve descripción de la cancha...'
                    />
                 ) : (
                    <input
                      type={
                          field === 'precioPorHora' ? 'number' // Tipo número para precio
                          : field.includes('Url') || field.includes('Maps') ? 'url' // Tipo URL
                          : field === 'telefono' ? 'tel' // Tipo teléfono
                          : 'text' // Tipo texto por defecto
                      }
                      id={field}
                      name={field}
                      value={currentFormData[field] || ''} // Usar '' como valor por defecto para controlar el input
                      onChange={handleCanchaChange}
                      required={field === 'nombre'} // Solo el nombre es estrictamente obligatorio
                      step={field === 'precioPorHora' ? '0.01' : undefined} // Permitir decimales en precio
                      min={field === 'precioPorHora' ? '0' : undefined} // Precio no puede ser negativo
                      placeholder={
                          field === 'nombre' ? 'Ej: La Redonda F5'
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

            {/* Checkbox para Disponibilidad */}
            <div className="admin-form-group checkbox">
              <input
                  type="checkbox"
                  id="disponible"
                  name="disponible"
                  checked={currentFormData.disponible}
                  onChange={handleCanchaChange}
              />
               <label htmlFor="disponible">
                 Disponible para reservas
              </label>
            </div>

             {/* Botones del formulario */}
            <div className="admin-form-buttons">
              <button type="submit" className="admin-btn-save">
                {editingCancha ? 'Actualizar Cancha' : 'Crear Cancha'}
              </button>
              {/* Mostrar botón de cancelar solo si se está editando */}
              {editingCancha && (
                <button type="button" className="admin-btn-cancel" onClick={cancelEditing}>
                    Cancelar Edición
                </button>
              )}
            </div>
          </form>


          {/* Lista de Canchas Existentes */}
          <div className="admin-cancha-list">
            <h3>Listado de Canchas</h3>
            {/* Mostrar mensaje de carga o la tabla */}
            {isLoadingCanchas ? <p>Cargando canchas...</p> : (
                <div className="admin-table-container"> {/* Contenedor para scroll horizontal si es necesario */}
                    <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Ubicación</th>
                            <th>Precio/hr</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mapear canchas si existen, o mostrar mensaje */}
                        {canchas.length > 0 ? canchas.map(c => (
                        <tr key={c.id}>
                            <td data-label="ID">{c.id}</td>
                            <td data-label="Nombre">{c.nombre}</td>
                            <td data-label="Ubicación">{c.ubicacion || '-'}</td>
                            <td data-label="Precio/hr">{c.precioPorHora != null ? `$${Number(c.precioPorHora).toLocaleString('es-AR')}` : '-'}</td>
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
                            <tr><td colSpan="6" className="admin-no-data">No se encontraron canchas registradas.</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
      )}


       {/* Contenido de la Pestaña de Reservas */}
      {activeTab === 'reservas' && (
        <div className="admin-tab-content">
          <h2>Reservas Registradas</h2>
          {/* Mostrar mensaje de carga o la tabla */}
           {isLoadingReservas ? <p>Cargando reservas...</p> : (
                <div className="admin-table-container"> {/* Contenedor para scroll horizontal */}
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cancha</th>
                            <th>Cliente</th>
                            <th>Teléfono</th>
                            <th>Fecha y Hora</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {/* Mapear reservas si existen, o mostrar mensaje */}
                        {reservas.length > 0 ? reservas.map(r => (
                            <tr key={r.id}>
                            <td data-label="ID">{r.id}</td>
                            {/* Acceder al nombre de la cancha de forma segura */}
                            <td data-label="Cancha">{r.cancha?.nombre || 'N/A'}</td>
                            {/* Usar campo 'cliente' o combinar nombre/apellido */}
                            <td data-label="Cliente">{r.cliente || `${r.nombre || ''} ${r.apellido || ''}`.trim() || 'N/A'}</td>
                            <td data-label="Teléfono">{r.telefono || 'N/A'}</td>
                            {/* Formatear fecha y hora */}
                            <td data-label="Fecha y Hora">{formatDate(r.fechaHora || `${r.fecha}T${r.hora}`)}</td>
                            <td data-label="Estado">
                                <span className={`admin-badge ${r.confirmada ? 'confirmed' : 'pending'}`}>
                                {r.confirmada ? 'Confirmada' : 'Pendiente'}
                                </span>
                            </td>
                            <td data-label="Acciones">
                                {/* Mostrar botón de confirmar solo si está pendiente */}
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
                            <tr><td colSpan="7" className="admin-no-data">No hay reservas registradas.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
           )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;