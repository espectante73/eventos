// Ventana "Versiones": historial de cambios de la app. No depende de
// ningún dato del evento — solo de sus propias constantes. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { VERSION_APP } from "../../constants";
import { Stamp } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Versiones anteriores ya cerradas (números enteros completos): un resumen
// breve por versión mayor, en vez de listar cada sub-versión — ocupa menos
// espacio en la sección "Versiones".
const RESUMEN_VERSIONES_ANTERIORES = [
  {
    version: "5",
    cambios:
      'Enlace del anfitrión cerrado con token secreto. Avisos automáticos por email (Resend) para asignación de invitados, datos completos y pagos completos, y envío de la invitación (con imagen adjunta) a cada familia, todo con vista previa y confirmación explícita — nunca disparado solo. Formulario del colaborador rediseñado para móvil. Cuadrícula de calibración para posicionar fecha/hora/lugar sobre la imagen de la invitación. Zona de Reinicio para limpiar datos de pruebas sin borrar invitados ni colaboradores.',
  },
  {
    version: "4",
    cambios:
      "Migración a una web real: los datos ya no viven en un Artifact sino en una base de datos compartida (Supabase), con web propia (Vite) desplegada automáticamente desde GitHub. El aislamiento entre colaboradores (cada uno solo ve sus invitados asignados) se cumple en el propio servidor, no solo en la pantalla.",
  },
  {
    version: "3",
    cambios:
      "Los campos de edición se movieron a Configuración; portada solo lectura con la fecha en formato largo.",
  },
  {
    version: "2",
    cambios:
      "Cobro automático por edad y precios, invitación generada con plantilla vertical (Familia/Mesa/PAGADO integrado), alergias con selectores dedicados y aviso en mesa, BORRAR TODO en Configuración, y encabezados sin flecha.",
  },
  {
    version: "1",
    cambios:
      "Primera versión estable: tabla ordenable, imagen de cabecera incrustada, enlaces de colaborador vía URL pública, foto de boda por familia, y límite de capacidad respetado en mesas.",
  },
];

