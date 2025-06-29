// frontend/src/features/admin/AdminPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import AdminEstadisticas from './AdminEstadisticas';
import ComplejoForm from './ComplejoForm'; 
import ConfirmationModal from '../../components/Common/ConfirmationModal/ConfirmationModal'; 
import './AdminPanel.css'; 

// Estado inicial para un formulario de COMPLEJO nuevo
const estadoInicialComplejoAdmin = {
    id: null,
    nombre: '',
    descripcion: '',
    ubicacion: '',
    telefono: '',
    fotoUrl: '', // Mantenemos fotoUrl para mostrar la imagen existente si estamos editando
    horarioApertura: '10:00',
    horarioCierre: '23:00',
    emailPropietario: '', 
    canchas: [{ tipoCancha: '', cantidad: '', precioHora: '', superficie: '', iluminacion: false, techo: false }]
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

    // ¡NUEVO ESTADO! Para el archivo de la foto seleccionado por el usuario
    const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);

    const [managingUserRoles, setManagingUserRoles] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
    });

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

    // Este useEffect ahora solo configura el estado nuevoComplejoAdmin
    // El estado selectedPhotoFile es gestionado por ComplejoForm y sus handlers
    useEffect(() => {
        if (editingComplejo && editingComplejo.id) {
            setNuevoComplejoAdmin({
                id: editingComplejo.id,
                nombre: editingComplejo.nombre || '',
                descripcion: editingComplejo.descripcion || '',
                ubicacion: editingComplejo.ubicacion || '',
                telefono: editingComplejo.telefono || '',
                fotoUrl: editingComplejo.fotoUrl || '', // Mantener la fotoUrl existente para visualización
                horarioApertura: editingComplejo.horarioApertura || '10:00',
                horarioCierre: editingComplejo.horarioCierre || '23:00',
                emailPropietario: editingComplejo.propietario?.username || '', 
                canchas: mapComplejoToFormCanchas(editingComplejo)
            });
            // NOTA: selectedPhotoFile se resetea a null en ComplejoForm a través de su useEffect
        } else {
            setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
            // NOTA: selectedPhotoFile se resetea a null en ComplejoForm a través de su useEffect
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
            const endpoint = isAdmin ? '/reservas/admin/todas' : '/reservas/complejo/mis-reservas'; 
            const res = await api.get(endpoint);
            setReservas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error al obtener reservas:', err);
            if (err.response?.status === 404) {
                setReservas([]);
                setMensaje({ text: 'No hay reservas registradas para mostrar.', type: 'info' });
            } else {
                const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al cargar la lista de reservas.';
                setMensaje({ text: errorMsg, type: 'error' });
            }
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
                setUsuarios([]);
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

        setEditingComplejo(null); 
        setManagingUserRoles(null);

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

    // ¡handleSaveComplejo ahora recibe el archivo de la foto desde el formulario!
    const handleSaveComplejo = async (e, photoFile) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const { id, nombre, emailPropietario, canchas, descripcion, ubicacion, telefono, horarioApertura, horarioCierre } = nuevoComplejoAdmin;
        let { fotoUrl } = nuevoComplejoAdmin; // Obtenemos fotoUrl del estado para determinar si se eliminó

        // Validaciones básicas que aún se hacen aquí
        if (!nombre?.trim()) { setMensaje({ text: 'El nombre del complejo es obligatorio.', type: 'error' }); return; }
        if (!ubicacion?.trim()) { setMensaje({ text: 'La ubicación del complejo es obligatoria.', type: 'error' }); return; }
        if (!horarioApertura || !horarioCierre) { setMensaje({ text: 'Los horarios de apertura y cierre son obligatorios.', type: 'error' }); return; }
        if (!id && isAdmin && !emailPropietario?.trim()) { setMensaje({ text: 'El email del propietario es obligatorio para nuevos complejos (Administrador).', type: 'error' }); return; }

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

        // ¡PREPARAR FormData para enviar archivos y JSON!
        const formData = new FormData();

        // 1. Añadir el archivo de foto si fue seleccionado
        if (photoFile) {
            formData.append('photo', photoFile); // 'photo' debe coincidir con el @RequestPart("photo") del backend
        } else if (editingComplejo?.id && fotoUrl === '') {
            // 2. Si estamos editando Y no hay archivo nuevo Y la fotoUrl del estado se vació (indicando que se quiere eliminar la existente)
            // Se envía un Blob vacío con el nombre 'photo' para indicar al backend que se debe eliminar la foto.
            // Si el backend espera 'photo' como required=false, un Blob vacío es la forma de indicar "quitar foto".
            // Nota: En el backend se manejará si fotoUrl es null/vacío y photoFile es nulo/vacío para mantener la foto existente.
            formData.append('photo', new Blob(), 'empty-photo'); // 'empty-photo' es el nombre del archivo vacío
        }


        // 3. Construir el objeto JSON con los datos del complejo (sin fotoUrl aquí)
        const complejoData = {
            id,
            nombre,
            descripcion: descripcion || null,
            ubicacion,
            telefono: telefono || null,
            horarioApertura,
            horarioCierre,
            canchaCounts,
            canchaPrices,
            canchaSurfaces,
            canchaIluminacion,
            canchaTecho,
            // Si estamos editando y la fotoUrl del estado es '' (porque se hizo clic en "Eliminar Foto"),
            // enviamos fotoUrl: '' para que el backend sepa que debe eliminarla.
            ...(editingComplejo?.id && fotoUrl === '' && { fotoUrl: '' }) 
        };

        // Si es un nuevo complejo y es ADMIN, añadir el emailPropietario al objeto JSON
        if (!id && isAdmin && emailPropietario) {
            complejoData.propietarioUsername = emailPropietario;
        }

        // 4. Añadir el JSON del complejo como un Blob a FormData
        formData.append('complejo', new Blob([JSON.stringify(complejoData)], { type: 'application/json' })); // 'complejo' debe coincidir con el @RequestPart("complejo") del backend

        try {
            let response;
            if (editingComplejo?.id) { 
                response = await api.put(`/complejos/${id}`, formData, {
                    headers: {
                        // Axios suele inferir 'Content-Type': 'multipart/form-data' al enviar FormData,
                        // pero explicitarlo no está de más. NO DEBES PONER EL BOUNDARY.
                        // 'Content-Type': 'multipart/form-data' 
                    },
                });
                setMensaje({ text: 'Complejo actualizado correctamente.', type: 'success' });
            } else { 
                response = await api.post('/complejos', formData, {
                    headers: {
                        // 'Content-Type': 'multipart/form-data'
                    },
                });
                setMensaje({ text: 'Complejo creado correctamente y asignado al propietario.', type: 'success' });
            }
            
            // Si la operación fue exitosa, limpiar estados y recargar datos
            setEditingComplejo(null);
            setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
            setSelectedPhotoFile(null); // Limpiar el archivo seleccionado del input
            fetchComplejos(); // Recargar la lista de complejos

        } catch (err) {
            console.error('Error al guardar complejo (Frontend):', err);
            const errorMsg = err.response?.data?.message || err.message || 'Ocurrió un error al guardar el complejo.';
            setMensaje({ text: errorMsg, type: 'error' });
        }
    };
    
    const startEditingComplejo = (complejoParaEditar) => {
        setEditingComplejo(complejoParaEditar);
        // La inicialización de nuevoComplejoAdmin y selectedPhotoFile se maneja en useEffect
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditingComplejo = () => {
        setEditingComplejo(null);
        setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
        setSelectedPhotoFile(null); // Asegurarse de limpiar el archivo seleccionado
        document.getElementById('photoFile').value = ''; // Limpiar el input file visualmente
    };

    const handleConfirmReserva = (id) => {
        setModalConfig({
            title: 'Confirmar Reserva',
            message: `¿Estás seguro de que quieres confirmar la reserva con ID: ${id}?`,
            onConfirm: async () => {
                setMensaje({ text: '', type: '' });
                try {
                    await api.put(`/reservas/${id}/confirmar`);
                    setMensaje({ text: 'Reserva confirmada correctamente.', type: 'success' });
                    fetchReservas();
                } catch (err) {
                    console.error('Error al confirmar la reserva:', err);
                    const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al confirmar la reserva.';
                    setMensaje({ text: errorMsg, type: 'error' });
                } finally {
                    setIsModalOpen(false);
                }
            },
            confirmButtonText: 'Sí, Confirmar',
            cancelButtonText: 'No, Cancelar',
            type: 'success'
        });
        setIsModalOpen(true);
    };

    const handleDeleteReserva = (id) => {
        setModalConfig({
            title: 'Eliminar Reserva',
            message: `¿Estás seguro de que quieres eliminar la reserva con ID: ${id}? Esta acción es irreversible.`,
            onConfirm: async () => {
                setMensaje({ text: '', type: '' });
                try {
                    await api.delete(`/reservas/${id}`);
                    setMensaje({ text: 'Reserva eliminada correctamente.', type: 'success' });
                    fetchReservas();
                } catch (err) {
                    console.error('Error al eliminar la reserva:', err);
                    const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar la reserva.';
                    setMensaje({ text: errorMsg, type: 'error' });
                } finally {
                    setIsModalOpen(false);
                }
            },
            confirmButtonText: 'Sí, Eliminar',
            cancelButtonText: 'No, Cancelar',
            type: 'danger'
        });
        setIsModalOpen(true);
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
                return ['ADMIN', 'USER']; 
            } else if (value === 'COMPLEX_OWNER' && checked) {
                return ['COMPLEX_OWNER', 'USER']; 
            } else if (value === 'USER') {
                if (checked) {
                    return [...new Set([...prevRoles, 'USER'])];
                } else {
                    if (prevRoles.includes('ADMIN') || prevRoles.includes('COMPLEX_OWNER')) {
                        return prevRoles.filter(role => role !== 'USER'); 
                    }
                    return prevRoles.filter(role => role !== 'USER');
                }
            } else { 
                return checked ? [...prevRoles, value] : prevRoles.filter(role => role !== value);
            }
        }).filter(Boolean);
    };

    const handleSaveUserRoles = async () => {
        setMensaje({ text: '', type: '' });
        if (!managingUserRoles) return;

        setModalConfig({
            title: 'Confirmar Cambio de Roles',
            message: `¿Estás seguro de que quieres actualizar los roles de ${managingUserRoles.username}?`,
            onConfirm: async () => {
                try {
                    let rolesToActualSend = [];
                    if (selectedRoles.includes('ADMIN')) {
                        rolesToActualSend = ['ROLE_ADMIN', 'ROLE_USER'];
                    } 
                    else if (selectedRoles.includes('COMPLEX_OWNER')) {
                        rolesToActualSend = ['ROLE_COMPLEX_OWNER', 'ROLE_USER'];
                    } 
                    else if (selectedRoles.includes('USER') || selectedRoles.length === 0) {
                        rolesToActualSend = ['ROLE_USER'];
                    }
                    rolesToActualSend = [...new Set(rolesToActualSend)];
                    
                    await api.put(`/users/${managingUserRoles.id}/roles`, rolesToActualSend);
                    
                    setMensaje({ text: `Roles de ${managingUserRoles.username} actualizados correctamente.`, type: 'success' });
                    fetchUsuarios();
                    setManagingUserRoles(null);
                    setSelectedRoles([]);
                } catch (err) {
                    console.error('Error al guardar roles:', err);
                    const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al guardar los roles.';
                    setMensaje({ text: errorMsg, type: 'error' });
                } finally {
                    setIsModalOpen(false);
                }
            },
            confirmButtonText: 'Sí, Guardar',
            cancelButtonText: 'No, Cancelar',
            type: 'info'
        });
        setIsModalOpen(true);
    };

    const handleActivateUser = (userId, username) => {
        setModalConfig({
            title: 'Activar Cuenta de Usuario',
            message: `¿Estás seguro de que quieres activar la cuenta del usuario ${username}?`,
            onConfirm: async () => {
                setMensaje({ text: '', type: '' });
                try {
                    await api.put(`/users/admin/users/${userId}/activate`);
                    setMensaje({ text: `Cuenta de ${username} activada correctamente.`, type: 'success' });
                    fetchUsuarios();
                } catch (err) {
                    console.error('Error al activar usuario:', err);
                    const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al activar la cuenta.';
                    setMensaje({ text: errorMsg, type: 'error' });
                } finally {
                    setIsModalOpen(false);
                }
            },
            confirmButtonText: 'Sí, Activar',
            cancelButtonText: 'No, Cancelar',
            type: 'success'
        });
        setIsModalOpen(true);
    };

    const handleDeleteComplejo = (id) => {
        setModalConfig({
            title: 'Eliminar Complejo',
            message: `¿Estás seguro de que quieres eliminar el complejo con ID: ${id}? Esta acción es irreversible y eliminará todas las canchas y reservas asociadas.`,
            onConfirm: async () => {
                setMensaje({ text: '', type: '' });
                try {
                    await api.delete(`/complejos/${id}`);
                    setMensaje({ text: 'Complejo eliminado correctamente.', type: 'success' });
                    fetchComplejos();
                    setEditingComplejo(null);
                    setNuevoComplejoAdmin(estadoInicialComplejoAdmin);
                    setSelectedPhotoFile(null); // Asegurarse de limpiar el archivo seleccionado
                } catch (err) {
                    console.error('Error al eliminar el complejo:', err);
                    const errorMsg = err.response?.data?.message || err.response?.data || 'Ocurrió un error al eliminar el complejo.';
                    setMensaje({ text: errorMsg, type: 'error' });
                } finally {
                    setIsModalOpen(false);
                }
            },
            confirmButtonText: 'Sí, Eliminar',
            cancelButtonText: 'No, Cancelar',
            type: 'danger'
        });
        setIsModalOpen(true);
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
                {isComplexOwner && (
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
                {isComplexOwner && ( 
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
                    <h2>{editingComplejo?.id ? `Editando Complejo: ${editingComplejo.nombre}` : 'Agregar Nuevo Complejo'}</h2>

                    {isAdmin && !editingComplejo?.id && ( 
                        <p className="info-message">Como **Administrador General**, puedes crear y editar cualquier complejo. Puedes asignarlos a un propietario existente.</p>
                    )}
                    {isComplexOwner && !editingComplejo?.id && complejos.length > 0 && ( 
                        <p className="info-message">Selecciona un complejo de la lista para gestionarlo. Para crear nuevos complejos, contacta a un Administrador.</p>
                    )}
                    {isComplexOwner && !editingComplejo?.id && complejos.length === 0 && ( 
                        <p className="info-message">No tienes complejos registrados. Contacta a un administrador para agregar el tuyo.</p>
                    )}

                    {(isAdmin || (isComplexOwner && editingComplejo?.id)) && ( 
                        <ComplejoForm
                            nuevoComplejoAdmin={nuevoComplejoAdmin}
                            handleComplejoFormChange={handleComplejoFormChange}
                            handleCanchaChange={handleCanchaChange}
                            handleAddCancha={handleAddCancha}
                            handleRemoveCancha={handleRemoveCancha}
                            handleSaveComplejo={handleSaveComplejo} 
                            editingComplejo={editingComplejo}
                            cancelEditingComplejo={cancelEditingComplejo}
                            isAdmin={isAdmin}
                            // Pasamos el estado de la foto y su setter
                            selectedPhotoFile={selectedPhotoFile} 
                            setSelectedPhotoFile={setSelectedPhotoFile} 
                            setMensaje={setMensaje} // Pasamos setMensaje para errores específicos de foto
                        />
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

            {activeTab === 'reservas' && (isAdmin || isComplexOwner) && (
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
                                                        {!u.enabled && (
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

            <ConfirmationModal 
                isOpen={isModalOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setIsModalOpen(false)}
                confirmButtonText={modalConfig.confirmButtonText}
                cancelButtonText={modalConfig.cancelButtonText}
                type={modalConfig.type}
            />
        </div>
    );
}

export default AdminPanel;