// frontend/src/features/reservas/ReservaForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Ya no usamos useParams para canchaId aquí
import api from '../../api/axiosConfig';
import './ReservaForm.css';

// Importar los logos directamente desde src/assets
import mercadopagoIcon from '../../assets/mercadopago.png'; 
import efectivoIcon from '../../assets/efectivo.png'; 

function ReservaForm() {
    // Ya no necesitamos canchaId de los params si reservamos por tipo
    // const { canchaId } = useParams(); // ELIMINAR esta línea

    const navigate = useNavigate();

    // Estado para el tipo de cancha seleccionado
    const [selectedTipoCancha, setSelectedTipoCancha] = useState(''); 
    // Estado para los tipos de cancha disponibles (para el selector)
    const [tiposCanchaDisponibles, setTiposCanchaDisponibles] = useState([]); 

    const [formulario, setFormulario] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        fecha: '',
        hora: '', 
        metodoPago: 'mercadopago',
    });
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    // Estado para la carga inicial de tipos de cancha
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingPreference, setIsCreatingPreference] = useState(false);
    
    // Estados para la disponibilidad por tipo/fecha/hora
    const [availableCanchasCount, setAvailableCanchasCount] = useState(null); // Cantidad de canchas disponibles
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false); // Indica si se está verificando disponibilidad
    const [availabilityMessage, setAvailabilityMessage] = useState(''); // Mensaje sobre la disponibilidad
    const [hoursOptions, setHoursOptions] = useState([]); // Opciones de horas fijas para el select

    // Rellena las opciones del select de hora (10:00 a 23:00)
    useEffect(() => {
        const generateHours = () => {
            const hours = [];
            for (let i = 10; i <= 23; i++) { // De 10:00 a 23:00 (último slot para terminar a medianoche)
                hours.push(`${String(i).padStart(2, '0')}:00`);
            }
            setHoursOptions(hours);
        };
        generateHours();
    }, []);

    // Función para obtener la fecha mínima para el input de fecha (hoy o mañana si ya es tarde)
    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Cargar los tipos de cancha disponibles al inicio
    useEffect(() => {
        const fetchTiposCancha = async () => {
            setIsLoadingInitialData(true);
            try {
                // Asumiendo que /canchas devuelve todas las canchas, y podemos extraer tipos únicos de ahí.
                // Opcional: si tu backend tuviera un endpoint /canchas/tipos-disponibles, sería mejor.
                const response = await api.get('/canchas'); 
                const uniqueTypes = [...new Set(response.data.map(c => c.tipoCancha))].filter(Boolean); // Obtener tipos únicos no nulos
                setTiposCanchaDisponibles(uniqueTypes);
                // Si hay tipos, seleccionar el primero por defecto
                if (uniqueTypes.length > 0) {
                    setSelectedTipoCancha(uniqueTypes[0]); 
                    setFormulario(prev => ({ ...prev, tipoCancha: uniqueTypes[0] }));
                }
            } catch (err) {
                console.error("Error al obtener tipos de cancha:", err);
                setMensaje({ type: 'error', text: 'Error al cargar los tipos de cancha disponibles.' });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchTiposCancha();
    }, []);

    // Función para consultar la disponibilidad por tipo de cancha, fecha y hora
    const checkAvailability = useCallback(async () => {
        const { fecha, hora } = formulario;
        if (!selectedTipoCancha || !fecha || !hora) {
            setAvailableCanchasCount(null); // Resetear el contador
            setAvailabilityMessage('Selecciona un tipo de cancha, fecha y hora.');
            return;
        }

        setIsLoadingAvailability(true);
        setAvailabilityMessage('');
        try {
            // Llama al nuevo endpoint del backend
            const response = await api.get(`/reservas/disponibilidad-por-tipo?tipoCancha=${selectedTipoCancha}&fecha=${fecha}&hora=${hora}`);
            const count = response.data; // El backend devuelve un número entero
            setAvailableCanchasCount(count);
            if (count > 0) {
                setAvailabilityMessage(`¡Hay ${count} canchas de ${selectedTipoCancha} disponibles a las ${hora.substring(0, 5)}!`);
                setMensaje({ text: '', type: '' }); // Limpiar mensaje de error si hay disponibles
            } else {
                setAvailabilityMessage(`No hay canchas de ${selectedTipoCancha} disponibles a las ${hora.substring(0, 5)}. Elige otro horario.`);
                setMensaje({ type: 'error', text: 'Horario no disponible.' });
            }
        } catch (err) {
            console.error("Error al consultar disponibilidad:", err);
            setAvailableCanchasCount(0);
            setAvailabilityMessage('Error al verificar disponibilidad. Intenta de nuevo.');
            setMensaje({ type: 'error', text: 'Error al verificar disponibilidad.' });
        } finally {
            setIsLoadingAvailability(false);
        }
    }, [formulario.fecha, formulario.hora, selectedTipoCancha]);

    // Efecto para verificar disponibilidad cuando cambian los campos clave
    useEffect(() => {
        checkAvailability();
    }, [formulario.fecha, formulario.hora, selectedTipoCancha, checkAvailability]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prevFormulario => ({
            ...prevFormulario,
            [name]: value
        }));
        // Si cambia el tipo de cancha, actualizar el estado
        if (name === 'tipoCancha') {
            setSelectedTipoCancha(value);
        }
    };

    const validarFormulario = () => {
        setMensaje({ text: '', type: '' }); // Limpiar mensaje al revalidar
        const { nombre, apellido, dni, telefono, fecha, hora, metodoPago } = formulario;

        if (!selectedTipoCancha || !nombre.trim() || !apellido.trim() || !dni.trim() || !telefono.trim() || !fecha || !hora || !metodoPago) {
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
        
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date();

        if (selectedDateTime <= now) {
            setMensaje({ type: 'error', text: 'No se puede reservar en el pasado. Selecciona una fecha y hora futura.' });
            return false;
        }

        // Se valida que haya canchas disponibles EN EL MOMENTO DE LA UI
        if (availableCanchasCount === null || availableCanchasCount <= 0) {
            setMensaje({ type: 'error', text: 'No hay canchas disponibles para este horario. Por favor, elige otro.' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        if (!validarFormulario()) return;
        
        setIsSubmitting(true);

        const reservaData = {
            tipoCancha: selectedTipoCancha, // Enviar el tipo de cancha al backend
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            dni: formulario.dni.trim(),
            telefono: formulario.telefono.trim(),
            fecha: formulario.fecha,
            hora: formulario.hora,
            metodoPago: formulario.metodoPago,
            // Puedes añadir jugadores y equipos si el formulario los recoge
            // jugadores: formulario.jugadores,
            // equipo1: formulario.equipo1,
            // equipo2: formulario.equipo2,
        };

        try {
            const reservaResponse = await api.post("/reservas/crear", reservaData);
            const reservaCreada = reservaResponse.data;

            console.log("Reserva creada con ID:", reservaCreada.id, "Método de pago:", reservaCreada.metodoPago, "Cancha asignada:", reservaCreada.canchaNombre);

            // Resetear formulario y estados
            setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', fecha: '', hora: '', metodoPago: 'mercadopago' });
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
            setSelectedTipoCancha(tiposCanchaDisponibles[0] || ''); // Restablecer el tipo seleccionado

            if (reservaCreada.metodoPago === 'mercadopago') {
                setMensaje({ type: 'info', text: 'Reserva creada. Redirigiendo a Mercado Pago...' });
                setIsCreatingPreference(true);
                try {
                    const preferenciaResponse = await api.post(
                        `/pagos/crear-preferencia/${reservaCreada.id}`,
                        {
                            reservaId: reservaCreada.id,
                            nombreCliente: reservaCreada.cliente,
                            monto: reservaCreada.precioTotal // Usar precioTotal del DTO de respuesta
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
                // Mensaje al usuario, incluyendo la cancha asignada
                setMensaje({ type: 'success', text: `Reserva creada exitosamente (ID: ${reservaCreada.id}). Te asignamos la cancha: ${reservaCreada.canchaNombre || 'N/A'}. Puedes ver los detalles en tu Dashboard.` });
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
                setMensaje({ type: 'error', text: `Error al crear reserva: ${reservaError.response.data}` });
            } else if (reservaError.response?.status === 400) {
                setMensaje({ type: 'error', text: 'Error en los datos de la reserva. Revisa los campos y la disponibilidad.' });
            } else if (reservaError.response?.status === 409) { // Capturar el conflicto de disponibilidad
                 setMensaje({ type: 'error', text: `Error: ${reservaError.response.data || 'El horario seleccionado ya no está disponible. Por favor, elige otro.'}` });
            } else {
                setMensaje({ type: 'error', text: 'No se pudo crear la reserva. Intenta nuevamente.' });
            }
            setIsSubmitting(false);
        }
    };

    if (isLoadingInitialData) return <p className="loading-message">Cargando tipos de cancha...</p>;
    if (tiposCanchaDisponibles.length === 0 && !isLoadingInitialData) return <p className="error-message">No hay tipos de cancha disponibles para reservar. Crea canchas en el panel de administrador.</p>;

    return (
        <div className="reserva-form-container">
            <h2 className="reserva-form-title">Reservar Cancha</h2>
            
            <h3 className="reserva-form-subtitle">Selecciona tipo, fecha y hora</h3>
            <form onSubmit={handleSubmit} className="reserva-formulario" noValidate>
                {/* Selector de Tipo de Cancha */}
                <div className="form-group">
                    <label htmlFor="tipoCancha">Tipo de Cancha:</label>
                    <select
                        id="tipoCancha"
                        name="tipoCancha"
                        value={selectedTipoCancha}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting || isCreatingPreference || isLoadingInitialData || tiposCanchaDisponibles.length === 0}
                    >
                         {tiposCanchaDisponibles.length === 0 ? (
                            <option value="">Cargando tipos...</option>
                        ) : (
                            tiposCanchaDisponibles.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))
                        )}
                    </select>
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
                        min={getMinDate()} 
                        disabled={isSubmitting || isCreatingPreference || isLoadingInitialData}
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
                        disabled={isSubmitting || isCreatingPreference || isLoadingInitialData || !formulario.fecha || hoursOptions.length === 0}
                    >
                        <option value="">Selecciona una hora</option>
                        {hoursOptions.map(hour => (
                            <option key={hour} value={hour}>
                                {hour.substring(0, 5)} {/* Mostrar solo HH:MM */}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Mensaje de disponibilidad (cantidad de canchas disponibles) */}
                {(formulario.fecha && formulario.hora && selectedTipoCancha) && (
                    <div className={`availability-status ${availableCanchasCount > 0 ? 'available' : 'not-available'}`}>
                        {isLoadingAvailability ? (
                            <p>Verificando disponibilidad...</p>
                        ) : (
                            <p>{availabilityMessage}</p>
                        )}
                    </div>
                )}
                
                {/* Campos de datos personales */}
                <h3 className="reserva-form-subtitle">Completa tus datos personales</h3>
                <div className="form-group">
                    <label htmlFor="nombre">Nombre:</label>
                    <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" value={formulario.nombre} onChange={handleChange} required disabled={isSubmitting || isCreatingPreference || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="apellido">Apellido:</label>
                    <input type="text" id="apellido" name="apellido" placeholder="Tu apellido" value={formulario.apellido} onChange={handleChange} required disabled={isSubmitting || isCreatingPreference || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="dni">DNI:</label>
                    <input type="text" id="dni" name="dni" placeholder="Tu DNI (7-8 dígitos)" value={formulario.dni} onChange={handleChange} required pattern="\d{7,8}" title="Ingresa 7 u 8 dígitos sin puntos" disabled={isSubmitting || isCreatingPreference || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono:</label>
                    <input type="tel" id="telefono" name="telefono" placeholder="Tu teléfono (solo números)" value={formulario.telefono} onChange={handleChange} required pattern="\d+" title="Ingresa solo números" disabled={isSubmitting || isCreatingPreference || isLoadingInitialData} />
                </div>

                {/* Selección de Método de Pago */}
                <h3 className="reserva-form-subtitle">Selecciona tu método de pago</h3>
                <div className="form-group payment-method-selection">
                    <label>
                        <input
                            type="radio"
                            name="metodoPago"
                            value="mercadopago"
                            checked={formulario.metodoPago === 'mercadopago'}
                            onChange={handleChange}
                            disabled={isSubmitting || isCreatingPreference || isLoadingInitialData}
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
                            disabled={isSubmitting || isCreatingPreference || isLoadingInitialData}
                        />
                        Pagar en Efectivo (al llegar a la cancha)
                        <img src={efectivoIcon} alt="Efectivo" className="payment-icon" />
                    </label>
                </div>

                <button 
                    type="submit" 
                    className="reserva-submit-button" 
                    // Deshabilitado si está enviando, cargando, o no hay canchas disponibles
                    disabled={isSubmitting || isCreatingPreference || isLoadingInitialData || availableCanchasCount <= 0}
                >
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