// A partir de la 6.0, "cambios" es una lista de párrafos cortos (uno por
// área mejorada) en vez de un único bloque de texto largo — más fácil de
// leer de un vistazo.
const HISTORIAL_VERSIONES = [
  {
    version: "11",
    cambios: [
      'Nueva figura "rol de trabajo" en la Lista de invitados (icono de etiqueta, junto al de borrar): marca a un invitado como acomodador, fotografía o cualquier otro rol que actúe EL DÍA del evento -- sin darle ningún acceso a la app, es solo una etiqueta para poder asignarlo luego a un bloque del cronograma. Catálogo abierto: escribes el nombre del rol la primera vez, no hace falta tocar código para añadir uno nuevo.',
    ],
  },
  {
    version: "10.5",
    cambios: [
      "Cronograma: cada bloque ya deja elegir qué colaboradores lo atienden (pueden ser varios a la vez) y marcarlo como \"ya lo he supervisado\". Logística resume cuántos bloques están supervisados y avisa si alguno se ha quedado sin nadie asignado.",
    ],
  },
  {
    version: "10.4",
    cambios: [
      "Cronograma: cada bloque ya no se edita con una hora exacta -- se le dan los minutos que dura, y la hora de inicio de ese bloque (y de todos los que van después) se calcula sola a partir de la hora de inicio del cronograma. Cambiar la duración de un bloque desplaza automáticamente todos los siguientes, sin tocarlos a mano.",
    ],
  },
  {
    version: "10.3",
    cambios: [
      "Configuración → Cronograma, mucho más compacta: en vez de ver los 9 bloques a la vez, se elige uno con un desplegable (mismo criterio que Permisos) y solo se edita ese. La hora pasa a ser un único desplegable con todos los horarios en pasos de 5 minutos, en vez de dos relojes separados.",
    ],
  },
  {
    version: "10.2",
    cambios: [
      "Arreglado de raíz el menú de Safari sobre las horas del cronograma (\"Crear evento\", \"Abrir calendario\"...): el campo de hora ya no es un <input> de tipo fecha (que Safari trataba como tal, sin la etiqueta que se probó antes) -- ahora son dos desplegables normales (hora / minutos de 5 en 5), que Safari nunca confunde con una fecha.",
    ],
  },
  {
    version: "10.1",
    cambios: [
      "Quitada la opción \"Visible para invitados\" del cronograma -- a petición del usuario: es una herramienta de trabajo para quien organiza el evento, nunca para el invitado que solo viene a disfrutarlo. Solo queda \"Visible para colaboradores\".",
    ],
  },
  {
    version: "10",
    cambios: [
      'Cronograma reconstruido de cero: ya no se sube una imagen a mano -- se editan los 9 bloques (hora en pasos de 5 minutos + texto) desde Configuración → Cronograma, y la app dibuja sola la imagen: el ancho de cada bloque representa cuánto dura de verdad ese tramo, con la hora marcando el inicio en la esquina superior izquierda. La misma imagen se ve, siempre al día, en Logística, en el tablón público y en la vista de colaborador.',
      "Botón para imprimir el cronograma, para poder entregarlo en papel a los colaboradores.",
    ],
  },
  {
    version: "9.6",
    cambios: [
      "Textos email (Configuración) gana los mismos botones de negrita/cursiva/subrayado que ya tenía Novedades, en cada una de las 4 plantillas -- ya no hace falta escribir <b>/<i>/<u> a mano ahí tampoco.",
    ],
  },
  {
    version: "9.5",
    cambios: [
      "El colaborador ve ahora un banner rojo fijo arriba de su vista mientras tenga cualquier permiso de edición concedido (\"Tienes permisos de edición: ...\") -- antes no había ningún aviso, ni email ni dentro de la app, así que solo se enteraba si encontraba el botón nuevo por casualidad.",
    ],
  },
  {
    version: "9.4",
    cambios: [
      "Arreglado: al reemplazar la imagen del cronograma, seguía viéndose la anterior (en el tablón público, en la vista de colaborador y en Logística) -- el navegador la tenía cacheada porque el nombre de archivo no cambia nunca. Ahora cada visita fuerza a pedirla de nuevo.",
    ],
  },
  {
    version: "9.3",
    cambios: [
      "La sección Cronograma de Logística nace desplegada por defecto (a diferencia de las demás): la imagen se ve de un vistazo nada más abrir la ventana, sin tener que desplegarla.",
    ],
  },
  {
    version: "9.2",
    cambios: [
      "La sección Cronograma de Logística ya enseña la propia imagen (para ti, siempre que esté subida) además del texto de estado -- antes había que ir a Configuración para verla.",
    ],
  },
  {
    version: "9.1",
    cambios: [
      "Logística pasa a ser una ventana de verdad del sistema operativo (como Novedades), con sus secciones (Cronograma, Tablón/FAQ, Música ambiental, Colaboradores, Permisos) plegables y plegadas por defecto -- deja de parecerse a Progreso.",
      "La sección de música se etiqueta \"Música ambiental (tablón público)\" y aclara que no es la canción que pide cada invitado para el convite (esa sigue en Progreso) -- para no confundir las dos cosas distintas que comparten la palabra \"música\".",
    ],
  },
  {
    version: "9",
    cambios: [
      'Nueva ventana "Logística": panel de solo lectura con el estado general del evento de un vistazo -- cuenta atrás, confirmados/pagados, si el cronograma está subido y a quién es visible, cuántas entradas del tablón/FAQ están publicadas, si hay música ambiental subida, qué colaboradores han terminado lo suyo, y qué permisos tiene concedido cada uno. No añade datos nuevos ni edición -- reúne en un sitio lo que antes había que ir a mirar ventana por ventana.',
    ],
  },
  {
    version: "8.1",
    cambios: [
      "Cronograma: oculto por defecto. Dos casillas nuevas en Configuración → Cronograma deciden si se enseña a colaboradores y/o a invitados (tablón público) — antes de marcarlas, nadie más que tú lo ve.",
      "Ventana Permisos, segundo ajuste: en vez de un desplegable por colaborador, ahora se elige a la persona con un <select> y sus permisos quedan siempre visibles debajo, sin nada más que abrir.",
    ],
  },
  {
    version: "8",
    cambios: [
      'Nueva sección "Cronograma" en Configuración: sube (y puede reemplazar cuando quieras) una imagen con el cronograma o la logística del día, que se ve en su propio bloque dentro del tablón público (FAQ).',
      "Ventana Permisos rediseñada: una sola columna con el checkbox a la derecha (alcance cómodo del pulgar), y cada colaborador plegado por defecto en su propio desplegable — la ventana ocupa mucho menos sitio, sobre todo en móvil.",
    ],
  },
  {
    version: "7",
    cambios: [
      "Tres permisos nuevos en la ventana Permisos: editar el texto de los emails, editar los datos del evento, y enviar invitaciones — este último solo deja ver y mandar a familias ya confirmadas y con todos los pagos hechos, y pide confirmar aparte que el dinero ya está en tu poder antes de cada envío.",
    ],
  },
  {
    version: "6.9",
    cambios: [
      'Nueva ventana "Permisos": puedes darle a un colaborador concreto acceso a editar el texto de las novedades/FAQ existentes, sin darle acceso a nada más — crear, borrar, publicar, marcar NOVEDADES/FAQ, el enlace del tablón y la configuración de WhatsApp/pregunta de acceso quedan bloqueados para él. Pensada para ir sumando más permisos de este tipo en el futuro.',
    ],
  },
  {
    version: "6.8",
    cambios: [
      'El apartado público pasa a llamarse "FAQ" (antes "Novedades") — cada entrada lleva una etiqueta automática, "FAQ" o "NOVEDADES", según la marques en el editor. Pensado para que la mayoría (preguntas frecuentes) convivan con los avisos de cambios de verdad, sin mezclarlos visualmente ni tener que escribir la etiqueta a mano.',
    ],
  },
  {
    version: "6.7",
    cambios: [
      'Capa extra de protección en el tablón público: una pregunta con respuesta (configurable en Novedades, opcional) que hay que responder antes de ver nada — aunque el enlace se reenvíe fuera del grupo, sin la respuesta correcta no se ve ni la fecha del evento. Cada dispositivo la recuerda tras la primera vez, no hace falta responderla cada visita.',
    ],
  },
  {
    version: "6.6",
    cambios: [
      "Arreglado de raíz: subir la imagen para WhatsApp o una pista de música ambiental nunca llegaba a funcionar (los dos buckets llevaban vacíos desde que se crearon) — un permiso mal puesto en la base de datos rechazaba la subida en silencio hasta este cambio.",
    ],
  },
  {
    version: "6.5",
    cambios: [
      "Ventana Novedades rediseñada: sin texto explicativo, con \"Nueva novedad\" y \"Copiar enlace\" en la propia cabecera, y el enlace del grupo de WhatsApp en el pie — más limpia, más rápida de usar.",
      "Novedades se abre ahora en una ventana de verdad, aparte del navegador — se puede agrandar o llevar a otro monitor sin las limitaciones de las demás ventanas de la app.",
      "Reordenados los botones de la portada: Cerrar sesión, Novedades y Mi cuenta, de arriba a abajo.",
      "Arreglado: los botones de la cabecera de Novedades (Enlace/Nueva) no respondían al pulsarlos.",
      "Cada novedad se puede plegar/desplegar por separado (como ya pasaba en el tablón público) — con varias escritas, ya no hace falta ver todo el texto de golpe para encontrar la que buscas.",
      "Solo una novedad abierta a la vez, en Novedades y en el tablón público — al desplegar una se pliegan las demás solas.",
      "El botón 'Enlace' de Novedades ahora copia el enlace del tablón Y abre el grupo de WhatsApp en el mismo clic — solo falta pegarlo y darle a enviar (ninguna web puede hacer eso último por ti, WhatsApp no lo permite).",
    ],
  },
  {
    version: "6.4",
    cambios: [
      'Botón "Novedades" en la portada, tanto para el anfitrión como para cada colaborador — abre el tablón público en un clic y se puede volver atrás sin perder la sesión.',
      "El tablón público avisa ahora, con un candado, de que el enlace es privado y no debe compartirse fuera del grupo.",
      "Música ambiental de fondo en el tablón público — se sube desde Configuración → Fondo musical (varias pistas suenan una detrás de otra); un botón flotante la activa (los navegadores no dejan sonar nada solo, hace falta ese primer clic).",
      'Ventana Novedades: negrita/cursiva/subrayado con botones al escribir, sin tener que teclear etiquetas a mano, y un enlace directo al grupo de WhatsApp para avisar "hay novedades nuevas" sin dejar que 140 personas puedan escribirte directamente a ti.',
      "Al pegar cualquier enlace de esta web en WhatsApp o Facebook, ahora aparece una miniatura con imagen (antes solo se veía el texto del enlace, sin foto) — la imagen se sube desde Configuración → Datos del evento.",
      "Ventana Novedades: Tab para sangrar y un botón de viñetas al escribir, y los saltos de línea normales (Enter) ya se ven de verdad en el tablón público — antes se perdían si no se añadía un salto a mano.",
    ],
  },
  {
    version: "6.3",
    cambios: [
      'Nueva sección "Novedades": un tablón de anuncios público y de solo lectura, con un único enlace que se comparte una vez (por ejemplo en el grupo de WhatsApp de confirmados) — nadie sin el enlace lo encuentra, y quien lo tenga ve fecha/hora/lugar del evento fijos arriba y las novedades debajo, plegadas por secciones para que no se lea como un bloque grande de texto.',
      "Pensado para ir creciendo con el número de confirmados sin repartir enlaces nuevos: es el mismo enlace para todo el grupo, no uno por persona.",
    ],
  },
  {
    version: "6.2",
    cambios: [
      "Si un colaborador cambia su email de acceso, ahora también actualiza el email al que le llegan sus avisos automáticos, sin ningún paso manual — con un aviso claro para el anfitrión en Colaboradores, para no perder de vista el cambio.",
      "Comprobación de seguridad (CAPTCHA) en los tres formularios de entrada (entrar, crear cuenta, recuperar contraseña) — frena a un script automatizado probando contraseñas al azar, algo que no venía cubierto de fábrica.",
    ],
  },
  {
    version: "6.1",
    cambios: [
      "Login real (email + contraseña) para el anfitrión y para cada colaborador, en paralelo al enlace mágico de siempre — nadie tuvo que cambiar cómo entraba hasta que quiso.",
      'Cada colaborador crea su propia cuenta desde "Crear cuenta" usando el email con el que ya estaba dado de alta — se enlaza sola con su ficha, sin ningún paso manual de por medio. Si más adelante cambia de email, basta con actualizarlo en Colaboradores y volver a crear cuenta con el nuevo: se re-enlaza sola otra vez.',
      "El enlace-token antiguo deja de funcionar para colaboradores (ahora hace falta el login de verdad); el del anfitrión se mantiene como plan B, sin cambios.",
      'Enlace de colaborador viejo abierto sin haber iniciado sesión: pantalla clara de "No tienes acceso" con enlace a iniciar sesión, en vez de una vista técnica confusa que parecía un fallo de la app.',
      'Corrige que la previsualización "Formularios" del anfitrión llevaba rota desde la retirada del enlace-token: ahora reutiliza los datos que el anfitrión ya tiene cargados en vez de intentar una recarga que exigía sesión real de esa otra persona.',
      "Fallo de seguridad encontrado y cerrado en pruebas en vivo: la función que resuelve el rol al iniciar sesión concedía permiso de ejecución a cualquiera por defecto (aunque sin sesión no llegaba a devolver ningún dato real) — corregido revocando ese permiso explícitamente.",
      "Aviso inmediato si un email no parece válido (falta la arroba, el punto...) en Colaboradores, en tu email de anfitrión y al entrar o crear cuenta — antes solo se notaba cuando dejaba de llegar un aviso, sin saber por qué.",
      "Nuevo botón \"Mi cuenta\" (junto a \"Cerrar sesión\"): tanto el anfitrión como cualquier colaborador con sesión iniciada pueden cambiar su propia contraseña o su email de acceso sin tener que cerrar sesión ni pasar por \"He olvidado mi contraseña\".",
      "Si un colaborador cambia su email de acceso desde \"Mi cuenta\", en cuanto lo confirma también pasa a ser el email al que le llegan sus avisos automáticos — antes se quedaban separados sin avisar a nadie del cambio; ahora el anfitrión ve un aviso claro en Colaboradores hasta que lo confirma.",
    ],
  },
  {
    version: "6.0",
    cambios: [
      'Mesas: ahora se dibujan redondas con sillas alrededor (su número sigue a la capacidad), la cantidad de mesas es libre (añadir/quitar, sin el límite fijo de 15), y "Vaciar mesa" desasigna a todos sus invitados de golpe sin borrar a nadie.',
      "Plano de mesas: nueva sección con un lienzo donde cada mesa se arrastra a la posición que quieras (se guarda sola), con botón de impresión preparado para papel A2.",
      "Estado de cuentas: nueva sección con lo recaudado y pendiente de cobro calculados solos a partir de los pagos de invitados, más una lista editable de gastos (incluye también los costes de la propia app, como el dominio o la suscripción) y el balance resultante.",
      'Navegación: las secciones (Mesas, Configuración, Avisos...) dejan de estar apiladas en una página larga y pasan a abrirse como ventanas flotantes movibles y redimensionables, accesibles desde un único desplegable ordenado alfabéticamente. El cambio entre Anfitrión y colaboradores se redujo a una sola barra táctil, pensada para el pulgar en móvil.',
      "Portada: el botón para cambiar la imagen (poco visible sobre algunas fotos) se quita de encima de la portada; ahora se edita desde Configuración, junto con el resto de datos del evento.",
      "Imágenes: la imagen de portada y la de la plantilla de invitación se suben ahora como archivo desde el dispositivo, en vez de pegar una URL — igual que ya funcionaba la foto de boda.",
      "Email del colaborador: se edita en un solo sitio (Colaboradores); se quita el duplicado de Configuración, y en el formulario de datos del invitado aparece ensombrecido (solo lectura) cuando ese invitado es también un colaborador.",
      "Configuración: la ventana pasa a ser solo un desplegable \"SECCIÓN\" — cada parte (Precios, URL web, Email anfitrión, Texto emails, Reinicios, Borrado total...) se abre en su propia ventana independiente, igual que Mesas o Avisos.",
      "Ventanas: cualquiera pasa a primer plano en cuanto se toca, en vez de quedarse algunas ancladas por encima de las demás.",
      "Solidez: BORRAR TODO descarga ahora la misma copia de seguridad automática que ya tenían los reinicios. Y si guardar algo falla (sin conexión, fallo del servidor), la pantalla deja de mostrar el cambio como si se hubiera guardado — se deshace solo en vez de mentir hasta que recargues. Además, si algo revienta al pintar la pantalla, ahora se ve un aviso con botón de recargar en vez de quedarse todo en blanco sin explicación.",
      "Emails, tras la primera prueba real: la tentativa ya no bloquea avisar al anfitrión ni aparece nombrada en el email al colaborador (evita preguntas antes de tiempo); \"He terminado mi trabajo\" se movió a la derecha; y en Colaboradores hay un botón \"Probar\" para confirmar al momento que un email está bien escrito, en vez de descubrirlo días después.",
      "Corrige que los modales de confirmación (REINICIAR, \"¿has terminado?\"...) podían abrirse ocultos detrás de una ventana ya abierta un rato, por quedarse con un z-index fijo mientras las ventanas ya lo tenían dinámico.",
      "Avisos: panel con el total pendiente de datos (solo confirmados) e invitaciones, y el historial de emails enviados ahora se filtra por 3 tipos (Asignados, Datos, Invitación) y se ordena por Fecha, Tipo o Email.",
      "Corrige que BORRAR TODO y los reinicios no llegaban a aplicarse desde el móvil: la descarga automática de la copia de seguridad se disparaba antes de la acción real, y en algunos navegadores móviles eso podía interrumpirla antes de completarse. Ahora la copia se descarga después de que la acción ya haya terminado.",
      "Se probó y se revirtió: confirmar en el momento si Resend acepta un envío. Esperar esa respuesta dentro de la misma función podía agotar el tiempo máximo de una consulta y cancelar el envío entero, no solo la confirmación — enviar_email vuelve a ser \"disparar y no esperar\", que es lo fiable.",
      "Solidez de fondo: avisoPendiente e invitacionEnviada dejan de fijarse a mano en cada función y se recalculan solos según el estado real. Además, cada sesión (la tuya, la de cada colaborador) vuelve a pedir los datos sola cada minuto, para no quedarse con una copia vieja si otra persona cambia algo mientras tanto.",
      "Emails: la confirmación ✓/✗/? vuelve al historial de Avisos, esta vez bien separada del envío — enviar_email() solo guarda dónde mirar la respuesta más tarde, y una comprobación aparte (que nunca espera ni puede bloquear nada) la va resolviendo sola con el refresco de cada minuto.",
      "Solidez de fondo: App.jsx (6.262 líneas) se reparte en ficheros por tipo (lib/, components/, vistas/) — mismo comportamiento, más fácil de mantener. Ahora en marcha: dividir también el interior de VistaAnfitrion, ventana a ventana.",
      "Solidez de fondo: terminado el reparto del interior de VistaAnfitrion — cada ventana (Mesas, Avisos, Configuración...) vive ya en su propio fichero.",
      "Lista de invitados pasa a ser una ventana flotante más (movible, cerrable, accesible desde el desplegable de arriba), igual que el resto — antes era la única sección fija en la página. Sus filtros y la cabecera de columnas se quedan fijos arriba al hacer scroll por la lista, para no perderlos de vista con listas largas.",
      "Corrige que cerrar la ventana de Lista de invitados podía dejar la pantalla en un bucle de renderizado (la ventana se abría y cerraba sola sin parar) por un efecto que se reiniciaba con cada cierre en vez de una sola vez.",
      "Invitación: fecha/hora/lugar y familia/mesa recalibradas sobre la plantilla real (coordenadas exactas, sombreado ajustado a cada línea de texto en vez de al recuadro entero), con los mismos iconos de calendario/reloj/ubicación que usa la propia app en vez de los que traía la plantilla.",
      "Portada: los 3 recuadros de estadísticas (Lista global, Tentativa, Confirmados) sobresalían del ancho de la imagen en pantallas anchas — ahora comparten el mismo ancho máximo y quedan pegados a la franja verde de debajo.",
      "Progreso de recopilación: cada colaborador pasa a ser un solo recuadro compacto (antes 3 barras sueltas), y las barras generales (datos, cobro, canciones) se juntan en un recuadro verde/dorado único con formato icono+barra+porcentaje en una línea.",
      "Corrige que arrastrar una ventana flotante tocando su cuerpo (no la cabecera) podía mover lo que hay detrás en móvil, por un encadenamiento de scroll del navegador.",
      "Limpieza de fondo: unos 80 imports y variables sin usar (sobras del reparto de App.jsx en ventanas separadas) detectados y eliminados.",
    ],
  },
];

