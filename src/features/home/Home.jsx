import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import ReservasSimplesImg from '../../assets/reservas-simples.jpg';

function Home({ estaAutenticado }) { // Recibe estaAutenticado como prop
    const [nombreUsuario, setNombreUsuario] = useState('');

    useEffect(() => {
        if (estaAutenticado) {
            const storedName = localStorage.getItem('nombreCompleto');
            setNombreUsuario(storedName || 'Usuario');
        } else {
            setNombreUsuario('');
        }
    }, [estaAutenticado]);

    return (
        <main>
            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    {/* CORRECCIÓN: Quitada la doble tilde */}
                    <h1>¿DÓNDE <span>JUEGO?</span></h1>
                    <p>La mejor forma de <strong>reservar</strong> tu cancha</p>
                    <div className="hero-buttons">
                        {/* Redirige a /complejos si está autenticado, sino a /login */}
                        <Link to={estaAutenticado ? "/complejos" : "/login"} className="btn-main">Reservar ahora</Link>
                        <a href="#como-funciona" className="btn-secondary">Conocer más</a>
                    </div>
                </div>
            </section>

            <section id="como-funciona" className="how">
                <div className="section-container">
                    <h2>¿Cómo funciona?</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-icon"><div className="step-number">1</div></div>
                            <div className="step-content">
                                <h4>Registrate</h4>
                                <p>Creá tu cuenta en pocos segundos</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-icon"><div className="step-number">2</div></div>
                            <div className="step-content">
                                <h4>Buscá tu cancha</h4>
                                <p>Filtrá por zona, deporte y disponibilidad</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-icon"><div className="step-number">3</div></div>
                            <div className="step-content">
                                <h4>Reservá online</h4>
                                <p>Elegí día y hora, pagá y ¡listo!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="platform-preview">
                <div className="section-container">
                    <div className="platform-content">
                        <h2>Reservas simples y rápidas</h2>
                        <p>Nuestro sistema intuitivo te permite encontrar y reservar tu cancha ideal en solo unos pocos pasos. Olvídate de las llamadas telefónicas y las agendas complicadas. ¡Tu próxima partida está a solo un click!</p>
                        <ul className="feature-list">
                            <li> Búsqueda por deporte, fecha y horario.</li>
                            <li> Visualiza la disponibilidad en tiempo real.</li>
                            <li> Confirma y paga de forma segura.</li>
                        </ul>
                        {!estaAutenticado && (
                            <Link to="/register" className="btn-main">Crear cuenta</Link>
                        )}
                    </div>
                    <div className="platform-image-container">
                        <img src={ReservasSimplesImg} alt="Plataforma de Reservas" className="platform-image-actual" />
                    </div>
                </div>
            </section>

            <section id="beneficios" className="benefits">
                <div className="section-container">
                    <h2>¿Por qué elegirnos?</h2>
                    <div className="benefit-list">
                        <div className="benefit">
                            <div className="benefit-icon">📈</div>
                            <div className="benefit-content">
                                <h4>Rentabilidad</h4>
                                <p>Aumentá tus ingresos ocupando horas libres.</p>
                            </div>
                        </div>
                        <div className="benefit">
                            <div className="benefit-icon">📅</div>
                            <div className="benefit-content">
                                <h4>Agenda Online</h4>
                                <p>Gestión simple, ágil y segura desde cualquier dispositivo.</p>
                            </div>
                        </div>
                        <div className="benefit">
                            <div className="benefit-icon">📊</div>
                            <div className="benefit-content">
                                <h4>Estadísticas</h4>
                                <p>Balance de ingresos, reservas y horarios pico.</p>
                            </div>
                        </div>
                        <div className="benefit">
                            <div className="benefit-icon">📵</div>
                            <div className="benefit-content">
                                <h4>Sanción de jugadores</h4>
                                <p>Controlá cancelaciones y ausencias frecuentes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="cta-overlay"></div>
                <div className="cta-content">
                    <h2>¿Listo para comenzar?</h2>
                    <p>Únete a miles de usuarios que ya disfrutan de nuestro servicio</p>
                    {/* Redirige a /complejos si está autenticado, sino a /login */}
                    <Link to={estaAutenticado ? "/complejos" : "/login"} className="btn-main">Reservar ahora</Link>
                </div>
            </section>

            {/* ELIMINADO: Sección de FAQ en el Home */}
            {/* <section id="faq-preview" className="faq-preview">
                <div className="section-container">
                    <h2>Preguntas Frecuentes</h2>
                    <p>Encuentra respuestas a tus dudas más comunes sobre el uso de nuestra plataforma.</p>
                    <Link to="/faq" className="btn-secondary-outline">Ver todas las preguntas</Link>
                </div>
            </section> */}

            <a href="https://wa.me/5492634200763" className="whatsapp-button" target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
    {/* NUEVO SVG: Solo el icono del teléfono de WhatsApp */}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
        <path d="M12.04 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm.04 17.5c-4.14 0-7.5-3.36-7.5-7.5s3.36-7.5 7.5-7.5 7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5zm4.9-5.1c-.24-.12-.8-.4-.92-.45-.12-.05-.26-.06-.38.06s-.46.56-.56.68-.2.12-.38.06c-.18-.06-.75-.28-.9-.33-.16-.06-.32-.1-.5-.14-.04-.01-.06 0-.1.01-.1.02-.18.06-.28.1-.1.04-.2.08-.2.18s-.24.12-.4.2c-.16.08-.3.12-.45.16-.08.02-.18.03-.26 0-.08-.03-.18-.08-.34-.16-.16-.08-.38-.17-.6-.2-.22-.03-.32-.06-.38-.08s-.12-.06-.2-.02c-.08.04-.12.12-.04.24.08.12.3.4.45.56.16.12.3.24.46.36.16.12.3.2.46.26.16.06.32.06.48 0 .16-.06.3-.12.45-.2.16-.08.3-.16.4-.24.1-.1.18-.18.24-.26.06-.08.1-.16.14-.24.04-.08.08-.16.1-.24.02-.08.02-.16 0-.24-.02-.08-.06-.16-.1-.24-.04-.08-.08-.16-.12-.24-.04-.08-.08-.16-.12-.24-.04-.08-.08-.16-.1-.24-.02-.08-.02-.16-.02-.24zM12.04 4c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8z"/>
    </svg>
</a>

            <footer className="footer">
                <div className="footer-content">
                    <Link to="/" className="footer-logo-link"> {/* Enlace con estilo de logo */}
                        <h3>¿DÓNDE <span className="footer-logo-span">JUEGO?</span></h3>
                    </Link>
                    <div className="footer-links-group">
                        <Link to="/" className="footer-link">Inicio</Link>
                        <a href="#como-funciona" className="footer-link">Cómo funciona</a>
                        <a href="#beneficios" className="footer-link">Por qué elegirnos</a>
                        <Link to="/faq" className="footer-link">Preguntas Frecuentes</Link> {/* Enlace a la página de FAQ */}
                    </div>
                </div>
                <div className="footer-bottom">
                    <p className="copyright">© {new Date().getFullYear()} Sistema de Reservas de Canchas | Hecho en San Martín, Mendoza ⚽</p>
                    {/* ELIMINADO: footer-nav con Términos y Privacidad */}
                </div>
            </footer>
        </main>
    );
}

export default Home;