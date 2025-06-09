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

    const [complejo, setComplejo] = useState(null); // Objeto del complejo seleccionado
    const [complejosDisponibles, setComplejosDisponibles] = useState([]); // Para el selector de complejos
    const [selectedComplejoId, setSelectedComplejoId] = useState(''); // ID del complejo seleccionado

    const [tiposCanchaDisponiblesDelComplejo, setTiposCanchaDisponiblesDelComplejo] = useState([]); // Tipos de cancha para el complejo elegido
    const [selectedTipoCancha, setSelectedTipoCancha] = useState(''); // Tipo de cancha seleccionado

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
    const [hoursOptions, setHoursOptions] = useState([]); // Opciones de horas generadas dinámicamente

    // Función para obtener la fecha mínima para el input de fecha (hoy)
    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Cargar datos del usuario autenticado si existen (Nombre, Apellido, Email, Teléfono)
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('jwtToken');
                if (token) {
                    const response = await api.get('/users/me');
                    const userProfile = response.data;
                    setFormulario(prevForm => ({
                        ...prevForm,
                        // Simplificación: si nombreCompleto tiene varias palabras, asigna todo a 'nombre'
                        // y deja 'apellido' vacío para que el usuario lo complete.
                        // La mejor solución es que el backend devuelva nombre y apellido separados.
                        nombre: userProfile.nombreCompleto || '', // Asignar todo a 'nombre' por defecto
                        apellido: '', // Dejar vacío para nombres compuestos, el usuario lo completa
                        email: userProfile.username || '',
                        telefono: userProfile.telefono || '',
                        dni: userProfile.dni || '' // Si el backend alguna vez devuelve DNI
                    }));
                }
            } catch (error) {
                console.error("Error al cargar perfil de usuario:", error);
                // No es crítico, el usuario puede ingresar manualmente sus datos
            }
        };
        fetchUserProfile();
    }, []);


    // Cargar todos los complejos disponibles al inicio y preseleccionar
    useEffect(() => {
        const fetchComplejos = async () => {
            setIsLoadingInitialData(true);
            try {
                const response = await api.get('/complejos');
                const fetchedComplejos = Array.isArray(response.data) ? response.data : [];
                setComplejosDisponibles(fetchedComplejos);

                let initialComplejoId = '';
                if (location.state && location.state.preselectedComplejoId) {
                    initialComplejoId = location.state.preselectedComplejoId;
                } else if (fetchedComplejos.length > 0) {
                    initialComplejoId = fetchedComplejos[0].id;
                }

                if (initialComplejoId) {
                    setSelectedComplejoId(initialComplejoId);
                    const foundComplejo = fetchedComplejos.find(c => c.id === initialComplejoId);
                    setComplejo(foundComplejo);

                    if (foundComplejo && foundComplejo.canchaCounts) {
                        const types = Object.keys(foundComplejo.canchaCounts);
                        setTiposCanchaDisponiblesDelComplejo(types);
                        if (types.length > 0 && !selectedTipoCancha) {
                            setSelectedTipoCancha(types[0]);
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
    }, [location.state, selectedTipoCancha]);


    // Efecto para actualizar los tipos de cancha y generar opciones de hora cuando cambia el complejo
    useEffect(() => {
        if (selectedComplejoId) {
            const currentComplejo = complejosDisponibles.find(c => c.id === selectedComplejoId);
            setComplejo(currentComplejo); // Asegura que el estado 'complejo' sea el objeto completo

            if (currentComplejo) {
                // Actualizar tipos de cancha disponibles
                if (currentComplejo.canchaCounts) {
                    const types = Object.keys(currentComplejo.canchaCounts);
                    setTiposCanchaDisponiblesDelComplejo(types);
                    if (!types.includes(selectedTipoCancha) || (selectedTipoCancha === '' && types.length > 0)) {
                        setSelectedTipoCancha(types[0]);
                    } else if (types.length === 0) {
                        setSelectedTipoCancha('');
                    }
                } else {
                    setTiposCanchaDisponiblesDelComplejo([]);
                    setSelectedTipoCancha('');
                }

                // Generar opciones de hora basadas en el horario del complejo
                const startHour = parseInt(currentComplejo.horarioApertura.substring(0, 2), 10);
                const endHour = parseInt(currentComplejo.horarioCierre.substring(0, 2), 10);
                const generatedHours = [];
                for (let i = startHour; i < endHour; i++) { // 'i < endHour' para que el último slot termine a la hora de cierre
                    generatedHours.push(`${String(i).padStart(2, '0')}:00`);
                }
                setHoursOptions(generatedHours);

            } else {
                setTiposCanchaDisponiblesDelComplejo([]);
                setSelectedTipoCancha('');
                setHoursOptions([]);
            }
        } else {
            setTiposCanchaDisponiblesDelComplejo([]);
            setSelectedTipoCancha('');
            setHoursOptions([]);
        }
    }, [selectedComplejoId, complejosDisponibles, selectedTipoCancha]);


    // Función para consultar la disponibilidad por complejo, tipo de cancha, fecha y hora
    const checkAvailability = useCallback(async () => {
        const { fecha, hora } = formulario;
        if (!selectedComplejoId || !selectedTipoCancha || !fecha || !hora || !complejo) {
            setAvailableCanchasCount(null);
            setAvailabilityMessage('Selecciona un complejo, tipo de cancha, fecha y hora para verificar disponibilidad.');
            return;
        }

        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date(); // Hora actual del usuario

        // Lógica para bloquear horas pasadas del día actual
        if (fecha === getMinDate()) { // Si la fecha seleccionada es hoy
            const currentHour = now.getHours();
            const selectedHour = parseInt(hora.substring(0, 2), 10);

            if (selectedHour < currentHour) { // Si la hora seleccionada ya pasó hoy
                setAvailableCanchasCount(0);
                setAvailabilityMessage('No puedes reservar una hora que ya ha pasado hoy.');
                setMensaje({ type: 'error', text: 'Hora en el pasado no disponible.' });
                return;
            }
        }

        setIsLoadingAvailability(true);
        setAvailabilityMessage('');
        try {
            const response = await api.get(`/reservas/disponibilidad-por-tipo?complejoId=${selectedComplejoId}&tipoCancha=${selectedTipoCancha}&fecha=${fecha}&hora=${hora}`);
            const count = response.data;
            setAvailableCanchasCount(count);
            if (count > 0) {
                setAvailabilityMessage(`¡Hay ${count} canchas de ${selectedTipoCancha} disponibles a las ${hora.substring(0, 5)}!`);
                setMensaje({ text: '', type: '' });
            } else {
                setAvailabilityMessage(`No hay canchas de ${selectedTipoCancha} disponibles a las ${hora.substring(0, 5)}. Elige otro horario o tipo.`);
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
    }, [formulario.fecha, formulario.hora, selectedComplejoId, selectedTipoCancha, complejo]);


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
        if (name === 'complejoId') {
            setSelectedComplejoId(parseInt(value, 10));
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
        if (name === 'tipoCancha') {
            setSelectedTipoCancha(value);
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
        // Si cambia la fecha o la hora, también limpiar la disponibilidad
        if (name === 'fecha' || name === 'hora') {
            setAvailableCanchasCount(null);
            setAvailabilityMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ text: '', type: '' });

        const { nombre, apellido, dni, email, telefono, fecha, hora, metodoPago } = formulario;

        // Validaciones del lado del cliente
        if (!selectedComplejoId) { setMensaje({ type: 'error', text: 'Debes seleccionar un complejo.' }); return; }
        if (!selectedTipoCancha) { setMensaje({ type: 'error', text: 'Debes seleccionar un tipo de cancha.' }); return; }
        if (!nombre.trim() || !apellido.trim() || !dni || !email.trim() || !telefono.trim() || !fecha || !hora || !metodoPago) {
            setMensaje({ type: 'error', text: 'Todos los campos (Nombre, Apellido, DNI, Email, Teléfono, Fecha, Hora y Método de Pago) son obligatorios.' });
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMensaje({ type: 'error', text: 'Por favor, ingresa un correo electrónico válido.' }); return; }
        if (!/^\d+$/.test(telefono.trim())) { setMensaje({ type: 'error', text: 'El teléfono debe contener solo números.' }); return; }
        if (!/^\d{7,8}$/.test(dni)) { setMensaje({ type: 'error', text: 'El DNI debe contener 7 u 8 dígitos numéricos.' }); return; }

        const selectedDateTime = new Date(`${fecha}T${hora}:00`);
        const now = new Date();
        const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);

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
            complejoId: selectedComplejoId,
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

            // Resetea solo los campos del formulario, no los selectores de complejo/tipo
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

    if (isLoadingInitialData) return <p className="loading-message">Cargando información de complejos...</p>;
    if (complejosDisponibles.length === 0 && !isLoadingInitialData) return <p className="error-message">No hay complejos disponibles para reservar. Contacta al administrador.</p>;

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
                    {selectedTipoCancha && complejo.canchaPrices && complejo.canchaPrices[selectedTipoCancha] && (
                        <p className="reserva-price">
                            <strong>Precio por Hora ({selectedTipoCancha}):</strong> ${complejo.canchaPrices[selectedTipoCancha].toLocaleString('es-AR')}
                        </p>
                    )}
                </div>
            )}

            <h3 className="reserva-form-subtitle">1. Selecciona Complejo, Tipo de Cancha, Fecha y Hora</h3>
            <form onSubmit={handleSubmit} className="reserva-formulario" noValidate>
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

                <div className="form-group">
                    <label htmlFor="tipoCancha">Tipo de Cancha:</label>
                    <select
                        id="tipoCancha"
                        name="tipoCancha"
                        value={selectedTipoCancha}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting || isLoadingInitialData || !selectedComplejoId || tiposCanchaDisponiblesDelComplejo.length === 0}
                    >
                        <option value="">Selecciona un tipo de cancha</option>
                        {tiposCanchaDisponiblesDelComplejo.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                    {selectedComplejoId && tiposCanchaDisponiblesDelComplejo.length === 0 && (
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
                </div>

                {(formulario.fecha && formulario.hora && selectedComplejoId && selectedTipoCancha) && (
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