// frontend/src/features/admin/ComplejoForm.jsx
import React, { useState, useEffect } from 'react'; // Importar useState y useEffect
import './ComplejoForm.css';

const placeholderImage = '/imagenes/default-complejo.png';

const ComplejoForm = ({
    nuevoComplejoAdmin,
    handleComplejoFormChange,
    handleCanchaChange,
    handleAddCancha,
    handleRemoveCancha,
    handleSaveComplejo, // Esta función se encargará de guardar
    editingComplejo,
    cancelEditingComplejo,
    isAdmin,
    mensaje,
    // ¡NUEVAS PROPS! Para manejar el archivo de la foto
    selectedPhotoFile, 
    setSelectedPhotoFile,
    setMensaje // Pasamos setMensaje desde AdminPanel para mostrar errores específicos de la foto
}) => {
    // Estado interno para la URL de previsualización (solo para el cliente)
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

    // useEffect para manejar la previsualización al cargar un complejo para edición
    useEffect(() => {
        if (editingComplejo && editingComplejo.fotoUrl) {
            setPreviewPhotoUrl(editingComplejo.fotoUrl);
            // Si el complejo existente tiene una foto, NO seleccionamos un archivo nuevo aquí.
            // La lógica es que si el usuario no selecciona un archivo nuevo, se mantiene la foto existente.
            setSelectedPhotoFile(null); 
        } else {
            setPreviewPhotoUrl(null); // No hay preview si es nuevo o no tiene foto
            setSelectedPhotoFile(null); // Asegurarse de que no hay archivo seleccionado al iniciar
        }
    }, [editingComplejo, setSelectedPhotoFile]);

    // Manejar la selección del archivo de foto
    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño máximo (ej. 5MB)
            const MAX_FILE_SIZE_MB = 5;
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                setMensaje({ text: `La imagen no puede exceder los ${MAX_FILE_SIZE_MB}MB.`, type: 'error' });
                e.target.value = null; // Limpiar el input file
                setPreviewPhotoUrl(null);
                setSelectedPhotoFile(null);
                return;
            }
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                setMensaje({ text: 'Por favor, selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.).', type: 'error' });
                e.target.value = null;
                setPreviewPhotoUrl(null);
                setSelectedPhotoFile(null);
                return;
            }

            setSelectedPhotoFile(file);
            setPreviewPhotoUrl(URL.createObjectURL(file)); // Crear URL para previsualización
            setMensaje({ text: '', type: '' }); // Limpiar mensaje de error si había
        } else {
            setSelectedPhotoFile(null);
            setPreviewPhotoUrl(editingComplejo?.fotoUrl || null); // Volver a la foto existente si se deselecciona
        }
    };

    // Manejar la eliminación de la foto (tanto la nueva seleccionada como la existente)
    const handleRemovePhoto = () => {
        setMensaje({ text: '', type: '' });
        setSelectedPhotoFile(null); // Quitar archivo seleccionado
        setPreviewPhotoUrl(null); // Quitar previsualización

        // Si estamos editando, también vaciamos la fotoUrl del objeto principal
        // Esto indica al `handleSaveComplejo` que la fotoUrl debe eliminarse en el backend
        if (editingComplejo) {
            handleComplejoFormChange({ target: { name: 'fotoUrl', value: '' } });
        }
    };


    return (
        <form className="admin-complejo-form" onSubmit={(e) => handleSaveComplejo(e, selectedPhotoFile)}>
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
            
            {/* ¡CAMBIO CLAVE AQUÍ: Input de tipo 'file' para la foto! */}
            <div className="admin-form-group">
                <label htmlFor="photoFile">Foto Principal del Complejo:</label>
                <input 
                    type="file" 
                    id="photoFile" 
                    name="photoFile" // Nota: el nombre del input debe coincidir con el @RequestPart del backend ('photo')
                    accept="image/*" // Solo acepta archivos de imagen
                    onChange={handlePhotoFileChange} 
                />
                <p className="small-info">Tamaño máximo de archivo: 5MB. Formatos recomendados: JPG, PNG.</p>

                {(previewPhotoUrl || editingComplejo?.fotoUrl) && (
                    <div className="image-preview-container">
                        <p>Previsualización:</p>
                        <img 
                            src={previewPhotoUrl || editingComplejo.fotoUrl} 
                            alt="Previsualización de Complejo" 
                            className="image-preview" 
                            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} 
                        />
                        <button type="button" className="admin-btn-delete remove-photo-btn" onClick={handleRemovePhoto}>
                            Eliminar Foto
                        </button>
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