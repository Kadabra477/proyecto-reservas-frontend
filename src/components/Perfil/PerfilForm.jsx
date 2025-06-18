import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PerfilForm.css'; // Asegúrate de que esta ruta sea correcta

const PerfilForm = () => {
  const [perfil, setPerfil] = useState({
    nombreCompleto: '',
    edad: '',
    ubicacion: '',
    // <-- ELIMINAR: teléfono del estado inicial si no se usará -->
    // telefono: '',
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // <-- ASÉGURATE de que 'api' (de axiosConfig) sea usado en lugar de 'axios' globalmente -->
  // const token = localStorage.getItem('token'); // Esto debería ser 'jwtToken' si usas axiosConfig

  useEffect(() => {
    const jwtToken = localStorage.getItem('jwtToken'); // Usar jwtToken de localStorage
    if (jwtToken) {
      // Usar la instancia 'api' de axiosConfig
      api.get(`/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })
      .then(res => {
        setPerfil({
          nombreCompleto: res.data.nombreCompleto || '',
          edad: res.data.edad || '',
          ubicacion: res.data.ubicacion || '',
          // <-- ELIMINAR: teléfono de la carga del perfil -->
          // telefono: res.data.telefono || '',
        });
      })
      .catch(err => {
        console.error(err);
        setError('No se pudo cargar el perfil');
      });
    }
  }, []); // Dependencia vacía para que se ejecute una vez al montar

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const jwtToken = localStorage.getItem('jwtToken'); // Usar jwtToken
    if (!jwtToken) {
      setError('No estás autenticado.');
      return;
    }

    // Crear un objeto con solo los campos que quieres enviar, excluyendo 'telefono'
    const perfilAEnviar = {
        nombreCompleto: perfil.nombreCompleto,
        edad: perfil.edad,
        ubicacion: perfil.ubicacion,
        // <-- ELIMINAR: teléfono del objeto a enviar -->
        // telefono: perfil.telefono
    };

    // Usar la instancia 'api' de axiosConfig
    api.put(`/usuarios/perfil`, perfilAEnviar, { // <-- CAMBIO: enviar perfilAEnviar
      headers: { Authorization: `Bearer ${jwtToken}` }
    })
    .then(() => setMensaje('Perfil actualizado correctamente'))
    .catch(err => {
      console.error(err);
      setError('Error al actualizar el perfil');
    });
  };

  return (
    <div className="perfil-form-container">
      <h2>Mi Perfil</h2>
      <form onSubmit={handleSubmit} className="perfil-form">
        <label>
          Nombre completo:
          <input type="text" name="nombreCompleto" value={perfil.nombreCompleto} onChange={handleChange} required />
        </label>
        <label>
          Edad:
          <input type="number" name="edad" value={perfil.edad} onChange={handleChange} required />
        </label>
        <label>
          Ubicación:
          <input type="text" name="ubicacion" value={perfil.ubicacion} onChange={handleChange} required />
        </label>
        {/* <-- ELIMINAR: Campo de entrada para el teléfono -->
        <label>
          Teléfono:
          <input type="text" name="telefono" value={perfil.telefono} onChange={handleChange} />
        </label>
        */}
        <button type="submit">Guardar</button>
        {mensaje && <p className="mensaje">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default PerfilForm;