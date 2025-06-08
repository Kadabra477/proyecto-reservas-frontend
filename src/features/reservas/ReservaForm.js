// frontend/src/features/reservas/ReservaForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import api from '../../api/axiosConfig';
import './ReservaForm.css'; // Asegúrate de que tus estilos estén actualizados para la nueva UI

// Importar los logos directamente desde src/assets
import mercadopagoIcon from '../../assets/mercadopago.png'; 
import efectivoIcon from '../../assets/efectivo.png'; 

function ReservaForm() {
    // Ya no necesitamos canchaId de los params. Usaremos location.state para el complejoId preseleccionado
    // const { canchaId } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation(); // Para acceder al estado de la navegación

    const [complejo, setComplejo] = useState(null); // Estado para el complejo seleccionado
    const [complejosDisponibles, setComplejosDisponibles] = useState([]); // Para el selector de complejos
    const [selectedComplejoId, setSelectedComplejoId] = useState(''); // ID del complejo seleccionado
    
    const [tiposCanchaDisponiblesDelComplejo, setTiposCanchaDisponiblesDelComplejo] = useState([]); // Tipos de cancha para el complejo elegido
    const [selectedTipoCancha, setSelectedTipoCancha] = useState(''); // Tipo de cancha seleccionado
    
    const [formulario, setFormulario] = useState({
        nombreCompleto: '', // nombreCompleto es para el perfil del usuario
        email: '',         // Email para el registro o login (username en el backend)
        telefono: '',
        fecha: '',
        hora: '', 
        metodoPago: 'mercadopago',
    });
    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Para cargar complejos y tipos
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingPreference, setIsCreatingPreference] = useState(false);
    
    // Estados para la disponibilidad por tipo/fecha/hora
    const [availableCanchasCount, setAvailableCanchasCount] = useState(null); // Cantidad de canchas disponibles
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false); // Indica si se está verificando disponibilidad
    const [availabilityMessage, setAvailabilityMessage] = useState(''); // Mensaje sobre la disponibilidad
    const [hoursOptions, setHoursOptions] = useState([]); // Opciones de horas fijas para el select

    // Genera las opciones de hora (10:00 a 23:00 para slots de 1 hora)
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

    // Función para obtener la fecha mínima para el input de fecha
    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Cargar todos los complejos disponibles al inicio
    useEffect(() => {
        const fetchComplejos = async () => {
            setIsLoadingInitialData(true);
            try {
                const response = await api.get('/complejos'); // Endpoint para listar todos los complejos
                setComplejosDisponibles(response.data);
                
                let initialComplejoId = '';
                // Intenta preseleccionar un complejo si viene en el estado de la navegación (ej. desde Canchas.jsx)
                if (location.state && location.state.preselectedComplejoId) {
                    initialComplejoId = location.state.preselectedComplejoId;
                } else if (response.data.length > 0) {
                    // Si no viene preseleccionado, elige el primero por defecto
                    initialComplejoId = response.data[0].id;
                }

                if (initialComplejoId) {
                    setSelectedComplejoId(initialComplejoId);
                    // Buscar el objeto complejo completo para setComplejo
                    const foundComplejo = response.data.find(c => c.id === initialComplejoId);
                    setComplejo(foundComplejo);

                    // Extraer los tipos de cancha de ese complejo para el selector
                    if (foundComplejo && foundComplejo.canchaCounts) {
                        const types = Object.keys(foundComplejo.canchaCounts);
                        setTiposCanchaDisponiblesDelComplejo(types);
                        if (types.length > 0) {
                            setSelectedTipoCancha(types[0]); // Seleccionar el primer tipo por defecto
                        }
                    }
                }

            } catch (err) {
                console.error("Error al cargar complejos:", err);
                setMensaje({ type: 'error', text: 'Error al cargar los complejos disponibles.' });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchComplejos();
    }, [location.state]); // Dependencia para reaccionar a la navegación con estado


    // Efecto para actualizar los tipos de cancha cuando cambia el complejo seleccionado
    useEffect(() => {
        if (selectedComplejoId) {
            const currentComplejo = complejosDisponibles.find(c => c.id === selectedComplejoId);
            setComplejo(currentComplejo); // Asegura que el estado 'complejo' sea el objeto completo
            if (currentComplejo && currentComplejo.canchaCounts) {
                const types = Object.keys(currentComplejo.canchaCounts);
                setTiposCanchaDisponiblesDelComplejo(types);
                // Si el tipo de cancha seleccionado ya no existe en el nuevo complejo, o si no hay ninguno
                if (!types.includes(selectedTipoCancha) || !selectedTipoCancha && types.length > 0) {
                    setSelectedTipoCancha(types[0]); // Seleccionar el primero del nuevo complejo
                } else if (types.length === 0) {
                    setSelectedTipoCancha(''); // Si no hay tipos, limpiar
                }
            } else {
                setTiposCanchaDisponiblesDelComplejo([]);
                setSelectedTipoCancha('');
            }
        } else {
            setTiposCanchaDisponiblesDelComplejo([]);
            setSelectedTipoCancha('');
        }
    }, [selectedComplejoId, complejosDisponibles, selectedTipoCancha]);


    // Función para consultar la disponibilidad por complejo, tipo de cancha, fecha y hora
    const checkAvailability = useCallback(async () => {
        const { fecha, hora } = formulario;
        if (!selectedComplejoId || !selectedTipoCancha || !fecha || !hora) {
            setAvailableCanchasCount(null); // Resetear el contador
            setAvailabilityMessage('Selecciona un complejo, tipo de cancha, fecha y hora.');
            return;
        }

        setIsLoadingAvailability(true);
        setAvailabilityMessage('');
        try {
            // Llama al nuevo endpoint del backend que cuenta canchas por tipo
            const response = await api.get(`/reservas/disponibilidad-por-tipo?complejoId=${selectedComplejoId}&tipoCancha=${selectedTipoCancha}&fecha=${fecha}&hora=${hora}`);
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
    }, [formulario.fecha, formulario.hora, selectedComplejoId, selectedTipoCancha]);

    // Efecto para verificar disponibilidad cuando cambian los campos clave de la reserva
    useEffect(() => {
        checkAvailability();
    }, [formulario.fecha, formulario.hora, selectedComplejoId, selectedTipoCancha, checkAvailability]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prevFormulario => ({
            ...prevFormulario,
            [name]: value
        }));
        // Si cambia el ID del complejo, actualizar el estado
        if (name === 'complejoId') {
            setSelectedComplejoId(parseInt(value, 10)); // Convertir a número
            setSelectedTipoCancha(''); // Limpiar el tipo de cancha al cambiar de complejo
            setAvailableCanchasCount(null); // Limpiar disponibilidad
            setAvailabilityMessage('');
        }
        // Si cambia el tipo de cancha, actualizar el estado
        if (name === 'tipoCancha') {
            setSelectedTipoCancha(value);
            setAvailableCanchasCount(null); // Limpiar disponibilidad
            setAvailabilityMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        // Validaciones del lado del cliente antes de enviar
        const { nombreCompleto, email, telefono, fecha, hora, metodoPago } = formulario;

        if (!selectedComplejoId) {
            setMensaje({ type: 'error', text: 'Debes seleccionar un complejo.' });
            return;
        }
        if (!selectedTipoCancha) {
            setMensaje({ type: 'error', text: 'Debes seleccionar un tipo de cancha.' });
            return;
        }
        if (!nombreCompleto.trim() || !email.trim() || !telefono.trim() || !fecha || !hora || !metodoPago) {
            setMensaje({ type: 'error', text: 'Todos los campos personales, fecha, hora y método de pago son obligatorios.' });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email.trim())) {
            setMensaje({ type: 'error', text: 'Por favor, ingresa un correo electrónico válido.' });
            return;
        }
        if (!/^\d+$/.test(telefono.trim())) {
            setMensaje({ type: 'error', text: 'El teléfono debe contener solo números.' });
            return;
        }
        
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date();

        if (selectedDateTime <= now) {
            setMensaje({ type: 'error', text: 'No se puede reservar en el pasado. Selecciona una fecha y hora futura.' });
            return;
        }

        if (availableCanchasCount === null || availableCanchasCount <= 0) {
            setMensaje({ type: 'error', text: 'No hay canchas disponibles para este horario. Por favor, elige otro.' });
            return;
        }

        setIsSubmitting(true);

        const reservaData = {
            complejoId: selectedComplejoId, // ID del complejo seleccionado
            tipoCancha: selectedTipoCancha, // Tipo de cancha seleccionado
            nombre: nombreCompleto.trim(), // Nombre completo para el backend
            email: email.trim(),           // Email para el backend
            telefono: telefono.trim(),
            fecha: fecha,
            hora: hora,
            metodoPago: metodoPago,
        };

        try {
            const reservaResponse = await api.post("/reservas/crear", reservaData);
            const reservaCreada = reservaResponse.data;

            console.log("Reserva creada con ID:", reservaCreada.id, "Método de pago:", reservaCreada.metodoPago, "Complejo:", reservaCreada.complejoNombre, "Cancha asignada:", reservaCreada.nombreCanchaAsignada);

            // Resetear formulario y estados
            setFormulario({ nombreCompleto: '', email: '', telefono: '', fecha: '', hora: '', metodoPago: 'mercadopago' });
            setSelectedComplejoId('');
            setSelectedTipoCancha('');
            setComplejo(null);
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
            // Podrías recargar complejos o limpiar si es necesario
            // fetchComplejos(); 

            if (reservaCreada.metodoPago === 'mercadopago') {
                setMensaje({ type: 'info', text: 'Reserva creada. Redirigiendo a Mercado Pago...' });
                setIsCreatingPreference(true);
                try {
                    const preferenciaResponse = await api.post(
                        `/pagos/crear-preferencia/${reservaCreada.id}`,
                        {
                            reservaId: reservaCreada.id,
                            nombreCliente: reservaCreada.cliente,
                            monto: reservaCreada.precioTotal 
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
                setMensaje({ type: 'success', text: `Reserva creada exitosamente (ID: ${reservaCreada.id}). Te asignamos la cancha: ${reservaCreada.nombreCanchaAsignada || 'N/A'}. Puedes ver los detalles en tu Dashboard.` });
                setIsSubmitting(false);
                navigate('/dashboard');
            } else {
                setMensaje({ type: 'warning', text: 'Reserva creada, pero el método de pago es desconocido. Revisa tu Dashboard.' });
                setIsSubmitting(false);
                navigate('/dashboard');
            }

        } catch (reservaError) {
            console.error("Error al crear la reserva:", reservaError);
            let errorMessage = 'Error al crear la reserva.';
            if (reservaError.response?.data?.error) {
                errorMessage = reservaError.response.data.error;
            } else if (typeof reservaError.response?.data === 'string') { // Si el backend envía un string de error directo
                errorMessage = reservaError.response.data;
            } else if (reservaError.response?.status === 400) {
                errorMessage = 'Error en los datos de la reserva. Revisa los campos y la disponibilidad.';
            } else if (reservaError.response?.status === 409) { 
                 errorMessage = `Error: ${reservaError.response.data || 'El horario seleccionado ya no está disponible. Por favor, elige otro.'}`;
            } else {
                errorMessage = 'No se pudo crear la reserva. Intenta nuevamente.';
            }
            setMensaje({ type: 'error', text: errorMessage });
            setIsSubmitting(false);
        }
    };

    if (isLoadingInitialData) return <p className="loading-message">Cargando información de complejos...</p>;
    if (complejosDisponibles.length === 0 && !isLoadingInitialData) return <p className="error-message">No hay complejos disponibles para reservar. Contacta al administrador.</p>;

    return (
        <div className="reserva-form-container">
            <h2 className="reserva-form-title">Realizar Nueva Reserva</h2>
            
            <h3 className="reserva-form-subtitle">1. Selecciona Complejo, Tipo de Cancha, Fecha y Hora</h3>
            <form onSubmit={handleSubmit} className="reserva-formulario" noValidate>
                {/* Selector de Complejo */}
                <div className="form-group">
                    <label htmlFor="complejoId">Complejo:</label>
                    <select
                        id="complejoId"
                        name="complejoId"
                        value={selectedComplejoId}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting || isLoadingInitialData || complejosDisponibles.length === 0}
                    >
                        <option value="">Selecciona un complejo</option>
                        {complejosDisponibles.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Selector de Tipo de Cancha (solo si hay un complejo seleccionado) */}
                {selectedComplejoId && (
                    <div className="form-group">
                        <label htmlFor="tipoCancha">Tipo de Cancha:</label>
                        <select
                            id="tipoCancha"
                            name="tipoCancha"
                            value={selectedTipoCancha}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting || isLoadingInitialData || tiposCanchaDisponiblesDelComplejo.length === 0}
                        >
                            <option value="">Selecciona un tipo de cancha</option>
                            {tiposCanchaDisponiblesDelComplejo.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                    </div>
                )}

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
                        disabled={isSubmitting || isLoadingInitialData}
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
                        disabled={isSubmitting || isLoadingInitialData || !formulario.fecha || hoursOptions.length === 0}
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
                {(formulario.fecha && formulario.hora && selectedComplejoId && selectedTipoCancha) && (
                    <div className={`availability-status ${availableCanchasCount > 0 ? 'available' : 'not-available'}`}>
                        {isLoadingAvailability ? (
                            <p>Verificando disponibilidad...</p>
                        ) : (
                            <p>{availabilityMessage}</p>
                        )}
                    </div>
                )}
                
                <h3 className="reserva-form-subtitle">2. Completa tus datos personales y método de pago</h3>
                <div className="form-group">
                    <label htmlFor="nombreCompleto">Nombre completo:</label>
                    <input type="text" id="nombreCompleto" name="nombreCompleto" placeholder="Tu nombre completo" value={formulario.nombreCompleto} onChange={handleChange} required disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Correo electrónico:</label>
                    <input type="email" id="email" name="email" placeholder="Tu correo electrónico" value={formulario.email} onChange={handleChange} required disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono:</label>
                    <input type="tel" id="telefono" name="telefono" placeholder="Tu teléfono (solo números)" value={formulario.telefono} onChange={handleChange} required pattern="\d+" title="Ingresa solo números" disabled={isSubmitting || isLoadingInitialData} />
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
                            disabled={isSubmitting || isLoadingInitialData}
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
                            disabled={isSubmitting || isLoadingInitialData}
                        />
                        Pagar en Efectivo (al llegar al complejo)
                        <img src={efectivoIcon} alt="Efectivo" className="payment-icon" />
                    </label>
                </div>

                <button 
                    type="submit" 
                    className="reserva-submit-button" 
                    disabled={isSubmitting || isLoadingInitialData || availableCanchasCount <= 0}
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