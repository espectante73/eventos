// Claves de permisos por colaborador -- lista de texto libre guardada en
// colaboradores.permisos (jsonb), no una columna nueva por cada función,
// para poder dar acceso a una zona nueva de la app en el futuro sin
// tocar el esquema cada vez (ver schema.sql). Centralizadas aquí para no
// repetir la cadena literal en cada sitio que las usa/concede.
export const PERMISOS = {
  NOVEDADES_EDITAR: "novedades_editar",
  // ⚠️ Existió "email_editar" (editar solo el texto de los emails). Se
  // retiró el 2026-09-06, cuando las plantillas de email pasaron a vivir
  // DENTRO de "Datos del evento": quien puede editar esa ventana edita
  // todo su contenido, textos incluidos -- no tenía sentido un permiso
  // para una parte de una ventana que ya se concede entera.
  //
  // Un colaborador que tuviera "email_editar" concedido simplemente deja
  // de tener nada: la clave ya no la mira nadie. Si se le quiere
  // mantener el acceso, hay que marcarle "Editar los datos del evento".
  DATOS_EVENTO_EDITAR: "datos_evento_editar",
  INVITACIONES_ENVIAR: "invitaciones_enviar",
};

// Etiquetas legibles, para VentanaPermisos.jsx -- un objeto en vez de un
// switch, así añadir una clave nueva es una línea aquí y otra en
// PERMISOS, sin tocar el componente.
export const ETIQUETAS_PERMISOS = {
  [PERMISOS.NOVEDADES_EDITAR]: "Editar el texto de Novedades",
  [PERMISOS.DATOS_EVENTO_EDITAR]: "Editar los datos del evento (textos de email incluidos)",
  [PERMISOS.INVITACIONES_ENVIAR]: "Enviar invitaciones (solo confirmados y pagados)",
};

export function tienePermiso(colaborador, clave) {
  return Array.isArray(colaborador?.permisos) && colaborador.permisos.includes(clave);
}
