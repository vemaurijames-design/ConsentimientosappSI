import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../lib/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo?: boolean;
}

const AdminUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Si AuthContext no existe o falla, no rompemos la pantalla
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;

  const getToken = () => {
    return (
      localStorage.getItem('medfis_token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa. Vuelve a iniciar sesión.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      if (err.response?.status === 403) {
        setError('Acceso denegado (403). Verifica rol y CORS.');
      } else if (err.response?.status === 401) {
        setError('Sesión expirada. Cierra sesión y vuelve a entrar.');
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            'No se pudieron cargar los usuarios.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleToggle = async (usuario: Usuario) => {
    const accion = usuario.activo !== false ? 'DESACTIVAR' : 'ACTIVAR';
    if (!window.confirm(`¿Seguro que deseas ${accion} a ${usuario.nombre}?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await axios.patch(
        `${API_URL}/usuarios/${usuario.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const actualizado = response.data;
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id
            ? { ...u, activo: actualizado?.activo ?? !u.activo }
            : u
        )
      );
      setSuccess(
        `${usuario.nombre} ${
          actualizado?.activo ? 'activado' : 'desactivado'
        } correctamente`
      );
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Error al cambiar el estado del usuario'
      );
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    if (
      !window.confirm(
        `¿ELIMINAR permanentemente a "${usuario.nombre}"?\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/usuarios/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
      setSuccess(`Usuario "${usuario.nombre}" eliminado correctamente`);
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      console.error(err);
      const status = err.response?.status;
      let msg = 'Error al eliminar el usuario';
      if (status === 405 || status === 404) {
        msg =
          'El backend no tiene el endpoint DELETE. Agrégalo y reinicia el backend.';
      } else if (status === 403) {
        msg = 'No tienes permiso para eliminar (solo ADMINISTRADOR).';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (typeof err.response?.data === 'string') {
        msg = err.response.data;
      }
      setError(msg);
      setTimeout(() => setError(''), 6000);
    }
  };

  // Comparar rol sin fallar por mayúsculas/tildes
  const esAdminLogueado = (user?.rol || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') === 'ADMINISTRADOR';

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Lista de Usuarios</h2>
        <button
          type="button"
          onClick={fetchUsuarios}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Recargar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Nombre
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Email
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Rol
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Estado
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => {
              const esAdminFila = (u.rol || '')
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') === 'ADMINISTRADOR';

              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {u.nombre}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.activo !== false
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* ===== COLUMNA ACCIONES (versión segura) ===== */}
                  <td className="py-3 px-4">
                    {esAdminFila ? (
                      <span className="text-xs text-gray-400">Protegido</span>
                    ) : esAdminLogueado ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
                            u.activo !== false
                              ? 'bg-amber-500 hover:bg-amber-600'
                              : 'bg-emerald-500 hover:bg-emerald-600'
                          }`}
                        >
                          {u.activo !== false ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && !error && (
        <p className="text-center text-gray-400 text-sm mt-6">
          No hay usuarios para mostrar.
        </p>
      )}
    </div>
  );
};

export default AdminUsuarios;