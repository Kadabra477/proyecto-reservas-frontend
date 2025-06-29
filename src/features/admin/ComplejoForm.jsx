// frontend/src/components/AdminPanel/ComplejoForm.jsx
import React from 'react';
import './ComplejoForm.css'; // Crea este archivo CSS

const ComplejoForm = ({
    nuevoComplejoAdmin,
    handleComplejoFormChange,
    handleCanchaChange,
    handleAddCancha,
    handleRemoveCancha,
    handleSaveComplejo,
    editingComplejo,
    cancelEditingComplejo,
    isAdmin,
    mensaje // Pasamos el mensaje para validación interna si es necesario
}) => {
    return (
        <form className="admin-complejo-form" onSubmit={handleSaveComplejo}>
            <h3>Datos Generales del Complejo</h3>
            <div className="admin-form-group">
                <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
                <input type="text" id="nombre" name="nombre" value={nuevoComplejoAdmin.nombre} onChange={handleComplejoFormChange} required placeholder='Ej: El Alargue' />
            </div>

            {isAdmin && !editingComplejo?.id && ( 
                <div className="admin-form-group">
                    <label htmlFor="emailPropietario">Email del Propietario (usuario existente): <span className="obligatorio">*</span></label>
                    <input type="email" id="emailPropietario" name="emailPropietario" value={nuevoComplejoAdmin.emailPropietario} onChange={handleComplejoFormChange} required={!editingComplejo?.id && isAdmin} placeholder='dueño@ejemplo.com' />
                    <p className="small-info">El usuario con este email será asignado como propietario del complejo y se le otorgará el rol &quot;COMPLEX_OWNER&quot; si no lo tiene.</p>
                </div>
            )}
            
            <div className="admin-form-group">
                <label htmlFor="descripcion">Descripción:</label>
                <textarea id="descripcion" name="descripcion" value={nuevoComplejoAdmin.descripcion} onChange={handleComplejoFormChange} rows={3} placeholder='Breve descripción del complejo...' />
            </div>
            <div className="admin-form-group">
                <label htmlFor="ubicacion">Ubicación: <span className="obligatorio">*</span></label>
                <input type="text" id="ubicacion" name="ubicacion" value={nuevoComplejoAdmin.ubicacion} onChange={handleComplejoFormChange} required placeholder='Ej: Calle Falsa 123, San Martín' />
            </div>
            <div className="admin-form-group">
                <label htmlFor="telefono">Teléfono:</label>
                <input type="tel" id="telefono" name="telefono" value={nuevoComplejoAdmin.telefono} onChange={handleComplejoFormChange} placeholder='Ej: +549261xxxxxxx' />
            </div>
            <div className="admin-form-group">
                <label htmlFor="fotoUrl">URL de Foto Principal:</label>
                <input type="url" id="fotoUrl" name="fotoUrl" value={nuevoComplejoAdmin.fotoUrl} onChange={handleComplejoFormChange} placeholder='https://ejemplo.com/foto_complejo.jpg' />
                {nuevoComplejoAdmin.fotoUrl && (
                    <div className="image-preview-container">
                        <p>Previsualización:</p>
                        <img src={nuevoComplejoAdmin.fotoUrl} alt="Previsualización de Complejo" className="image-preview" onError={(e) => { e.target.onerror = null; e.target.src = '/imagenes/default-complejo.png'; }} />
                    </div>
                )}
            </div>
            <div className="admin-form-group">
                <label htmlFor="horarioApertura">Horario Apertura: <span className="obligatorio">*</span></label>
                <input type="time" id="horarioApertura" name="horarioApertura" value={nuevoComplejoAdmin.horarioApertura} onChange={handleComplejoFormChange} required />
            </div>
            <div className="admin-form-group">
                <label htmlFor="horarioCierre">Horario Cierre: <span className="obligatorio">*</span></label>
                <input type="time" id="horarioCierre" name="horarioCierre" value={nuevoComplejoAdmin.horarioCierre} onChange={handleComplejoFormChange} required />
            </div>
            
            <h3>Detalles de Canchas</h3>
            <div className="canchas-dinamicas-container">
                {nuevoComplejoAdmin.canchas.map((cancha, index) => (
                    <div key={index} className="cancha-item-form">
                        <h4>Cancha #{index + 1}</h4>
                        <div className="admin-form-group">
                            <label htmlFor={`tipoCancha-${index}`}>Tipo de Cancha: <span className="obligatorio">*</span></label>
                            <select
                                id={`tipoCancha-${index}`}
                                name="tipoCancha"
                                value={cancha.tipoCancha}
                                onChange={(e) => handleCanchaChange(index, e)}
                                required
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="Fútbol 5">Fútbol 5</option>
                                <option value="Fútbol 7">Fútbol 7</option>
                                <option value="Fútbol 11">Fútbol 11</option>
                                <option value="Pádel">Pádel</option>
                                <option value="Tenis">Tenis</option>
                                <option value="Básquet">Básquet</option>
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label htmlFor={`cantidad-${index}`}>Cantidad de Canchas de este Tipo: <span className="obligatorio">*</span></label>
                            <input
                                type="number"
                                id={`cantidad-${index}`}
                                name="cantidad"
                                value={cancha.cantidad}
                                onChange={(e) => handleCanchaChange(index, e)}
                                required
                                min="1"
                                placeholder='Ej: 6'
                            />
                        </div>
                        <div className="admin-form-group">
                            <label htmlFor={`precioHora-${index}`}>Precio por Hora ($): <span className="obligatorio">*</span></label>
                            <input
                                type="number"
                                id={`precioHora-${index}`}
                                name="precioHora"
                                value={cancha.precioHora}
                                onChange={(e) => handleCanchaChange(index, e)}
                                required
                                step="0.01"
                                min="0"
                                placeholder='Ej: 35000.00'
                            />
                        </div>
                        <div className="admin-form-group">
                            <label htmlFor={`superficie-${index}`}>Superficie: <span className="obligatorio">*</span></label>
                            <select
                                id={`superficie-${index}`}
                                name="superficie"
                                value={cancha.superficie}
                                onChange={(e) => handleCanchaChange(index, e)}
                                required
                            >
                                <option value="">Selecciona una superficie</option>
                                <option value="Césped Sintético">Césped Sintético</option>
                                <option value="Polvo de Ladrillo">Polvo de Ladrillo</option>
                                <option value="Cemento">Cemento</option>
                                <option value="Parquet">Parquet</option>
                            </select>
                        </div>
                        <div className="admin-form-group checkbox">
                            <input
                                type="checkbox"
                                id={`iluminacion-${index}`}
                                name="iluminacion"
                                checked={cancha.iluminacion}
                                onChange={(e) => handleCanchaChange(index, e)}
                            />
                            <label htmlFor={`iluminacion-${index}`}>Tiene Iluminación</label>
                        </div>
                        <div className="admin-form-group checkbox">
                            <input
                                type="checkbox"
                                id={`techo-${index}`}
                                name="techo"
                                checked={cancha.techo}
                                onChange={(e) => handleCanchaChange(index, e)}
                            />
                            <label htmlFor={`techo-${index}`}>Tiene Techo</label>
                        </div>
                        {nuevoComplejoAdmin.canchas.length > 1 && (
                            <button type="button" className="admin-btn-delete remove-cancha-btn" onClick={() => handleRemoveCancha(index)}>
                                Eliminar Cancha
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button type="button" className="admin-btn-add" onClick={handleAddCancha}>
                Agregar Tipo de Cancha
            </button>

            <div className="admin-form-buttons">
                <button type="submit" className="admin-btn-save">
                    {editingComplejo?.id ? 'Actualizar Complejo' : 'Crear Complejo'}
                </button>
                {editingComplejo?.id && (
                    <button type="button" className="admin-btn-cancel" onClick={cancelEditingComplejo}>
                        Cancelar Edición
                    </button>
                )}
            </div>
        </form>
    );
};

export default ComplejoForm;