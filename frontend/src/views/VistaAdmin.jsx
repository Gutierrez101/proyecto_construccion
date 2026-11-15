import React, { useState, useEffect } from 'react';

export default function VistaAdmin() {
  const [turnos, setTurnos] = useState([]);
  const token = localStorage.getItem('token');

  const cargarTurnos = () => {
    fetch('http://localhost:8000/api/turnos/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return [];
        }
        return res.json();
      })
      .then((data) => setTurnos(data.results ? data.results : data))
      .catch((err) => console.error('Error al cargar turnos:', err));
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  const getBadgeColor = (estado) => {
    const colors = {
      'PENDIENTE': 'ql-badge-pendiente',
      'LLAMANDO': 'ql-badge-llamando',
      'EN_ATENCION': 'ql-badge-atencion',
      'COMPLETADO': 'ql-badge-completado',
      'CANCELADO': 'ql-badge-cancelado'
    };
    return colors[estado] || 'ql-badge-default';
  };

  // Contadores calculados sobre la lista actual de turnos
  const totalPendientes = turnos.filter((t) => t.estado === 'PENDIENTE').length;
  const totalActivos = turnos.filter((t) => t.estado === 'LLAMANDO' || t.estado === 'EN_ATENCION').length;
  const totalCompletados = turnos.filter((t) => t.estado === 'COMPLETADO').length;

  return (
    <div className="ql-card">
      <div className="ql-page-header">
        <div>
          <h2 className="ql-page-title">Monitor General de Turnos (Admin)</h2>
          <p className="ql-page-subtitle">
            Supervisión en tiempo real de los turnos generados y estados de atención
          </p>
        </div>
        <button onClick={cargarTurnos} className="ql-btn ql-btn-outline">
          Actualizar Lista
        </button>
      </div>

      {/* Resumen de indicadores */}
      <div className="ql-stats-grid">
        <div className="ql-stat-card">
          <p className="ql-stat-label">Total Registrados</p>
          <p className="ql-stat-value">{turnos.length}</p>
        </div>
        <div className="ql-stat-card">
          <p className="ql-stat-label">En Espera</p>
          <p className="ql-stat-value" style={{ color: 'var(--warning)' }}>
            {totalPendientes}
          </p>
        </div>
        <div className="ql-stat-card">
          <p className="ql-stat-label">En Ventanilla</p>
          <p className="ql-stat-value" style={{ color: 'var(--primary)' }}>
            {totalActivos}
          </p>
        </div>
        <div className="ql-stat-card">
          <p className="ql-stat-label">Completados</p>
          <p className="ql-stat-value" style={{ color: 'var(--success)' }}>
            {totalCompletados}
          </p>
        </div>
      </div>

      {/* Tabla de turnos */}
      <div className="ql-table-wrapper">
        <table className="ql-table">
          <thead>
            <tr>
              <th>Turno</th>
              <th>Ciudadano</th>
              <th>Identificación</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {turnos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No existen turnos registrados en este momento.
                </td>
              </tr>
            ) : (
              turnos.map((turno) => (
                <tr key={turno.id}>
                  <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                    {turno.codigo_turno}
                  </td>
                  <td style={{ fontWeight: '600' }}>{turno.ciudadano_nombre}</td>
                  <td>{turno.ciudadano_identificacion}</td>
                  <td>{turno.servicio_nombre}</td>
                  <td>
                    <span className={`ql-badge ${getBadgeColor(turno.estado)}`}>
                      {turno.estado}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    {new Date(turno.fecha_creacion).toLocaleString('es-EC')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}