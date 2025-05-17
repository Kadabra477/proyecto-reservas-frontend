import React from 'react';
import { Link } from 'react-router-dom';
import './PagoCallback.css';

function PagoFallido() {
    return (
        <div className="pago-callback-container pago-fallido">
            <h2>Pago Fallido</h2>
            <p>Lo sentimos, hubo un problema con tu pago. No pudimos completar la transacción.</p>
            <p>Por favor, intenta nuevamente o contacta con el soporte si necesitas ayuda.</p>
            <img src="/error-mark.png" alt="Pago Fallido" className="pago-icono"/>
            <Link to="/reservas/nueva" className="btn btn-primary">Intentar de nuevo</Link>
            <Link to="/contacto" className="btn btn-secondary">Contactar Soporte</Link>
        </div>
    );
}

export default PagoFallido;
