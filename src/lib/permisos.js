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
  // Manejar la música (y el vídeo, cuando exista) desde el mando, con su
  // propia cuenta (él, v57.2). UNO para los dos, a propósito: lo más
  // sencillo y estable; quién lleva qué lo acuerdan entre ellos. Lo
  // comprueba la base al entrar en el canal (puede_usar_canal).
  MULTIMEDIA: "multimedia",
  // Leer el QR de las invitaciones en la entrada (él, v83.2): para los
  // acomodadores que también son colaboradores. Lo comprueba la base.
  ACREDITAR_ENTRADA: "acreditar_entrada",
  // «Canciones para bailar» dentro de la app (v91.5, él): la lista del DJ,
  // para el DJ con su cuenta. Solo para mirar; lo comprueba la base
  // (colaborador_canciones_dj).
  CANCIONES_DJ: "canciones_dj",
  // Ver Contabilidad para repasarla (v95, él: «es para repasar lo que se me
  // escape a mí, no necesita nombres de personas»): solo cifras, sin nombres
  // de invitados (la nota de privacidad: ningún colaborador ve los invitados
  // de otro) y solo para mirar. Lo comprueba la base (colaborador_contabilidad).
  CONTABILIDAD_VER: "contabilidad_ver",
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
  [PERMISOS.MULTIMEDIA]: "Multimedia (manejar la música y el vídeo con el mando)",
  [PERMISOS.ACREDITAR_ENTRADA]: "Acreditar en la entrada (leer el QR de las invitaciones)",
  [PERMISOS.CANCIONES_DJ]: "Canciones para bailar (ver la lista del DJ)",
  [PERMISOS.CONTABILIDAD_VER]: "Ver la contabilidad (solo cifras, para repasarla)",
};

// Cómo se ENSEÑAN en Permisos: por zona de la app, con su título (él,
// v91.7: «deberían estar ordenados por secciones, música y multimedia no
// están juntos»). Es otra cosa que las tres clases de abajo, que deciden
// qué dice el aviso rojo del colaborador: Multimedia es «en la app» y
// Canciones para bailar «de vista», pero las dos son de la música. Un
// permiso nuevo entra en un grupo; si no, permisos.test.js se pone en rojo.
export const GRUPOS_PERMISOS = [
  { titulo: "Textos del evento", claves: [PERMISOS.NOVEDADES_EDITAR, PERMISOS.DATOS_EVENTO_EDITAR] },
  { titulo: "Invitaciones y entrada", claves: [PERMISOS.INVITACIONES_ENVIAR, PERMISOS.ACREDITAR_ENTRADA] },
  { titulo: "Música", claves: [PERMISOS.MULTIMEDIA, PERMISOS.CANCIONES_DJ] },
  { titulo: "Contabilidad", claves: [PERMISOS.CONTABILIDAD_VER] },
  { titulo: "Cómo está hecha la app", claves: [PERMISOS.MAPA_SITIO_VER, PERMISOS.REPOSITORIO_VER, PERMISOS.DISENO_VER] },
];

// Los permisos de alguien en el orden de los grupos (para «Permisos
// concedidos»); una clave que ya no existe, al final.
const ORDEN_PERMISOS = GRUPOS_PERMISOS.flatMap((g) => g.claves);
export function ordenarPermisos(claves = []) {
  const posicion = (c) => (ORDEN_PERMISOS.includes(c) ? ORDEN_PERMISOS.indexOf(c) : ORDEN_PERMISOS.length);
  return [...claves].sort((a, b) => posicion(a) - posicion(b));
}

// ⚠️ Hay TRES clases de permiso, y confundirlas ya dio dos fallos reales:
// el aviso rojo del colaborador decía "Tienes permisos de edición" y metía
// "Ver el código de la app", que no deja editar nada (usuario,
// 2026-09-21); y llamaba "de edición" a Multimedia, que es un permiso
// dentro de la app (él, v91.4: «solamente hay permiso de edición cuando se
// le permite editar texto»).
//
//   EDICIÓN:    dejan cambiar TEXTO del evento (Novedades, los datos del
//               evento y sus emails). Solo estos se llaman «de edición».
//   EN LA APP:  dejan HACER algo dentro de la app (enviar invitaciones,
//               Multimedia, acreditar en la entrada, repasar la
//               contabilidad: solo mira, pero es una responsabilidad, v95.1,
//               él: «no aparece el banner de permisos que tienen los demás»).
//   VISTA:      solo enseñan algo que ya existe (el mapa, el código, el
//               diseño, la lista del DJ). No son responsabilidad de nadie.
//
// Los de edición y los de la app son responsabilidad: van en el aviso rojo,
// cada uno con su frase. Al añadir un permiso nuevo hay que meterlo en una
// de las tres; si no, el test permisos.test.js se pone en rojo.
export const PERMISOS_DE_EDICION = [PERMISOS.NOVEDADES_EDITAR, PERMISOS.DATOS_EVENTO_EDITAR];
export const PERMISOS_EN_LA_APP = [PERMISOS.INVITACIONES_ENVIAR, PERMISOS.MULTIMEDIA, PERMISOS.ACREDITAR_ENTRADA, PERMISOS.CONTABILIDAD_VER];
export const PERMISOS_DE_VISTA = [PERMISOS.MAPA_SITIO_VER, PERMISOS.REPOSITORIO_VER, PERMISOS.DISENO_VER, PERMISOS.CANCIONES_DJ];

export const esDeEdicion = (clave) => PERMISOS_DE_EDICION.includes(clave);
export const esDeLaApp = (clave) => PERMISOS_EN_LA_APP.includes(clave);

export function tienePermiso(colaborador, clave) {
  return Array.isArray(colaborador?.permisos) && colaborador.permisos.includes(clave);
}