export function VentanaVersiones({ onCerrar }) {
  return (
    <VentanaFlotante clave="versiones" titulo="Versiones" onCerrar={onCerrar}>
      <div className="space-y-3">
        {HISTORIAL_VERSIONES.map((v) => (
          <div
            key={v.version}
            className="flex items-start gap-3 p-3 rounded"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
          >
            <Stamp color={v.version === VERSION_APP ? C.ink : C.charcoal}>
              v{v.version}
            </Stamp>
            <div className="space-y-2">
              {(Array.isArray(v.cambios) ? v.cambios : [v.cambios]).map((parrafo, i) => (
                <p key={i} className="text-sm" style={{ color: C.charcoal }}>
                  {parrafo}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      {RESUMEN_VERSIONES_ANTERIORES.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.6 }}>
            Versiones anteriores completas (resumidas):
          </p>
          <div className="space-y-2">
            {RESUMEN_VERSIONES_ANTERIORES.map((v) => (
              <div
                key={v.version}
                className="flex items-start gap-3 p-2 rounded"
                style={{ background: C.paperDark, opacity: 0.8 }}
              >
                <Stamp color={C.charcoal}>v{v.version}</Stamp>
                <p className="text-xs" style={{ color: C.charcoal }}>
                  {v.cambios}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </VentanaFlotante>
  );
}
