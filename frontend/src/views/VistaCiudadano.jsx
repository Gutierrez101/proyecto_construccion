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
      .then(res => res.json())
      .then(data => setServicios(data.results ? data.results : data));
  }, []);

  const solicitarTurno = async (e) => {
    e.preventDefault();
    const res = await fetch('http://192.168.100.45:8000/api/turnos/', {
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
      alert("Hubo un error al generar el turno.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Solicitar Turno</h2>
      
      {miTurno ? (
        <div className="text-center p-6 bg-green-100 rounded">
          <p className="text-lg">Tu número de turno es:</p>
          <h1 className="text-5xl font-black text-green-700 my-4">{miTurno.codigo_turno}</h1>
          <p>Por favor, espera a ser llamado a través de las pantallas.</p>
        </div>
      ) : (
        <form onSubmit={solicitarTurno} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Nombre completo" 
            required
            className="border p-2 rounded"
            onChange={(e) => setFormulario({...formulario, nombre: e.target.value})}
          />
          <input 
            type="text" 
            placeholder="Número de Identificación" 
            required
            className="border p-2 rounded"
            onChange={(e) => setFormulario({...formulario, identificacion: e.target.value})}
          />
          <select 
            required 
            className="border p-2 rounded"
            onChange={(e) => setFormulario({...formulario, servicio_id: e.target.value})}
          >
            <option value="">Seleccione un Trámite/Servicio</option>
            {servicios.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Generar Turno
          </button>
        </form>
      )}
    </div>
  );
}