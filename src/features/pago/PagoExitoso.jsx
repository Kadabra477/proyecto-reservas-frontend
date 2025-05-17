import React from 'react';
import { Link } from 'react-router-dom';
import './PagoCallback.css';

function PagoExitoso() {
    return (
        <div className="pago-callback-container pago-exitoso">
            <h2>¡Pago Exitoso!</h2>
            <p>¡Felicitaciones! Tu pago ha sido procesado correctamente y tu reserva está confirmada.</p>
            <p>Recibirás un correo electrónico con los detalles de tu reserva. ¡Disfruta de tu partido!</p>
            <img src="/check-mark.png" alt="Pago Exitoso" className="pago-icono"/>
            <Link to="/dashboard" className="btn btn-primary">Ir al Dashboard</Link>
            <Link to="/mis-reservas" className="btn btn-secondary">Ver Mis Reservas</Link>
        </div>
    );
}

export default PagoExitoso;
