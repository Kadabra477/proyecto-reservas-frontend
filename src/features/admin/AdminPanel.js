// frontend/src/features/admin/AdminPanel.jsx
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
    // ¡CAMPOS NUEVOS OBLIGATORIOS EN BACKEND!
    tipoCancha: '', 
    superficie: '',
    iluminacion: false, // Por defecto false
    techo: false,        // Por defecto false
};

function AdminPanel() {
    const [canchas, setCanchas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [activeTab, setActiveTab] = useState('canchas'); // 'canchas', 'reservas', 'estadisticas'
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
            }, 5000); // Desaparece después de 5 segundos
        }
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
            // Ruta corregida para el backend: /reservas/admin/todas
            const res = await api.get('/reservas/admin/todas');
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
    }, []);

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
        // No llamar a fetch de estadísticas aquí, ya que el componente AdminEstadisticas lo hace por sí mismo.
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
            setEditingCancha({ ...editingCancha, [name]: newValue });
        } else {
            setNuevaCancha({ ...nuevaCancha, [name]: newValue });
        }
    };

    // Guardar Cancha (Crear nueva o Actualizar existente)
    const handleSaveCancha = async (e) => {
        e.preventDefault(); // Prevenir envío por defecto
        setMensaje({ text: '', type: '' }); // Limpiar mensaje

        const canchaDataToSave = { ...(editingCancha || nuevaCancha) };

        // Validaciones en el frontend (complementarias al backend)
        const precioNum = parseFloat(canchaDataToSave.precioPorHora);
        if (isNaN(precioNum) || precioNum <= 0) { // Precio debe ser mayor a 0
            setMensaje({ text: 'El Precio por Hora debe ser un número válido y mayor a cero.', type: 'error' });
            return;
        }
        canchaDataToSave.precioPorHora = precioNum; // Guardar como número

        if (!canchaDataToSave.nombre?.trim()) {
            setMensaje({ text: 'El Nombre de la cancha es obligatorio.', type: 'error' });
            return;
        }
        if (!canchaDataToSave.tipoCancha?.trim()) {
            setMensaje({ text: 'El Tipo de Cancha es obligatorio.', type: 'error' });
            return;
        }
        if (!canchaDataToSave.superficie?.trim()) {
            setMensaje({ text: 'La Superficie de la cancha es obligatoria.', type: 'error' });
            return;
        }
        // Puedes añadir más validaciones aquí si lo deseas (ej. ubicacion, telefono)


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
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al guardar la cancha.';
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
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar la cancha.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    // Iniciar la edición de una cancha
    const startEditing = (canchaParaEditar) => {
        // Asegurarse que precioPorHora sea string para el input
        const canchaConPrecioString = {
            ...canchaParaEditar,
            precioPorHora: canchaParaEditar.precioPorHora != null ? String(canchaParaEditar.precioPorHora) : '',
            // Asegúrate de que los booleanos no sean null, para que los checkboxes funcionen.
            iluminacion: canchaParaEditar.iluminacion ?? false,
            techo: canchaParaEditar.techo ?? false,
            disponible: canchaParaEditar.disponible ?? true, // Por si el campo viene null de la BD
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
            await api.put(`/reservas/${id}/confirmar`);
            setMensaje({ text: 'Reserva confirmada correctamente.', type: 'success' });
            fetchReservas(); // Recargar la lista de reservas
        } catch (err) {
            console.error('Error al confirmar la reserva:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al confirmar la reserva.';
            setMensaje({ text: errorMsg, type: 'error' });
        }
    };

    // Eliminar una Reserva
    const handleDeleteReserva = async (id) => {
        if (window.confirm(`¿Estás seguro de eliminar la reserva con ID: ${id}?`)) {
            setMensaje({ text: '', type: '' });
            try {
                await api.delete(`/reservas/${id}`);
                setMensaje({ text: 'Reserva eliminada correctamente.', type: 'success' });
                fetchReservas(); // Recargar la lista de reservas
            } catch (err) {
                console.error('Error al eliminar la reserva:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar la reserva.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    // Función auxiliar para formatear fechas y horas
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
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
                <button
                    className={`admin-tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('estadisticas')}
                    disabled={isLoadingCanchas || isLoadingReservas} // Deshabilitar si algo está cargando
                >
                    Ver Estadísticas
                </button>
            </div>

            {/* Contenido de la Pestaña de Canchas */}
            {activeTab === 'canchas' && (
                <div className="admin-tab-content">
                    <h2>{editingCancha ? `Editando Cancha: ${editingCancha.nombre}` : 'Agregar Nueva Cancha'}</h2>

                    {/* Formulario para Agregar/Editar Canchas */}
                    <form className="admin-cancha-form" onSubmit={handleSaveCancha}>
                        {/* Campo: Nombre de Cancha */}
                        <div className="admin-form-group">
                            <label htmlFor="nombre">Nombre: <span className="obligatorio">*</span></label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={currentFormData.nombre || ''}
                                onChange={handleCanchaChange}
                                required
                                placeholder='Ej: La Redonda F5'
                            />
                        </div>

                        {/* Campo: Descripción */}
                        <div className="admin-form-group">
                            <label htmlFor="descripcion">Descripción:</label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={currentFormData.descripcion || ''}
                                onChange={handleCanchaChange}
                                rows={3}
                                placeholder='Breve descripción de la cancha...'
                            />
                        </div>

                        {/* Campo: Tipo de Cancha (SELECT) */}
                        <div className="admin-form-group">
                            <label htmlFor="tipoCancha">Tipo de Cancha: <span className="obligatorio">*</span></label>
                            <select
                                id="tipoCancha"
                                name="tipoCancha"
                                value={currentFormData.tipoCancha || ''}
                                onChange={handleCanchaChange}
                                required
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="Fútbol 5">Fútbol 5</option>
                                <option value="Fútbol 7">Fútbol 7</option>
                                <option value="Fútbol 11">Fútbol 11</option>
                                <option value="Pádel">Pádel</option>
                                <option value="Tenis">Tenis</option>
                                <option value="Básquet">Básquet</option>
                                {/* Agrega más opciones según tus necesidades */}
                            </select>
                        </div>

                        {/* Campo: Superficie (SELECT) */}
                        <div className="admin-form-group">
                            <label htmlFor="superficie">Superficie: <span className="obligatorio">*</span></label>
                            <select
                                id="superficie"
                                name="superficie"
                                value={currentFormData.superficie || ''}
                                onChange={handleCanchaChange}
                                required
                            >
                                <option value="">Selecciona una superficie</option>
                                <option value="Césped Sintético">Césped Sintético</option>
                                <option value="Polvo de ladrillo">Polvo de ladrillo</option>
                                <option value="Cemento">Cemento</option>
                                <option value="Parquet">Parquet</option>
                                {/* Agrega más opciones según tus necesidades */}
                            </select>
                        </div>

                        {/* Campo: Ubicación */}
                        <div className="admin-form-group">
                            <label htmlFor="ubicacion">Ubicación:</label>
                            <input
                                type="text"
                                id="ubicacion"
                                name="ubicacion"
                                value={currentFormData.ubicacion || ''}
                                onChange={handleCanchaChange}
                                placeholder='Ej: Calle Falsa 123, San Martín'
                            />
                        </div>

                        {/* Campo: Teléfono */}
                        <div className="admin-form-group">
                            <label htmlFor="telefono">Teléfono:</label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={currentFormData.telefono || ''}
                                onChange={handleCanchaChange}
                                placeholder='Ej: 2634...'
                            />
                        </div>

                        {/* Campo: URL de Foto */}
                        <div className="admin-form-group">
                            <label htmlFor="fotoUrl">URL de Foto:</label>
                            <input
                                type="url"
                                id="fotoUrl"
                                name="fotoUrl"
                                value={currentFormData.fotoUrl || ''}
                                onChange={handleCanchaChange}
                                placeholder='https://ejemplo.com/foto_cancha.jpg'
                            />
                        </div>

                        {/* Campo: URL Google Maps */}
                        <div className="admin-form-group">
                            <label htmlFor="ubicacionMaps">URL Google Maps:</label>
                            <input
                                type="url"
                                id="ubicacionMaps"
                                name="ubicacionMaps"
                                value={currentFormData.ubicacionMaps || ''}
                                onChange={handleCanchaChange}
                                placeholder='https://goo.gl/maps/...'
                            />
                        </div>

                        {/* Campo: Precio por Hora */}
                        <div className="admin-form-group">
                            <label htmlFor="precioPorHora">Precio por Hora: <span className="obligatorio">*</span></label>
                            <input
                                type="number"
                                id="precioPorHora"
                                name="precioPorHora"
                                value={currentFormData.precioPorHora || ''}
                                onChange={handleCanchaChange}
                                required
                                step="0.01"
                                min="0"
                                placeholder='Ej: 5000.00'
                            />
                        </div>

                        {/* Checkboxes para iluminacion, techo, disponible */}
                        <div className="admin-form-group checkbox">
                            <input
                                type="checkbox"
                                id="iluminacion"
                                name="iluminacion"
                                checked={currentFormData.iluminacion}
                                onChange={handleCanchaChange}
                            />
                            <label htmlFor="iluminacion">
                                Tiene Iluminación
                            </label>
                        </div>
                        <div className="admin-form-group checkbox">
                            <input
                                type="checkbox"
                                id="techo"
                                name="techo"
                                checked={currentFormData.techo}
                                onChange={handleCanchaChange}
                            />
                            <label htmlFor="techo">
                                Tiene Techo
                            </label>
                        </div>
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
                                        {/* Mapear canchas si existen, o mostrar mensaje */}
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