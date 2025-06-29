// frontend/src/features/reservas/ReservaForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import api from '../../api/axiosConfig';
import './ReservaForm.css';

import mercadopagoIcon from '../../assets/mercadopago.png';
import efectivoIcon from '../../assets/efectivo.png';

function ReservaForm() {
    const navigate = useNavigate();
    const location = useLocation();

    const [complejo, setComplejo] = useState(null); 
    const [tiposCanchaDisponiblesDelComplejo, setTiposCanchaDisponiblesDelComplejo] = useState([]); 
    const [selectedTipoCancha, setSelectedTipoCancha] = useState(''); 

    const [formulario, setFormulario] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        fecha: '',
        hora: '',
        metodoPago: 'mercadopago',
    });

    const [mensaje, setMensaje] = useState({ text: '', type: '' });
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingPreference, setIsCreatingPreference] = useState(false);

    const [availableCanchasCount, setAvailableCanchasCount] = useState(null);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState('');
    const [hoursOptions, setHoursOptions] = useState([]); 

    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('jwtToken');
                if (token) {
                    const response = await api.get('/users/me');
                    const userProfile = response.data;
                    setFormulario(prevForm => ({
                        ...prevForm,
                        nombre: userProfile.nombreCompleto || '', 
                        apellido: '', 
                        email: userProfile.username || '',
                        telefono: userProfile.telefono || '',
                        dni: userProfile.dni || '' 
                    }));
                }
            } catch (error) {
                console.error("Error al cargar perfil de usuario:", error);
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const loadPreselectedComplejo = async () => {
            setIsLoadingInitialData(true);
            const preselectedComplejoId = location.state?.preselectedComplejoId;
            
            if (!preselectedComplejoId) {
                setMensaje({ type: 'error', text: 'No se ha seleccionado un complejo para reservar. Por favor, vuelve a la lista de complejos.' });
                setIsLoadingInitialData(false);
                return;
            }

            try {
                const response = await api.get(`/complejos/${preselectedComplejoId}`);
                const fetchedComplejo = response.data;
                setComplejo(fetchedComplejo);

                if (fetchedComplejo && fetchedComplejo.canchaCounts) {
                    const types = Object.keys(fetchedComplejo.canchaCounts);
                    setTiposCanchaDisponiblesDelComplejo(types);
                    if (types.length > 0) {
                        setSelectedTipoCancha(types[0]); 
                    }
                } else {
                    setTiposCanchaDisponiblesDelComplejo([]);
                    setSelectedTipoCancha('');
                    setMensaje({ type: 'warning', text: 'El complejo seleccionado no tiene tipos de cancha configurados.' });
                }
                
                // --- INICIO DE LA LÓGICA CORREGIDA PARA GENERAR HORAS ---
                if (fetchedComplejo.horarioApertura && fetchedComplejo.horarioCierre) {
                    const [aperturaHoras, aperturaMinutos] = fetchedComplejo.horarioApertura.split(':').map(Number);
                    const [cierreHoras, cierreMinutos] = fetchedComplejo.horarioCierre.split(':').map(Number);
                    
                    const generatedHours = [];
                    // Convertir todo a minutos para manejar mejor los rangos y el cruce de medianoche
                    const aperturaTotalMinutos = aperturaHoras * 60 + aperturaMinutos;
                    let cierreTotalMinutos = cierreHoras * 60 + cierreMinutos;

                    // Si el horario de cierre es menor que el de apertura, significa que cierra al día siguiente
                    if (cierreTotalMinutos <= aperturaTotalMinutos) {
                        cierreTotalMinutos += (24 * 60); // Sumar 24 horas en minutos
                    }

                    let currentTimeInMinutes = aperturaTotalMinutos;

                    while (currentTimeInMinutes < cierreTotalMinutos) {
                        const hour = Math.floor(currentTimeInMinutes / 60) % 24; 
                        const minute = currentTimeInMinutes % 60;
                        const formattedHour = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        
                        // Solo añadir la hora si es igual o posterior a la hora actual (si es hoy)
                        const now = new Date();
                        const isToday = new Date(formulario.fecha).toDateString() === now.toDateString();
                        const currentRealHour = now.getHours();
                        const currentRealMinute = now.getMinutes();
                        
                        if (!isToday || hour > currentRealHour || (hour === currentRealHour && minute >= currentRealMinute)) {
                             generatedHours.push(formattedHour);
                        }
                       
                        currentTimeInMinutes += 60; // Incrementa en 60 minutos (1 hora). Ajusta si tus slots son diferentes.
                    }

                    setHoursOptions(generatedHours);
                    console.log("Horas generadas:", generatedHours); 
                } else {
                    setHoursOptions([]);
                    setMensaje({ type: 'error', text: 'Horarios de apertura y cierre no configurados para el complejo.' });
                }
                // --- FIN DE LA LÓGICA CORREGIDA PARA GENERAR HORAS ---

            } catch (err) {
                console.error("Error al cargar el complejo preseleccionado:", err);
                setMensaje({ type: 'error', text: 'Error al cargar los detalles del complejo seleccionado.' });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        loadPreselectedComplejo();
    }, [location.state, formulario.fecha]); // Se añadió formulario.fecha como dependencia

    const checkAvailability = useCallback(async () => {
        const { fecha, hora } = formulario;
        if (!complejo || !selectedTipoCancha || !fecha || !hora) {
            setAvailableCanchasCount(null);
            setAvailabilityMessage('Selecciona un tipo de cancha, fecha y hora para verificar disponibilidad.');
            return;
        }

        const selectedDate = new Date(fecha);
        const now = new Date();
        const currentDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);

        // Esta validación de tiempo pasado ya la hace la generación de hoursOptions,
        // pero la mantenemos aquí como un respaldo extra para el envío de datos al backend.
        if (selectedDate.toDateString() === now.toDateString()) { 
            if (selectedDateTime < currentDateTime) { 
                setAvailableCanchasCount(0);
                setAvailabilityMessage('No puedes reservar una hora que ya ha pasado hoy.');
                setMensaje({ type: 'error', text: 'Hora en el pasado no disponible.' });
                return;
            }
        }

        setIsLoadingAvailability(true);
        setAvailabilityMessage('');
        try {
            const response = await api.get(`/reservas/disponibilidad-por-tipo?complejoId=${complejo.id}&tipoCancha=${selectedTipoCancha}&fecha=${fecha}&hora=${hora}`);
            const count = response.data;
            setAvailableCanchasCount(count);
            if (count > 0) {
                setAvailabilityMessage(`¡Hay ${count} canchas de ${selectedTipoCancha} disponibles a las ${hora.substring(0, 5)}!`);
                setMensaje({ text: '', type: '' }); 
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
    }, [formulario.fecha, formulario.hora, complejo, selectedTipoCancha]);


    useEffect(() => {
        if (complejo && formulario.fecha && formulario.hora && selectedTipoCancha) {
            checkAvailability();
        } else {
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
    }, [formulario.fecha, formulario.hora, selectedTipoCancha, complejo, checkAvailability]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario(prevFormulario => ({
            ...prevFormulario,
            [name]: value
        }));
        
        if (name === 'tipoCancha') {
            setSelectedTipoCancha(value);
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
        if (name === 'fecha') { // Si la fecha cambia, regenerar las opciones de hora
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
            // Disparar la regeneración de hoursOptions cuando la fecha cambie
            // La dependencia de formulario.fecha en el useEffect de loadPreselectedComplejo lo hará.
        }
        if (name === 'hora') {
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const { nombre, apellido, dni, email, telefono, fecha, hora, metodoPago } = formulario;

        if (!complejo) { setMensaje({ type: 'error', text: 'Error: No hay complejo seleccionado.' }); return; }
        if (!selectedTipoCancha) { setMensaje({ type: 'error', text: 'Debes seleccionar un tipo de cancha.' }); return; }
        if (!nombre.trim() || !apellido.trim() || !dni || !email.trim() || !telefono.trim() || !fecha || !hora || !metodoPago) {
            setMensaje({ type: 'error', text: 'Todos los campos personales (Nombre, Apellido, DNI, Email, Teléfono, Fecha, Hora y Método de Pago) son obligatorios.' });
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMensaje({ type: 'error', text: 'Por favor, ingresa un correo electrónico válido.' }); return; }
        if (!/^\d+$/.test(telefono.trim())) { setMensaje({ type: 'error', text: 'El teléfono debe contener solo números.' }); return; }
        if (!/^\d{7,8}$/.test(dni)) { setMensaje({ type: 'error', text: 'El DNI debe contener 7 u 8 dígitos numéricos.' }); return; }

        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date();
        const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()); // Usar minutos para comparación más precisa

        if (selectedDateTime < currentHourStart) {
            setMensaje({ type: 'error', text: 'No se puede reservar en el pasado. Selecciona una fecha y hora futura.' });
            return;
        }

        if (availableCanchasCount === null || availableCanchasCount <= 0) {
            setMensaje({ type: 'error', text: 'No hay canchas disponibles para este horario. Por favor, elige otro o espera la verificación.' });
            return;
        }

        setIsSubmitting(true);

        const reservaData = {
            complejoId: complejo.id, 
            tipoCancha: selectedTipoCancha,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            dni: parseInt(dni, 10),
            email: email.trim(),
            telefono: telefono.trim(),
            fecha: fecha,
            hora: hora,
            metodoPago: metodoPago,
        };

        try {
            const reservaResponse = await api.post("/reservas/crear", reservaData);
            const reservaCreada = reservaResponse.data;

            console.log("Reserva creada con ID:", reservaCreada.id, "Método de pago:", reservaCreada.metodoPago, "Complejo:", reservaCreada.complejoNombre, "Cancha asignada:", reservaCreada.nombreCanchaAsignada);

            setFormulario(prevForm => ({
                ...prevForm,
                nombre: '',
                apellido: '',
                dni: '',
                email: '',
                telefono: '',
                fecha: '',
                hora: '',
                metodoPago: 'mercadopago'
            }));
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');


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
            console.log("Error al crear la reserva (raw error object):", reservaError);
            let errorMessage = 'Error al crear la reserva.';
            if (reservaError.response && reservaError.response.data) {
                if (reservaError.response.data.message) {
                    errorMessage = reservaError.response.data.message;
                } else if (typeof reservaError.response.data === 'string') {
                    errorMessage = reservaError.response.data;
                }
            } else {
                errorMessage = reservaError.message || 'No se pudo crear la reserva. Intenta nuevamente.';
            }
            setMensaje({ type: 'error', text: errorMessage });
            setIsSubmitting(false);
        }
    };

    if (isLoadingInitialData) return <p className="loading-message">Cargando complejo...</p>;
    if (!complejo && !isLoadingInitialData) return <p className="error-message">No se pudo cargar el complejo o no se especificó uno para reservar. Por favor, asegúrate de acceder a la reserva desde la tarjeta de un complejo válido.</p>;

    return (
        <div className="reserva-form-container">
            <h2 className="reserva-form-title">Realizar Nueva Reserva</h2>

            {complejo && (
                <div className="reserva-cancha-details">
                    <img src={complejo.fotoUrl || 'https://via.placeholder.com/400x200?text=Complejo+Deportivo'} alt={`Foto de ${complejo.nombre}`} className="reserva-cancha-img" />
                    <h3>{complejo.nombre}</h3>
                    <p><strong>Ubicación:</strong> {complejo.ubicacion}</p>
                    <p><strong>Teléfono:</strong> {complejo.telefono}</p>
                    <p><strong>Horario de atención:</strong> {complejo.horarioApertura} - {complejo.horarioCierre}</p>
                    {selectedTipoCancha && complejo.canchaPrices && complejo.canchaPrices[selectedTipoCancha] != null && ( 
                        <p className="reserva-price">
                            <strong>Precio por Hora ({selectedTipoCancha}):</strong> ${complejo.canchaPrices[selectedTipoCancha].toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    )}
                </div>
            )}

            <h3 className="reserva-form-subtitle">1. Selecciona Tipo de Cancha, Fecha y Hora</h3>
            <form onSubmit={handleSubmit} className="reserva-formulario" noValidate>
                <div className="form-group">
                    <label htmlFor="complejoId">Complejo:</label>
                    <input
                        type="text"
                        id="complejoId"
                        name="complejoId"
                        value={complejo ? complejo.nombre : 'Cargando...'}
                        disabled
                        className="blocked-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tipoCancha">Tipo de Cancha:</label>
                    <select
                        id="tipoCancha"
                        name="tipoCancha"
                        value={selectedTipoCancha}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting || isLoadingInitialData || !complejo || tiposCanchaDisponiblesDelComplejo.length === 0}
                    >
                        <option value="">Selecciona un tipo de cancha</option>
                        {tiposCanchaDisponiblesDelComplejo.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                    {complejo && tiposCanchaDisponiblesDelComplejo.length === 0 && (
                        <p className="small-info-text">Este complejo no tiene tipos de cancha configurados.</p>
                    )}
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
                        disabled={isSubmitting || isLoadingInitialData || !selectedTipoCancha}
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
                        disabled={isSubmitting || isLoadingInitialData || !formulario.fecha || hoursOptions.length === 0 || !selectedTipoCancha}
                    >
                        <option value="">Selecciona una hora</option>
                        {hoursOptions.map(hour => (
                            <option key={hour} value={hour}>
                                {hour.substring(0, 5)}
                            </option>
                        ))}
                    </select>
                    {complejo && formulario.fecha && hoursOptions.length === 0 && (
                        <p className="small-info-text">No hay horarios disponibles para este complejo.</p>
                    )}
                </div>

                {(formulario.fecha && formulario.hora && complejo && selectedTipoCancha) && (
                    <div className={`availability-status ${availableCanchasCount > 0 ? 'available' : 'not-available'} ${isLoadingAvailability ? 'loading' : ''}`}>
                        {isLoadingAvailability ? (
                            <p>Verificando disponibilidad...</p>
                        ) : (
                            <p>{availabilityMessage}</p>
                        )}
                    </div>
                )}

                <h3 className="reserva-form-subtitle full-width">2. Completa tus datos personales y método de pago</h3>
                <div className="form-group">
                    <label htmlFor="nombre">Nombre:</label>
                    <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" value={formulario.nombre} onChange={handleChange} required disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="apellido">Apellido:</label>
                    <input type="text" id="apellido" name="apellido" placeholder="Tu apellido" value={formulario.apellido} onChange={handleChange} required disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="dni">DNI:</label>
                    <input type="text" id="dni" name="dni" placeholder="Solo 7 u 8 números" value={formulario.dni} onChange={handleChange} required pattern="\d{7,8}" title="Ingresa 7 u 8 dígitos numéricos" disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Correo electrónico:</label>
                    <input type="email" id="email" name="email" placeholder="Tu correo electrónico" value={formulario.email} onChange={handleChange} required disabled={isSubmitting || isLoadingInitialData} />
                </div>
                <div className="form-group">
                    <label htmlFor="telefono">Teléfono:</label>
                    <input type="tel" id="telefono" name="telefono" placeholder="Tu teléfono (solo números)" value={formulario.telefono} onChange={handleChange} required pattern="\d+" title="Ingresa solo números" disabled={isSubmitting || isLoadingInitialData} />
                </div>

                <div className="form-group payment-method-selection full-width">
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
                    disabled={isSubmitting || isLoadingInitialData || availableCanchasCount <= 0 || isCreatingPreference}
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