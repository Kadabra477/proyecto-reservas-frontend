// frontend/src/components/Common/ConfirmationModal/ConfirmationModal.jsx
import React from 'react';
import './ConfirmationModal.css'; // Crea este archivo CSS

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmButtonText, cancelButtonText, type = 'warning' }) => {
    if (!isOpen) return null;

    let icon = '';
    let iconClass = '';
    switch (type) {
        case 'danger':
            icon = '🗑️';
            iconClass = 'modal-icon-danger';
            break;
        case 'success':
            icon = '✅';
            iconClass = 'modal-icon-success';
            break;
        case 'info':
            icon = 'ℹ️';
            iconClass = 'modal-icon-info';
            break;
        default:
            icon = '⚠️';
            iconClass = 'modal-icon-warning';
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className={`modal-header ${type}`}>
                    <span className={`modal-icon ${iconClass}`}>{icon}</span>
                    <h3 className="modal-title">{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className={`modal-button confirm-button ${type}`} onClick={onConfirm}>
                        {confirmButtonText}
                    </button>
                    <button className="modal-button cancel-button" onClick={onCancel}>
                        {cancelButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;