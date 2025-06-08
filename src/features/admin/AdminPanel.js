import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import AdminEstadisticas from './AdminEstadisticas';
import './AdminPanel.css';

// Estado inicial para un formulario de COMPLEJO nuevo
const estadoInicialComplejo = {
    nombre: '',
    descripcion: '',
    fotoUrl: '',
    ubicacion: '',
    telefono: '',
    horarioApertura: '10:00', // Formato HH:MM
    horarioCierre: '23:00',   // Formato HH:MM
    canchaCounts: {},
    canchaPrices: {},
    canchaSurfaces: {},
    canchaIluminacion: {},
    canchaTecho: {},
};

// Estado inicial para un nuevo Tipo de Cancha dentro de un complejo
const estadoInicialTipoCancha = {
    tipo: '',
    cantidad: '',
    precio: '',
    superficie: '',
    iluminacion: false,
    techo: false,
};

function AdminPanel() {
    const [complejos, setComplejos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [activeTab, setActiveTab] = useState('complejos');
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [editingComplejo, setEditingComplejo] = useState(null);
    const [nuevoComplejo, setNuevoComplejo] = useState(estadoInicialComplejo);

    const [editingTipoCancha, setEditingTipoCancha] = useState(null);
    const [nuevoTipoCancha, setNuevoTipoCancha] = useState(estadoInicialTipoCancha);

    const userRole = localStorage.getItem('userRole');

    // Mueve la declaración de currentComplejoFormData aquí, al inicio del componente
    const currentComplejoFormData = editingComplejo || nuevoComplejo;
    const currentTipoCanchaFormData = editingTipoCancha || nuevoTipoCancha;


    useEffect(() => {
        let timer;
        if (mensaje.text) {
            timer = setTimeout(() => {
                setMensaje({ text: '', type: '' });
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [mensaje]);

    const fetchComplejos = useCallback(async () => {
        setIsLoadingData(true);
        setMensaje({ text: '', type: '' });
        try {
            let res;
            if (userRole === 'ADMIN') {
                res = await api.get('/complejos');
            } else if (userRole === 'COMPLEX_OWNER') {
                res = await api.get('/complejos/mis-complejos');
            } else {
                setComplejos([]);
                setIsLoadingData(false);
                return;
            }
            setComplejos(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al obtener complejos:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de complejos.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, [userRole]);

    const fetchReservas = useCallback(async () => {
        setIsLoadingData(true);
        setMensaje({ text: '', type: '' });
        try {
            const res = await api.get('/reservas/admin/todas');
            setReservas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al obtener reservas:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de reservas.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            setMensaje({ text: 'Acceso denegado. Necesitas iniciar sesión.', type: 'error' });
            return;
        }

        if (activeTab === 'complejos') {
            fetchComplejos();
        } else if (activeTab === 'reservas') {
            fetchReservas();
        }
    }, [activeTab, fetchComplejos, fetchReservas, userRole]);

    // --- Manejo de Formularios de Complejo ---
    const handleComplejoChange = (e) => {
        const { name, value } = e.target;
        const targetState = editingComplejo ? setEditingComplejo : setNuevoComplejo;
        targetState(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveComplejo = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const complejoDataToSave = { ...currentComplejoFormData }; // Usa la variable ya declarada

        if (!complejoDataToSave.nombre?.trim() || !complejoDataToSave.ubicacion?.trim() || !complejoDataToSave.horarioApertura || !complejoDataToSave.horarioCierre) {
            setMensaje({ text: 'Los campos obligatorios de Complejo (Nombre, Ubicación, Horarios) son obligatorios.', type: 'error' });
            return;
        }

        complejoDataToSave.horarioApertura = complejoDataToSave.horarioApertura.substring(0, 5);
        complejoDataToSave.horarioCierre = complejoDataToSave.horarioCierre.substring(0, 5);

        complejoDataToSave.canchaCounts = complejoDataToSave.canchaCounts || {};
        complejoDataToSave.canchaPrices = complejoDataToSave.canchaPrices || {};
        complejoDataToSave.canchaSurfaces = complejoDataToSave.canchaSurfaces || {};
        complejoDataToSave.canchaIluminacion = complejoDataToSave.canchaIluminacion || {};
        complejoDataToSave.canchaTecho = complejoDataToSave.canchaTecho || {};


        const request = editingComplejo
            ? api.put(`/complejos/${editingComplejo.id}`, complejoDataToSave)
            : api.post('/complejos', complejoDataToSave);

        try {
            await request;
            setMensaje({
                text: editingComplejo ? 'Complejo actualizado correctamente.' : 'Complejo creado correctamente.',
                type: 'success'
            });
            fetchComplejos();
            setEditingComplejo(null);
            setNuevoComplejo(estadoInicialComplejo);
        } catch (err) {
            console.error('Error al guardar el complejo:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al guardar el complejo.';
            setMensaje({ text: errorMsg, type: 'error' });
        }
    };

    const handleDeleteComplejo = async (id) => {
        if (window.confirm(`¿Estás seguro de eliminar el complejo con ID: ${id}? Esta acción es irreversible y eliminará todas las reservas asociadas.`)) {
            setMensaje({ text: '', type: '' });
            try {
                await api.delete(`/complejos/${id}`);
                setMensaje({ text: 'Complejo eliminado correctamente.', type: 'success' });
                fetchComplejos();
                if (editingComplejo && editingComplejo.id === id) {
                    setEditingComplejo(null);
                    setNuevoComplejo(estadoInicialComplejo);
                }
            } catch (err) {
                console.error('Error al eliminar el complejo:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    const startEditingComplejo = (complejoParaEditar) => {
        setEditingComplejo({
            ...complejoParaEditar,
            horarioApertura: complejoParaEditar.horarioApertura ? complejoParaEditar.horarioApertura.substring(0, 5) : '10:00',
            horarioCierre: complejoParaEditar.horarioCierre ? complejoParaEditar.horarioCierre.substring(0, 5) : '23:00',
            canchaCounts: complejoParaEditar.canchaCounts || {},
            canchaPrices: complejoParaEditar.canchaPrices || {},
            canchaSurfaces: complejoParaEditar.canchaSurfaces || {},
            canchaIluminacion: complejoParaEditar.canchaIluminacion || {},
            canchaTecho: complejoParaEditar.canchaTecho || {},
        });
        setNuevoComplejo(estadoInicialComplejo);
        setEditingTipoCancha(null);
        setNuevoTipoCancha(estadoInicialTipoCancha);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditingComplejo = () => {
        setEditingComplejo(null);
        setNuevoComplejo(estadoInicialComplejo);
        setEditingTipoCancha(null);
        setNuevoTipoCancha(estadoInicialTipoCancha);
    };

    // --- Manejo de Formularios de Tipos de Cancha dentro de un Complejo ---
    const handleTipoCanchaChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        const targetState = editingTipoCancha ? setEditingTipoCancha : setNuevoTipoCancha;
        targetState(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSaveTipoCancha = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        if (!editingComplejo) {
            setMensaje({ text: 'Primero selecciona o crea un complejo para agregar tipos de cancha.', type: 'error' });
            return;
        }

        const tipoCanchaData = { ...currentTipoCanchaFormData }; // Usa la variable ya declarada

        const cantidadNum = parseInt(tipoCanchaData.cantidad, 10);
        const precioNum = parseFloat(tipoCanchaData.precio);

        if (!tipoCanchaData.tipo?.trim() || isNaN(cantidadNum) || cantidadNum <= 0 || isNaN(precioNum) || precioNum <= 0 || !tipoCanchaData.superficie?.trim()) {
            setMensaje({ text: 'Todos los campos de Tipo de Cancha (Tipo, Cantidad, Precio, Superficie) son obligatorios y válidos.', type: 'error' });
            return;
        }

        const updatedComplejo = { ...editingComplejo };

        updatedComplejo.canchaCounts = { ...updatedComplejo.canchaCounts, [tipoCanchaData.tipo]: cantidadNum };
        updatedComplejo.canchaPrices = { ...updatedComplejo.canchaPrices, [tipoCanchaData.tipo]: precioNum };
        updatedComplejo.canchaSurfaces = { ...updatedComplejo.canchaSurfaces, [tipoCanchaData.tipo]: tipoCanchaData.superficie };
        updatedComplejo.canchaIluminacion = { ...updatedComplejo.canchaIluminacion, [tipoCanchaData.tipo]: tipoCanchaData.iluminacion };
        updatedComplejo.canchaTecho = { ...updatedComplejo.canchaTecho, [tipoCanchaData.tipo]: tipoCanchaData.techo };

        try {
            await api.put(`/complejos/${updatedComplejo.id}`, updatedComplejo);
            setMensaje({ text: `Tipo de cancha &quot;${tipoCanchaData.tipo}&quot; guardado correctamente en el complejo.`, type: 'success' }); // Escapado
            fetchComplejos();
            setEditingTipoCancha(null);
            setNuevoTipoCancha(estadoInicialTipoCancha);
            setEditingComplejo(updatedComplejo);
        } catch (err) {
            console.error('Error al guardar el tipo de cancha:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al guardar el tipo de cancha.';
            setMensaje({ text: errorMsg, type: 'error' });
        }
    };

    const handleDeleteTipoCancha = async (tipo) => {
        if (window.confirm(`¿Estás seguro de eliminar el tipo de cancha &quot;${tipo}&quot; del complejo &quot;${editingComplejo.nombre}&quot;? Esta acción es irreversible.`)) { // Escapado
            setMensaje({ text: '', type: '' });
            if (!editingComplejo) return;

            const updatedComplejo = { ...editingComplejo };

            delete updatedComplejo.canchaCounts[tipo];
            delete updatedComplejo.canchaPrices[tipo];
            delete updatedComplejo.canchaSurfaces[tipo];
            delete updatedComplejo.canchaIluminacion[tipo];
            delete updatedComplejo.canchaTecho[tipo];

            try {
                await api.put(`/complejos/${updatedComplejo.id}`, updatedComplejo);
                setMensaje({ text: `Tipo de cancha &quot;${tipo}&quot; eliminado correctamente.`, type: 'success' }); // Escapado
                fetchComplejos();
                setEditingComplejo(updatedComplejo);
                if (editingTipoCancha && editingTipoCancha.tipo === tipo) {
                    setEditingTipoCancha(null);
                    setNuevoTipoCancha(estadoInicialTipoCancha);
                }
            } catch (err) {
                console.error('Error al eliminar el tipo de cancha:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar el tipo de cancha.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    const startEditingTipoCancha = (tipo) => {
        if (!editingComplejo) return;

        setEditingTipoCancha({
            tipo: tipo,
            cantidad: editingComplejo.canchaCounts[tipo] || '',
            precio: editingComplejo.canchaPrices[tipo] || '',
            superficie: editingComplejo.canchaSurfaces[tipo] || '',
            iluminacion: editingComplejo.canchaIluminacion[tipo] ?? false,
            techo: editingComplejo.canchaTecho[tipo] ?? false,
        });
        setNuevoTipoCancha(estadoInicialTipoCancha);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditingTipoCancha = () => {
        setEditingTipoCancha(null);
        setNuevoTipoCancha(estadoInicialTipoCancha);
    };

    // --- Manejo de Reservas ---
    const handleConfirmReserva = async (id) => {
        setMensaje({ text: '', type: '' });
        try {
            await api.put(`/reservas/${id}/confirmar`);
            setMensaje({ text: 'Reserva confirmada correctamente.', type: 'success' });
            fetchReservas();
        } catch (err) {
            console.error('Error al confirmar la reserva:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al confirmar la reserva.';
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
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar la reserva.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    // --- Funciones Auxiliares ---
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
            return new Date(dateStr).toLocaleString('es-AR', options);
        } catch (e) {
            console.error("Error al formatear fecha:", dateStr, e);
            return dateStr;
        }
    };

    const formatReservaEstado = (estado) => {
        if (!estado) return 'Desconocido';
        estado = estado.toLowerCase();
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'confirmada': return 'Confirmada';
            case 'pendiente_pago_efectivo': return 'Pendiente (Efectivo)';
            case 'pendiente_pago_mp': return 'Pendiente (Mercado Pago)';
            case 'pagada': return 'Pagada';
            case 'rechazada_pago_mp': return 'Rechazada (Mercado Pago)';
            case 'cancelada': return 'Cancelada';
            default: return estado.charAt(0).toUpperCase() + estado.slice(1);
        }
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    return (
        <div className="admin-panel">
            <h1>Panel de Administración</h1>
            {mensaje.text && <div className={`admin-mensaje ${mensaje.type}`}>{mensaje.text}</div>}

            <div className="admin-tabs">
                <button
                    className={`admin-tab-button ${activeTab === 'complejos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('complejos')}
                    disabled={isLoadingData}
                >
                    Gestionar Complejos
                </button>
                <button
                    className={`admin-tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservas')}
                    disabled={isLoadingData}
                >
                    Gestionar Reservas
                </button>
                <button
                    className={`admin-tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('estadisticas')}
                    disabled={isLoadingData}
                >
                    Ver Estadísticas
                </button>
            </div>

            {/* Contenido de la Pestaña de Complejos */}
            {activeTab === 'complejos' && (
                <div className="admin-tab-content">
                    <h2>{editingComplejo ? `Editando Complejo: ${editingComplejo.nombre}` : 'Agregar Nuevo Complejo'}</h2>

                    {userRole === 'ADMIN' && (
                        <p className="info-message">Como Administrador General, puedes crear y editar cualquier complejo. El complejo se asignará al usuario que lo crea (tú).</p>
                    )}
                    {userRole === 'COMPLEX_OWNER' && (
                        <p className="info-message">Como Dueño de Complejo, puedes gestionar solo los complejos que te pertenecen. Selecciona un complejo de la lista para editarlo.</p>
                    )}

                    {/* Formulario para Agregar/Editar Complejos (visible solo para ADMIN, o para COMPLEX_OWNER si edita) */}
                    {userRole === 'ADMIN' || (userRole === 'COMPLEX_OWNER' && editingComplejo) ? (
                        <form className="admin-complejo-form" onSubmit={handleSaveComplejo}>
                            <h3>Datos Generales del Complejo</h3>
                            <div className="admin-form-group">
                                <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
                                <input type="text" id="nombre" name="nombre" value={currentComplejoFormData.nombre || ''} onChange={handleComplejoChange} required placeholder='Ej: El Alargue' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="descripcion">Descripción:</label>
                                <textarea id="descripcion" name="descripcion" value={currentComplejoFormData.descripcion || ''} onChange={handleComplejoChange} rows={3} placeholder='Breve descripción del complejo...' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="ubicacion">Ubicación: <span className="obligatorio">*</span></label>
                                <input type="text" id="ubicacion" name="ubicacion" value={currentComplejoFormData.ubicacion || ''} onChange={handleComplejoChange} required placeholder='Ej: Calle Falsa 123, San Martín' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="telefono">Teléfono:</label>
                                <input type="tel" id="telefono" name="telefono" value={currentComplejoFormData.telefono || ''} onChange={handleComplejoChange} placeholder='Ej: +549261xxxxxxx' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="fotoUrl">URL de Foto Principal:</label>
                                <input type="url" id="fotoUrl" name="fotoUrl" value={currentComplejoFormData.fotoUrl || ''} onChange={handleComplejoChange} placeholder='https://ejemplo.com/foto_complejo.jpg' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="horarioApertura">Horario Apertura: <span className="obligatorio">*</span></label>
                                <input type="time" id="horarioApertura" name="horarioApertura" value={currentComplejoFormData.horarioApertura || ''} onChange={handleComplejoChange} required />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="horarioCierre">Horario Cierre: <span className="obligatorio">*</span></label>
                                <input type="time" id="horarioCierre" name="horarioCierre" value={currentComplejoFormData.horarioCierre || ''} onChange={handleComplejoChange} required />
                            </div>

                            <div className="admin-form-buttons">
                                <button type="submit" className="admin-btn-save">
                                    {editingComplejo ? 'Actualizar Complejo' : 'Crear Complejo'}
                                </button>
                                {editingComplejo && (
                                    <button type="button" className="admin-btn-cancel" onClick={cancelEditingComplejo}>
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : (
                        userRole === 'COMPLEX_OWNER' && !editingComplejo && (
                            <p className="info-message">Selecciona un complejo de la lista para gestionarlo. Solo los Administradores Generales pueden crear nuevos complejos.</p>
                        )
                    )}

                    {/* Sección para Gestionar Tipos de Cancha dentro del Complejo (solo si se está editando un complejo) */}
                    {editingComplejo && (userRole === 'ADMIN' || userRole === 'COMPLEX_OWNER') && (
                        <div className="admin-tipo-cancha-gestion">
                            <h3>Gestionar Tipos de Cancha para "{editingComplejo.nombre}"</h3>

                            {/* Formulario para agregar/editar un Tipo de Cancha */}
                            <form className="admin-tipo-cancha-form" onSubmit={handleSaveTipoCancha}>
                                <h4>{editingTipoCancha ? `Editando Tipo: ${editingTipoCancha.tipo}` : 'Agregar Nuevo Tipo de Cancha'}</h4>
                                <div className="admin-form-group">
                                    <label htmlFor="tipo">Tipo de Cancha: <span className="obligatorio">*</span></label>
                                    <select id="tipo" name="tipo" value={currentTipoCanchaFormData.tipo || ''} onChange={handleTipoCanchaChange} required disabled={!!editingTipoCancha}>
                                        <option value="">Selecciona un tipo</option>
                                        <option value="Fútbol 5">Fútbol 5</option>
                                        <option value="Fútbol 7">Fútbol 7</option>
                                        <option value="Fútbol 11">Fútbol 11</option>
                                        <option value="Pádel">Pádel</option>
                                        <option value="Tenis">Tenis</option>
                                        <option value="Básquet">Básquet</option>
                                    </select>
                                    {editingTipoCancha && <p className="small-info">No puedes cambiar el tipo de cancha mientras editas. Elimínalo y crea uno nuevo si lo necesitas.</p>}
                                </div>
                                <div className="admin-form-group">
                                    <label htmlFor="cantidad">Cantidad: <span className="obligatorio">*</span></label>
                                    <input type="number" id="cantidad" name="cantidad" value={currentTipoCanchaFormData.cantidad || ''} onChange={handleTipoCanchaChange} required min="1" placeholder='Número de canchas de este tipo' />
                                </div>
                                <div className="admin-form-group">
                                    <label htmlFor="precio">Precio por Hora: <span className="obligatorio">*</span></label>
                                    <input type="number" id="precio" name="precio" value={currentTipoCanchaFormData.precio || ''} onChange={handleTipoCanchaChange} required step="0.01" min="0" placeholder='Ej: 35000.00' />
                                </div>
                                <div className="admin-form-group">
                                    <label htmlFor="superficie">Superficie: <span className="obligatorio">*</span></label>
                                    <select id="superficie" name="superficie" value={currentTipoCanchaFormData.superficie || ''} onChange={handleTipoCanchaChange} required>
                                        <option value="">Selecciona una superficie</option>
                                        <option value="Césped Sintético">Césped Sintético</option>
                                        <option value="Polvo de Ladrillo">Polvo de Ladrillo</option>
                                        <option value="Cemento">Cemento</option>
                                        <option value="Parquet">Parquet</option>
                                    </select>
                                </div>
                                <div className="admin-form-group checkbox">
                                    <input type="checkbox" id="iluminacion" name="iluminacion" checked={currentTipoCanchaFormData.iluminacion} onChange={handleTipoCanchaChange} />
                                    <label htmlFor="iluminacion">Tiene Iluminación</label>
                                </div>
                                <div className="admin-form-group checkbox">
                                    <input type="checkbox" id="techo" name="techo" checked={currentTipoCanchaFormData.techo} onChange={handleTipoCanchaChange} />
                                    <label htmlFor="techo">Tiene Techo</label>
                                </div>
                                <div className="admin-form-buttons">
                                    <button type="submit" className="admin-btn-save">
                                        {editingTipoCancha ? 'Actualizar Tipo' : 'Agregar Tipo'}
                                    </button>
                                    {editingTipoCancha && (
                                        <button type="button" className="admin-btn-cancel" onClick={cancelEditingTipoCancha}>
                                            Cancelar Edición
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Lista de Tipos de Cancha del Complejo actual */}
                            <div className="admin-list-tipos-cancha">
                                <h4>Tipos de Cancha configurados en "{editingComplejo.nombre}"</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Cant.</th>
                                            <th>Precio/hr</th>
                                            <th>Superficie</th>
                                            <th>Ilum.</th>
                                            <th>Techo</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(editingComplejo.canchaCounts).length > 0 ? (
                                            Object.keys(editingComplejo.canchaCounts).map(tipo => (
                                                <tr key={tipo}>
                                                    <td data-label="Tipo">{tipo}</td>
                                                    <td data-label="Cantidad">{editingComplejo.canchaCounts[tipo]}</td>
                                                    <td data-label="Precio/hr">${(editingComplejo.canchaPrices[tipo] || 0).toLocaleString('es-AR')}</td>
                                                    <td data-label="Superficie">{editingComplejo.canchaSurfaces[tipo] || '-'}</td>
                                                    <td data-label="Ilum.">{editingComplejo.canchaIluminacion[tipo] ? 'Sí' : 'No'}</td>
                                                    <td data-label="Techo">{editingComplejo.canchaTecho[tipo] ? 'Sí' : 'No'}</td>
                                                    <td data-label="Acciones">
                                                        <button className="admin-btn-edit" onClick={() => startEditingTipoCancha(tipo)}>Editar</button>
                                                        <button className="admin-btn-delete" onClick={() => handleDeleteTipoCancha(tipo)}>Eliminar</button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="7" className="admin-no-data">No hay tipos de canchas configurados para este complejo.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Contenido de la Pestaña de Reservas */}
            {activeTab === 'reservas' && (
                <div className="admin-tab-content">
                    <h2>Reservas Registradas</h2>
                    {isLoadingData ? <p>Cargando reservas...</p> : (
                        <div className="admin-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Complejo</th>
                                        <th>Tipo Cancha</th>
                                        <th>Cancha Asignada</th>
                                        <th>Cliente</th>
                                        <th>DNI</th>
                                        <th>Teléfono</th>
                                        <th>Fecha y Hora</th>
                                        <th>Precio Total</th>
                                        <th>Método Pago</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservas.length > 0 ? reservas.map(r => (
                                        <tr key={r.id}>
                                            <td data-label="ID">{r.id}</td>
                                            <td data-label="Complejo">{r.complejoNombre || 'N/A'}</td>
                                            <td data-label="Tipo Cancha">{r.tipoCanchaReservada || 'N/A'}</td>
                                            <td data-label="Cancha Asignada">{r.nombreCanchaAsignada || 'N/A'}</td>
                                            <td data-label="Cliente">{r.cliente || 'N/A'}</td>
                                            <td data-label="DNI">{r.dni || 'N/A'}</td>
                                            <td data-label="Teléfono">{r.telefono || 'N/A'}</td>
                                            <td data-label="Fecha y Hora">{formatDate(r.fechaHora)}</td>
                                            <td data-label="Precio Total">${r.precioTotal ? r.precioTotal.toLocaleString('es-AR') : 'N/A'}</td>
                                            <td data-label="Método Pago">{capitalizeFirstLetter(r.metodoPago || 'N/A')}</td>
                                            <td data-label="Estado">
                                                <span className={`admin-badge ${r.estado === 'pagada' ? 'paid' : (r.estado === 'confirmada' ? 'confirmed' : 'pending')}`}>
                                                    {formatReservaEstado(r.estado)}
                                                </span>
                                            </td>
                                            <td data-label="Acciones">
                                                {(r.estado === 'pendiente_pago_efectivo' || r.estado === 'pendiente_pago_mp') && (
                                                    <button className="admin-btn-confirm" onClick={() => handleConfirmReserva(r.id)}>
                                                        Confirmar
                                                    </button>
                                                )}
                                                <button className="admin-btn-delete" onClick={() => handleDeleteReserva(r.id)}>
                                                    Eliminar
                                                </button>
                                                <a href={`${process.env.REACT_APP_API_URL}/reservas/${r.id}/pdf-comprobante`} target="_blank" rel="noopener noreferrer" className="admin-btn-pdf">
                                                    PDF
                                                </a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="12" className="admin-no-data">No hay reservas registradas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Contenido de la Pestaña de Estadísticas */}
            {activeTab === 'estadisticas' && (
                <AdminEstadisticas userRole={userRole} />
            )}
        </div>
    );
}

export default AdminPanel;