import React, { useState, useEffect } from 'react';
import {Link} from 'react-router-dom'; // Importar useNavigate si lo usas para redirección
import api from '../../api/axiosConfig'; // Asegúrate que esta ruta sea correcta
import './DashboardUsuario.css'; // Asegúrate que esta ruta sea correcta

function DashboardUsuario() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [username, setUsername] = useState(''); // Este es el email
  const [edad, setEdad] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [misReservas, setMisReservas] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState('/avatar-default.png');
  const [modalReserva, setModalReserva] = useState(null);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [errorReservas, setErrorReservas] = useState(null);

  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones en componente desmontado

    const fetchUserDataAndReservas = async () => {
      setLoadingReservas(true);
      setErrorReservas(null);

      // 1. Intenta obtener datos del perfil desde localStorage
      const nombreLS = localStorage.getItem('nombreCompleto');
      const userLS = localStorage.getItem('username'); // Email
      if (isMounted) {
          setNombreUsuario(nombreLS || 'Usuario');
          setUsername(userLS || ''); // Deja email vacío si no está? O intenta fetch?
      }

      // --- Datos hardcodeados (reemplazar/eliminar si obtienes del backend) ---
      if (isMounted) {
        setEdad('24');
        setUbicacion('San Martín, Mendoza');
      }
      // -------------------------------------------------------------------------


      // 2. Fetch de las reservas del usuario usando el endpoint CORRECTO
      console.log('Dashboard UseEffect: Token ANTES de llamar API:', localStorage.getItem('jwtToken')); // Log para depurar token
      try {
        // *** CORRECCIÓN PRINCIPAL: Usar el endpoint correcto ***
        const res = await api.get('/reservas/usuario'); // <-- LLAMAR A /api/reservas/usuario

        if (isMounted) {
          setMisReservas(Array.isArray(res.data) ? res.data : []);
          console.log('Reservas obtenidas:', res.data);
        }
      } catch (err) {
        console.error("Error al obtener mis reservas:", err);
        if (isMounted) {
            // El interceptor de Axios ya maneja la redirección del 401 globalmente.
            // Aquí solo mostramos un mensaje si el error NO fue 401 (ya que seremos redirigidos).
            if (!(err.response && err.response.status === 401)) {
                setErrorReservas("No se pudieron cargar tus reservas. Intenta recargar la página.");
            }
             setMisReservas([]); // Limpia las reservas en caso de error
        }
      } finally {
        if (isMounted) {
          setLoadingReservas(false);
        }
      }

      // 3. (Opcional) Si el nombre o email no están en localStorage (ej. tras OAuth2),
      // podrías hacer una llamada API aquí para obtenerlos desde /api/usuarios/mi-perfil (necesitas crear ese endpoint)
      // if (isMounted && (!nombreLS || !userLS)) {
      //   try {
      //     const perfilRes = await api.get('/usuarios/mi-perfil'); // Endpoint de ejemplo
      //     localStorage.setItem('nombreCompleto', perfilRes.data.nombreCompleto);
      //     localStorage.setItem('username', perfilRes.data.email); // Asumiendo que devuelve email
      //     setNombreUsuario(perfilRes.data.nombreCompleto);
      //     setUsername(perfilRes.data.email);
      //     // Actualiza otros datos si vienen del perfil: setEdad(perfilRes.data.edad), etc.
      //   } catch (perfilErr) {
      //     console.error("Error obteniendo datos del perfil:", perfilErr);
      //     // No necesariamente un error crítico si ya tenemos token
      //   }
      // }
    };

    fetchUserDataAndReservas();

    // Cleanup function para evitar setear estado si el componente se desmonta
    return () => {
      isMounted = false;
    };

  }, []); // El array vacío asegura que useEffect se ejecute solo una vez al montar

  // --- Resto de los handlers (handleAvatarChange, formatLocalDateTime, handleOpenModal, etc.) ---
  // (Sin cambios respecto a la versión anterior que te pasé)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
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

  const handleOpenModal = (reserva) => { setModalReserva(reserva); };
  const handleCloseModal = () => { setModalReserva(null); };
  const handleSaveChanges = () => { console.log("Guardando cambios:", { nombreUsuario, edad, ubicacion }); setIsEditing(false); };

  // --- JSX de Renderizado (Sin cambios funcionales importantes respecto al anterior) ---
  return (
    <div className="dashboard-container">
      {/* Sección de Perfil */}
      <div className="perfil-container">
        {/* ... (código de perfil sin cambios) ... */}
         <div className="perfil-portada">
             <img src="/portada-default.jpg" alt="Portada" className="portada-img" />
           </div>
           <div className="perfil-info-box">
             <label htmlFor="avatar-upload" className="avatar-label">
               <img src={avatar} alt="Avatar" className="perfil-avatar editable" title="Cambiar avatar"/>
             </label>
             <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange}/>
             {isEditing ? (
               <div className="perfil-edicion">
                 {/* ... inputs y botones de edición ... */}
                 <input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="perfil-input" placeholder="Nombre Completo"/>
                 <input value={edad} onChange={(e) => setEdad(e.target.value)} className="perfil-input" placeholder="Edad" type="number"/>
                 <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="perfil-input" placeholder="Ubicación"/>
                 <button onClick={handleSaveChanges} className="btn btn-primary btn-guardar">Guardar</button>
                 <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-cancelar">Cancelar</button>
               </div>
             ) : (
               <div className="perfil-vista">
                  {/* ... vista del perfil ... */}
                 <h2 className="perfil-nombre">{nombreUsuario}</h2>
                 <p className="perfil-dato"><strong>Edad:</strong> {edad} años</p>
                 <p className="perfil-dato"><strong>Ubicación:</strong> {ubicacion}</p>
                 <p className="perfil-dato"><strong>Email:</strong> {username}</p>
                 <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary btn-editar">Editar Perfil</button>
               </div>
             )}
           </div>
      </div>

      {/* Sección de Mis Reservas */}
      <div className="dashboard-card mis-reservas-card">
        <h2>Mis Reservas</h2>
        {loadingReservas ? (
          <p>Cargando reservas...</p>
        ) : errorReservas ? (
          // Mostramos el error si no fue un 401 (ya que seremos redirigidos)
          <p className="error-mensaje">{errorReservas}</p>
        ) : misReservas.length > 0 ? (
          <ul className="lista-reservas">
            {misReservas.map((reserva) => (
              <li key={reserva.id} className="reserva-item" onClick={() => handleOpenModal(reserva)} title="Ver detalle">
                <p><strong>Cancha:</strong> {reserva.cancha?.nombre || 'N/A'}</p>
                <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(reserva.fechaHora)}</p>
                {/* Aquí podrías mostrar el estado 'pagada' también si lo tienes */}
                <p><strong>Estado:</strong> {reserva.confirmada ? 'Confirmada' : 'Pendiente'}</p>
                 <p><strong>Pago:</strong> {reserva.pagada ? 'Pagada' : 'Pendiente'}</p> {/* Mostrar estado de pago */}
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
            {/* ... (contenido del modal sin cambios, usando modalReserva) ... */}
            <h3>Detalle de Reserva</h3>
            <hr />
            <p><strong>Cancha:</strong> {modalReserva.cancha?.nombre || 'N/A'}</p>
            <p><strong>Fecha y Hora:</strong> {formatLocalDateTime(modalReserva.fechaHora)}</p>
            <p><strong>Estado:</strong> {modalReserva.confirmada ? 'Confirmada' : 'Pendiente'}</p>
            <p><strong>Pago:</strong> {modalReserva.pagada ? `Pagada (${modalReserva.metodoPago || '?'})` : 'Pendiente de Pago'}</p> {/* Mostrar estado de pago */}
            <p><strong>Reservado a nombre de:</strong> {modalReserva.cliente}</p>
            <p><strong>Teléfono de contacto:</strong> {modalReserva.telefono || '-'}</p>

             {/* --- BOTÓN DE PAGO (Ejemplo) --- */}
              {/* Mostrar solo si la reserva está confirmada Y NO pagada */}
             {modalReserva.confirmada && !modalReserva.pagada && (
                <button
                  className="btn btn-success btn-pagar-mp"
                  onClick={async () => {
                      console.log(`Iniciando pago para reserva ID: ${modalReserva.id}`);
                      try {
                          const preferenciaResponse = await api.post(`/pagos/crear-preferencia/${modalReserva.id}`);
                          const initPoint = preferenciaResponse.data.initPoint;
                          if (initPoint) {
                              window.location.href = initPoint; // Redirigir a Mercado Pago
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
              {/* ----------------------------- */}

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