// frontend/src/features/reservas/ReservaForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ReservaForm.css';

// Importar los logos directamente desde src/assets
import mercadopagoIcon from '../../assets/mercadopago.png'; 
import efectivoIcon from '../../assets/efectivo.png'; 

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
        hora: '', // Ahora será controlado por el backend
        metodoPago: 'mercadopago',
    });
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingCancha, setIsLoadingCancha] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingPreference, setIsCreatingPreference] = useState(false);
    const [errorCancha, setErrorCancha] = useState('');

    const [availableHours, setAvailableHours] = useState([]); // Nuevo estado para horas disponibles
    const [isLoadingHours, setIsLoadingHours] = useState(false); // Nuevo estado para carga de horas

    // Determinar la fecha mínima para el input de fecha (hoy o mañana si ya es tarde)
    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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

    // NUEVO: Función para obtener y establecer las horas disponibles
    const fetchAvailableHours = useCallback(async (date) => {
        if (!date || !canchaId) {
            setAvailableHours([]);
            setFormulario(prev => ({ ...prev, hora: '' })); // Limpiar hora si la fecha es inválida
            return;
        }

        setIsLoadingHours(true);
        setMensaje({ text: '', type: '' }); // Limpiar mensajes al cargar horas
        try {
            const response = await api.get(`/reservas/${canchaId}/slots-disponibles?fecha=${date}`);
            const hours = response.data.sort(); // Ordenar las horas
            setAvailableHours(hours);
            // Si la hora actual seleccionada no está disponible, o si no hay hora seleccionada, resetearla
            if (!hours.includes(formulario.hora)) {
                setFormulario(prev => ({ ...prev, hora: '' }));
            }
            if (hours.length === 0) {
                setMensaje({ type: 'warning', text: 'No hay horarios disponibles para esta cancha en la fecha seleccionada.' });
            }
        } catch (err) {
            console.error("Error al obtener horas disponibles:", err);
            setMensaje({ type: 'error', text: 'Error al cargar los horarios disponibles. Intenta de nuevo.' });
            setAvailableHours([]);
            setFormulario(prev => ({ ...prev, hora: '' }));
        } finally {
            setIsLoadingHours(false);
        }
    }, [canchaId, formulario.hora]);

    useEffect(() => {
        fetchCanchaDetails();
    }, [fetchCanchaDetails]);

    // Efecto para cargar horas disponibles cuando cambia la fecha seleccionada
    useEffect(() => {
        if (formulario.fecha) {
            fetchAvailableHours(formulario.fecha);
        } else {
            setAvailableHours([]); // Limpiar horas si no hay fecha
        }
    }, [formulario.fecha, fetchAvailableHours]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prevFormulario => ({
            ...prevFormulario,
            [name]: value
        }));
    };

    const validarFormulario = () => {
        setMensaje({ text: '', type: '' }); // Limpiar mensaje al revalidar
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
        
        // La validación de fecha y hora ahora se centra en si el slot está en `availableHours`
        // y si la fecha no es pasada. El backend hace la validación final.
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date();

        if (selectedDateTime <= now) {
            setMensaje({ type: 'error', text: 'No se puede reservar en el pasado. Selecciona una fecha y hora futura.' });
            return false;
        }

        // Si la hora seleccionada no está en la lista de horas disponibles, es inválida
        if (!availableHours.includes(hora)) {
             setMensaje({ type: 'error', text: 'El horario seleccionado no está disponible. Por favor, elige uno de la lista.' });
             return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        if (!validarFormulario()) return;
        if (!cancha || !cancha.disponible) {
            setMensaje({ type: 'error', text: 'La cancha no está disponible o no se pudo cargar.' });
            return;
        }

        setIsSubmitting(true);

        const reservaData = {
            canchaId: parseInt(canchaId, 10),
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            dni: formulario.dni.trim(),
            telefono: formulario.telefono.trim(),
            fecha: formulario.fecha,
            hora: formulario.hora,
            metodoPago: formulario.metodoPago,
        };

        try {
            const reservaResponse = await api.post("/reservas/crear", reservaData);
            const reservaCreada = reservaResponse.data;

            console.log("Reserva creada con ID:", reservaCreada.id, "Método de pago:", reservaCreada.metodoPago);

            setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', fecha: '', hora: '', metodoPago: 'mercadopago' });
            setAvailableHours([]); // Limpiar horas disponibles después de la reserva

            if (reservaCreada.metodoPago === 'mercadopago') {
                setMensaje({ type: 'info', text: 'Reserva creada. Redirigiendo a Mercado Pago...' });
                setIsCreatingPreference(true);
                try {
                    const preferenciaResponse = await api.post(
                        `/pagos/crear-preferencia/${reservaCreada.id}`,
                        {
                            reservaId: reservaCreada.id,
                            nombreCliente: reservaCreada.cliente,
                            monto: reservaCreada.precio
                        }
                    );
                    const initPoint = preferenciaResponse.data.initPoint;

                    if (!initPoint) {
                        throw new Error("No se recibió el punto de inicio de Mercado Pago.");
                    }

                    console.log("Redirigiendo a Mercado Pago:", initPoint);
                    window.location.href = initPoint;

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
                setMensaje({ type: 'success', text: `Reserva creada exitosamente (ID: ${reservaCreada.id}). Puedes ver los detalles en tu Dashboard.` });
                setIsSubmitting(false);
                navigate('/dashboard');
            } else {
                setMensaje({ type: 'warning', text: 'Reserva creada, pero el método de pago es desconocido. Revisa tu Dashboard.' });
                setIsSubmitting(false);
                navigate('/dashboard');
            }

        } catch (reservaError) {
            console.error("Error al crear la reserva:", reservaError);
            if (reservaError.response?.data?.error) {
                setMensaje({ type: 'error', text: `Error al crear reserva: ${reservaError.response.data.error}` });
            } else if (reservaError.response?.data) {
                // Si el error es de tipo String directo del backend (como en la validación de conflicto)
                setMensaje({ type: 'error', text: `Error al crear reserva: ${reservaError.response.data}` });
            } else if (reservaError.response?.status === 400) {
                setMensaje({ type: 'error', text: 'Error en los datos de la reserva. Revisa la fecha y hora.' });
            } else if (reservaError.response?.status === 409) { // Capturar el conflicto de disponibilidad
                 setMensaje({ type: 'error', text: `Error: ${reservaError.response.data || 'El horario seleccionado ya no está disponible. Por favor, elige otro.'}` });
            }
            else {
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
                    <input
                        type="date"
                        id="fecha"
                        name="fecha"
                        value={formulario.fecha}
                        onChange={handleChange}
                        required
                        min={getMinDate()} // Usa la función para obtener la fecha mínima
                        disabled={isSubmitting || isCreatingPreference || !cancha.disponible}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="hora">Hora:</label>
                    <select
                        id="hora"
                        name="hora"
                        value={formulario.hora}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting || isCreatingPreference || !cancha.disponible || isLoadingHours || availableHours.length === 0}
                    >
                        <option value="">
                            {isLoadingHours ? 'Cargando horas...' : (formulario.fecha ? 'Selecciona una hora' : 'Selecciona una fecha primero')}
                        </option>
                        {availableHours.map(hour => (
                            <option key={hour} value={hour}>
                                {hour.substring(0, 5)} {/* Mostrar solo HH:MM */}
                            </option>
                        ))}
                    </select>
                    {isLoadingHours && <p className="loading-small">Cargando horarios...</p>}
                    {!isLoadingHours && formulario.fecha && availableHours.length === 0 && (
                        <p className="no-hours-message">No hay horarios disponibles para la fecha seleccionada.</p>
                    )}
                </div>

                {/* Selección de Método de Pago */}
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
                        <img src={mercadopagoIcon} alt="Mercado Pago" className="payment-icon" /> 
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
                        <img src={efectivoIcon} alt="Efectivo" className="payment-icon" />
                    </label>
                </div>

                <button type="submit" className="reserva-submit-button" disabled={isSubmitting || isCreatingPreference || !cancha.disponible || availableHours.length === 0}>
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