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
  // Solo afecta a lo que se ve, no a lo que se puede tocar: enseña el
  // enlace "Mapa del sitio" dentro de "Mi cuenta". La imagen la sirve la
  // web sin más (public/mapa-de-la-aplicacion.png), así que no hay nada
  // que comprobar en la base de datos -- por eso este permiso no aparece
  // en schema.sql, a diferencia de los tres de arriba.
  MAPA_SITIO_VER: "mapa_sitio_ver",
  // Enseña en "Mi cuenta" el enlace al código en GitHub, para que el
  // desarrollador que revisa la app lo encuentre ahí dentro sin que haya
  // que mandárselo por otro lado (usuario, 2026-09-18). Igual que el del
  // mapa: solo de pantalla, sin nada que comprobar en la base.
  REPOSITORIO_VER: "repositorio_ver",
  // Enseña en "Mi cuenta" el diseño de la app (CLAUDE.md, el documento
  // con el que se construye). Se llamó "normas" una hora y se cambió:
  // chocaba con las "Normas de estándar" de dentro del documento, y un
  // colaborador podía leerlo como normas del evento. Solo de pantalla,
  // como el mapa: el archivo ya es público en GitHub, así que no hay nada
  // que proteger en la base
  // (usuario, 2026-09-24: "quiero poder dar permiso de ver").
  DISENO_VER: "diseno_ver",
};

// Etiquetas legibles, para VentanaPermisos.jsx -- un objeto en vez de un
// switch, así añadir una clave nueva es una línea aquí y otra en
// PERMISOS, sin tocar el componente.
export const ETIQUETAS_PERMISOS = {
  [PERMISOS.NOVEDADES_EDITAR]: "Editar el texto de Novedades",
  [PERMISOS.DATOS_EVENTO_EDITAR]: "Editar los datos del evento (textos de email incluidos)",
  [PERMISOS.INVITACIONES_ENVIAR]: "Enviar invitaciones (solo confirmados y pagados)",
  [PERMISOS.MAPA_SITIO_VER]: "Ver el mapa del sitio (dónde está cada cosa en la app)",
  [PERMISOS.REPOSITORIO_VER]: "Ver el proyecto en GitHub",
  [PERMISOS.DISENO_VER]: "Ver el diseño de la app (cómo se construye)",
};

// ⚠️ Hay DOS clases de permiso, y confundirlas ya dio un fallo real
// (usuario, 2026-09-21): el aviso rojo del colaborador decía "Tienes
// permisos de edición" y metía en la misma lista "Ver el código de la
// app", que no deja editar nada. El texto se escribió para los de
// EDICIÓN y los de VISTA se colaron después en la misma lista.
//
//   EDICIÓN: dejan CAMBIAR algo del evento. Hay que avisar de ellos: es
//            responsabilidad, y el colaborador tiene que saber que la
//            tiene.
//   VISTA:   solo enseñan algo que ya existe (el mapa, el código). No
//            son responsabilidad de nadie y no van en un aviso rojo.
//
// Al añadir un permiso nuevo hay que meterlo aquí; si no, el test
// permisos.test.js se pone en rojo.
export const PERMISOS_DE_VISTA = [PERMISOS.MAPA_SITIO_VER, PERMISOS.REPOSITORIO_VER, PERMISOS.DISENO_VER];

export function esDeEdicion(clave) {
  return !PERMISOS_DE_VISTA.includes(clave);
}

export function tienePermiso(colaborador, clave) {
  return Array.isArray(colaborador?.permisos) && colaborador.permisos.includes(clave);
}
