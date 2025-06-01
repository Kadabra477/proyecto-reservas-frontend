import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './DashboardUsuario.css';

function DashboardUsuario() {
    const [nombreCompleto, setNombreComplepleto] = useState('');
    const [email, setEmail] = useState('');
    const [edad, setEdad] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [bio, setBio] = useState(''); 
    const [profilePictureUrl, setProfilePictureUrl] = useState('/avatar-default.png');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [misReservas, setMisReservas] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [modalReserva, setModalReserva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para recargar las reservas, útil después de una acción de pago
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
                    setProfilePictureUrl(userData.profilePictureUrl || '/avatar-default.png');
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
                    setProfilePictureUrl('/avatar-default.png');
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

        try {
            const profileData = {
                nombreCompleto,
                edad: edad === '' ? null : Number(edad),
                ubicacion,
                bio,
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

    // NUEVO: Manejador para descargar el PDF
    const handleDescargarPdf = async (reservaId) => {
        try {
            // Llama al endpoint del backend para generar el PDF
            const response = await api.get(`/reservas/${reservaId}/pdf-comprobante`, {
                responseType: 'blob' // Importante para recibir archivos binarios
            });

            // Crea una URL para el blob y abre una nueva pestaña o descarga el archivo
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const fileLink = document.createElement('a');
            fileLink.href = fileURL;
            fileLink.setAttribute('download', `comprobante_reserva_${reservaId}.pdf`); // Nombre del archivo
            document.body.appendChild(fileLink);
            fileLink.click();
            fileLink.remove(); // Limpia el elemento después de usarlo

            setModalReserva(null); // Cierra el modal
            alert("Comprobante descargado.");
        } catch (error) {
            console.error("Error al descargar el PDF:", error);
            alert("No se pudo descargar el comprobante. Intenta de nuevo más tarde.");
        }
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
                    <img src="/portada-default.jpg" alt="Portada" className="portada-img" />
                </div>
                <div className="perfil-info-box">
                    <label htmlFor="avatar-upload" className="avatar-label">
                        <img src={profilePictureUrl} alt="Avatar" className="perfil-avatar editable" title="Cambiar avatar" />
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
                                <p><strong>Cancha:</strong> {reserva.canchaNombre || 'N/A'}</p> 
                                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                                <p><strong>Estado:</strong> {reserva.confirmada ? 'Confirmada' : 'Pendiente'}</p>
                                <p><strong>Pago:</strong> {reserva.pagada ? 'Pagada' : 'Pendiente'}</p>
                                {/* NUEVO: Mostrar método de pago */}
                                {reserva.metodoPago && <p><strong>Método de Pago:</strong> {reserva.metodoPago}</p>}
                                {reserva.jugadores && reserva.jugadores.length > 0 && (
                                    <p><strong>Jugadores:</strong> {reserva.jugadores.join(', ')}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="dashboard-info">Aún no tenés reservas.</p>
                )}
                <Link to="/canchas" className="btn btn-primary btn-nueva-reserva">Hacer una Nueva Reserva</Link>
            </div>

            {modalReserva && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalle de Reserva</h3>
                        <hr />
                        <p><strong>Cancha:</strong> {modalReserva.canchaNombre || 'N/A'}</p>
                        <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(modalReserva.fechaHora)}</p>
                        <p><strong>Estado:</strong> {modalReserva.estado}</p>
                        <p><strong>Pago:</strong> {modalReserva.pagada ? `Pagada (${modalReserva.metodoPago || '?'})` : 'Pendiente de Pago'}</p>
                        <p><strong>Reservado a nombre de:</strong> {modalReserva.cliente}</p>
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

                        {/* NUEVO: Botones condicionales en el modal */}
                        {modalReserva.metodoPago === 'efectivo' && !modalReserva.pagada && (
                            <button
                                className="btn btn-info btn-mostrar-boleto"
                                onClick={() => handleDescargarPdf(modalReserva.id)}
                            >
                                Mostrar Boleto de Pago (PDF)
                            </button>
                        )}

                        {modalReserva.metodoPago === 'mercadopago' && !modalReserva.pagada && modalReserva.estado !== 'rechazada_pago_mp' && (
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
                                                monto: modalReserva.precio
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
                        
                        {/* Mensaje si el pago fue rechazado por MP */}
                        {modalReserva.estado === 'rechazada_pago_mp' && (
                             <p className="text-danger">Este pago fue rechazado por Mercado Pago. Contacta al administrador si deseas reintentar.</p>
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