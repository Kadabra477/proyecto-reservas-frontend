import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import AdminEstadisticas from './AdminEstadisticas';
import './AdminPanel.css';

// Estado inicial para un formulario de COMPLEJO nuevo
const estadoInicialComplejoAdmin = {
    id: null,
    nombre: '',
    descripcion: '',
    ubicacion: '',
    telefono: '',
    fotoUrl: '',
    horarioApertura: '10:00',
    horarioCierre: '23:00',
    emailPropietario: '', // Campo para la creación por ADMIN
    canchas: [{ tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false }]
};

function AdminPanel() {
    const [complejos, setComplejos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [activeTab, setActiveTab] = useState('complejos');
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [editingComplejo, setEditingComplejo] = useState(null); // Almacena el objeto complejo completo si estamos editando
    const [nuevoComplejoAdmin, setNuevoComplejoAdmin] = useState(estadoInicialComplejoAdmin);

    const [managingUserRoles, setManagingUserRoles] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const isAdmin = userRoles.includes('ADMIN');
    const isComplexOwner = userRoles.includes('COMPLEX_OWNER');

    const roleForStats = isAdmin ? 'ADMIN' : (isComplexOwner ? 'COMPLEX_OWNER' : null);


    const mapComplejoToFormCanchas = useCallback((complejo) => {
        const canchasArray = [];
        const tiposExistentes = new Set();
        
        const allCanchaTypes = new Set([
            ...Object.keys(complejo.canchaCounts || {}),
            ...Object.keys(complejo.canchaPrices || {}),
            ...Object.keys(complejo.canchaSurfaces || {}),
            ...Object.keys(complejo.canchaIluminacion || {}),
            ...Object.keys(complejo.canchaTecho || {})
        ]);

        allCanchaTypes.forEach(tipoCancha => {
            if (!tiposExistentes.has(tipoCancha)) {
                canchasArray.push({
                    tipoCancha: tipoCancha,
                    cantidad: complejo.canchaCounts?.[tipoCancha] || '',
                    precioHora: complejo.canchaPrices?.[tipoCancha] || '',
                    superficie: complejo.canchaSurfaces?.[tipoCancha] || '',
                    iluminacion: complejo.canchaIluminacion?.[tipoCancha] || false,
                    techo: complejo.canchaTecho?.[tipoCancha] || false
                });
                tiposExistentes.add(tipoCancha);
            }
        });
        
        if (canchasArray.length === 0) {
            canchasArray.push({ tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false });
        }
        return canchasArray;
    }, []);

    useEffect(() => {
        if (editingComplejo) {
            setNuevoComplejoAdmin({
                id: editingComplejo.id,
                nombre: editingComplejo.nombre || '',
                descripcion: editingComplejo.descripcion || '',
                ubicacion: editingComplejo.ubicacion || '',
                telefono: editingComplejo.telefono || '',
                fotoUrl: editingComplejo.fotoUrl || '',
                horarioApertura: editingComplejo.horarioApertura ? editingComplejo.horarioApertura.substring(0, 5) : '10:00',
                horarioCierre: editingComplejo.horarioCierre ? editingComplejo.horarioCierre.substring(0, 5) : '23:00',
                emailPropietario: editingComplejo.propietario?.username || '', // ¡Acceder a .username del objeto propietario!
                canchas: mapComplejoToFormCanchas(editingComplejo)
            });
        } else {
            setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
        }
    }, [editingComplejo, mapComplejoToFormCanchas]);


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
            const endpoint = isAdmin ? '/complejos' : '/complejos/mis-complejos';
            // Esperamos Complejo del backend (con propietario cargado por JOIN FETCH)
            const res = await api.get(endpoint);
            setComplejos(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al obtener complejos:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de complejos.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, [isAdmin]);

    const fetchReservas = useCallback(async () => {
        setIsLoadingData(true);
        setMensaje({ text: '', type: '' });
        try {
            // El backend debe tener un endpoint para COMPLEX_OWNER si no lo tiene ya.
            // Por ahora, usa la ruta de ADMIN si no hay una específica para COMPLEX_OWNER.
            const endpoint = isAdmin ? '/reservas/admin/todas' : '/reservas/complejo/mis-reservas'; // Ajustar según tu backend real para COMPLEX_OWNER
            const res = await api.get(endpoint);
            setReservas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al obtener reservas:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de reservas.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, [isAdmin]);

    const fetchUsuarios = useCallback(async () => {
        setIsLoadingData(true);
        setMensaje({ text: '', type: '' });
        try {
            if (isAdmin) {
                const res = await api.get('/users');
                setUsuarios(Array.isArray(res.data) ? res.data : []);
            } else {
                setUsuarios([]); // Otros roles no ven la lista de usuarios
            }
        } catch (err) {
            console.error('Error al obtener usuarios:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de usuarios.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, [isAdmin]);

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
        } else if (activeTab === 'usuarios' && isAdmin) {
            fetchUsuarios();
        } else if (activeTab === 'estadisticas') {
            // AdminEstadisticas se encarga de su propia carga de datos
        }
    }, [activeTab, fetchComplejos, fetchReservas, fetchUsuarios, isAdmin]);


    const handleComplejoFormChange = (e) => {
        const { name, value } = e.target;
        setNuevoComplejoAdmin(prev => ({ ...prev, [name]: value }));
    };

    const handleCanchaChange = (index, event) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked : value;

        const newCanchas = [...nuevoComplejoAdmin.canchas];
        newCanchas[index] = {
            ...newCanchas[index],
            [name]: name === 'cantidad' || name === 'precioHora' ? parseFloat(newValue) || 0 : newValue
        };
        setNuevoComplejoAdmin(prev => ({ ...prev, canchas: newCanchas }));
    };

    const handleAddCancha = () => {
        setNuevoComplejoAdmin(prev => ({
            ...prev,
            canchas: [...prev.canchas, { tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false }]
        }));
    };

    const handleRemoveCancha = (index) => {
        const newCanchas = nuevoComplejoAdmin.canchas.filter((_, i) => i !== index);
        setNuevoComplejoAdmin(prev => ({ ...prev, canchas: newCanchas }));
    };


    const handleSaveComplejo = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const { id, nombre, emailPropietario, canchas, descripcion, ubicacion, telefono, fotoUrl, horarioApertura, horarioCierre } = nuevoComplejoAdmin;

        if (!nombre?.trim()) {
            setMensaje({ text: 'El nombre del complejo es obligatorio.', type: 'error' });
            return;
        }
        if (!ubicacion?.trim()) {
            setMensaje({ text: 'La ubicación del complejo es obligatoria.', type: 'error' });
            return;
        }
        if (!horarioApertura || !horarioCierre) {
            setMensaje({ text: 'Los horarios de apertura y cierre son obligatorios.', type: 'error' });
            return;
        }

        // Validación para la creación por ADMIN: emailPropietario es obligatorio
        if (!id && isAdmin && !emailPropietario?.trim()) { 
            setMensaje({ text: 'El email del propietario es obligatorio para nuevos complejos (Administrador).', type: 'error' });
            return;
        }

        const formattedCanchas = canchas.filter(c => c.tipoCancha.trim() !== '');
        if (formattedCanchas.length === 0 || formattedCanchas.some(c => !c.tipoCancha?.trim() || isNaN(parseFloat(c.precioHora)) || parseFloat(c.precioHora) <= 0 || isNaN(parseInt(c.cantidad, 10)) || parseInt(c.cantidad, 10) <= 0 || !c.superficie?.trim())) {
            setMensaje({ text: 'Todos los tipos de canchas deben tener un tipo, cantidad, precio, y superficie válidos.', type: 'error' });
            return;
        }

        const canchaCounts = {};
        const canchaPrices = {};
        const canchaSurfaces = {};
        const canchaIluminacion = {};
        const canchaTecho = {};

        formattedCanchas.forEach(cancha => {
            canchaCounts[cancha.tipoCancha] = parseInt(cancha.cantidad, 10);
            canchaPrices[cancha.tipoCancha] = parseFloat(cancha.precioHora);
            canchaSurfaces[cancha.tipoCancha] = cancha.superficie;
            canchaIluminacion[cancha.tipoCancha] = cancha.iluminacion;
            canchaTecho[cancha.tipoCancha] = cancha.techo;
        });

        // Los datos a enviar al backend deben coincidir con la entidad Complejo (sin el propietario, se usa el token)
        const payload = {
            id, // Para la actualización, el ID es importante
            nombre,
            descripcion: descripcion || null,
            ubicacion,
            telefono: telefono || null,
            fotoUrl: fotoUrl || null,
            horarioApertura,
            horarioCierre,
            canchaCounts,
            canchaPrices,
            canchaSurfaces,
            canchaIluminacion,
            canchaTecho
        };

        if (editingComplejo) { // Si estamos en modo edición
            try {
                await api.put(`/complejos/${id}`, payload); // Enviamos el payload para actualizar
                setMensaje({ text: 'Complejo actualizado correctamente.', type: 'success' });
                setEditingComplejo(null);
                setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
                fetchComplejos();
            }
            catch (err) {
                console.error('Error al actualizar el complejo:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al actualizar el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        } else { // Si estamos creando un nuevo complejo
            // Al crear, el ADMIN puede especificar el propietario (si isAdmin), si no, el backend lo asignará al creador
            const crearPayload = {
                ...payload,
                propietarioUsername: isAdmin ? emailPropietario : undefined // Solo incluye propietarioUsername si es ADMIN y creando
            };
            try {
                await api.post('/complejos', crearPayload);
                setMensaje({ text: 'Complejo creado correctamente y asignado al propietario.', type: 'success' });
                setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
                fetchComplejos();
            } catch (err) {
                console.error('Error al crear complejo (Admin):', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Error al crear el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };
    
    const startEditingComplejo = (complejoParaEditar) => {
        setEditingComplejo(complejoParaEditar);
        setNuevoComplejoAdmin({
            id: complejoParaEditar.id,
            nombre: complejoParaEditar.nombre || '',
            descripcion: complejoParaEditar.descripcion || '',
            ubicacion: complejoParaEditar.ubicacion || '',
            telefono: complejoParaEditar.telefono || '',
            fotoUrl: complejoParaEditar.fotoUrl || '',
            horarioApertura: complejoParaEditar.horarioApertura ? complejoParaEditar.horarioApertura.substring(0, 5) : '10:00',
            horarioCierre: complejoParaEditar.horarioCierre ? complejoParaEditar.horarioCierre.substring(0, 5) : '23:00',
            emailPropietario: complejoParaEditar.propietario?.username || '', // Acceder al username del objeto propietario
            canchas: mapComplejoToFormCanchas(complejoParaEditar)
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditingComplejo = () => {
        setEditingComplejo(null);
        setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
    };


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

    const startManagingUserRoles = (user) => {
        setManagingUserRoles(user);
        const currentRoles = user.authorities ? user.authorities.map(auth => auth.authority.replace('ROLE_', '')) : [];
        setSelectedRoles(currentRoles);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelManagingUserRoles = () => {
        setManagingUserRoles(null);
        setSelectedRoles([]);
    };

    const handleRoleChange = (e) => {
        const { value, checked } = e.target;
        setSelectedRoles(prevRoles => {
            if (value === 'ADMIN' && checked) {
                const newRoles = prevRoles.filter(role => role !== 'COMPLEX_OWNER' && role !== 'ADMIN');
                return ['ADMIN', ...newRoles.filter(role => role === 'USER')];
            } else if (value === 'COMPLEX_OWNER' && checked) {
                const newRoles = prevRoles.filter(role => role !== 'ADMIN' && role !== 'COMPLEX_OWNER');
                return ['COMPLEX_OWNER', ...newRoles.filter(role => role === 'USER')];
            } else if (value === 'USER') {
                if (checked) {
                    if (prevRoles.includes('ADMIN') || prevRoles.includes('COMPLEX_OWNER') || prevRoles.includes('USER')) {
                        return [...new Set([...prevRoles, 'USER'])];
                    }
                    return [...prevRoles, value];
                } else {
                    return prevRoles.filter(role => role !== value);
                }
            } else {
                return checked ? [...prevRoles, value] : prevRoles.filter(role => role !== value);
            }
        }).filter(Boolean);
    };

    const handleSaveUserRoles = async () => {
        setMensaje({ text: '', type: '' });
        if (!managingUserRoles) return;

        try {
            let rolesToActualSend;
            if (selectedRoles.length === 0) {
                rolesToActualSend = ['ROLE_USER'];
            } else if (selectedRoles.includes('ADMIN') && selectedRoles.includes('COMPLEX_OWNER')) {
                console.warn("Intento de asignar ADMIN y COMPLEX_OWNER simultáneamente. Priorizando ADMIN.");
                rolesToActualSend = ['ROLE_ADMIN', ...selectedRoles.filter(r => r === 'USER').map(r => `ROLE_${r}`)];
            }
            else {
                rolesToActualSend = selectedRoles.map(role => `ROLE_${role}`);
            }
            
            await api.put(`/users/${managingUserRoles.id}/roles`, rolesToActualSend);
            
            setMensaje({ text: `Roles de ${managingUserRoles.username} actualizados correctamente.`, type: 'success' });
            fetchUsuarios();
            setManagingUserRoles(null);
            setSelectedRoles([]);
        } catch (err) {
            console.error('Error al guardar roles:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al guardar los roles.';
            setMensaje({ text: errorMsg, type: 'error' });
        }
    };

    const handleActivateUser = async (userId, username) => {
        if (window.confirm(`¿Estás seguro de activar la cuenta del usuario ${username}?`)) {
            setMensaje({ text: '', type: '' });
            try {
                await api.put(`/users/admin/users/${userId}/activate`);
                setMensaje({ text: `Cuenta de ${username} activada correctamente.`, type: 'success' });
                fetchUsuarios();
            } catch (err) {
                console.error('Error al activar usuario:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al activar la cuenta.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    const handleDeleteComplejo = async (id) => {
        if (window.confirm(`¿Estás seguro de eliminar el complejo con ID: ${id}? Esta acción es irreversible.`)) {
            setMensaje({ text: '', type: '' });
            try {
                await api.delete(`/complejos/${id}`);
                setMensaje({ text: 'Complejo eliminado correctamente.', type: 'success' });
                fetchComplejos();
                setEditingComplejo(null);
                setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
            } catch (err) {
                console.error('Error al eliminar el complejo:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
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
                {(isAdmin || isComplexOwner) && (
                    <button
                        className={`admin-tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reservas')}
                        disabled={isLoadingData}
                    >
                        Gestionar Reservas
                    </button>
                )}
                {isAdmin && (
                    <button
                        className={`admin-tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setActiveTab('usuarios')}
                        disabled={isLoadingData}
                    >
                        Gestionar Usuarios
                    </button>
                )}
                {(isAdmin || isComplexOwner) && (
                    <button
                        className={`admin-tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('estadisticas')}
                        disabled={isLoadingData}
                    >
                        Ver Estadísticas
                    </button>
                )}
            </div>

            {activeTab === 'complejos' && (
                <div className="admin-tab-content">
                    <h2>{editingComplejo ? `Editando Complejo: ${editingComplejo.nombre}` : 'Agregar Nuevo Complejo'}</h2>

                    {isAdmin && (
                        <p className="info-message">Como Administrador General, puedes crear y editar cualquier complejo. Puedes asignarlos a un propietario existente.</p>
                    )}
                    {isComplexOwner && !editingComplejo && (
                        <p className="info-message">Como Dueño de Complejo, puedes gestionar solo los complejos que te pertenecen. Selecciona un complejo de la lista para editarlo. Solo los Administradores Generales pueden crear nuevos complejos.</p>
                    )}

                    {(isAdmin || (isComplexOwner && editingComplejo)) ? (
                        <form className="admin-complejo-form" onSubmit={handleSaveComplejo}>
                            <h3>Datos Generales del Complejo</h3>
                            <div className="admin-form-group">
                                <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
                                <input type="text" id="nombre" name="nombre" value={nuevoComplejoAdmin.nombre} onChange={handleComplejoFormChange} required placeholder='Ej: El Alargue' />
                            </div>

                            {isAdmin && !editingComplejo && ( // Solo el ADMIN puede asignar propietario al crear
                                <div className="admin-form-group">
                                    <label htmlFor="emailPropietario">Email del Propietario (usuario existente): <span className="obligatorio">*</span></label>
                                    <input type="email" id="emailPropietario" name="emailPropietario" value={nuevoComplejoAdmin.emailPropietario} onChange={handleComplejoFormChange} required={!editingComplejo && isAdmin} placeholder='dueño@ejemplo.com' />
                                    <p className="small-info">El usuario con este email será asignado como propietario del complejo y se le otorgará el rol &quot;COMPLEX_OWNER&quot; si no lo tiene.</p>
                                </div>
                            )}
                            
                            {/* Campos para editar (siempre visibles en modo edición, y para crear si es ADMIN) */}
                            <div className="admin-form-group">
                                <label htmlFor="descripcion">Descripción:</label>
                                <textarea id="descripcion" name="descripcion" value={nuevoComplejoAdmin.descripcion} onChange={handleComplejoFormChange} rows={3} placeholder='Breve descripción del complejo...' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="ubicacion">Ubicación: <span className="obligatorio">*</span></label>
                                <input type="text" id="ubicacion" name="ubicacion" value={nuevoComplejoAdmin.ubicacion} onChange={handleComplejoFormChange} required placeholder='Ej: Calle Falsa 123, San Martín' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="telefono">Teléfono:</label>
                                <input type="tel" id="telefono" name="telefono" value={nuevoComplejoAdmin.telefono} onChange={handleComplejoFormChange} placeholder='Ej: +549261xxxxxxx' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="fotoUrl">URL de Foto Principal:</label>
                                <input type="url" id="fotoUrl" name="fotoUrl" value={nuevoComplejoAdmin.fotoUrl} onChange={handleComplejoFormChange} placeholder='https://ejemplo.com/foto_complejo.jpg' />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="horarioApertura">Horario Apertura: <span className="obligatorio">*</span></label>
                                <input type="time" id="horarioApertura" name="horarioApertura" value={nuevoComplejoAdmin.horarioApertura} onChange={handleComplejoFormChange} required />
                            </div>
                            <div className="admin-form-group">
                                <label htmlFor="horarioCierre">Horario Cierre: <span className="obligatorio">*</span></label>
                                <input type="time" id="horarioCierre" name="horarioCierre" value={nuevoComplejoAdmin.horarioCierre} onChange={handleComplejoFormChange} required />
                            </div>
                            
                            <h3>Detalles de Canchas</h3>
                            <div className="canchas-dinamicas-container">
                                {nuevoComplejoAdmin.canchas.map((cancha, index) => (
                                    <div key={index} className="cancha-item-form">
                                        <h4>Cancha #{index + 1}</h4>
                                        <div className="admin-form-group">
                                            <label htmlFor={`tipoCancha-${index}`}>Tipo de Cancha: <span className="obligatorio">*</span></label>
                                            <select
                                                id={`tipoCancha-${index}`}
                                                name="tipoCancha"
                                                value={cancha.tipoCancha}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                                required
                                            >
                                                <option value="">Selecciona un tipo</option>
                                                <option value="Fútbol 5">Fútbol 5</option>
                                                <option value="Fútbol 7">Fútbol 7</option>
                                                <option value="Fútbol 11">Fútbol 11</option>
                                                <option value="Pádel">Pádel</option>
                                                <option value="Tenis">Tenis</option>
                                                <option value="Básquet">Básquet</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-group">
                                            <label htmlFor={`cantidad-${index}`}>Cantidad de Canchas de este Tipo: <span className="obligatorio">*</span></label>
                                            <input
                                                type="number"
                                                id={`cantidad-${index}`}
                                                name="cantidad"
                                                value={cancha.cantidad}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                                required
                                                min="1"
                                                placeholder='Ej: 6'
                                            />
                                        </div>
                                        <div className="admin-form-group">
                                            <label htmlFor={`precioHora-${index}`}>Precio por Hora ($): <span className="obligatorio">*</span></label>
                                            <input
                                                type="number"
                                                id={`precioHora-${index}`}
                                                name="precioHora"
                                                value={cancha.precioHora}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                                required
                                                step="0.01"
                                                min="0"
                                                placeholder='Ej: 35000.00'
                                            />
                                        </div>
                                        <div className="admin-form-group">
                                            <label htmlFor={`superficie-${index}`}>Superficie: <span className="obligatorio">*</span></label>
                                            <select
                                                id={`superficie-${index}`}
                                                name="superficie"
                                                value={cancha.superficie}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                                required
                                            >
                                                <option value="">Selecciona una superficie</option>
                                                <option value="Césped Sintético">Césped Sintético</option>
                                                <option value="Polvo de Ladrillo">Polvo de Ladrillo</option>
                                                <option value="Cemento">Cemento</option>
                                                <option value="Parquet">Parquet</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-group checkbox">
                                            <input
                                                type="checkbox"
                                                id={`iluminacion-${index}`}
                                                name="iluminacion"
                                                checked={cancha.iluminacion}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                            />
                                            <label htmlFor={`iluminacion-${index}`}>Tiene Iluminación</label>
                                        </div>
                                        <div className="admin-form-group checkbox">
                                            <input
                                                type="checkbox"
                                                id={`techo-${index}`}
                                                name="techo"
                                                checked={cancha.techo}
                                                onChange={(e) => handleCanchaChange(index, e)}
                                            />
                                            <label htmlFor={`techo-${index}`}>Tiene Techo</label>
                                        </div>
                                        {nuevoComplejoAdmin.canchas.length > 1 && (
                                            <button type="button" className="admin-btn-delete remove-cancha-btn" onClick={() => handleRemoveCancha(index)}>
                                                Eliminar Cancha
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="admin-btn-add" onClick={handleAddCancha}>
                                Agregar Tipo de Cancha
                            </button>

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
                        isComplexOwner && !editingComplejo && (
                            <p className="info-message">Selecciona un complejo de la lista para gestionarlo. Solo los Administradores Generales pueden crear nuevos complejos.</p>
                        )
                    )}

                    <div className="admin-list-container">
                        <h3>{isAdmin ? 'Todos los Complejos' : 'Mis Complejos'}</h3>
                        {isLoadingData ? <p>Cargando complejos...</p> : (
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Propietario</th>
                                            <th>Ubicación</th>
                                            <th>Horario</th>
                                            <th>Canchas</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {complejos.length > 0 ? complejos.map(c => (
                                            <tr key={c.id}>
                                                <td data-label="ID">{c.id}</td>
                                                <td data-label="Nombre">{c.nombre}</td>
                                                <td data-label="Propietario">{c.propietario?.username || 'N/A'}</td> {/* Acceder al username del objeto propietario */}
                                                <td data-label="Ubicación">{c.ubicacion || 'N/A'}</td>
                                                <td data-label="Horario">{c.horarioApertura || 'N/A'} - {c.horarioCierre || 'N/A'}</td>
                                                <td data-label="Canchas">
                                                    {Object.keys(c.canchaCounts || {}).map(tipo => (
                                                        <span key={tipo} className="cancha-type-badge">
                                                            {c.canchaCounts[tipo]}x {tipo} (${c.canchaPrices[tipo]?.toLocaleString('es-AR') || 'N/A'})
                                                        </span>
                                                    ))}
                                                </td>
                                                <td data-label="Acciones">
                                                    <button className="admin-btn-edit" onClick={() => startEditingComplejo(c)}>Editar</button>
                                                    <button className="admin-btn-delete" onClick={() => handleDeleteComplejo(c.id)}>Eliminar</button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="7" className="admin-no-data">No hay complejos registrados.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'reservas' && (isAdmin || isComplexOwner) && ( // Ahora visible para COMPLEX_OWNER
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

            {activeTab === 'usuarios' && isAdmin && (
                <div className="admin-tab-content">
                    <h2>Gestionar Usuarios y Roles</h2>
                    {isLoadingData ? <p>Cargando usuarios...</p> : (
                        <div className="admin-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email (Username)</th>
                                        <th>Nombre Completo</th>
                                        <th>Roles</th>
                                        <th>Activo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.length > 0 ? usuarios.map(u => (
                                        <tr key={u.id}>
                                            <td data-label="ID">{u.id}</td>
                                            <td data-label="Email">{u.username}</td>
                                            <td data-label="Nombre">{u.nombreCompleto || 'N/A'}</td>
                                            <td data-label="Roles">
                                                {u.authorities && u.authorities.map(auth => auth.authority.replace('ROLE_', '')).join(', ')}
                                            </td>
                                            <td data-label="Activo">{u.enabled ? 'Sí' : 'No'}</td>
                                            <td data-label="Acciones">
                                                {u.username !== localStorage.getItem('username') ? (
                                                    <>
                                                        <button className="admin-btn-edit" onClick={() => startManagingUserRoles(u)}>
                                                            Gestionar Roles
                                                        </button>
                                                        {!u.enabled && ( // Botón para activar solo si el usuario no está activo
                                                            <button 
                                                                className="admin-btn-activate" 
                                                                onClick={() => handleActivateUser(u.id, u.username)}
                                                            >
                                                                Activar
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="info-text">Tu cuenta</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="admin-no-data">No hay usuarios registrados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {managingUserRoles && (
                        <div className="admin-user-role-form-modal">
                            <h3>Gestionar Roles para: {managingUserRoles.username}</h3>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        value="USER" 
                                        checked={selectedRoles.includes('USER')} 
                                        onChange={handleRoleChange} 
                                    />
                                    Usuario Estándar
                                </label>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        value="COMPLEX_OWNER" 
                                        checked={selectedRoles.includes('COMPLEX_OWNER')} 
                                        onChange={handleRoleChange} 
                                    />
                                    Dueño de Complejo
                                </label>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        value="ADMIN" 
                                        checked={selectedRoles.includes('ADMIN')} 
                                        onChange={handleRoleChange} 
                                    />
                                    Administrador General
                                </label>
                            </div>
                            <p className="small-info">Un usuario no puede tener los roles ADMIN y DUEÑO_COMPLEJO al mismo tiempo. Al seleccionar uno, el otro se desmarcará automáticamente.</p>

                            <div className="admin-form-buttons">
                                <button className="admin-btn-save" onClick={handleSaveUserRoles}>Guardar Roles</button>
                                <button className="admin-btn-cancel" onClick={cancelManagingUserRoles}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'estadisticas' && (isAdmin || isComplexOwner) && roleForStats && (
                <AdminEstadisticas userRole={roleForStats} />
            )}
        </div>
    );
}

export default AdminPanel;