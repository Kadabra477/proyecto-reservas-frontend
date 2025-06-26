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

    // Determina el endpoint de la API según el rol
    const API_ESTADISTICAS_URL = userRole === 'ADMIN' ? '/estadisticas/admin' : '/estadisticas/owner';
    // Ojo: Si el backend no tiene un endpoint específico para el owner,
    // y el /estadisticas/admin ya devuelve lo filtrado para el owner si se llama con su token,
    // entonces usa solo '/estadisticas/admin'.

    const fetchEstadisticas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(API_ESTADISTICAS_URL);
            // Asegúrate de que la data sea un objeto o manejar el caso de array si el backend lo devuelve así
            setEstadisticas(response.data); 
        } catch (err) {
            console.error("Error al cargar las estadísticas:", err);
            if (err.response && err.response.status === 403) {
                setError('Acceso denegado. No tienes permisos para ver las estadísticas solicitadas.');
            } else if (err.response?.status === 404) { // Manejo explícito del 404 para datos no encontrados
                setError('No se encontraron datos de estadísticas. Intenta registrar algunos complejos y reservas.');
                setEstadisticas(null); // Asegura que las estadísticas estén limpias
            }
            else {
                setError('Error al cargar las estadísticas. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    }, [API_ESTADISTICAS_URL]); // Depende de API_ESTADISTICAS_URL (que a su vez depende de userRole)

    useEffect(() => {
        fetchEstadisticas();
    }, [fetchEstadisticas]);

    if (loading) {
        return <div className="admin-estadisticas-container">Cargando estadísticas...</div>;
    }

    if (error) {
        return <div className="admin-estadisticas-container error-message">{error}</div>;
    }

    // **CRÍTICO:** Verificar si `estadisticas` es null o si sus propiedades son nulas antes de acceder a ellas.
    // Esto previene el error "Cannot convert undefined or null to object".
    if (!estadisticas || Object.keys(estadisticas).length === 0) {
        return <div className="admin-estadisticas-container">No hay datos de estadísticas disponibles.</div>;
    }

    // Datos para el gráfico de reservas por tipo de cancha
    const reservasPorCanchaData = {
        // Usa el operador OR (|| {}) para asegurar que sea un objeto vacío si es null/undefined
        labels: Object.keys(estadisticas.reservasPorTipoCancha || {}), 
        datasets: [
            {
                label: 'Número de Reservas',
                data: Object.values(estadisticas.reservasPorTipoCancha || {}), 
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
                // Asegurarse de que las propiedades existen antes de acceder a ellas
                data: [
                    estadisticas.totalReservasConfirmadas || 0,
                    estadisticas.totalReservasPendientes || 0,
                    estadisticas.totalReservasCanceladas || 0, // Incluye las canceladas
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

    // Horarios pico: asegurarse de que estadisticas.horariosPico existe
    const horariosPicoLabels = Object.keys(estadisticas.horariosPico || {}).sort((a, b) => {
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
                data: horariosPicoLabels.map(hora => estadisticas.horariosPico[hora] || 0),
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
                    <p>${(estadisticas.ingresosTotalesConfirmados || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="resumen-card reservas-confirmadas">
                    <h3>Reservas Confirmadas</h3>
                    <p>{estadisticas.totalReservasConfirmadas || 0}</p>
                </div>
                <div className="resumen-card reservas-pendientes">
                    <h3>Reservas Pendientes</h3>
                    <p>{estadisticas.totalReservasPendientes || 0}</p>
                </div>
                {/* Ahora el backend ya devuelve totalReservasCanceladas */}
                <div className="resumen-card reservas-canceladas">
                    <h3>Reservas Canceladas/Rechazadas</h3>
                    <p>{estadisticas.totalReservasCanceladas || 0}</p>
                </div>
            </div>

            <div className="estadisticas-charts">
                {Object.keys(estadisticas.reservasPorTipoCancha || {}).length > 0 ? (
                    <div className="chart-item">
                        <Bar data={reservasPorCanchaData} options={barOptions} />
                    </div>
                ) : (
                    <div className="chart-item no-data-message">No hay datos de reservas por tipo de cancha.</div>
                )}
                
                {(estadisticas.totalReservasConfirmadas || estadisticas.totalReservasPendientes || estadisticas.totalReservasCanceladas) > 0 ? (
                    <div className="chart-item">
                        <Pie data={estadoReservasData} options={pieOptions} />
                    </div>
                ) : (
                    <div className="chart-item no-data-message">No hay datos de estado de reservas.</div>
                )}

                {Object.keys(estadisticas.horariosPico || {}).length > 0 ? (
                    <div className="chart-item full-width-chart">
                        <Bar data={horariosPicoData} options={horariosPicoOptions} />
                    </div>
                ) : (
                    <div className="chart-item no-data-message">No hay datos de horarios pico.</div>
                )}
            </div>

            {/* Puedes mantener o eliminar este botón según tu navegación */}
            {/* <button className="back-to-admin-button" onClick={() => navigate('/admin/panel')}>
                Volver al Panel de Administrador
            </button> */}
        </div>
    );
};

export default AdminEstadisticas;