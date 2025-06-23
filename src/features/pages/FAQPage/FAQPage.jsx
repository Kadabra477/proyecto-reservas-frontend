import React, { useLayoutEffect } from 'react'; // Importa useLayoutEffect
import './FAQPage.css';

function FAQPage() {
    // Usa useLayoutEffect para desplazar la ventana al principio
    // Se ejecuta de forma síncrona después de todas las mutaciones del DOM.
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    const faqData = [
        {
            question: "¿Cómo puedo reservar una cancha?",
            answer: "Puedes reservar una cancha navegando a la sección 'Complejos', seleccionando el complejo de tu interés y luego eligiendo la fecha, hora y tipo de cancha disponible."
        },
        {
            question: "¿Qué métodos de pago aceptan?",
            answer: "Actualmente, aceptamos pagos en efectivo directamente en el complejo o a través de Mercado Pago para pagos online."
        },
        {
            question: "¿Puedo cancelar una reserva?",
            answer: "Sí, puedes cancelar tu reserva desde tu panel de usuario. Ten en cuenta nuestras políticas de cancelación para evitar cargos."
        },
        {
            question: "¿Cómo puedo contactar al soporte?",
            answer: "Puedes contactarnos a través del botón de WhatsApp en la esquina inferior derecha de la pantalla o enviando un correo electrónico a nuestro soporte."
        },
        {
            question: "¿Qué hago si el complejo no tiene disponibilidad para mi fecha/hora deseada?",
            answer: "Puedes intentar buscar en otros complejos cercanos o ajustar tus criterios de búsqueda. Nuestro sistema muestra la disponibilidad en tiempo real."
        },
        {
            question: "¿Cómo se asignan los roles de usuario (ADMIN, COMPLEX_OWNER)?",
            answer: "Los roles de usuario son asignados por los administradores del sistema. Si deseas convertirte en dueño de un complejo, contáctanos."
        },
        {
            question: "¿Necesito estar registrado para ver los complejos?",
            answer: "Sí, para poder ver los detalles completos de los complejos y realizar reservas, necesitas tener una cuenta y estar autenticado."
        }
    ];

    return (
        <div className="faq-page-container">
            <h1 className="faq-page-title">Preguntas Frecuentes (FAQ)</h1>
            <p className="faq-page-subtitle">Encuentra respuestas a las dudas más comunes sobre nuestro servicio de reservas.</p>
            
            <div className="faq-list">
                {faqData.map((item, index) => (
                    <div className="faq-item" key={index}>
                        <h3 className="faq-question">{item.question}</h3>
                        <p className="faq-answer">{item.answer}</p>
                    </div>
                ))}
            </div>

            <div className="faq-contact-section">
                <h3>¿No encuentras lo que buscas?</h3>
                <p>Si tienes alguna otra pregunta o necesitas ayuda personalizada, no dudes en contactarnos.</p>
                <a href="https://wa.me/5492634200763" target="_blank" rel="noopener noreferrer" className="faq-contact-button">
                    Contactar por WhatsApp
                </a>
            </div>
        </div>
    );
}

export default FAQPage;