import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PerfilForm.css';

const PerfilForm = () => {
  const [perfil, setPerfil] = useState({
    nombreCompleto: '',
    edad: '',
    ubicacion: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:8080/api/usuarios/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setPerfil({
          nombreCompleto: res.data.nombreCompleto || '',
          edad: res.data.edad || '',
          ubicacion: res.data.ubicacion || ''
        });
      })
      .catch(err => {
        console.error(err);
        setError('No se pudo cargar el perfil');
      });
    }
  }, [token]);

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    axios.put('http://localhost:8080/api/usuarios/perfil', perfil, {
      headers: { Authorization: `Bearer ${token}` }
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
        <button type="submit">Guardar</button>
        {mensaje && <p className="mensaje">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default PerfilForm;
