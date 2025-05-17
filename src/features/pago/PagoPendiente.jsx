import React from 'react';
import { Link } from 'react-router-dom';
import './PagoCallback.css';

function PagoPendiente() {
    return (
        <div className="pago-callback-container pago-pendiente">
            <h2>Pago Pendiente</h2>
            <p>Tu pago está siendo procesado o está pendiente de confirmación (ej: pago en efectivo).</p>
            <p>Te notificaremos por correo electrónico cuando el pago se complete y tu reserva se confirme.</p>
            <img src="/pending-mark.png" alt="Pendiente" className="pago-icono"/>
            <Link to="/dashboard" className="btn btn-primary">Volver al Dashboard</Link>
            <Link to="/mis-reservas" className="btn btn-secondary">Ver Mis Reservas</Link>
        </div>
    );
}

export default PagoPendiente;
