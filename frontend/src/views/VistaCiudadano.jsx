import React, { useState, useEffect } from 'react';
import { requestForToken, escucharNotificacionesPrimerPlano } from '../services/firebase';

export default function VistaCiudadano() {
  const [servicios, setServicios] = useState([]);
  const [formulario, setFormulario] = useState({ nombre: '', identificacion: '', servicio_id: '' });
  const [miTurno, setMiTurno] = useState(null);
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    // Pedir permiso y obtener token al cargar la vista
    requestForToken().then((token) => {
      if (token) setFcmToken(token);
    });

    escucharNotificacionesPrimerPlano();

    fetch('http://localhost:8000/api/servicios/')
      .then((res) => res.json())
      .then((data) => setServicios(data.results ? data.results : data))
      .catch((err) => console.error('Error al cargar servicios:', err));
  }, []);

  const solicitarTurno = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/turnos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudadano_nombre: formulario.nombre,
          ciudadano_identificacion: formulario.identificacion,
          servicio: formulario.servicio_id,
          fcm_token: fcmToken // Envio del token al backend
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMiTurno(data);
      } else {
        alert('Hubo un error al generar el turno.');
      }
    } catch (error) {
      alert('No se pudo conectar con el servidor para generar el turno.');
    }
  };

  return (
    <div className="ql-mobile-container">
      <div className="ql-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: '700',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              marginBottom: '8px'
            }}
          >
            ATENCIÓN CIUDADANA
          </span>
          <h2 className="ql-page-title">Solicitar Turno Virtual</h2>
          <p className="ql-page-subtitle">
            Complete sus datos para asignarle un turno de atención
          </p>
        </div>

        {miTurno ? (
          <div className="ql-ticket">
            <span className="ql-badge ql-badge-completado">Turno Generado</span>
            <p style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Su código de turno asignado es:
            </p>
            <h1 className="ql-ticket-code">{miTurno.codigo_turno}</h1>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--secondary)', marginBottom: '8px' }}>
              {miTurno.ciudadano_nombre || formulario.nombre}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Por favor, permanezca atento. Recibirá una notificación en su teléfono cuando sea llamado a ventanilla.
            </p>
          </div>
        ) : (
          <form onSubmit={solicitarTurno}>
            <div className="ql-form-group">
              <label className="ql-label" htmlFor="nombre">
                Nombre Completo
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                className="ql-input"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </div>

            <div className="ql-form-group">
              <label className="ql-label" htmlFor="identificacion">
                Número de Cédula / Identificación
              </label>
              <input
                id="identificacion"
                type="text"
                placeholder="Ej. 0501234567"
                required
                className="ql-input"
                value={formulario.identificacion}
                onChange={(e) => setFormulario({ ...formulario, identificacion: e.target.value })}
              />
            </div>

            <div className="ql-form-group" style={{ marginBottom: '24px' }}>
              <label className="ql-label" htmlFor="servicio">
                Trámite o Servicio Requerido
              </label>
              <select
                id="servicio"
                required
                className="ql-select"
                value={formulario.servicio_id}
                onChange={(e) => setFormulario({ ...formulario, servicio_id: e.target.value })}
              >
                <option value="">Seleccione un Trámite/Servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="ql-btn ql-btn-primary ql-btn-block ql-btn-lg">
              Generar Turno
            </button>
          </form>
        )}
      </div>
    </div>
  );
}