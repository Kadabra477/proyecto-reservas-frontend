// frontend/src/features/admin/ComplejoForm.jsx
import React, { useState, useEffect } from 'react';
import './ComplejoForm.css';

const placeholderImage = '/imagenes/default-complejo.png';

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
    // ¡PROPS MODIFICADAS! Ahora aceptan un array de archivos
    selectedPhotoFiles,
    setSelectedPhotoFiles,
    setMensaje
}) => {
    // Estado interno para la URL de previsualización de las fotos
    const [previewPhotoUrls, setPreviewPhotoUrls] = useState([]);

    // useEffect para inicializar la previsualización y los archivos seleccionados
    useEffect(() => {
        if (editingComplejo && editingComplejo.fotoUrls && editingComplejo.fotoUrls.length > 0) {
            setPreviewPhotoUrls(editingComplejo.fotoUrls);
            setSelectedPhotoFiles([]); // No hay un archivo nuevo seleccionado al cargar un complejo existente
        } else {
            setPreviewPhotoUrls([]);
            setSelectedPhotoFiles([]);
        }
    }, [editingComplejo, setSelectedPhotoFiles]);

    // Manejar la selección de archivos de foto por el usuario
    const handlePhotoFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // --- VALIDACIONES DE IMAGEN EN EL FRONTEND ---
            const MAX_FILE_SIZE_MB = 5;
            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            
            let allFilesValid = true;
            for (const file of files) {
                if (!ALLOWED_TYPES.includes(file.type)) {
                    setMensaje({ text: `Tipo de archivo no permitido: ${file.name}. Sube JPG, PNG, GIF o WebP.`, type: 'error' });
                    allFilesValid = false;
                    break;
                }
                if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                    setMensaje({ text: `La imagen ${file.name} excede los ${MAX_FILE_SIZE_MB}MB.`, type: 'error' });
                    allFilesValid = false;
                    break;
                }
            }

            if (!allFilesValid) {
                e.target.value = null;
                setPreviewPhotoUrls([]);
                setSelectedPhotoFiles([]);
                return;
            }

            setSelectedPhotoFiles(files);
            const newPreviewUrls = files.map(file => URL.createObjectURL(file));
            setPreviewPhotoUrls(newPreviewUrls);
            setMensaje({ text: '', type: '' });
        } else {
            setSelectedPhotoFiles([]);
            setPreviewPhotoUrls(editingComplejo?.fotoUrls || []);
            setMensaje({ text: '', type: '' });
        }
    };
    
    // Manejar la eliminación de las fotos
    const handleRemovePhotos = () => {
        setMensaje({ text: '', type: '' });
        setSelectedPhotoFiles([]);
        setPreviewPhotoUrls([]);
        
        // Si estamos editando y había fotos existentes, 
        // vaciamos `fotoUrls` para indicarle al backend que debe eliminarlas.
        if (editingComplejo) {
            handleComplejoFormChange({ target: { name: 'fotoUrls', value: [] } });
        }
        document.getElementById('photoFile').value = '';
    };

    return (
        <form className="admin-complejo-form" onSubmit={(e) => handleSaveComplejo(e, selectedPhotoFiles)}>
            <h3>Datos Generales del Complejo</h3>
            <div className="admin-form-group">
                <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
                <input type="text" id="nombre" name="nombre" value={nuevoComplejoAdmin.nombre} onChange={handleComplejoFormChange} required placeholder='Ej: El Alargue' />
            </div>

            {isAdmin && !editingComplejo?.id && (
                <div className="admin-form-group">
                    <label htmlFor="emailPropietario">Email del Propietario (usuario existente): <span className="obligatorio">*</span></label>
                    <input type="email" id="emailPropietario" name="emailPropietario" value={nuevoComplejoAdmin.emailPropietario} onChange={handleComplejoFormChange} required={!editingComplejo?.id && isAdmin} placeholder='dueño@ejemplo.com' />
                    <p className="small-info">El usuario con este email será asignado como propietario del complejo y se le otorgará el rol "COMPLEX_OWNER" si no lo tiene.</p>
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
            
            {/* ¡CAMBIO CLAVE: Input de tipo 'file' para múltiples fotos! */}
            <div className="admin-form-group">
                <label htmlFor="photoFile">Fotos del Complejo:</label>
                <input
                    type="file"
                    id="photoFile"
                    name="photos" // El 'name' debe coincidir con el @RequestPart del backend (ej. "photos")
                    accept="image/*"
                    multiple // Permite seleccionar varios archivos
                    onChange={handlePhotoFileChange}
                />
                <p className="small-info">Tamaño máximo de archivo: 5MB cada uno. Formatos permitidos: JPG, PNG, GIF o WebP.</p>

                {/* Mostrar la previsualización de las fotos */}
                {(previewPhotoUrls && previewPhotoUrls.length > 0) ? (
                    <div className="image-preview-container">
                        <p>Previsualización de las fotos:</p>
                        <div className="image-preview-grid">
                            {previewPhotoUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Previsualización ${index + 1}`}
                                    className="image-preview-thumbnail"
                                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                                />
                            ))}
                        </div>
                        <button type="button" className="admin-btn-delete remove-photo-btn" onClick={handleRemovePhotos}>
                            Eliminar Fotos
                        </button>
                    </div>
                ) : (
                    <div className="image-preview-container">
                        <p className="no-photo-message">No hay fotos seleccionadas.</p>
                        {editingComplejo?.id && <p className="small-info">Para mantener las fotos existentes, no selecciones nuevas ni las elimines.</p>}
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
                        <h4>Espacio deportivo #{index + 1}</h4>
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