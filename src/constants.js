// Constantes de app compartidas entre App.jsx y los componentes bajo
// src/components/. Movida fuera de App.jsx en el reparto del 2026-08-08.
export const VERSION_APP = "46.6";

// Dirección del código de la app. La enseña "Mi cuenta" a quien tenga el
// permiso "Ver el código de la app" (lib/permisos.js).
// ⚠️ El repositorio es PÚBLICO: el permiso decide quién ve el enlace
// dentro de la app, no quién puede entrar a GitHub.
export const URL_REPOSITORIO = "https://github.com/espectante73/eventos";

// Panel de errores de la app en Sentry (ver lib/registroErrores.js). Solo
// lo ve el anfitrión, en Mi cuenta. Pide entrar con la cuenta de Sentry:
// el enlace no enseña nada a quien no la tenga.
export const URL_REGISTRO_ERRORES = "https://benito-farina.sentry.io/issues/";

// La nota de privacidad del tablón, tal como la escribió el usuario
// (2026-09-21). Es el valor POR DEFECTO: el texto de verdad vive en
// `evento."notaPrivacidad"` y se edita desde Datos del evento, con el
// permiso "Editar los datos del evento".
//
// ⚠️ LA NOTA MANDA SOBRE LA APP, no al revés. La casilla "Autorizo
// expresamente a que guarden mis datos", el respeto del Borrado total y
// el borrado de una foto de boda ya entregada existen porque este texto
// lo promete. Si alguien lo reescribe prometiendo otra cosa, la app no
// se entera: hay que comprobarlo a mano.
//
// ⚠️ Trato: TÚ en singular, USTEDES en plural, y TODO en tercera persona
// ("el anfitrión", "se guarda"). Decisión expresa suya. Ver CLAUDE.md.
//
// El RGPD no le aplica (art. 2.2.c, actividad personal): esta nota es
// deferencia con sus amigos, no una obligación.
export const NOTA_PRIVACIDAD_POR_DEFECTO =
  "Los datos que le diste a tu colaborador los gestiona Benito Fariña, el anfitrión, para organizar este evento. Es un evento privado, sin ánimo de lucro: el pago de la entrada es únicamente para cubrir los gastos de organización y para pagar los servicios de los profesionales contratados.\n\n<b>Qué se guarda:</b> tu nombre y apellidos, tu zona, si has pagado, tu mesa y si llegaste el día del evento, tu email, tu año de nacimiento, tu año de boda, una canción, alergias y observaciones. De los matrimonios invitados, la foto de su boda.\n\n<b>Para qué:</b> para saber cuántos invitados vienen, cómo sentarles, avisarles de las novedades, mandarles la invitación y que la cocina tenga en cuenta las alergias.\n\n<b>Las alergias</b> se piden solo para la cocina: si prefieres no decirlas, no pasa nada.\n\n<b>Quién lo ve:</b> el anfitrión y el colaborador que te atiende. Ningún colaborador ve los invitados de otro.\n\n<b>Dónde están los datos:</b> en servicios que trabajan por encargo del anfitrión (la base de datos, la web y el envío de correos). No se venden, no se ceden a terceros con fines comerciales ni se usan para publicidad.\n\n<b>Cuánto tiempo:</b> hasta 3 meses después del evento. Después se eliminarán, salvo que tú autorices expresamente que se guarden para otra ocasión. En ese caso, el colaborador te lo preguntará y dejará constancia de tu autorización.\n\n<b>Las fotos de boda:</b> en «Las bodas de todos» se verán las bodas de todos en sus fotos de boda. Esa es la razón por la que se piden: para mostrarlas. Si prefieren que la suya no se vea, basta con no darla, y si ya la dieron y cambian de idea, díganselo al colaborador y se borra.\n\n<b>Al entrar en este tablón</b> se guarda tu nombre y un código del aparato desde el que entras, solo para detectar accesos raros. No se guarda tu dirección de internet.\n\n<b>Lo que puedes pedir:</b> gestionar tus datos a través del colaborador y él se los trasladará al anfitrión.";

export const TITULO_NOTA_PRIVACIDAD = "Tus datos, en claro";
