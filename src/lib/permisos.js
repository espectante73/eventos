// Claves de permisos por colaborador -- lista de texto libre guardada en
// colaboradores.permisos (jsonb), no una columna nueva por cada función,
// para poder dar acceso a una zona nueva de la app en el futuro sin
// tocar el esquema cada vez (ver schema.sql). Centralizadas aquí para no
// repetir la cadena literal en cada sitio que las usa/concede.
export const PERMISOS = {
  NOVEDADES_EDITAR: "novedades_editar",
};

// Etiquetas legibles, para VentanaPermisos.jsx -- un objeto en vez de un
// switch, así añadir una clave nueva es una línea aquí y otra en
// PERMISOS, sin tocar el componente.
export const ETIQUETAS_PERMISOS = {
  [PERMISOS.NOVEDADES_EDITAR]: "Editar el texto de Novedades",
};

export function tienePermiso(colaborador, clave) {
  return Array.isArray(colaborador?.permisos) && colaborador.permisos.includes(clave);
}
