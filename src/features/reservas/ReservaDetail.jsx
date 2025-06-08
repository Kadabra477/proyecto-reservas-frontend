import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ReservaDetail.css';

import mercadopagoLogo from '../../assets/mercadopago.png';
import efectivoLogo from '../../assets/efectivo.png';

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
                const response = await api.get(`/reservas/${id}`);
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
        if (!reserva || !reserva.id || !reserva.precioTotal) { // No usar canchaNombre aquí
            setError('Datos de reserva incompletos para procesar el pago.');
            return;
        }
        try {
            const nombreCliente = reserva.cliente || localStorage.getItem('nombreCompleto') || 'Cliente Desconocido';
            const preferenciaResponse = await api.post(
                `/pagos/crear-preferencia/${reserva.id}`,
                {
                    reservaId: reserva.id,
                    nombreCliente: nombreCliente,
                    monto: reserva.precioTotal
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
        alert('Has seleccionado pagar en efectivo. Por favor, realiza el pago al llegar a la cancha.');
        navigate('/dashboard'); // Redirige al dashboard después de seleccionar efectivo
    };

    const formatLocalDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Fecha no disponible';
        try {
            const date = new Date(dateTimeString);
            const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
            return date.toLocaleString('es-AR', options);
        } catch (e) {
            console.error("Error formateando fecha:", dateTimeString, e);
            return dateTimeString;
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


    if (loading) {
        return <div className="reserva-detail-container">Cargando detalles de la reserva...</div>;
    }

    if (error) {
        return <div className="reserva-detail-container error-message">{error}</div>;
    }

    if (!reserva) {
        return <div className="reserva-detail-container">No se encontró la reserva.</div>;
    }

    // La lógica de `confirmada` ya no es necesaria si el estado es el campo principal.
    // Usaremos el campo `estado` para determinar si es pagada o pendiente.
    const isPaid = reserva.pagada; // `pagada` sigue siendo útil
    const isPendingPayment = !isPaid && (reserva.estado === 'pendiente_pago_efectivo' || reserva.estado === 'pendiente_pago_mp');

    return (
        <div className="reserva-detail-container">
            <h2 className="reserva-detail-title">Detalle de la Reserva</h2>
            <div className="reserva-detail-card">
                <p><strong>Complejo:</strong> {reserva.complejoNombre || 'N/A'}</p>
                <p><strong>Tipo de Cancha:</strong> {reserva.tipoCanchaReservada || 'N/A'}</p>
                <p><strong>Cancha Asignada:</strong> {reserva.nombreCanchaAsignada || 'N/A'}</p>
                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                <p><strong>Precio Total:</strong> ${reserva.precioTotal ? reserva.precioTotal.toLocaleString('es-AR') : 'N/A'}</p>
                <p><strong>Estado:</strong> {formatReservaEstado(reserva.estado)}</p>
                <p><strong>Pago:</strong> {isPaid ? 'Pagada' : 'Pendiente'}</p>
                {reserva.metodoPago && <p><strong>Método de Pago Seleccionado:</strong> {capitalizeFirstLetter(reserva.metodoPago)}</p>}
                <p><strong>Reservado a nombre de:</strong> {reserva.cliente}</p>
                <p><strong>DNI:</strong> {reserva.dni || '-'}</p>
                <p><strong>Teléfono de contacto:</strong> {reserva.telefono || '-'}</p>

                {isPendingPayment && (
                    <div className="payment-options">
                        <h3>Finaliza tu Pago:</h3>
                        {reserva.metodoPago && reserva.metodoPago.toLowerCase() === 'mercadopago' && (
                            <button className="payment-button mercadopago-button" onClick={handlePagoMercadoPago}>
                                <img src={mercadopagoLogo} alt="Mercado Pago" className="payment-logo" />
                                Pagar con Mercado Pago
                            </button>
                        )}
                        {reserva.metodoPago && reserva.metodoPago.toLowerCase() === 'efectivo' && (
                            <button className="payment-button efectivo-button" onClick={handlePagarEnEfectivo}>
                                <img src={efectivoLogo} alt="Efectivo" className="payment-logo" />
                                Pagar en Efectivo
                            </button>
                        )}
                    </div>
                )}

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