import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Asegúrate que esta ruta sea correcta
import './DashboardUsuario.css';

function DashboardUsuario() {
    const [nombreCompleto, setNombreCompleto] = useState(''); // Ahora vacío por defecto
    const [email, setEmail] = useState(''); // Estado para el email (username)
    const [edad, setEdad] = useState(''); // Ahora vacío por defecto
    const [ubicacion, setUbicacion] = useState(''); // Ahora vacío por defecto
    const [bio, setBio] = useState(''); // Ahora vacío por defecto
    const [profilePictureUrl, setProfilePictureUrl] = useState('/avatar-default.png'); // URL de la imagen de perfil
    const [profileImageFile, setProfileImageFile] = useState(null); // Archivo de imagen seleccionado
    const [misReservas, setMisReservas] = useState([]);
    const [isEditing, setIsEditing] = useState(false); // Estado para controlar el modo de edición
    const [modalReserva, setModalReserva] = useState(null);
    const [loading, setLoading] = useState(true); // Nuevo estado para controlar la carga general
    const [error, setError] = useState(null); // Nuevo estado para errores generales

    useEffect(() => {
        let isMounted = true; // Flag para evitar actualizaciones en componente desmontado

        const fetchUserDataAndReservas = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch de los datos del perfil del usuario
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

                // 2. Fetch de las reservas del usuario
                const reservasRes = await api.get('/reservas/usuario');
                if (isMounted) {
                    setMisReservas(Array.isArray(reservasRes.data) ? reservasRes.data : []);
                }

            } catch (err) {
                console.error("Error al cargar datos del dashboard:", err);
                if (isMounted) {
                    // El interceptor de Axios ya maneja la redirección del 401 globalmente.
                    // Aquí solo mostramos un mensaje si el error NO fue 401.
                    if (!(err.response && err.response.status === 401)) {
                        setError("No se pudieron cargar los datos del perfil o las reservas. Intenta recargar la página.");
                    }
                    setMisReservas([]);
                    // Limpiar datos del perfil también si hay error general
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

        // Cleanup function
        return () => {
            isMounted = false;
        };

    }, []); // El array vacío asegura que useEffect se ejecute solo una vez al montar

    // Maneja la selección de un nuevo archivo de avatar
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file); // Guarda el archivo para enviarlo al backend
            // Crea una URL temporal para la previsualización instantánea
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePictureUrl(reader.result); // Actualiza la URL para mostrar la previsualización
            };
            reader.readAsDataURL(file);
        }
    };

    // Función para guardar los cambios del perfil
    const handleSaveChanges = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Crear el objeto con los datos del perfil a enviar
            const profileData = {
                nombreCompleto,
                edad: edad === '' ? null : Number(edad), // Asegurarse de enviar null si está vacío, y que sea número
                ubicacion,
                bio,
                // Email no se suele editar desde el perfil de usuario, pero si fuera necesario:
                // email: email,
            };

            // 2. Enviar los datos del perfil
            // Necesitas crear este endpoint en tu backend Spring Boot: PUT /api/users/me
            const updateProfileRes = await api.put('/users/me', profileData);
            console.log('Perfil actualizado:', updateProfileRes.data);

            // 3. Si hay un nuevo archivo de imagen, subirlo
            if (profileImageFile) {
                const formData = new FormData();
                formData.append('file', profileImageFile); // 'file' debe coincidir con el nombre esperado en el backend

                // Necesitas crear este endpoint en tu backend Spring Boot: POST /api/users/me/profile-picture
                const uploadImageRes = await api.post('/users/me/profile-picture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Importante para subir archivos
                    },
                });
                console.log('Imagen de perfil actualizada:', uploadImageRes.data);
                setProfilePictureUrl(uploadImageRes.data.profilePictureUrl); // Actualizar con la URL final del backend
                setProfileImageFile(null); // Limpiar el archivo después de subir
            }

            // Una vez que todo se guarda exitosamente
            setIsEditing(false); // Sale del modo de edición
            alert('¡Perfil actualizado exitosamente!'); // Mensaje de éxito
        } catch (err) {
            console.error("Error al guardar cambios en el perfil:", err);
            setError("Error al guardar los cambios. Intenta de nuevo.");
            // Si el error es 401, el interceptor de axios ya debería redirigir.
            // Aquí manejar otros errores (ej. validación, red).
            if (err.response && err.response.data && err.response.data.message) {
                alert(`Error: ${err.response.data.message}`);
            } else {
                alert("Hubo un problema al guardar el perfil.");
            }
        } finally {
            setLoading(false);
        }
    };


    // Función para formatear la fecha y hora de la reserva
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

    // Funciones para manejar el modal de reservas
    const handleOpenModal = (reserva) => { setModalReserva(reserva); };
    const handleCloseModal = () => { setModalReserva(null); };


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

    // --- JSX de Renderizado ---
    return (
        <div className="dashboard-container">
            {/* Sección de Perfil */}
            <div className="perfil-container">
                <div className="perfil-portada">
                    {/* Puedes hacer que esta portada también sea editable si quieres */}
                    <img src="/portada-default.jpg" alt="Portada" className="portada-img" />
                </div>
                <div className="perfil-info-box">
                    <label htmlFor="avatar-upload" className="avatar-label">
                        <img src={profilePictureUrl} alt="Avatar" className="perfil-avatar editable" title="Cambiar avatar" />
                        {isEditing && (
                            <span className="change-avatar-icon">
                                <i className="fas fa-camera"></i> {/* Icono de cámara, si usas Font Awesome */}
                            </span>
                        )}
                    </label>
                    {/* Input de tipo file, visible solo en modo edición */}
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
                            {/* El email generalmente no se edita por seguridad una vez registrado */}
                            <p className="perfil-dato-editable"><strong>Email:</strong> {email}</p>

                            <div className="perfil-acciones">
                                <button onClick={handleSaveChanges} className="btn btn-primary btn-guardar">Guardar Cambios</button>
                                <button onClick={() => {
                                    setIsEditing(false);
                                    // Opcional: recargar datos originales si se cancela la edición
                                    // fetchUserDataAndReservas();
                                }} className="btn btn-secondary btn-cancelar">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="perfil-vista">
                            {/* Los placeholders se muestran si el valor está vacío */}
                            <h2 className="perfil-nombre">{nombreCompleto || '¡Completa tu Perfil!'}</h2>
                            <p className="perfil-dato"><strong>Edad:</strong> {edad ? `${edad} años` : 'No especificado'}</p>
                            <p className="perfil-dato"><strong>Ubicación:</strong> {ubicacion || 'No especificada'}</p>
                            <p className="perfil-dato"><strong>Email:</strong> {email || 'N/A'}</p>
                            {bio && <p className="perfil-dato"><strong>Bio:</strong> {bio}</p>} {/* Solo mostrar si hay bio */}
                            <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary btn-editar">Editar Perfil</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sección de Mis Reservas */}
            <div className="dashboard-card mis-reservas-card">
                <h2>Mis Reservas</h2>
                {misReservas.length > 0 ? (
                    <ul className="lista-reservas">
                        {misReservas.map((reserva) => (
                            <li key={reserva.id} className="reserva-item" onClick={() => handleOpenModal(reserva)} title="Ver detalle">
                                <p><strong>Cancha:</strong> {reserva.cancha?.nombre || 'N/A'}</p>
                                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                                <p><strong>Estado:</strong> {reserva.confirmada ? 'Confirmada' : 'Pendiente'}</p>
                                <p><strong>Pago:</strong> {reserva.pagada ? 'Pagada' : 'Pendiente'}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="dashboard-info">Aún no tenés reservas.</p>
                )}
                <Link to="/canchas" className="btn btn-primary btn-nueva-reserva">Hacer una Nueva Reserva</Link>
            </div>

            {/* Modal para Detalles de Reserva */}
            {modalReserva && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Detalle de Reserva</h3>
                        <hr />
                        <p><strong>Cancha:</strong> {modalReserva.cancha?.nombre || 'N/A'}</p>
                        <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(modalReserva.fechaHora)}</p>
                        <p><strong>Estado:</strong> {modalReserva.confirmada ? 'Confirmada' : 'Pendiente'}</p>
                        <p><strong>Pago:</strong> {modalReserva.pagada ? `Pagada (${modalReserva.metodoPago || '?'})` : 'Pendiente de Pago'}</p>
                        <p><strong>Reservado a nombre de:</strong> {modalReserva.cliente}</p>
                        <p><strong>Teléfono de contacto:</strong> {modalReserva.telefono || '-'}</p>

                        {modalReserva.confirmada && !modalReserva.pagada && (
                            <button
                                className="btn btn-success btn-pagar-mp"
                                onClick={async () => {
                                    console.log(`Iniciando pago para reserva ID: ${modalReserva.id}`);
                                    try {
                                        const preferenciaResponse = await api.post(`/pagos/crear-preferencia/${modalReserva.id}`);
                                        const initPoint = preferenciaResponse.data.initPoint;
                                        if (initPoint) {
                                            window.location.href = initPoint;
                                        } else {
                                            alert("Error: No se pudo obtener el link de pago.");
                                        }
                                    } catch (error) {
                                        console.error("Error al crear preferencia de MP:", error);
                                        alert(`Error al iniciar el pago: ${error.response?.data || error.message}`);
                                    }
                                }}
                            >
                                Pagar con Mercado Pago
                            </button>
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