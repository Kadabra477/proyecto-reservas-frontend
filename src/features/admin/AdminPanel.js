import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import AdminEstadisticas from './AdminEstadisticas';
import './AdminPanel.css'; // Asegúrate de tener los estilos actualizados

// Estado inicial para un formulario de COMPLEJO nuevo
const estadoInicialComplejoAdmin = {
    nombre: '',
    emailPropietario: '', // Cambiado de propietarioUsername a emailPropietario para ser consistente con el backend
    canchas: [{ tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false }] // Estado inicial para canchas dinámicas
};

function AdminPanel() {
    const [complejos, setComplejos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [activeTab, setActiveTab] = useState('complejos');
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [editingComplejo, setEditingComplejo] = useState(null);
    const [nuevoComplejoAdmin, setNuevoComplejoAdmin] = useState(estadoInicialComplejoAdmin);

    const [managingUserRoles, setManagingUserRoles] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const userRole = localStorage.getItem('userRole');

    // Mapea los datos de mapas de canchas del backend a un formato de array para el formulario
    const mapComplejoToFormCanchas = useCallback((complejo) => {
        const canchasArray = [];
        if (complejo.canchaCounts) {
            Object.keys(complejo.canchaCounts).forEach(tipoCancha => {
                canchasArray.push({
                    tipoCancha: tipoCancha,
                    cantidad: complejo.canchaCounts[tipoCancha] || 0,
                    precioHora: complejo.canchaPrices[tipoCancha] || 0,
                    superficie: complejo.canchaSurfaces[tipoCancha] || '',
                    iluminacion: complejo.canchaIluminacion[tipoCancha] || false,
                    techo: complejo.canchaTecho[tipoCancha] || false
                });
            });
        }
        return canchasArray;
    }, []);

    // Cuando se empieza a editar un complejo, inicializa el estado de las canchas para el formulario
    useEffect(() => {
        if (editingComplejo) {
            setNuevoComplejoAdmin({
                ...editingComplejo,
                emailPropietario: editingComplejo.propietario?.username || '', // Si el complejo ya tiene propietario, carga su email
                horarioApertura: editingComplejo.horarioApertura ? editingComplejo.horarioApertura.substring(0, 5) : '10:00',
                horarioCierre: editingComplejo.horarioCierre ? editingComplejo.horarioCierre.substring(0, 5) : '23:00',
                // Transforma los mapas de canchas del backend a un array para el formulario dinámico
                canchas: mapComplejoToFormCanchas(editingComplejo)
            });
        } else {
            setNuevoComplejoAdmin(estadoInicialComplejoAdmin); // Resetea si no hay edición
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

    const fetchUsuarios = useCallback(async () => {
        setIsLoadingData(true);
        setMensaje({ text: '', type: '' });
        try {
            if (userRole === 'ADMIN') {
                const res = await api.get('/users?enabled=true');
                setUsuarios(Array.isArray(res.data) ? res.data : []);
            } else {
                setUsuarios([]);
            }
        } catch (err) {
            console.error('Error al obtener usuarios:', err);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Error al cargar la lista de usuarios.';
            setMensaje({ text: errorMsg, type: 'error' });
        } finally {
            setIsLoadingData(false);
        }
    }, [userRole]);

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            setMensaje({ text: 'Acceso denegado. Necesitas iniciar sesión.', type: 'error' });
            return;
        }

        if (activeTab === 'complejos') {
            fetchComplejos();
        } else if (activeTab === 'reservas' && userRole === 'ADMIN') { // Solo ADMIN puede ver reservas
            fetchReservas();
        } else if (activeTab === 'usuarios' && userRole === 'ADMIN') {
            fetchUsuarios();
        }
    }, [activeTab, fetchComplejos, fetchReservas, fetchUsuarios, userRole]);


    // Manejo de cambios en el formulario de complejo (tanto para crear como para editar)
    const handleComplejoFormChange = (e) => {
        const { name, value } = e.target;
        setNuevoComplejoAdmin(prev => ({ ...prev, [name]: value }));
    };

    // Manejo de cambios en el formulario dinámico de canchas
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

    // Agregar nueva cancha al formulario
    const handleAddCancha = () => {
        setNuevoComplejoAdmin(prev => ({
            ...prev,
            canchas: [...prev.canchas, { tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false }]
        }));
    };

    // Eliminar cancha del formulario
    const handleRemoveCancha = (index) => {
        const newCanchas = nuevoComplejoAdmin.canchas.filter((_, i) => i !== index);
        setNuevoComplejoAdmin(prev => ({ ...prev, canchas: newCanchas }));
    };


    const handleSaveComplejo = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const { nombre, emailPropietario, canchas, descripcion, ubicacion, telefono, fotoUrl, horarioApertura, horarioCierre } = nuevoComplejoAdmin;

        // Validaciones generales
        if (!nombre?.trim()) {
            setMensaje({ text: 'El nombre del complejo es obligatorio.', type: 'error' });
            return;
        }

        if (userRole === 'ADMIN' && !editingComplejo && !emailPropietario?.trim()) {
            setMensaje({ text: 'El email del propietario es obligatorio para nuevos complejos (Administrador).', type: 'error' });
            return;
        }

        if (canchas.length === 0 || canchas.some(c => !c.tipoCancha?.trim() || isNaN(parseFloat(c.precioHora)) || parseFloat(c.precioHora) <= 0 || isNaN(parseInt(c.cantidad, 10)) || parseInt(c.cantidad, 10) <= 0 || !c.superficie?.trim())) {
            setMensaje({ text: 'Todas las canchas deben tener un tipo, cantidad, precio, y superficie válidos.', type: 'error' });
            return;
        }

        // Transformar el array de canchas de vuelta a mapas para el backend
        const canchaCounts = {};
        const canchaPrices = {};
        const canchaSurfaces = {};
        const canchaIluminacion = {};
        const canchaTecho = {};

        canchas.forEach(cancha => {
            if (cancha.tipoCancha.trim()) {
                canchaCounts[cancha.tipoCancha] = parseInt(cancha.cantidad, 10);
                canchaPrices[cancha.tipoCancha] = parseFloat(cancha.precioHora);
                canchaSurfaces[cancha.tipoCancha] = cancha.superficie;
                canchaIluminacion[cancha.tipoCancha] = cancha.iluminacion;
                canchaTecho[cancha.tipoCancha] = cancha.techo;
            }
        });

        const complejoData = {
            nombre,
            descripcion: descripcion || '',
            ubicacion: ubicacion || '',
            telefono: telefono || '',
            fotoUrl: fotoUrl || '',
            horarioApertura: horarioApertura || '10:00',
            horarioCierre: horarioCierre || '23:00',
            canchaCounts,
            canchaPrices,
            canchaSurfaces,
            canchaIluminacion,
            canchaTecho
        };

        if (editingComplejo) {
            // Actualizar complejo existente
            try {
                await api.put(`/complejos/${editingComplejo.id}`, complejoData);
                setMensaje({ text: 'Complejo actualizado correctamente.', type: 'success' });
                setEditingComplejo(null); // Sale del modo edición
                setNuevoComplejoAdmin(estadoInicialComplejoAdmin); // Resetea el formulario
                fetchComplejos();
            } catch (err) {
                console.error('Error al actualizar el complejo:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al actualizar el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        } else {
            // Crear nuevo complejo (solo ADMIN)
            const crearComplejoRequest = {
                nombre: nombre,
                propietarioUsername: emailPropietario, // Este campo es crucial para el ADMIN
                canchaCounts,
                canchaPrices,
                canchaSurfaces,
                canchaIluminacion,
                canchaTecho,
                // Otros campos del complejo como descripción, ubicación, etc., si los mandas desde el admin
                descripcion: descripcion || '',
                ubicacion: ubicacion || '',
                telefono: telefono || '',
                fotoUrl: fotoUrl || '',
                horarioApertura: horarioApertura || '10:00',
                horarioCierre: horarioCierre || '23:00',
            };

            try {
                await api.post('/complejos', crearComplejoRequest); // Tu endpoint para crear complejos
                setMensaje({ text: 'Complejo creado correctamente y asignado al propietario.', type: 'success' });
                setNuevoComplejoAdmin(estadoInicialComplejoAdmin); // Resetea el formulario
                fetchComplejos();
            } catch (err) {
                console.error('Error al crear complejo (Admin):', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Error al crear el complejo.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };
    
    const handleDeleteTipoCancha = async (tipo) => {
        // La línea 484 es la que empieza el 'if'
        // Asegúrate de que las comillas internas sean dobles si las de afuera son simples
        // O usa template literals ` ` para la string completa
        if (window.confirm(`¿Estás seguro de eliminar el tipo de cancha "${tipo}" del complejo "${editingComplejo.nombre}"? Esta acción es irreversible.`)) {
            setMensaje({ text: '', type: '' });
            if (!editingComplejo) return;

            const updatedComplejo = { ...editingComplejo };

            if (updatedComplejo.canchaCounts) delete updatedComplejo.canchaCounts[tipo];
            if (updatedComplejo.canchaPrices) delete updatedComplejo.canchaPrices[tipo];
            if (updatedComplejo.canchaSurfaces) delete updatedComplejo.canchaSurfaces[tipo];
            if (updatedComplejo.canchaIluminacion) delete updatedComplejo.canchaIluminacion[tipo];
            if (updatedComplejo.canchaTecho) delete updatedComplejo.canchaTecho[tipo];

            try {
                await api.put(`/complejos/${updatedComplejo.id}`, updatedComplejo);
                setMensaje({ text: `Tipo de cancha "${tipo}" eliminado correctamente.`, type: 'success' }); // También podría estar aquí
                fetchComplejos();
                setEditingComplejo(updatedComplejo);
                // ... (resto del código) ...
            } catch (err) {
                console.error('Error al eliminar el tipo de cancha:', err);
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar el tipo de cancha.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
        }
    };

    const startEditingComplejo = (complejoParaEditar) => {
        setEditingComplejo(complejoParaEditar);
        // El useEffect se encargará de inicializar `nuevoComplejoAdmin`
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
            if (checked) {
                return [...prevRoles, value];
            } else {
                return prevRoles.filter(role => role !== value);
            }
        });
    };

    const handleSaveUserRoles = async () => {
        setMensaje({ text: '', type: '' });
        if (!managingUserRoles) return;

        try {
            const rolesToSend = selectedRoles.map(role => `ROLE_${role}`);
            await api.put(`/users/${managingUserRoles.id}/roles`, rolesToSend);
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

    // Función para obtener la lista de tipos de cancha existentes del complejo (para mostrar en la tabla)
    const getCanchaTypesFromComplejo = (complejo) => {
        if (!complejo || !complejo.canchaCounts) return [];
        return Object.keys(complejo.canchaCounts);
    };

    const handleDeleteComplejo = async (id) => {
        if (window.confirm(`¿Estás seguro de eliminar el complejo con ID: ${id}? Esta acción es irreversible.`)) {
            setMensaje({ text: '', type: '' });
            try {
                await api.delete(`/complejos/${id}`);
                setMensaje({ text: 'Complejo eliminado correctamente.', type: 'success' });
                fetchComplejos();
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
                {/* La pestaña "Gestionar Reservas" ahora solo se muestra para ADMIN */}
                {userRole === 'ADMIN' && (
                    <button
                        className={`admin-tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reservas')}
                        disabled={isLoadingData}
                    >
                        Gestionar Reservas
                    </button>
                )}
                {userRole === 'ADMIN' && (
                    <button
                        className={`admin-tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setActiveTab('usuarios')}
                        disabled={isLoadingData}
                    >
                        Gestionar Usuarios
                    </button>
                )}
                <button
                    className={`admin-tab-button ${activeTab === 'estadisticas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('estadisticas')}
                    disabled={isLoadingData}
                >
                    Ver Estadísticas
                </button>
            </div>

            {activeTab === 'complejos' && (
                <div className="admin-tab-content">
                    <h2>{editingComplejo ? `Editando Complejo: ${editingComplejo.nombre}` : 'Agregar Nuevo Complejo'}</h2>

                    {userRole === 'ADMIN' && (
                        <p className="info-message">Como Administrador General, puedes crear y editar cualquier complejo. Los complejos creados por ti también te pertenecerán por defecto, pero puedes asignarlos a otro propietario al crearlos.</p>
                    )}
                    {userRole === 'COMPLEX_OWNER' && (
                        <p className="info-message">Como Dueño de Complejo, puedes gestionar solo los complejos que te pertenecen. Selecciona un complejo de la lista para editarlo. Solo los Administradores Generales pueden crear nuevos complejos.</p>
                    )}

                    {userRole === 'ADMIN' || (userRole === 'COMPLEX_OWNER' && editingComplejo) ? (
                        <form className="admin-complejo-form" onSubmit={handleSaveComplejo}>
                            <h3>Datos Generales del Complejo</h3>
                            <div className="admin-form-group">
                                <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
                                <input type="text" id="nombre" name="nombre" value={nuevoComplejoAdmin.nombre || ''} onChange={handleComplejoFormChange} required placeholder='Ej: El Alargue' />
                            </div>

                            {userRole === 'ADMIN' && !editingComplejo && ( // Solo el ADMIN puede especificar el email del propietario al crear
                                <div className="admin-form-group">
                                    <label htmlFor="emailPropietario">Email del Propietario (usuario existente): <span className="obligatorio">*</span></label>
                                    <input type="email" id="emailPropietario" name="emailPropietario" value={nuevoComplejoAdmin.emailPropietario || ''} onChange={handleComplejoFormChange} required placeholder='dueño@ejemplo.com' />
                                    <p className="small-info">El usuario con este email será asignado como propietario del complejo y se le otorgará el rol "COMPLEX_OWNER" si no lo tiene.</p>
                                </div>
                            )}

                            {editingComplejo && ( // Solo si estamos editando, se muestran estos campos
                                <>
                                    <div className="admin-form-group">
                                        <label htmlFor="descripcion">Descripción:</label>
                                        <textarea id="descripcion" name="descripcion" value={nuevoComplejoAdmin.descripcion || ''} onChange={handleComplejoFormChange} rows={3} placeholder='Breve descripción del complejo...' />
                                    </div>
                                    <div className="admin-form-group">
                                        <label htmlFor="ubicacion">Ubicación: <span className="obligatorio">*</span></label>
                                        <input type="text" id="ubicacion" name="ubicacion" value={nuevoComplejoAdmin.ubicacion || ''} onChange={handleComplejoFormChange} required placeholder='Ej: Calle Falsa 123, San Martín' />
                                    </div>
                                    <div className="admin-form-group">
                                        <label htmlFor="telefono">Teléfono:</label>
                                        <input type="tel" id="telefono" name="telefono" value={nuevoComplejoAdmin.telefono || ''} onChange={handleComplejoFormChange} placeholder='Ej: +549261xxxxxxx' />
                                    </div>
                                    <div className="admin-form-group">
                                        <label htmlFor="fotoUrl">URL de Foto Principal:</label>
                                        <input type="url" id="fotoUrl" name="fotoUrl" value={nuevoComplejoAdmin.fotoUrl || ''} onChange={handleComplejoFormChange} placeholder='https://ejemplo.com/foto_complejo.jpg' />
                                    </div>
                                    <div className="admin-form-group">
                                        <label htmlFor="horarioApertura">Horario Apertura: <span className="obligatorio">*</span></label>
                                        <input type="time" id="horarioApertura" name="horarioApertura" value={nuevoComplejoAdmin.horarioApertura || ''} onChange={handleComplejoFormChange} required />
                                    </div>
                                    <div className="admin-form-group">
                                        <label htmlFor="horarioCierre">Horario Cierre: <span className="obligatorio">*</span></label>
                                        <input type="time" id="horarioCierre" name="horarioCierre" value={nuevoComplejoAdmin.horarioCierre || ''} onChange={handleComplejoFormChange} required />
                                    </div>
                                </>
                            )}

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
                        userRole === 'COMPLEX_OWNER' && !editingComplejo && (
                            <p className="info-message">Selecciona un complejo de la lista para gestionarlo. Solo los Administradores Generales pueden crear nuevos complejos.</p>
                        )
                    )}

                    <div className="admin-list-container">
                        <h3>{userRole === 'ADMIN' ? 'Todos los Complejos' : 'Mis Complejos'}</h3>
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
                                                <td data-label="Propietario">{c.propietario?.username || 'N/A'}</td>
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

            {activeTab === 'reservas' && userRole === 'ADMIN' && ( // Solo ADMIN puede ver esta sección
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

            {activeTab === 'usuarios' && userRole === 'ADMIN' && (
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
                                                    <button className="admin-btn-edit" onClick={() => startManagingUserRoles(u)}>
                                                        Gestionar Roles
                                                    </button>
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
                                    <input type="checkbox" value="USER" checked={selectedRoles.includes('USER')} onChange={handleRoleChange} />
                                    Usuario Estándar
                                </label>
                                <label>
                                    <input type="checkbox" value="COMPLEX_OWNER" checked={selectedRoles.includes('COMPLEX_OWNER')} onChange={handleRoleChange} />
                                    Dueño de Complejo
                                </label>
                                <label>
                                    <input type="checkbox" value="ADMIN" checked={selectedRoles.includes('ADMIN')} onChange={handleRoleChange} disabled={true} />
                                    Administrador General (gestión manual)
                                </label>
                            </div>
                            <div className="admin-form-buttons">
                                <button className="admin-btn-save" onClick={handleSaveUserRoles}>Guardar Roles</button>
                                <button className="admin-btn-cancel" onClick={cancelManagingUserRoles}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'estadisticas' && (
                <AdminEstadisticas userRole={userRole} />
            )}
        </div>
    );
}

export default AdminPanel;