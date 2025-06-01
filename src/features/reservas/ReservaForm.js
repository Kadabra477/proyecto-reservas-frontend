import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ReservaForm.css';

function ReservaForm() {
    const { canchaId } = useParams();
    const navigate = useNavigate();

    const [cancha, setCancha] = useState(null);
    const [formulario, setFormulario] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        fecha: '',
        hora: '',
        metodoPago: 'mercadopago', // Nuevo: estado inicial para el método de pago
    });
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingCancha, setIsLoadingCancha] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Para creación de reserva
    const [isCreatingPreference, setIsCreatingPreference] = useState(false); // Para crear preferencia MP
    const [errorCancha, setErrorCancha] = useState('');

    const fetchCanchaDetails = useCallback(async () => {
        if (!canchaId) {
            setErrorCancha('ID de cancha no válido.');
            setIsLoadingCancha(false);
            return;
        }
        setIsLoadingCancha(true);
        setErrorCancha('');
        try {
            const response = await api.get(`/canchas/${canchaId}`);
            if (!response.data) {
                setErrorCancha('La cancha solicitada no existe.');
                setCancha(null);
            } else if (!response.data.disponible) {
                setErrorCancha('Esta cancha no está disponible para reservas en este momento.');
                setCancha(response.data);
            } else {
                setCancha(response.data);
            }
        } catch (err) {
            console.error("Error al obtener detalles de la cancha:", err);
            setErrorCancha('Error al cargar los detalles de la cancha. Intenta de nuevo.');
            setCancha(null);
        } finally {
            setIsLoadingCancha(false);
        }
    }, [canchaId]);

    useEffect(() => {
        fetchCanchaDetails();
    }, [fetchCanchaDetails]);

    // MODIFICADO: Incluir 'metodoPago' en el handleChange
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prevFormulario => ({
            ...prevFormulario,
            [name]: value
        }));
    };

    const validarFormulario = () => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const { nombre, apellido, dni, telefono, fecha, hora, metodoPago } = formulario;

        if (!nombre.trim() || !apellido.trim() || !dni.trim() || !telefono.trim() || !fecha || !hora || !metodoPago) {
            setMensaje({ type: 'error', text: 'Todos los campos y el método de pago son obligatorios.' });
            return false;
        }
        if (!/^\d{7,8}$/.test(dni.trim())) {
            setMensaje({ type: 'error', text: 'El DNI debe contener 7 u 8 números (sin puntos).' });
            return false;
        }
        if (!/^\d+$/.test(telefono.trim())) {
            setMensaje({ type: 'error', text: 'El teléfono debe contener solo números.' });
            return false;
        }
        const [year, month, day] = fecha.split('-').map(Number);
        const fechaSeleccionada = new Date(year, month - 1, day);
        if (fechaSeleccionada < hoy) {
            setMensaje({ type: 'error', text: 'La fecha de reserva no puede ser anterior a hoy.' });
            return false;
        }
        const [hourPart] = hora.split(':').map(Number);
        if (hourPart < 8 || hourPart >= 23) { // Rango de 08:00 a 22:xx
            setMensaje({ type: 'error', text: 'La hora de reserva debe estar entre las 08:00 y las 22:00.' });
            return false;
        }
        return true;
    };

    // MODIFICADO: handleSubmit para manejar la lógica de pago
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' }); // Limpiar mensajes previos

        if (!validarFormulario()) return;
        if (!cancha || !cancha.disponible) {
            setMensaje({ type: 'error', text: 'La cancha no está disponible o no se pudo cargar.' });
            return;
        }

        setIsSubmitting(true); // Inicia el proceso general

        const reservaData = {
            canchaId: parseInt(canchaId, 10),
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            dni: formulario.dni.trim(),
            telefono: formulario.telefono.trim(),
            fecha: formulario.fecha,
            hora: formulario.hora,
            metodoPago: formulario.metodoPago, // Enviar el método de pago seleccionado
        };

        try {
            // 1. Crear la reserva en el backend
            const reservaResponse = await api.post("/reservas/crear", reservaData);
            const reservaCreada = reservaResponse.data; // El backend devuelve la reserva creada (con ID)

            console.log("Reserva creada con ID:", reservaCreada.id, "Método de pago:", reservaCreada.metodoPago);

            // Limpiar formulario aquí si quieres
            setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', fecha: '', hora: '', metodoPago: 'mercadopago' });

            // 2. Manejar la acción según el método de pago
            if (reservaCreada.metodoPago === 'mercadopago') {
                setMensaje({ type: 'info', text: 'Reserva creada. Redirigiendo a Mercado Pago...' });
                setIsCreatingPreference(true); // Indicar que estamos creando la preferencia
                try {
                    const preferenciaResponse = await api.post(
                        `/pagos/crear-preferencia/${reservaCreada.id}`, // ID en la ruta
                        { // Cuerpo de la solicitud (PagoDTO)
                            reservaId: reservaCreada.id,
                            nombreCliente: reservaCreada.cliente, // Usar el nombre completo combinado
                            monto: reservaCreada.precio // Usar el precio exacto de la reserva creada
                        }
                    );
                    const initPoint = preferenciaResponse.data.initPoint; // Obtener la URL de pago

                    if (!initPoint) {
                        throw new Error("No se recibió el punto de inicio de Mercado Pago.");
                    }

                    console.log("Redirigiendo a Mercado Pago:", initPoint);
                    window.location.href = initPoint; // Redirección del navegador

                } catch (pagoError) {
                    console.error("Error al crear la preferencia de Mercado Pago:", pagoError);
                    setMensaje({
                        type: 'error',
                        text: `La reserva (ID: ${reservaCreada.id}) se creó, pero no pudimos iniciar el pago con Mercado Pago. Por favor, intenta pagar desde 'Mis Reservas' o contacta soporte.`
                    });
                    setIsCreatingPreference(false);
                    setIsSubmitting(false);
                }
            } else if (reservaCreada.metodoPago === 'efectivo') {
                // Si el método de pago es Efectivo
                setMensaje({ type: 'success', text: `Reserva creada exitosamente (ID: ${reservaCreada.id}). Puedes ver los detalles en tu Dashboard.` });
                setIsSubmitting(false);
                // Redirigir al dashboard del usuario o a una página de confirmación de efectivo
                navigate('/dashboard'); // O a /pago-efectivo-exitoso
            } else {
                // Si por alguna razón el método de pago no es reconocido
                setMensaje({ type: 'warning', text: 'Reserva creada, pero el método de pago es desconocido. Revisa tu Dashboard.' });
                setIsSubmitting(false);
                navigate('/dashboard');
            }

        } catch (reservaError) {
            console.error("Error al crear la reserva:", reservaError);
            if (reservaError.response?.data?.error) {
                setMensaje({ type: 'error', text: `Error al crear reserva: ${reservaError.response.data.error}` });
            } else if (reservaError.response?.data) {
                setMensaje({ type: 'error', text: `Error al crear reserva: ${reservaError.response.data}` });
            } else if (reservaError.response?.status === 400) {
                setMensaje({ type: 'error', text: 'Error en los datos de la reserva. Revisa la fecha y hora.' });
            } else {
                setMensaje({ type: 'error', text: 'No se pudo crear la reserva. Intenta nuevamente.' });
            }
            setIsSubmitting(false);
        }
    };

    if (isLoadingCancha) return <p className="loading-message">Cargando información de la cancha...</p>;
    if (errorCancha) return <p className="error-message">{errorCancha}</p>;
    if (!cancha) return <p className="error-message">No se encontró la cancha solicitada.</p>;

    return (
        <div className="reserva-form-container">
            <h2 className="reserva-form-title">Reserva para: {cancha.nombre}</h2>
            <div className="reserva-cancha-details">
                <img
                    src={cancha.fotoUrl || '/imagenes/default-cancha.png'}
                    alt={cancha.nombre}
                    className="reserva-cancha-img"
                    onError={(e) => { e.target.onerror = null; e.target.src='/imagenes/default-cancha.png'; }}
                />
                {cancha.descripcion && <p>{cancha.descripcion}</p>}
                {cancha.ubicacion && <p><strong>Ubicación:</strong> {cancha.ubicacion}</p>}
                {cancha.precioPorHora != null && <p><strong>Precio:</strong> {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(cancha.precioPorHora))} / hora</p>}
                {!cancha.disponible && <p style={{color: 'var(--danger)', fontWeight: 'bold'}}>Actualmente no disponible para reservas.</p>}
            </div>

            <h3 className="reserva-form-subtitle">Completa tus datos y selecciona método de pago</h3>
            <form onSubmit={handleSubmit} className="reserva-formulario" noValidate>
                {/* Inputs del formulario */}
                <div className="form-group">
                    <label htmlFor="nombre">Nombre:</label>
                    <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" value={formulario.nombre} onChange={handleChange} required disabled={isSubmitting || isCreatingPreference || !cancha.disponible} />
                </div>
                <div className="form-group">
                    <label htmlFor="apellido">Apellido:</label>
                    <input type="text" id="apellido" name="apellido" placeholder="Tu apellido" value={formulario.apellido} onChange={handleChange} required disabled={isSubmitting || isCreatingPreference || !cancha.disponible} />
                </div>
                <div className="form-group">
                    <label htmlFor="dni">DNI:</label>
                    <input type="text" id="dni" name="dni" placeholder="Tu DNI (7-8 dígitos)" value={formulario.dni} onChange={handleChange} required pattern="\d{7,8}" title="Ingresa 7 u 8 dígitos sin puntos" disabled={isSubmitting || isCreatingPreference || !cancha.disponible} />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono:</label>
                    <input type="tel" id="telefono" name="telefono" placeholder="Tu teléfono (solo números)" value={formulario.telefono} onChange={handleChange} required pattern="\d+" title="Ingresa solo números" disabled={isSubmitting || isCreatingPreference || !cancha.disponible} />
                </div>
                <div className="form-group">
                    <label htmlFor="fecha">Fecha:</label>
                    <input type="date" id="fecha" name="fecha" value={formulario.fecha} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} disabled={isSubmitting || isCreatingPreference || !cancha.disponible} />
                </div>
                <div className="form-group">
                    <label htmlFor="hora">Hora:</label>
                    <input type="time" id="hora" name="hora" value={formulario.hora} onChange={handleChange} required step="3600" min="08:00" max="23:00" disabled={isSubmitting || isCreatingPreference || !cancha.disponible} title="Horarios disponibles de 08:00 a 22:00" />
                </div>

                {/* NUEVO: Selección de Método de Pago */}
                <div className="form-group payment-method-selection">
                    <p>Selecciona tu método de pago:</p>
                    <label>
                        <input
                            type="radio"
                            name="metodoPago"
                            value="mercadopago"
                            checked={formulario.metodoPago === 'mercadopago'}
                            onChange={handleChange}
                            disabled={isSubmitting || isCreatingPreference || !cancha.disponible}
                        />
                        Pagar con Mercado Pago
                        <img src="/imagenes/mercadopago.png" alt="Mercado Pago" className="payment-icon" />
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="metodoPago"
                            value="efectivo"
                            checked={formulario.metodoPago === 'efectivo'}
                            onChange={handleChange}
                            disabled={isSubmitting || isCreatingPreference || !cancha.disponible}
                        />
                        Pagar en Efectivo (al llegar a la cancha)
                        <img src="/imagenes/efectivo.png" alt="Efectivo" className="payment-icon" />
                    </label>
                </div>

                <button type="submit" className="reserva-submit-button" disabled={isSubmitting || isCreatingPreference || !cancha.disponible}>
                    {isSubmitting ? (formulario.metodoPago === 'mercadopago' ? 'Iniciando Pago...' : 'Creando Reserva...') : 'Confirmar Reserva'}
                </button>
            </form>

            {mensaje.text && (
                <p className={`reserva-mensaje ${mensaje.type}`}>
                    {mensaje.text}
                </p>
            )}
        </div>
    );
}

export default ReservaForm;