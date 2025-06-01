// frontend/src/features/reservas/ReservaDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ReservaDetail.css';

// Importar los logos desde src/assets
import mercadopagoLogo from '../../assets/mercadopago.png'; // <--- RUTA CORREGIDA
import efectivoLogo from '../../assets/efectivo.png';     // <--- RUTA CORREGIDA

const ReservaDetail = () => {
    const { id } = useParams();
    const [reserva, setReserva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReserva = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/reservas/${id}`); // Usa tu instancia `api`
                setReserva(response.data);
            } catch (err) {
                console.error("Error al cargar la reserva:", err);
                if (err.response && err.response.status === 404) {
                    setError('Reserva no encontrada.');
                } else if (err.response && err.response.status === 403) {
                    setError('No tienes permiso para ver esta reserva.');
                } else {
                    setError('Error al cargar la reserva. Intenta de nuevo.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReserva();
    }, [id]);

    const handlePagoMercadoPago = async () => {
        if (!reserva || !reserva.id || !reserva.canchaNombre || !reserva.precioTotal) {
            setError('Datos de reserva incompletos para procesar el pago.');
            return;
        }
        try {
            // Asumiendo que `reserva.cliente` contiene el nombre para Mercado Pago
            const nombreCliente = reserva.cliente || localStorage.getItem('nombreCompleto') || 'Cliente Desconocido';
            const preferenciaResponse = await api.post(
                `/pagos/crear-preferencia/${reserva.id}`,
                {
                    reservaId: reserva.id,
                    nombreCliente: nombreCliente,
                    monto: reserva.precioTotal // Usar precioTotal de la reserva
                }
            );
            const initPoint = preferenciaResponse.data.initPoint;
            if (initPoint) {
                window.location.href = initPoint;
            } else {
                setError("Error: No se pudo obtener el link de pago de Mercado Pago.");
            }
        } catch (paymentError) {
            console.error("Error al iniciar el pago con Mercado Pago:", paymentError);
            const msg = paymentError.response?.data?.message || paymentError.message || "Error desconocido al iniciar pago con Mercado Pago.";
            setError(`Error al iniciar el pago: ${msg}`);
        }
    };

    const handlePagarEnEfectivo = () => {
        // En un caso real, esto solo actualizaría el estado en tu sistema a "pagada en efectivo"
        // o generaría un comprobante de pago para el cliente.
        alert('Has seleccionado pagar en efectivo. Por favor, realiza el pago al llegar a la cancha.');
        // Opcional: Podrías redirigir a una página de "Pago en Efectivo Confirmado"
        navigate('/mis-reservas');
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

    if (loading) {
        return <div className="reserva-detail-container">Cargando detalles de la reserva...</div>;
    }

    if (error) {
        return <div className="reserva-detail-container error-message">{error}</div>;
    }

    if (!reserva) {
        return <div className="reserva-detail-container">No se encontró la reserva.</div>;
    }

    const isConfirmedByAdmin = reserva.confirmada;
    const isPaid = reserva.pagada; // Asumo que el backend ya indica si está pagada

    return (
        <div className="reserva-detail-container">
            <h2 className="reserva-detail-title">Detalle de la Reserva</h2>
            <div className="reserva-detail-card">
                <p><strong>Cancha:</strong> {reserva.canchaNombre || 'N/A'}</p>
                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                <p><strong>Precio Total:</strong> ${reserva.precioTotal ? reserva.precioTotal.toLocaleString('es-AR') : 'N/A'}</p>
                <p><strong>Estado:</strong> {reserva.estado}</p>
                <p><strong>Confirmación Admin:</strong> {isConfirmedByAdmin ? 'Sí' : 'No'}</p>
                <p><strong>Pago:</strong> {isPaid ? 'Pagada' : 'Pendiente'}</p>
                {reserva.metodoPago && <p><strong>Método de Pago Seleccionado:</strong> {reserva.metodoPago}</p>}

                {/* Mostrar opciones de pago solo si la reserva está confirmada por el admin y NO está pagada */}
                {isConfirmedByAdmin && !isPaid && (
                    <div className="payment-options">
                        <h3>Finaliza tu Pago:</h3>
                        {reserva.metodoPago === 'mercadopago' && (
                            <button className="payment-button mercadopago-button" onClick={handlePagoMercadoPago}>
                                <img src={mercadopagoLogo} alt="Mercado Pago" className="payment-logo" />
                                Pagar con Mercado Pago
                            </button>
                        )}
                        {reserva.metodoPago === 'efectivo' && (
                            <button className="payment-button efectivo-button" onClick={handlePagarEnEfectivo}>
                                <img src={efectivoLogo} alt="Efectivo" className="payment-logo" />
                                Pagar en Efectivo
                            </button>
                        )}
                    </div>
                )}

                {/* Mensaje si la reserva está pendiente de confirmación */}
                {!isConfirmedByAdmin && (
                    <p className="pending-confirmation-message">
                        Esta reserva está pendiente de confirmación por parte del administrador.
                        Las opciones de pago se habilitarán una vez confirmada.
                    </p>
                )}

                {/* Mensaje si la reserva ya está pagada */}
                {isPaid && (
                    <p className="paid-confirmation-message">
                        ¡Esta reserva ya está pagada! Gracias por tu confirmación.
                    </p>
                )}
                
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    Volver al Dashboard
                </button>
            </div>
        </div>
    );
};

export default ReservaDetail;