import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
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
import './AdminEstadisticas.css';

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

const AdminEstadisticas = ({ userRole }) => { // Recibe userRole como prop
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_ESTADISTICAS_URL = '/estadisticas/admin';

    const fetchEstadisticas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(API_ESTADISTICAS_URL);
            setEstadisticas(response.data);
        } catch (err) {
            console.error("Error al cargar las estadísticas:", err);
            if (err.response && err.response.status === 403) {
                // Mensaje más específico basado en el rol si es posible
                if (userRole === 'COMPLEX_OWNER') {
                    setError('Acceso denegado. No tienes permisos para ver las estadísticas globales. Se mostrarán las de tus complejos.');
                    // Nota: Si el backend ya filtra, este mensaje puede no ser necesario si no hay error 403
                    // y simplemente se muestran menos datos. Pero lo mantenemos si el backend realmente deniega.
                } else {
                    setError('Acceso denegado. No tienes permisos para ver las estadísticas.');
                }
            } else {
                setError('Error al cargar las estadísticas. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    }, [userRole]); // Depende de userRole para, hipotéticamente, ajustar la petición o el mensaje

    useEffect(() => {
        fetchEstadisticas();
    }, [fetchEstadisticas]);

    if (loading) {
        return <div className="admin-estadisticas-container">Cargando estadísticas...</div>;
    }

    if (error) {
        return <div className="admin-estadisticas-container error-message">{error}</div>;
    }

    if (!estadisticas) {
        return <div className="admin-estadisticas-container">No hay datos de estadísticas disponibles.</div>;
    }

    // Datos para el gráfico de reservas por tipo de cancha
    const reservasPorCanchaData = {
        labels: Object.keys(estadisticas.reservasPorTipoCancha), // Usar reservasPorTipoCancha
        datasets: [
            {
                label: 'Número de Reservas',
                data: Object.values(estadisticas.reservasPorTipoCancha), // Usar reservasPorTipoCancha
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
                text: 'Reservas por Tipo de Cancha', // Título ajustado
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

    const estadoReservasData = {
        labels: ['Confirmadas', 'Pendientes', 'Canceladas/Rechazadas'], // Añadido Canceladas
        datasets: [
            {
                data: [
                    estadisticas.totalReservasConfirmadas,
                    estadisticas.totalReservasPendientes,
                    estadisticas.totalReservasCanceladas, // Incluye las canceladas
                ],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',   // Verde para confirmadas
                    'rgba(255, 193, 7, 0.7)',   // Amarillo para pendientes
                    'rgba(220, 53, 69, 0.7)',   // Rojo para canceladas/rechazadas
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
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

    const horariosPicoLabels = Object.keys(estadisticas.horariosPico).sort((a, b) => {
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
            <h2 className="admin-estadisticas-title">Estadísticas {userRole === 'ADMIN' ? 'Generales' : 'de tus Complejos'}</h2>

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
                {/* Ahora el backend ya devuelve totalReservasCanceladas */}
                <div className="resumen-card reservas-canceladas">
                    <h3>Reservas Canceladas/Rechazadas</h3>
                    <p>{estadisticas.totalReservasCanceladas}</p>
                </div>
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

            {/* Puedes mantener o eliminar este botón según tu navegación */}
            {/* <button className="back-to-admin-button" onClick={() => navigate('/admin/panel')}>
                Volver al Panel de Administrador
            </button> */}
        </div>
    );
};

export default AdminEstadisticas;