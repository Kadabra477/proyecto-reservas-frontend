import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig'; // Asegúrate de que esta ruta sea correcta
import '../../styles/AuthForm.css'; // Asegúrate de que esta ruta sea correcta
import './PerfilForm.css'; // Asegúrate de que esta ruta sea correcta

const PerfilForm = () => {
    const [perfil, setPerfil] = useState({
        nombreCompleto: '',
        edad: '',
        ubicacion: '',
    });

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const jwtToken = localStorage.getItem('jwtToken');
        if (jwtToken) {
            api.get(`/usuarios/perfil`, {
                headers: { Authorization: `Bearer ${jwtToken}` }
            })
            .then(res => {
                setPerfil({
                    nombreCompleto: res.data.nombreCompleto || '',
                    edad: res.data.edad || '',
                    ubicacion: res.data.ubicacion || '',
                    // Campo 'telefono' eliminado de la carga del perfil
                });
            })
            .catch(err => {
                console.error(err);
                setError('No se pudo cargar el perfil');
            });
        }
    }, []);

    const handleChange = (e) => {
        setPerfil({ ...perfil, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            setError('No estás autenticado.');
            return;
        }

        const perfilAEnviar = {
            nombreCompleto: perfil.nombreCompleto,
            edad: perfil.edad,
            ubicacion: perfil.ubicacion,
            // Campo 'telefono' eliminado del objeto a enviar
        };

        api.put(`/usuarios/perfil`, perfilAEnviar, {
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
                {/* ESTE ES EL BLOQUE QUE DEBE SER ELIMINADO FISICAMENTE */}
                {/* <label>
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