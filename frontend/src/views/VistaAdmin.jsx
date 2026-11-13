import React, { useState, useEffect } from 'react';

export default function VistaAdmin() {
  const [turnos, setTurnos] = useState([]);
  const token = localStorage.getItem('token');
  useEffect(() => {
    fetch('http://192.168.100.45:8000/api/turnos/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return [];
        }
        return res.json();
      })
      .then(data=>setTurnos(data.results ? data.results : data));
  }, []);

  const getBadgeColor = (estado) => {
    const colors = {
      'PENDIENTE': 'bg-yellow-200 text-yellow-800',
      'LLAMANDO': 'bg-blue-200 text-blue-800',
      'EN_ATENCION': 'bg-purple-200 text-purple-800',
      'COMPLETADO': 'bg-green-200 text-green-800',
      'CANCELADO': 'bg-red-200 text-red-800'
    };
    return colors[estado] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6">Monitor General de Turnos (Admin)</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Turno</th>
              <th className="py-3 px-4 text-left">Ciudadano</th>
              <th className="py-3 px-4 text-left">Identificación</th>
              <th className="py-3 px-4 text-left">Servicio</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-bold">{turno.codigo_turno}</td>
                <td className="py-3 px-4">{turno.ciudadano_nombre}</td>
                <td className="py-3 px-4">{turno.ciudadano_identificacion}</td>
                <td className="py-3 px-4">{turno.servicio_nombre}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(turno.estado)}`}>
                    {turno.estado}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {new Date(turno.fecha_creacion).toLocaleString('es-EC')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}