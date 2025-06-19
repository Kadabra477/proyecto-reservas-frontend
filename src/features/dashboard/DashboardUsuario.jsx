// frontend/src/features/dashboard/DashboardUsuario.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Asegúrate de que esta ruta sea correcta
import './DashboardUsuario.css'; // Asegúrate de que esta ruta sea correcta

function DashboardUsuario() {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [edad, setEdad] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [bio, setBio] = useState('');
    // <-- ELIMINAR: Estado para el teléfono -->
    // const [telefono, setTelefono] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [misReservas, setMisReservas] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [modalReserva, setModalReserva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para recargar las reservas, útil después de una acción de pago o confirmación
    const recargarReservas = async () => {
        setLoading(true);
        setError(null);
        try {
            const reservasRes = await api.get('/reservas/usuario');
            setMisReservas(Array.isArray(reservasRes.data) ? reservasRes.data : []);
        } catch (err) {
            console.error("Error al recargar reservas:", err);
            if (!(err.response && err.response.status === 401)) {
                setError("No se pudieron recargar las reservas. Intenta de nuevo.");
            }
            setMisReservas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchUserDataAndReservas = async () => {
            setLoading(true);
            setError(null);

            try {
                const userProfileRes = await api.get('/users/me');
                if (isMounted) {
                    const userData = userProfileRes.data;
                    setNombreCompleto(userData.nombreCompleto || '');
                    setEmail(userData.email || '');
                    setEdad(userData.edad || '');
                    setUbicacion(userData.ubicacion || '');
                    setBio(userData.bio || '');
                    // <-- ELIMINAR: Setear el teléfono -->
                    // setTelefono(userData.telefono || '');
                    setProfilePictureUrl(userData.profilePictureUrl || `${process.env.PUBLIC_URL}/imagenes/avatar-default.png`);
                }

                const reservasRes = await api.get('/reservas/usuario');
                if (isMounted) {
                    setMisReservas(Array.isArray(reservasRes.data) ? reservasRes.data : []);
                }

            } catch (err) {
                console.error("Error al cargar datos del dashboard:", err);
                if (isMounted) {
                    if (!(err.response && err.response.status === 401)) {
                        setError("No se pudieron cargar los datos del perfil o las reservas. Intenta recargar la página.");
                    }
                    setMisReservas([]);
                    setNombreCompleto('');
                    setEmail('');
                    setEdad('');
                    setUbicacion('');
                    setBio('');
                    // <-- ELIMINAR: Resetear también el teléfono en caso de error -->
                    // setTelefono('');
                    setProfilePictureUrl(`${process.env.PUBLIC_URL}/imagenes/avatar-default.png`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUserDataAndReservas();

        return () => {
            isMounted = false;
        };

    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePictureUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError(null);

        if (!nombreCompleto.trim()) {
            setError("El Nombre Completo es un campo obligatorio.");
            setLoading(false);
            return;
        }
        // <-- ELIMINAR: Opcional: Validar teléfono si es obligatorio -->
        // if (!telefono.trim() || !/^\d+$/.test(telefono.trim())) {
        //     setError("El teléfono es obligatorio y debe contener solo números.");
        //     setLoading(false);
        //     return;
        // }

        try {
            const profileData = {
                nombreCompleto,
                edad: edad === '' ? null : Number(edad),
                ubicacion,
                bio,
                // <-- ELIMINAR: Incluir el teléfono en los datos a enviar -->
                // telefono
            };

            const updateProfileRes = await api.put('/users/me', profileData);
            console.log('Perfil actualizado:', updateProfileRes.data);

            if (profileImageFile) {
                const formData = new FormData();
                formData.append('file', profileImageFile);

                const uploadImageRes = await api.post('/users/me/profile-picture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log('Imagen de perfil actualizada:', uploadImageRes.data);
                setProfilePictureUrl(uploadImageRes.data.profilePictureUrl);
                setProfileImageFile(null);
            }

            setIsEditing(false);
            alert('¡Perfil actualizado exitosamente!');
        } catch (err) {
            console.error("Error al guardar cambios en el perfil:", err);
            setError("Error al guardar los cambios. Intenta de nuevo.");
            if (err.response && err.response.data && err.response.data.message) {
                alert(`Error: ${err.response.data.message}`);
            } else {
                alert("Hubo un problema al guardar el perfil.");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatLocalDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Fecha no disponible';
        try {
            const date = new Date(dateTimeString);
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
            return date.toLocaleString('es-AR', options);
        } catch (e) {
            console.error("Error formateando fecha:", dateTimeString, e);
            return dateTimeString;
        }
    };

    const handleOpenModal = (reserva) => { setModalReserva(reserva); };
    const handleCloseModal = () => { setModalReserva(null); };

    // Manejador para descargar el PDF
    const handleDescargarPdf = async (reservaId) => {
        try {
            const response = await api.get(`/reservas/${reservaId}/pdf-comprobante`, {
                responseType: 'blob'
            });

            if (response.data.type === 'application/pdf') {
                const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', `comprobante_reserva_${reservaId}.pdf`);
                document.body.appendChild(fileLink);
                fileLink.click();
                fileLink.remove();
                window.URL.revokeObjectURL(fileURL);

                setModalReserva(null);
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    console.error("Respuesta inesperada del servidor al descargar PDF:", reader.result);
                    alert("Error: El servidor no envió un PDF válido. Por favor, revisa los logs del backend.");
                };
                reader.readAsText(response.data);
            }

        } catch (error) {
            console.error("Error al descargar el PDF:", error.response || error);
            let errorMessage = "No se pudo descargar el comprobante. Intenta de nuevo más tarde.";
            if (error.response && error.response.data) {
                if (error.response.data instanceof Blob) {
                    const errorReader = new FileReader();
                    errorReader.onload = (e) => {
                        try {
                            const errorJson = JSON.parse(e.target.result);
                            errorMessage = errorJson.message || errorJson.error || errorMessage;
                            alert(`Error al descargar el comprobante: ${errorMessage}`);
                        } catch (parseError) {
                            alert(`Error al descargar el comprobante: ${e.target.result || errorMessage}`);
                        }
                    };
                    errorReader.readAsText(error.response.data);
                    return;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            alert(errorMessage);
        }
    };

    const formatReservaEstado = (estado) => {
        if (!estado) return 'Desconocido';
        estado = estado.toLowerCase();
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'confirmada': return 'Confirmada';
            case 'confirmada_efectivo': return 'Confirmada (Efectivo)';
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


    if (loading) {
        return (
            <div className="dashboard-container">
                <p>Cargando datos del perfil y reservas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="perfil-container">
                <div className="perfil-portada">
                    <img src={`${process.env.PUBLIC_URL}/imagenes/portada-default.jpg`} alt="Portada" className="portada-img" />
                </div>
                <div className="perfil-info-box">
                    <label htmlFor="avatar-upload" className="avatar-label">
                        <img src={profilePictureUrl || `${process.env.PUBLIC_URL}/imagenes/avatar-default.png`} alt="Avatar" className="perfil-avatar editable" title="Cambiar avatar" />
                        {isEditing && (
                            <span className="change-avatar-icon">
                                <i className="fas fa-camera"></i>
                            </span>
                        )}
                    </label>
                    {isEditing && (
                        <input
                            type="file"
                            id="avatar-upload"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    )}

                    {isEditing ? (
                        <div className="perfil-edicion">
                            <input
                                value={nombreCompleto}
                                onChange={(e) => setNombreCompleto(e.target.value)}
                                className="perfil-input"
                                placeholder="Nombre Completo"
                                required
                            />
                            <input
                                value={edad}
                                onChange={(e) => setEdad(e.target.value)}
                                className="perfil-input"
                                placeholder="Edad"
                                type="number"
                            />
                            <input
                                value={ubicacion}
                                onChange={(e) => setUbicacion(e.target.value)}
                                className="perfil-input"
                                placeholder="Ubicación"
                            />
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="perfil-textarea"
                                placeholder="Cuéntanos algo sobre ti..."
                                rows="3"
                            ></textarea>
                            {/* <-- ELIMINAR: Campo de teléfono en edición --> */}
                            {/*
                            <input
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className="perfil-input"
                                placeholder="Teléfono"
                                type="tel"
                                required
                            />
                            */}
                            <p className="perfil-dato-editable"><strong>Email:</strong> {email}</p>

                            <div className="perfil-acciones">
                                <button onClick={handleSaveChanges} className="btn btn-primary btn-guardar">Guardar Cambios</button>
                                <button onClick={() => {
                                    setIsEditing(false);
                                }} className="btn btn-secondary btn-cancelar">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="perfil-vista">
                            <h2 className="perfil-nombre">{nombreCompleto || '¡Completa tu Perfil!'}</h2>
                            <p className="perfil-dato"><strong>Edad:</strong> {edad ? `${edad} años` : 'No especificado'}</p>
                            <p className="perfil-dato"><strong>Ubicación:</strong> {ubicacion || 'No especificada'}</p>
                            <p className="perfil-dato"><strong>Email:</strong> {email || 'N/A'}</p>
                            <p className="perfil-dato"><strong>Teléfono:</strong> {telefono || 'No especificado'}</p> {/* Mostrar teléfono */}
                            <p><strong>Bio:</strong> {bio || 'No especificado'}</p>
                            <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary btn-editar">Editar Perfil</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-card mis-reservas-card">
                <h2>Mis Reservas</h2>
                {misReservas.length > 0 ? (
                    <ul className="lista-reservas">
                        {misReservas.map((reserva) => (
                            <li key={reserva.id} className="reserva-item" onClick={() => handleOpenModal(reserva)} title="Ver detalle">
                                <p><strong>Complejo:</strong> {reserva.complejoNombre || 'N/A'}</p>
                                <p><strong>Tipo de Cancha:</strong> {reserva.tipoCanchaReservada || 'N/A'}</p>
                                <p><strong>Cancha Asignada:</strong> {reserva.nombreCanchaAsignada || 'N/A'}</p>
                                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                                <p><strong>Estado:</strong> {formatReservaEstado(reserva.estado)}</p>
                                <p><strong>Pago:</strong> {reserva.pagada ? 'Pagada' : 'Pendiente'}</p>
                                {reserva.metodoPago && (
                                    <p>
                                        <strong>Método de Pago:</strong> {capitalizeFirstLetter(reserva.metodoPago)}
                                        {reserva.metodoPago.toLowerCase() === 'mercadopago' && <img src={`${process.env.PUBLIC_URL}/imagenes/mercadopago-small.png`} alt="Mercado Pago" className="payment-icon-small" />}
                                        {reserva.metodoPago.toLowerCase() === 'efectivo' && <img src={`${process.env.PUBLIC_URL}/imagenes/efectivo-small.png`} alt="Efectivo" className="payment-icon-small" />}
                                    </p>
                                )}
                                {reserva.jugadores && reserva.jugadores.length > 0 && (
                                    <p><strong>Jugadores:</strong> {reserva.jugadores.join(', ')}</p>
                                )}
                                {reserva.equipo1 && reserva.equipo1.length > 0 && (
                                    <p><strong>Equipo 1:</strong> {Array.from(reserva.equipo1).join(', ')}</p>
                                )}
                                {reserva.equipo2 && reserva.equipo2.length > 0 && (
                                    <p><strong>Equipo 2:</strong> {Array.from(reserva.equipo2).join(', ')}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="dashboard-info">Aún no tenés reservas.</p>
                )}
                <Link to="/complejos" className="btn btn-primary btn-nueva-reserva">Hacer una Nueva Reserva</Link>
            </div>

            {modalReserva && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalle de Reserva</h3>
                        <hr />
                        <p><strong>Complejo:</strong> {modalReserva.complejoNombre || 'N/A'}</p>
                        <p><strong>Tipo de Cancha:</strong> {modalReserva.tipoCanchaReservada || 'N/A'}</p>
                        <p><strong>Cancha Asignada:</strong> {modalReserva.nombreCanchaAsignada || 'N/A'}</p>
                        <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(modalReserva.fechaHora)}</p>
                        <p><strong>Precio Total:</strong> ${modalReserva.precioTotal ? modalReserva.precioTotal.toLocaleString('es-AR') : 'N/A'}</p>
                        <p><strong>Estado:</strong> {formatReservaEstado(modalReserva.estado)}</p>
                        <p><strong>Pago:</strong> {modalReserva.pagada ? `Pagada (${capitalizeFirstLetter(modalReserva.metodoPago || '?')})` : 'Pendiente de Pago'}</p>
                        <p><strong>Reservado a nombre de:</strong> {modalReserva.cliente}</p>
                        <p><strong>DNI:</strong> {modalReserva.dni || '-'}</p>
                        <p><strong>Teléfono de contacto:</strong> {modalReserva.telefono || '-'}</p>

                        {modalReserva.jugadores && modalReserva.jugadores.length > 0 && (
                            <p><strong>Jugadores:</strong> {modalReserva.jugadores.join(', ')}</p>
                        )}
                        {modalReserva.equipo1 && modalReserva.equipo1.length > 0 && (
                            <p><strong>Equipo 1:</strong> {Array.from(modalReserva.equipo1).join(', ')}</p>
                        )}
                        {modalReserva.equipo2 && modalReserva.equipo2.length > 0 && (
                            <p><strong>Equipo 2:</strong> {Array.from(modalReserva.equipo2).join(', ')}</p>
                        )}

                        {modalReserva.metodoPago === 'efectivo' && !modalReserva.pagada && modalReserva.estado === 'pendiente_pago_efectivo' && (
                            <button
                                className="btn btn-info btn-mostrar-boleto"
                                onClick={() => handleDescargarPdf(modalReserva.id)}
                            >
                                Mostrar Boleto de Pago (PDF)
                            </button>
                        )}

                        {modalReserva.metodoPago === 'mercadopago' && !modalReserva.pagada && modalReserva.estado === 'pendiente_pago_mp' && (
                            <button
                                className="btn btn-success btn-pagar-mp"
                                onClick={async () => {
                                    console.log(`Iniciando pago para reserva ID: ${modalReserva.id}`);
                                    try {
                                        const preferenciaResponse = await api.post(
                                            `/pagos/crear-preferencia/${modalReserva.id}`,
                                            {
                                                reservaId: modalReserva.id,
                                                nombreCliente: modalReserva.cliente,
                                                monto: modalReserva.precioTotal
                                            }
                                        );
                                        const initPoint = preferenciaResponse.data.initPoint;
                                        if (initPoint) {
                                            window.location.href = initPoint;
                                        } else {
                                            alert("Error: No se pudo obtener el link de pago.");
                                        }
                                    } catch (error) {
                                        console.error("Error al crear preferencia de MP:", error);
                                        const errorMessage = error.response?.data?.error || error.message || "Error desconocido al crear preferencia.";
                                        alert(`Error al iniciar el pago: ${errorMessage}`);
                                    }
                                }}
                            >
                                Pagar con Mercado Pago
                            </button>
                        )}

                        {modalReserva.estado === 'pendiente' && (
                            <p className="text-warning">Esta reserva está pendiente de procesamiento inicial. Las opciones de pago/boleto aparecerán una vez el método de pago se determine.</p>
                        )}

                        {modalReserva.estado === 'rechazada_pago_mp' && (
                            <p className="text-danger">Este pago fue rechazado por Mercado Pago. Contacta al administrador si deseas reintentar.</p>
                        )}
                        {modalReserva.estado === 'cancelada' && (
                            <p className="text-danger">Esta reserva ha sido cancelada.</p>
                        )}


                        <div className="modal-actions">
                            <button className="btn btn-outline-primary" onClick={handleCloseModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardUsuario;