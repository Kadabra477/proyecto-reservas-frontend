// frontend/src/features/dashboard/DashboardUsuario.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig'; 
import './DashboardUsuario.css'; 

// Importa directamente las imágenes desde la carpeta assets (Asegúrate de que estas rutas sean correctas)
import mercadopagoSmallIcon from '../../assets/mercadopago-small.png'; 
import efectivoSmallIcon from '../../assets/efectivo-small.png'; 

function DashboardUsuario() {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [edad, setEdad] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [bio, setBio] = useState('');
    const [misReservas, setMisReservas] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [modalReserva, setModalReserva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' };
            return date.toLocaleString('es-AR', options);
        } catch (e) {
            console.error("Error formateando fecha:", dateTimeString, e);
            return dateTimeString;
        }
    };

    const handleOpenModal = (reserva) => { setModalReserva(reserva); };
    const handleCloseModal = () => { setModalReserva(null); };

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

    // NUEVA FUNCIÓN: Combina estado y método de pago en una sola línea de texto con icono opcional
    const getCombinedStatusAndPaymentInfo = (estado, pagada, metodoPago) => {
        estado = estado ? estado.toLowerCase() : 'desconocido';
        metodoPago = metodoPago ? metodoPago.toLowerCase() : '';

        let statusText = '';
        let icon = null;

        if (pagada) {
            statusText = 'Pagada';
            if (metodoPago === 'mercadopago') icon = <img src={mercadopagoSmallIcon} alt="MP" className="payment-icon-small" />;
            else if (metodoPago === 'efectivo') icon = <img src={efectivoSmallIcon} alt="Efectivo" className="payment-icon-small" />;
        } else {
            switch (estado) {
                case 'confirmada':
                    statusText = 'Confirmada';
                    break;
                case 'pendiente_pago_efectivo':
                    statusText = 'Pendiente (Efectivo)';
                    icon = <img src={efectivoSmallIcon} alt="Efectivo" className="payment-icon-small" />;
                    break;
                case 'pendiente_pago_mp':
                    statusText = 'Pendiente (Mercado Pago)';
                    icon = <img src={mercadopagoSmallIcon} alt="MP" className="payment-icon-small" />;
                    break;
                case 'pendiente':
                    statusText = 'Pendiente';
                    break;
                case 'rechazada_pago_mp':
                    statusText = 'Rechazada (Mercado Pago)';
                    break;
                case 'cancelada':
                    statusText = 'Cancelada';
                    break;
                default:
                    statusText = estado.charAt(0).toUpperCase() + estado.slice(1);
            }
        }
        return (
            <>
                {statusText} {icon}
            </>
        );
    };

    // Función para obtener la clase CSS del estado (colores)
    const getStatusClass = (estado, pagada, metodoPago) => {
        estado = estado ? estado.toLowerCase() : 'desconocido';
        metodoPago = metodoPago ? metodoPago.toLowerCase() : '';

        if (pagada) return 'status-pagada';

        switch (estado) {
            case 'pendiente':
            case 'pendiente_pago_mp': 
            case 'pendiente_pago_efectivo':
                return 'status-pendiente'; 
            case 'confirmada':
                return 'status-confirmada'; 
            case 'rechazada_pago_mp':
            case 'cancelada': 
                return 'status-cancelada'; 
            default: return 'status-desconocido';
        }
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };


    if (loading) {
        return (
            <div className="dashboard-container">
                <p className="loading-message">Cargando datos del perfil y reservas...</p>
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

    const nowArgentinaClient = new Date(new Date().toLocaleString('en-US', {timeZone: 'America/Argentina/Buenos_Aires'}));
    
    const proximasReservas = misReservas
        .filter(reserva => new Date(reserva.fechaHora).getTime() > nowArgentinaClient.getTime())
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()); 

    const reservasPasadas = misReservas
        .filter(reserva => new Date(reserva.fechaHora).getTime() <= nowArgentinaClient.getTime())
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()); 

    const proximaReserva = proximasReservas.length > 0 ? proximasReservas[0] : null;


    return (
        <div className="dashboard-container">
            {/* Sección de Bienvenida y Perfil */}
            <div className="welcome-card">
                <h1 className="welcome-title">¡Hola, {nombreCompleto || 'Usuario'}!</h1>
                <p className="welcome-subtitle">Bienvenido a tu panel personal. Aquí puedes gestionar tu perfil y tus reservas.</p>
            </div>

            <div className="dashboard-content-grid">
                {/* Columna Izquierda: Detalles del Perfil */}
                <div className="dashboard-section perfil-detail-card">
                    <h2>Tus Datos Personales</h2>
                    {isEditing ? (
                        <div className="perfil-form-edit">
                            <label htmlFor="nombreCompleto">Nombre Completo:</label>
                            <input
                                id="nombreCompleto"
                                value={nombreCompleto}
                                onChange={(e) => setNombreCompleto(e.target.value)}
                                className="perfil-input"
                                placeholder="Nombre Completo"
                                required
                            />
                            <label htmlFor="edad">Edad:</label>
                            <input
                                id="edad"
                                value={edad}
                                onChange={(e) => setEdad(e.target.value)}
                                className="perfil-input"
                                placeholder="Edad"
                                type="number"
                                min="10" max="99"
                            />
                            <label htmlFor="ubicacion">Ubicación:</label>
                            <input
                                id="ubicacion"
                                value={ubicacion}
                                onChange={(e) => setUbicacion(e.target.value)}
                                className="perfil-input"
                                placeholder="Ubicación"
                            />
                            <label htmlFor="bio">Biografía:</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="perfil-textarea"
                                placeholder="Cuéntanos algo sobre ti..."
                                rows="3"
                            ></textarea>
                            <p className="perfil-email-display"><strong>Email:</strong> {email}</p>

                            <div className="perfil-actions-edit">
                                <button onClick={handleSaveChanges} className="btn btn-primary btn-guardar">Guardar Cambios</button>
                                <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-cancelar">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="perfil-data-view">
                            <p className="perfil-data-item"><strong>Nombre:</strong> {nombreCompleto || 'No especificado'}</p>
                            <p className="perfil-data-item"><strong>Email:</strong> {email || 'N/A'}</p>
                            <p className="perfil-data-item"><strong>Edad:</strong> {edad ? `${edad} años` : 'No especificado'}</p>
                            <p className="perfil-data-item"><strong>Ubicación:</strong> {ubicacion || 'No especificada'}</p>
                            <p className="perfil-data-item perfil-bio"><strong>Bio:</strong> {bio || 'No especificado'}</p>
                            <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary btn-editar">Editar Perfil</button>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Resumen de Reservas */}
                <div className="dashboard-section reservations-summary-card">
                    <h2>Resumen de Reservas</h2>
                    
                    {proximaReserva ? (
                        <div className="next-reservation-highlight">
                            <h3>Tu Próxima Reserva:</h3>
                            <div className="reserva-highlight-item" onClick={() => handleOpenModal(proximaReserva)}>
                                <div className="reserva-highlight-icon">📅</div>
                                <div className="reserva-highlight-details">
                                    <p><strong>{proximaReserva.complejoNombre}</strong></p>
                                    <p>{proximaReserva.tipoCanchaReservada} - {formatLocalDateTime(proximaReserva.fechaHora)}</p>
                                    <span className={`reserva-status-badge ${getStatusClass(proximaReserva.estado, proximaReserva.pagada, proximaReserva.metodoPago)}`}>
                                        {getCombinedStatusAndPaymentInfo(proximaReserva.estado, proximaReserva.pagada, proximaReserva.metodoPago)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="dashboard-info">No tienes próximas reservas.</p>
                    )}

                    <div className="action-buttons-group">
                        <Link to="/complejos" className="btn btn-primary btn-full-width">Hacer una Nueva Reserva</Link>
                        <button onClick={() => document.getElementById('past-reservations-section').scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary btn-full-width">Ver todas las reservas</button>
                    </div>
                </div>
            </div>

            {/* Sección de Todas las Reservas (próximas y pasadas) */}
            <div id="past-reservations-section" className="dashboard-section all-reservations-card">
                <h2>Todas tus Reservas ({misReservas.length})</h2>
                {misReservas.length > 0 ? (
                    <div className="reservas-grid">
                        {proximasReservas.concat(reservasPasadas).map((reserva) => (
                            <div key={reserva.id} className="reserva-item-card" onClick={() => handleOpenModal(reserva)}>
                                <div className="reserva-card-header">
                                    <h3 className="reserva-card-title">{reserva.complejoNombre || 'Complejo Desconocido'}</h3>
                                    <span className={`reserva-status-badge ${getStatusClass(reserva.estado, reserva.pagada, reserva.metodoPago)}`}>
                                        {getCombinedStatusAndPaymentInfo(reserva.estado, reserva.pagada, reserva.metodoPago)}
                                    </span>
                                </div>
                                <p className="reserva-card-detail"><strong>Cancha:</strong> {reserva.tipoCanchaReservada || 'N/A'}</p>
                                <p className="reserva-card-detail"><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                                <p className="reserva-card-detail"><strong>Precio:</strong> ${reserva.precioTotal ? reserva.precioTotal.toLocaleString('es-AR') : 'N/A'}</p>
                                {/* REMOVIDO: Este párrafo ya no es necesario, el estado combinado lo maneja */}
                                {/* {reserva.metodoPago && (
                                    <p className="reserva-card-detail payment-info">
                                        <strong>Pago:</strong> {reserva.pagada ? `Pagada (${capitalizeFirstLetter(reserva.metodoPago || '?')})` : 'Pendiente'}
                                        {reserva.metodoPago.toLowerCase() === 'mercadopago' && <img src={mercadopagoSmallIcon} alt="MP" className="payment-icon-small" />}
                                        {reserva.metodoPago.toLowerCase() === 'efectivo' && <img src={efectivoSmallIcon} alt="Efectivo" className="payment-icon-small" />}
                                    </p>
                                )} */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="dashboard-info">Aún no tenés reservas. ¡Es hora de hacer la primera!</p>
                )}
            </div>

            {/* Modal de Detalle de Reserva */}
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
                        <p><strong>Estado y Pago:</strong> {getCombinedStatusAndPaymentInfo(modalReserva.estado, modalReserva.pagada, modalReserva.metodoPago)}</p> {/* UNIFICADO */}
                        <p><strong>Reservado a nombre de:</strong> {modalReserva.cliente}</p>
                        <p><strong>DNI:</strong> {modalReserva.dni || '-'}</p>
                        <p><strong>Teléfono de contacto:</strong> {modalReserva.telefono || '-'}</p>
                        
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