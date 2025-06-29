import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import ReservasSimplesImg from '../../assets/reservas-simples.jpg'; // Asegúrate de que la ruta a tu imagen sea correcta

function Home({ estaAutenticado }) {
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
                    <h1>¿DÓNDE <span>JUEGO?</span></h1>
                    <p>La mejor forma de <strong>reservar</strong> tu cancha</p>
                    <div className="hero-buttons">
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
                            <Link to="/register" className="btn-secondary-home">Crear cuenta</Link> 
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
                    <Link to={estaAutenticado ? "/complejos" : "/login"} className="btn-main">Reservar ahora</Link>
                </div>
            </section>

            <a href="https://wa.me/5492634200763" className="whatsapp-button" target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
                <i className="fab fa-whatsapp"></i> 
            </a>

            <footer className="footer">
                <div className="footer-content">
                    <Link to="/" className="footer-logo-link"> 
                        <h3>¿DÓNDE <span className="footer-logo-span">JUEGO?</span></h3>
                    </Link>
                    <div className="footer-links-group">
                        <Link to="/" className="footer-link">Inicio</Link>
                        <a href="#como-funciona" className="footer-link">Cómo funciona</a>
                        <a href="#beneficios" className="footer-link">Por qué elegirnos</a>
                        <Link to="/faq" className="footer-link">Preguntas Frecuentes</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p className="copyright">© {new Date().getFullYear()} Sistema de Reservas de Canchas | Hecho en San Martín, Mendoza ⚽</p>
                </div>
            </footer>
        </main>
    );
}

export default Home;