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
  setMensaje
}) => {
  // Estados para la imagen de portada
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState(null);
  const [previewCoverPhotoUrl, setPreviewCoverPhotoUrl] = useState(null);
  const [coverPhotoExplicitlyRemoved, setCoverPhotoExplicitlyRemoved] = useState(false);

  // Estados para las imágenes del carrusel
  const [selectedCarouselPhotos, setSelectedCarouselPhotos] = useState([]);
  const [previewCarouselPhotoUrls, setPreviewCarouselPhotoUrls] = useState([]);
  const [carouselPhotosExplicitlyRemoved, setCarouselPhotosExplicitlyRemoved] = useState(false);

  // useEffect para inicializar las previsualizaciones al cargar un complejo para edición
  useEffect(() => {
    if (editingComplejo) {
      // Lógica para la imagen de portada (usa la nueva propiedad portadaUrl)
      if (editingComplejo.portadaUrl) {
        setPreviewCoverPhotoUrl(editingComplejo.portadaUrl);
        setCoverPhotoExplicitlyRemoved(false);
      } else {
        setPreviewCoverPhotoUrl(null);
        setCoverPhotoExplicitlyRemoved(false);
      }
      setSelectedCoverPhoto(null);

      // Lógica para las imágenes del carrusel (usa la nueva propiedad carruselUrls)
      if (editingComplejo.carruselUrls && editingComplejo.carruselUrls.length > 0) {
        setPreviewCarouselPhotoUrls(editingComplejo.carruselUrls);
        setCarouselPhotosExplicitlyRemoved(false);
      } else {
        setPreviewCarouselPhotoUrls([]);
        setCarouselPhotosExplicitlyRemoved(false);
      }
      setSelectedCarouselPhotos([]);
    } else {
      // Limpiar estados al cancelar la edición o al crear un nuevo complejo
      setPreviewCoverPhotoUrl(null);
      setSelectedCoverPhoto(null);
      setCoverPhotoExplicitlyRemoved(false);

      setPreviewCarouselPhotoUrls([]);
      setSelectedCarouselPhotos([]);
      setCarouselPhotosExplicitlyRemoved(false);
    }
  }, [editingComplejo]);

  // Manejar la selección de la imagen de portada
  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_FILE_SIZE_MB = 5;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setMensaje({ text: `Tipo de archivo no permitido para la portada: ${file.name}. Sube JPG, PNG, GIF o WebP.`, type: 'error' });
        e.target.value = null;
        setPreviewCoverPhotoUrl(null);
        setSelectedCoverPhoto(null);
        setCoverPhotoExplicitlyRemoved(false);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setMensaje({ text: `La imagen de portada ${file.name} excede los ${MAX_FILE_SIZE_MB}MB.`, type: 'error' });
        e.target.value = null;
        setPreviewCoverPhotoUrl(null);
        setSelectedCoverPhoto(null);
        setCoverPhotoExplicitlyRemoved(false);
        return;
      }

      setSelectedCoverPhoto(file);
      setPreviewCoverPhotoUrl(URL.createObjectURL(file));
      setCoverPhotoExplicitlyRemoved(false);
      setMensaje({ text: '', type: '' });
    } else {
      setSelectedCoverPhoto(null);
      if (editingComplejo?.portadaUrl) {
        setPreviewCoverPhotoUrl(editingComplejo.portadaUrl);
        setCoverPhotoExplicitlyRemoved(false);
      } else {
        setPreviewCoverPhotoUrl(null);
        setCoverPhotoExplicitlyRemoved(false);
      }
      setMensaje({ text: '', type: '' });
    }
  };

  // Manejar la selección de las imágenes del carrusel
  const handleCarouselPhotosChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const MAX_FILE_SIZE_MB = 5;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      let allFilesValid = true;
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setMensaje({ text: `Tipo de archivo no permitido para el carrusel: ${file.name}. Sube JPG, PNG, GIF o WebP.`, type: 'error' });
          allFilesValid = false;
          break;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setMensaje({ text: `La imagen ${file.name} del carrusel excede los ${MAX_FILE_SIZE_MB}MB.`, type: 'error' });
          allFilesValid = false;
          break;
        }
      }

      if (!allFilesValid) {
        e.target.value = null;
        setPreviewCarouselPhotoUrls([]);
        setSelectedCarouselPhotos([]);
        setCarouselPhotosExplicitlyRemoved(false);
        return;
      }

      setSelectedCarouselPhotos(files);
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setPreviewCarouselPhotoUrls(newPreviewUrls);
      setCarouselPhotosExplicitlyRemoved(false);
      setMensaje({ text: '', type: '' });
    } else {
      setSelectedCarouselPhotos([]);
      if (editingComplejo?.carruselUrls && editingComplejo.carruselUrls.length > 0) {
        setPreviewCarouselPhotoUrls(editingComplejo.carruselUrls);
        setCarouselPhotosExplicitlyRemoved(false);
      } else {
        setPreviewCarouselPhotoUrls([]);
        setCarouselPhotosExplicitlyRemoved(false);
      }
      setMensaje({ text: '', type: '' });
    }
  };

  // Manejar la eliminación de la foto de portada
  const handleRemoveCoverPhoto = () => {
    setMensaje({ text: '', type: '' });
    setSelectedCoverPhoto(null);
    setPreviewCoverPhotoUrl(null);
    setCoverPhotoExplicitlyRemoved(true);
    document.getElementById('coverPhotoFile').value = '';
  };

  // Manejar la eliminación de las fotos del carrusel
  const handleRemoveCarouselPhotos = () => {
    setMensaje({ text: '', type: '' });
    setSelectedCarouselPhotos([]);
    setPreviewCarouselPhotoUrls([]);
    setCarouselPhotosExplicitlyRemoved(true);
    document.getElementById('carouselPhotoFiles').value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveComplejo(
      e,
      selectedCoverPhoto,
      selectedCarouselPhotos,
      coverPhotoExplicitlyRemoved,
      carouselPhotosExplicitlyRemoved
    );
  };

  return (
    <form className="admin-complejo-form" onSubmit={handleSubmit}>
      <h3 className="form-section-title">Datos Generales del Complejo</h3>
      
      <div className="form-field-group">
        <div className="admin-form-group">
          <label htmlFor="nombre">Nombre del Complejo: <span className="obligatorio">*</span></label>
          <input type="text" id="nombre" name="nombre" value={nuevoComplejoAdmin.nombre} onChange={handleComplejoFormChange} required placeholder="Ej: El Alargue" />
        </div>

        {isAdmin && !editingComplejo?.id && (
          <div className="admin-form-group">
            <label htmlFor="propietarioUsername">Email del Propietario (usuario existente): <span className="obligatorio">*</span></label>
            <input 
              type="email" 
              id="propietarioUsername" 
              name="propietarioUsername" 
              value={nuevoComplejoAdmin.propietarioUsername || ''} 
              onChange={handleComplejoFormChange} 
              required={!editingComplejo?.id && isAdmin} 
              placeholder="dueño@ejemplo.com" 
            />
            {/* CORRECCIÓN: Usar &quot; para escapar las comillas dobles */}
            <p className="small-info">El usuario con este email será asignado como &quot;COMPLEX_OWNER&quot;.</p>
          </div>
        )}
      </div>

      <div className="admin-form-group">
        <label htmlFor="descripcion">Descripción:</label>
        <textarea id="descripcion" name="descripcion" value={nuevoComplejoAdmin.descripcion} onChange={handleComplejoFormChange} rows={3} placeholder="Breve descripción del complejo..." />
      </div>

      <div className="form-field-group">
        <div className="admin-form-group">
          <label htmlFor="ubicacion">Ubicación: <span className="obligatorio">*</span></label>
          <input type="text" id="ubicacion" name="ubicacion" value={nuevoComplejoAdmin.ubicacion} onChange={handleComplejoFormChange} required placeholder="Ej: Calle Falsa 123, San Martín" />
        </div>
        <div className="admin-form-group">
          <label htmlFor="telefono">Teléfono:</label>
          <input type="tel" id="telefono" name="telefono" value={nuevoComplejoAdmin.telefono} onChange={handleComplejoFormChange} placeholder="Ej: +549261xxxxxxx" />
        </div>
      </div>

      <div className="form-field-group">
        <div className="admin-form-group">
          <label htmlFor="horarioApertura">Horario Apertura: <span className="obligatorio">*</span></label>
          <input type="time" id="horarioApertura" name="horarioApertura" value={nuevoComplejoAdmin.horarioApertura} onChange={handleComplejoFormChange} required />
        </div>
        <div className="admin-form-group">
          <label htmlFor="horarioCierre">Horario Cierre: <span className="obligatorio">*</span></label>
          <input type="time" id="horarioCierre" name="horarioCierre" value={nuevoComplejoAdmin.horarioCierre} onChange={handleComplejoFormChange} required />
        </div>
      </div>

      <div className="admin-form-group photo-upload-section">
        <label htmlFor="coverPhotoFile">Imagen de Portada (principal):</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="coverPhotoFile"
            name="coverPhoto"
            accept="image/*"
            onChange={handleCoverPhotoChange}
          />
          <button type="button" className="custom-file-upload" onClick={() => document.getElementById('coverPhotoFile').click()}>
            <span className="material-symbols-outlined">upload_file</span> Seleccionar Archivo
          </button>
        </div>
        <p className="small-info">Esta imagen será la principal del complejo. Tamaño máximo: 5MB.</p>

        {previewCoverPhotoUrl && (
          <div className="image-preview-container">
            <p className="preview-title">Previsualización de Portada:</p>
            <div className="preview-image-wrapper">
              <img
                src={previewCoverPhotoUrl}
                alt="Previsualización de Portada"
                className="image-preview-thumbnail cover-photo-preview"
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
              />
              <button type="button" className="remove-photo-btn" onClick={handleRemoveCoverPhoto}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-form-group photo-upload-section">
        <label htmlFor="carouselPhotoFiles">Imágenes para Carrusel (opcional):</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="carouselPhotoFiles"
            name="carouselPhotos"
            accept="image/*"
            multiple
            onChange={handleCarouselPhotosChange}
          />
          <button type="button" className="custom-file-upload" onClick={() => document.getElementById('carouselPhotoFiles').click()}>
            <span className="material-symbols-outlined">upload_file</span> Seleccionar Archivos
          </button>
        </div>
        <p className="small-info">Sube imágenes adicionales para el carrusel. Tamaño máximo: 5MB cada una.</p>

        {(previewCarouselPhotoUrls && previewCarouselPhotoUrls.length > 0) && (
          <div className="image-preview-container">
            <p className="preview-title">Previsualización de Carrusel:</p>
            <div className="image-preview-grid">
              {previewCarouselPhotoUrls.map((url, index) => (
                <div key={index} className="preview-image-wrapper">
                  <img
                    src={url}
                    alt={`Previsualización Carrusel ${index + 1}`}
                    className="image-preview-thumbnail"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                  />
                </div>
              ))}
            </div>
            <button type="button" className="remove-all-carousel-btn" onClick={handleRemoveCarouselPhotos}>
              <span className="material-symbols-outlined">delete</span> Eliminar todas las imágenes de carrusel
            </button>
          </div>
        )}
      </div>

      <h3 className="form-section-title">Detalles de Canchas</h3>
      <div className="canchas-dinamicas-container">
        {nuevoComplejoAdmin.canchas.map((cancha, index) => (
          <div key={index} className="cancha-item-form">
            <div className="cancha-header">
              <h4>Espacio deportivo #{index + 1}</h4>
              {nuevoComplejoAdmin.canchas.length > 1 && (
                <button type="button" className="admin-btn-delete remove-cancha-btn" onClick={() => handleRemoveCancha(index)}>
                  <span className="material-symbols-outlined">delete</span> Eliminar Cancha
                </button>
              )}
            </div>

            <div className="form-field-group">
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
                <label htmlFor={`cantidad-${index}`}>Cantidad: <span className="obligatorio">*</span></label>
                <input
                  type="number"
                  id={`cantidad-${index}`}
                  name="cantidad"
                  value={cancha.cantidad}
                  onChange={(e) => handleCanchaChange(index, e)}
                  required
                  min="1"
                  placeholder="Ej: 6"
                />
              </div>
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
                placeholder="Ej: 35000.00"
              />
            </div>
            
            <div className="form-field-group">
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
              <div className="admin-form-group checkbox-group">
                <div className="checkbox-item">
                  <input type="checkbox" id={`iluminacion-${index}`} name="iluminacion" checked={cancha.iluminacion} onChange={(e) => handleCanchaChange(index, e)} />
                  <label htmlFor={`iluminacion-${index}`}>Iluminación</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id={`techo-${index}`} name="techo" checked={cancha.techo} onChange={(e) => handleCanchaChange(index, e)} />
                  <label htmlFor={`techo-${index}`}>Techo</label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="admin-btn-add" onClick={handleAddCancha}>
        <span className="material-symbols-outlined">add_circle</span> Agregar Tipo de Cancha
      </button>

      <div className="admin-form-buttons">
        <button type="submit" className="admin-btn-save">
          <span className="material-symbols-outlined">save</span> {editingComplejo?.id ? 'Actualizar Complejo' : 'Crear Complejo'}
        </button>
        {editingComplejo?.id && (
          <button type="button" className="admin-btn-cancel" onClick={cancelEditingComplejo}>
            <span className="material-symbols-outlined">cancel</span> Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ComplejoForm;