// frontend/src/features/admin/AdminEstadisticas.jsx (NUEVO ARCHIVO)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // Usamos tu instancia de axios
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './AdminEstadisticas.css'; // Asegúrate de que este archivo exista

// Registrar los componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminEstadisticas = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_ESTADISTICAS_URL = '/estadisticas/admin'; // Endpoint de tu backend

    useEffect(() => {
        const fetchEstadisticas = async () => {
            setLoading(true);
            setError(null);
            try {
                // api.get ya incluye el token JWT si está en localStorage
                const response = await api.get(API_ESTADISTICAS_URL);
                setEstadisticas(response.data);
            } catch (err) {
                console.error("Error al cargar las estadísticas:", err);
                if (err.response && err.response.status === 403) {
                    setError('Acceso denegado. No tienes permisos para ver las estadísticas.');
                    // Considerar redirigir si no es admin, o mostrar solo el error
                    // setTimeout(() => navigate('/dashboard'), 3000); 
                } else {
                    setError('Error al cargar las estadísticas. Intenta de nuevo.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEstadisticas();
    }, [navigate]);

    if (loading) {
        return <div className="admin-estadisticas-container">Cargando estadísticas...</div>;
    }

    if (error) {
        return <div className="admin-estadisticas-container error-message">{error}</div>;
    }

    if (!estadisticas) {
        return <div className="admin-estadisticas-container">No hay datos de estadísticas disponibles.</div>;
    }

    // Datos para el gráfico de reservas por cancha
    const reservasPorCanchaData = {
        labels: Object.keys(estadisticas.reservasPorCancha),
        datasets: [
            {
                label: 'Número de Reservas',
                data: Object.values(estadisticas.reservasPorCancha),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(201, 203, 207, 0.7)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(201, 203, 207, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Opciones para el gráfico de barras de reservas por cancha
    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#333',
                },
            },
            title: {
                display: true,
                text: 'Reservas por Cancha',
                font: {
                    size: 18,
                    weight: 'bold',
                },
                color: '#333',
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#555',
                },
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    color: '#555',
                },
                grid: {
                    color: '#eee',
                },
                beginAtZero: true,
            },
        },
    };

    // Datos para el gráfico de pastel de estado de reservas
    const estadoReservasData = {
        labels: ['Confirmadas', 'Pendientes'],
        datasets: [
            {
                data: [
                    estadisticas.totalReservasConfirmadas,
                    estadisticas.totalReservasPendientes,
                ],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)', // Verde para confirmadas
                    'rgba(255, 193, 7, 0.7)',  // Amarillo para pendientes
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#333',
                },
            },
            title: {
                display: true,
                text: 'Estado de Reservas',
                font: {
                    size: 18,
                    weight: 'bold',
                },
                color: '#333',
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw;
                        const total = context.dataset.data.reduce((acc, current) => acc + current, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    // Datos para el gráfico de horarios pico
    const horariosPicoLabels = Object.keys(estadisticas.horariosPico).sort((a, b) => {
        // Ordenar horas de forma numérica (ej. "08:00" antes de "09:00")
        const [ha, ma] = a.split(':').map(Number);
        const [hb, mb] = b.split(':').map(Number);
        if (ha !== hb) return ha - hb;
        return ma - mb;
    });
    const horariosPicoData = {
        labels: horariosPicoLabels,
        datasets: [
            {
                label: 'Número de Reservas',
                data: horariosPicoLabels.map(hora => estadisticas.horariosPico[hora]),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const horariosPicoOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#333',
                },
            },
            title: {
                display: true,
                text: 'Horarios Pico de Reservas',
                font: {
                    size: 18,
                    weight: 'bold',
                },
                color: '#333',
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Hora del Día',
                    color: '#555',
                },
                ticks: {
                    color: '#555',
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Cantidad de Reservas',
                    color: '#555',
                },
                ticks: {
                    color: '#555',
                },
                grid: {
                    color: '#eee',
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="admin-estadisticas-container">
            <h2 className="admin-estadisticas-title">Estadísticas del Complejo</h2>

            <div className="estadisticas-resumen">
                <div className="resumen-card ingresos">
                    <h3>Ingresos Confirmados</h3>
                    <p>${estadisticas.ingresosTotalesConfirmados.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="resumen-card reservas-confirmadas">
                    <h3>Reservas Confirmadas</h3>
                    <p>{estadisticas.totalReservasConfirmadas}</p>
                </div>
                <div className="resumen-card reservas-pendientes">
                    <h3>Reservas Pendientes</h3>
                    <p>{estadisticas.totalReservasPendientes}</p>
                </div>
                 {/* Si tu backend maneja "canceladas", habilita esto */}
                 {/* <div className="resumen-card reservas-canceladas">
                    <h3>Reservas Canceladas</h3>
                    <p>{estadisticas.totalReservasCanceladas}</p>
                </div> */}
            </div>

            <div className="estadisticas-charts">
                <div className="chart-item">
                    <Bar data={reservasPorCanchaData} options={barOptions} />
                </div>
                <div className="chart-item">
                    <Pie data={estadoReservasData} options={pieOptions} />
                </div>
                <div className="chart-item full-width-chart">
                    <Bar data={horariosPicoData} options={horariosPicoOptions} />
                </div>
            </div>

            <button className="back-to-admin-button" onClick={() => navigate('/admin/panel')}>
                Volver al Panel de Administrador
            </button>
        </div>
    );
};

export default AdminEstadisticas;