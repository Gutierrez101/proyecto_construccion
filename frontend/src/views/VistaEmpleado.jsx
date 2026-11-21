import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = `http://${window.location.hostname}:8000/api`;

export default function VistaEmpleado() {
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [turnoActual, setTurnoActual] = useState(null);

  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const manejarNoAutorizado = () => {
    localStorage.removeItem('token');
    alert('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    navigate('/login');
  };

  // 1. Cargar los servicios activos desde Django
  useEffect(() => {
    const cargarServicios = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        manejarNoAutorizado();
        return;
      }

      try {
        const res = await fetch(`${API_URL}/servicios/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'application/json'
          }
        });

        if (res.status === 401) {
          manejarNoAutorizado();
          return;
        }

        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data.error || 'No se pudieron cargar los servicios.');
        }

        // Compatible con respuestas normales y respuestas paginadas de DRF
        const listaServicios = Array.isArray(data)
          ? data
          : (data.results || []);

        const serviciosActivos = listaServicios.filter(
          servicio => servicio.activo !== false
        );

        setServicios(serviciosActivos);

        // Seleccionar automáticamente cuando solo existe un servicio
        if (serviciosActivos.length === 1) {
          setServicioSeleccionado(String(serviciosActivos[0].id));
        }

        if (serviciosActivos.length === 0) {
          setMensaje('No existen servicios activos disponibles para atender.');
        }

      } catch (error) {
        setMensaje(error.message || 'Error al consultar los servicios.');
      } finally {
        setCargandoServicios(false);
      }
    };

    cargarServicios();
  }, []);

  // Obtener el servicio seleccionado
  const servicioActual = servicios.find(
    servicio => String(servicio.id) === String(servicioSeleccionado)
  );

  // 2. Llamar al siguiente ciudadano del servicio seleccionado
  const llamarSiguiente = async () => {
    const token = localStorage.getItem('token');

    if (!token) return manejarNoAutorizado();

    if (!servicioSeleccionado) {
      setMensaje('Primero selecciona el servicio que deseas atender.');
      return;
    }

    setProcesando(true);
    setMensaje('');

    try {
      const res = await fetch(`${API_URL}/turnos/llamar_siguiente/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          servicio_id: Number(servicioSeleccionado)
        })
      });

      if (res.status === 401) return manejarNoAutorizado();

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setTurnoActual(data);
        setMensaje('');
      } else {
        setMensaje(
          data.mensaje ||
          data.error ||
          'No se pudo llamar al siguiente ciudadano.'
        );
      }

    } catch (error) {
      setMensaje('No fue posible comunicarse con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  // 3. Actualizar el estado del turno actual
  const actualizarEstado = async (nuevoEstado) => {
    const token = localStorage.getItem('token');

    if (!token) return manejarNoAutorizado();
    if (!turnoActual) return;

    setProcesando(true);
    setMensaje('');

    try {
      const res = await fetch(
        `${API_URL}/turnos/${turnoActual.id}/actualizar_estado/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ estado: nuevoEstado })
        }
      );

      if (res.status === 401) return manejarNoAutorizado();

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMensaje(data.error || 'No se pudo actualizar el estado del turno.');
        return;
      }

      if (nuevoEstado === 'COMPLETADO') {
        setTurnoActual(null);
        setMensaje('La atención finalizó correctamente. Ya puedes atender otro turno.');
      } else {
        setTurnoActual(data);
      }

    } catch (error) {
      setMensaje('No fue posible comunicarse con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '16px auto' }}>
      <div className="ql-card">

        <div className="ql-page-header">
          <div>
            <h2 className="ql-page-title">
              Módulo de Atención en Ventanilla
            </h2>
            <p className="ql-page-subtitle">
              Selecciona un servicio y gestiona los turnos de los ciudadanos.
            </p>
          </div>

          <span className="ql-badge ql-badge-llamando">
            Atención de turnos
          </span>
        </div>

        {/* SELECTOR DINÁMICO DE SERVICIOS */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="servicio"
            style={{
              display: 'block',
              fontWeight: '700',
              marginBottom: '8px',
              color: 'var(--secondary)'
            }}
          >
            Servicio que deseas atender
          </label>

          <select
            id="servicio"
            value={servicioSeleccionado}
            onChange={(e) => {
              setServicioSeleccionado(e.target.value);
              setMensaje('');
            }}
            disabled={cargandoServicios || procesando || !!turnoActual}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              background: '#fff'
            }}
          >
            <option value="">
              {cargandoServicios
                ? 'Cargando servicios...'
                : 'Selecciona un servicio'}
            </option>

            {servicios.map(servicio => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre} ({servicio.codigo})
              </option>
            ))}
          </select>

          {servicioActual && (
            <p style={{
              marginTop: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              Servicio seleccionado: <strong>{servicioActual.nombre}</strong>
            </p>
          )}

          {turnoActual && (
            <p style={{
              marginTop: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              Para cambiar de servicio, primero finaliza la atención actual.
            </p>
          )}
        </div>

        {/* MENSAJES DEL SISTEMA */}
        {mensaje && (
          <div
            role="alert"
            style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: '#fff3cd',
              color: '#664d03'
            }}
          >
            {mensaje}
          </div>
        )}

        {/* VISTA CUANDO NO EXISTE UN TURNO EN ATENCIÓN */}
        {!turnoActual ? (
          <div className="ql-empty-box">
            <h3 style={{
              fontSize: '1.2rem',
              color: 'var(--secondary)',
              marginBottom: '8px'
            }}>
              Ventanilla Disponible
            </h3>

            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '24px',
              fontSize: '0.92rem'
            }}>
              Selecciona el servicio y presiona el botón para llamar
              al siguiente ciudadano de su fila de espera.
            </p>

            <button
              onClick={llamarSiguiente}
              className="ql-btn ql-btn-success ql-btn-lg"
              disabled={
                cargandoServicios ||
                procesando ||
                !servicioSeleccionado
              }
            >
              {procesando ? 'Procesando...' : 'Llamar Siguiente Turno'}
            </button>
          </div>

        ) : (

          /* VISTA DEL CIUDADANO LLAMADO */
          <div className="ql-attention-box">

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                Turno en Ventanilla
              </span>

              <span className={`ql-badge ${
                turnoActual.estado === 'EN_ATENCION'
                  ? 'ql-badge-atencion'
                  : 'ql-badge-llamando'
              }`}>
                {turnoActual.estado}
              </span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <span style={{
                fontSize: '2.6rem',
                fontWeight: '900',
                color: 'var(--primary)'
              }}>
                {turnoActual.codigo_turno}
              </span>
            </div>

            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}>
              Servicio: <strong>
                {turnoActual.servicio_nombre || servicioActual?.nombre}
              </strong>
            </p>

            <div className="ql-info-grid">
              <div>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  CIUDADANO
                </p>

                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--secondary)'
                }}>
                  {turnoActual.ciudadano_nombre}
                </p>
              </div>

              <div>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  IDENTIFICACIÓN
                </p>

                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'var(--secondary)'
                }}>
                  {turnoActual.ciudadano_identificacion}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => actualizarEstado('EN_ATENCION')}
                className="ql-btn ql-btn-primary"
                disabled={
                  procesando ||
                  turnoActual.estado === 'EN_ATENCION'
                }
              >
                Iniciar Trámite
              </button>

              <button
                onClick={() => actualizarEstado('COMPLETADO')}
                className="ql-btn ql-btn-dark"
                disabled={
                  procesando ||
                  turnoActual.estado !== 'EN_ATENCION'
                }
              >
                Finalizar Atención
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}