// Ventana "Versiones": historial de cambios de la app. No depende de
// ningún dato del evento — solo de sus propias constantes. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C, OP } from "../../theme";
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
    version: "47.1",
    cambios: [
      "La pregunta de la familia, con botones como los de toda la app: \"Sí, toda la familia\" y \"No, solo Juan\", en vez de un \"Sí\" y un \"No\" pelados.",
    ],
  },
  {
    version: "47",
    cambios: [
      "Pago y llegada para toda la familia: al marcar (o quitar) el pago o la llegada de uno, la app pregunta si es para toda la familia, con Sí o No. Al cobrar enseña lo que paga cada uno y el total. Vale aunque un cónyuge lo lleve otro colaborador: a ese le aparecerá ya pagado o llegado. Si alguien de la familia todavía no puede (le faltan datos, o no ha pagado para la llegada), lo dice y solo deja marcar a esa persona.",
    ],
  },
  {
    version: "46.6",
    cambios: [
      "Formulario del colaborador: vuelven la campana y la palabra \"datos\" (\"datos 0 de 6\"). Con el nombre ya entero, caben.",
    ],
  },
  {
    version: "46.5",
    cambios: [
      "Formulario del colaborador: cada fila enseña solo lo de su ronda. Con datos a medias, \"0 de 6\" y el nombre (sin campana ni la palabra \"datos\"); el pago y el check de llegada aparecen cuando los datos están completos. El nombre ya cabe entero.",
    ],
  },
  {
    version: "46.4",
    cambios: [
      "Diseño app avisa cuando toca repasar el documento: si crece más de 150 palabras en un día, el sello de palabras se pone rojo (\"hoy +180 · repasar\") y el botón \"Diseño app\" de Mi cuenta lleva un puntito rojo. El repaso lo hace Claude leyendo, buscando ideas repetidas o contrarias.",
    ],
  },
  {
    version: "46.3",
    cambios: [
      "Diseño app: la frase de arriba pasa a ser \"Documento para construir la app\", más corta, y ya cabe en una línea.",
    ],
  },
  {
    version: "46.2",
    cambios: [
      "Diseño app: el sello de palabras dice lo que subió o bajó el documento en el día, con \"hoy\" delante: por ejemplo \"4557 palabras (hoy −7777)\". Cada día empieza de cero, en hora de Canarias; si ese día no se toca, no sale nada.",
    ],
  },
  {
    version: "46.1",
    cambios: [
      "Diseño app: el sello de palabras dice cuánto creció o encogió el documento con el último cambio, por ejemplo \"4533 palabras (−4)\". Es la señal de que engorda.",
      "El documento tiene salvaguardas automáticas: 5.000 palabras como mucho, ninguna trampa de más de 8 líneas, ninguna fecha, y todo archivo o función que nombra tiene que existir.",
    ],
  },
  {
    version: "46",
    cambios: [
      "Diseño app: las reglas de la Parte 1 van numeradas dentro de cada sección (se puede citar \"1.6, regla 3\"), y la app las cuenta: \"PARTE 1 — 12 secciones\" y debajo \"63 reglas que hay que obedecer siempre\".",
    ],
  },
  {
    version: "45.9",
    cambios: [
      "Diseño app: el título de cada parte lleva la cifra dentro y todo en una línea: \"PARTE 1 — 12 secciones de reglas que hay que obedecer siempre · 3284 palabras\" y \"PARTE 2 — 10 trampas ya pagadas · 759 palabras\".",
    ],
  },
  {
    version: "45.8",
    cambios: [
      "Diseño app: bajo el título de cada parte pone ahora \"12 secciones · 3284 palabras\" y \"10 trampas · 759 palabras\", en su propia línea (antes \"12 · 3284\" se leía como una sola cifra). Y el total de arriba es la suma exacta de las partes.",
    ],
  },
  {
    version: "45.7",
    cambios: [
      "Reinicios y Borrado total decían \"se descargará una copia de seguridad\" y \"no se puede deshacer\". Las dos cosas eran falsas desde la v34: ya no se descarga nada, se guarda una copia en el servidor y se puede deshacer con el botón «Deshacer» de la misma ventana.",
    ],
  },
  {
    version: "45.6",
    cambios: [
      "Diseño app: cuando una norma lleva una lista dentro, ahora sale con sangría debajo de su norma, y la numeración sigue seguida (antes volvía a empezar en 1 y era un lío citar un número).",
    ],
  },
  {
    version: "45.5",
    cambios: [
      "Diseño app: los sellos salen de la cabecera y van debajo de la primera frase, que ahora es grande y en negrita, en una sola línea.",
    ],
  },
  {
    version: "45.4",
    cambios: [
      "Diseño app: en la cabecera de la ventana, dos sellos verde y dorado con el total de palabras del documento y el día y la hora de su último cambio.",
    ],
  },
  {
    version: "45.3",
    cambios: [
      "En Novedades, si un cambio no se puede guardar (por ejemplo, sin conexión), ahora sale un aviso dentro de la ventana. Antes la lista volvía a como estaba sin decir nada, y lo escrito desaparecía sin explicación.",
    ],
  },
  {
    version: "45.2",
    cambios: [
      "En Novedades, si el navegador no deja copiar el enlace, ahora sale un aviso dentro de la ventana con el enlace a la vista para copiarlo a mano. Antes salía una ventanita del navegador, que en las ventanas emergentes puede colgarse.",
    ],
  },
  {
    version: "45.1",
    cambios: [
      "Ahora sí aparece «Diseño app» en Mi cuenta. En la 45 estaba construido pero no se veía: el aviso de mostrarlo se perdía por el camino.",
    ],
  },
  {
    version: "45",
    cambios: [
      "Nuevo en Mi cuenta: «Diseño app». Es el documento con el que se construye la app, para que puedas consultarlo tú mismo, plegado por secciones y con lo que pesa cada una. Se actualiza solo con cada versión.",
      "Se puede dar permiso a un colaborador para verlo desde la ventana Permisos («Ver el diseño de la app»). Es un permiso de vista: no deja cambiar nada.",
    ],
  },
  {
    version: "44",
    cambios: [
      "La portada y la plantilla de la invitación dejan de guardarse DENTRO de la ficha del evento y pasan al almacén. Eran 830 KB que se descargaban enteros cada vez que alguien abría la app, y otra vez cada minuto.",
      "Las dos que ya estaban dentro se sacan volviéndolas a subir una vez desde la propia app: no hace falta ningún botón especial ni ningún paso raro.",
    ],
  },
  {
    version: "43.2",
    cambios: [
      "Arreglado el «Algo ha fallado» al filtrar por Acomodador en la Lista de invitados. Era un fallo mío de la versión anterior: la lista se filtraba antes de que existiera uno de los valores que necesitaba. Los datos nunca estuvieron en peligro.",
    ],
  },
  {
    version: "43.1",
    cambios: [
      "El filtro de la columna «Función» ya incluye «Colaborador»: llevar 10 o 12 invitados es una función del día, igual que ser acomodador. Ordenar por esa columna también los agrupa.",
      "Y «Sin función» pasa a significar sin NINGÚN papel del día: un colaborador ya no aparece ahí, porque función tiene.",
    ],
  },
  {
    version: "43",
    cambios: [
      "En la Lista de invitados, quien además es colaborador lleva un filete dorado en el borde izquierdo de su fila y el nombre en negrita. Antes era una estrellita detrás del nombre, tan pequeña y tan clara que no se veía.",
      "El filete va en el BORDE y no en el fondo a propósito: el fondo rojo que late sigue siendo solo del invitado al que le faltan datos, así que una fila puede ser las dos cosas sin confundirse.",
    ],
  },
  {
    version: "42.9",
    cambios: [
      "La Revisión avisa si la misma persona está dos veces en la lista. Cada ficha cuenta por separado en el aforo, en la mesa y en las invitaciones, y hasta ahora un doble solo se veía al añadirlo, nunca después. Si son dos personas distintas que se llaman igual, se marca como excepción.",
    ],
  },
  {
    version: "42.8",
    cambios: [
      "A las personas se las nombra «Apellido, Nombre» en toda la app, también en los avisos y en las preguntas de confirmación, que decían «Juan Gatell». El buscador acepta las dos formas: puedes escribir «Gatell, Juan» o solo «juan».",
    ],
  },
  {
    version: "42.7",
    cambios: [
      "En «¿Quién lo atiende?» todos salen con su apellido y la lista va ordenada por él. Antes, quien solo era invitado con rol de trabajo salía con el nombre de pila suelto y al final de la lista.",
      "La Revisión de la lista avisa de los colaboradores que están invitados pero cuya cuenta no está unida a su ficha. Ese enlace decide si su email cuenta para su familia, si el motor de invitaciones los encuentra y si les sale la ★ en la lista.",
    ],
  },
  {
    version: "42.6",
    cambios: [
      "Los nombres duplicados de «¿Quién lo atiende?» ya se juntan de verdad: antes solo se reconocía a la misma persona si el colaborador estaba enlazado a su ficha de invitado, y ninguno lo está. Ahora también se reconocen por nombre y apellido.",
    ],
  },
  {
    version: "42.5",
    cambios: [
      "En «¿Quién lo atiende?» cada persona sale una sola vez: quien es colaborador y además acomodador aparecía dos veces, una en cada lista. Ahora va en una línea, con su rol de trabajo al lado.",
      "Al desplegar «¿Quién lo atiende?» en un bloque nuevo ya se ve la lista: antes, hasta que no elegías Interno o Externo, debajo de los dos botones no aparecía nada.",
    ],
  },
  {
    version: "42.4",
    cambios: [
      "En la imagen del cronograma, el ancho de cada recuadro vuelve a ser proporcional a sus minutos en TODO el dibujo, no solo dentro de su fila: antes cada fila se estiraba hasta el borde, así que un bloque corto que cayera solo en su fila salía enorme. Ahora el bloque más largo ocupa una fila entera y los demás se miden contra él.",
    ],
  },
  {
    version: "42.3",
    cambios: [
      "Arreglado el error \"No se pudo guardar la configuración del evento\" que salía al tocar el Cronograma: la app mandaba la ficha entera del evento (con las dos imágenes dentro, unos 830 KB) cada vez que cambiabas una letra, y la base de datos cortaba el guardado por tardar demasiado. Ahora solo se manda lo que cambia.",
    ],
  },
  {
    version: "42.2",
    cambios: [
      "Cronograma: «¿Quién lo atiende?» se pliega con la misma pieza que el resto de la app, así que se abre y se ve igual que cualquier otra sección plegada.",
      "Reinicios: la explicación de cinco líneas que había encima del formulario pasa al pie de la ventana, plegada. Lo que protege de verdad (la copia de seguridad y escribir REINICIAR) sigue saliendo al confirmar.",
    ],
  },
  {
    version: "42.1",
    cambios: [
      "En la lista del colaborador, todas las filas van en columnas fijas: los nombres empiezan todos en el mismo sitio y el botón de llegada cae siempre en la misma columna, a la derecha. Si un nombre no cabe se recorta con puntos suspensivos; entero se lee al abrir la ficha.",
      "Todos los botones de la fila miden lo mismo de alto, así que ninguno se deforma por llevar un nombre largo.",
      "\"Pendiente de pago\" pasa a llamarse \"Pago pendiente\".",
    ],
  },
  {
    version: "42",
    cambios: [
      "En el formulario del colaborador, la zona del invitado se ve resaltada con la misma pastilla dorada que el importe. Es solo para mirarla: ahí no se cambia.",
      "El aviso de que a la familia le falta el email ya dice quién puede darlo: a un matrimonio le basta con el de uno de los dos, quien viene sin pareja lo tiene obligatorio, y a un menor no se le pide.",
    ],
  },
  {
    version: "41.7",
    cambios: [
      "La columna nueva ya está como las demás: \"Función\" de título arriba, \"Todos\" de filtro abajo, y se puede ordenar por ella igual que por el resto.",
    ],
  },
  {
    version: "41.6",
    cambios: [
      "El filtro de la última columna se llama \"Función\": es la palabra que usas tú para lo que hace cada uno el día del evento.",
    ],
  },
  {
    version: "41.5",
    cambios: [
      "El filtro nuevo dice \"Trabajo\" en vez de \"Todos\": está en la columna de los iconos, que no tiene título, y había dos filtros de \"rol\" sin forma de distinguirlos.",
    ],
  },
  {
    version: "41.4",
    cambios: [
      "El filtro de rol de trabajo ya tiene el mismo aspecto que los demás: llevaba el estilo de las columnas estrechísimas, sin flecha y centrado.",
    ],
  },
  {
    version: "41.3",
    cambios: [
      "En Invitaciones, los ajustes de la plantilla se pliegan: lo que se viene a hacer ahí es mandar invitaciones, no cambiar la imagen.",
      "Y corregido un texto que llevaba meses mintiendo: decía que la app no podía enviar correos, cuando hay un botón de enviar por email justo debajo.",
    ],
  },
  {
    version: "41.2",
    cambios: [
      "Filtro por rol de trabajo en la Lista de invitados: ya puedes ver de un vistazo quiénes son los acomodadores, o quién no tiene ningún rol. Está en la última columna, la de los iconos.",
    ],
  },
  {
    version: "41.1",
    cambios: [
      "Terminado el blindaje de la Lista de invitados: las 16 operaciones que tocan tus datos ya están fuera de la pantalla, con 27 pruebas automáticas.",
      "Nuevo aviso: si cambias el apellido o el grupo familiar de alguien que tiene familia en la lista, se te dice cuántos se quedan atrás — porque a partir de ahí ya no se sentarán juntos.",
    ],
  },
  {
    version: "41",
    cambios: [
      "Primera ronda para blindar la Lista de invitados: añadir, importar y eliminar salen de la pantalla y pasan a tener 14 pruebas automáticas. No cambia nada de lo que ves.",
      "Y de paso aparecieron dos fallos que llevaban ahí desde el principio: importar dos veces la misma lista duplicaba a todo el mundo en silencio, y borrar a un invitado que además es colaborador le dejaba la cuenta sin ficha sin avisar. Los dos, corregidos.",
    ],
  },
  {
    version: "40.3",
    cambios: [
      "El ojo para ver la contraseña, en los cuatro sitios donde se escribe una: entrar, crear cuenta y las dos de cambiarla.",
      "Y en el tablón, cuando un invitado no acierta su nombre, se le dice en qué se ha podido equivocar: primero el apellido, después el nombre, y que las mayúsculas y las tildes dan igual.",
    ],
  },
  {
    version: "40.2",
    cambios: [
      "Al crear la cuenta, el colaborador ya no se queda mirando el mismo formulario sin saber si funcionó: sale una pantalla entera que dice que su cuenta está creada y que revise el correo, avisando de que suele caer en spam.",
      "Y el correo con el que los invitas también lo avisa antes, para que vayan a buscarlo.",
    ],
  },
  {
    version: "40.1",
    cambios: [
      "El mismo arreglo de la v40, aplicado a todo lo demás: novedades, fotos de boda, mesas, colaboradores, gastos y orden de familias. Ninguno vuelve a mandar la lista entera al guardar.",
      "Hacía falta porque tú eres anfitrión y colaborador a la vez: con el móvil y el portátil abiertos, ya son dos personas escribiendo.",
    ],
  },
  {
    version: "40",
    cambios: [
      "Arreglado un fallo que aún no había dado la cara: al guardar la Lista de invitados se mandaba la lista entera, así que podías borrar sin enterarte lo que un colaborador acabara de rellenar en ese minuto. Ahora se manda solo lo que has cambiado tú.",
      "Con un colaborador era casi imposible que pasara. Con cinco rellenando a la vez, no.",
    ],
  },
  {
    version: "39.4",
    cambios: [
      "La nota de privacidad ya se puede editar, en Datos del evento, con el mismo editor que los textos de email (formato, deshacer e historial).",
      "La puede cambiar quien tenga el permiso \"Editar los datos del evento\". No basta con el de Novedades: la nota dice tus plazos y lo que te comprometes a hacer con los datos de la gente.",
    ],
  },
  {
    version: "39.3",
    cambios: [
      "El tablón del invitado lleva al pie un link discreto, \"Tus datos, en claro\", que abre la nota de privacidad en una ventana.",
    ],
  },
  {
    version: "39.2",
    cambios: [
      "En el formulario de cada invitado, una casilla: \"Autorizo expresamente a que guarden mis datos\". Nace desmarcada: la marca quien contesta, no quien rellena.",
      "El Borrado total la respeta: quien autorizó se queda con sus datos personales, y se le quita todo lo de este evento (mesa, pago, confirmación y colaborador). La pregunta de seguridad dice cuántos son.",
    ],
  },
  {
    version: "39.1",
    cambios: [
      "El invitado vuelve a ver el tablón completo: la fila de la fecha se enseña siempre, y cuando no hay día cerrado pone \"No hay fecha confirmada\", igual que lo ves tú.",
      "Retirada la opción \"Ocultar la fecha en el tablón\": era un parche para el mismo problema, y escondía la fila entera sin explicar por qué.",
    ],
  },
  {
    version: "39",
    cambios: [
      "En Datos del evento, una casilla \"Todavía no hay fecha confirmada\": al marcarla, la portada y el tablón dicen \"No hay fecha confirmada\" en vez de una raya, y las invitaciones salen sin fecha.",
      "La fecha escrita no se borra: el año sigue haciendo falta para calcular los aniversarios de cada matrimonio, y si se confirma ese mismo día no hay que volver a teclearlo.",
    ],
  },
  {
    version: "38.9",
    cambios: [
      "En el login, \"He olvidado mi contraseña\" y \"Crear cuenta\" pasan a ser links subrayados en gris suave, como en cualquier web, en vez de botones.",
      "Y el aviso del proyecto queda en una sola línea: \"Tienes permiso para ver el proyecto en GitHub\", donde esa última parte es el link.",
    ],
  },
  {
    version: "38.8",
    cambios: [
      "El acceso al proyecto deja de ser un botón grande y pasa a ser un link dorado, que armoniza mejor dentro del aviso.",
      "Y ya no repite la palabra GitHub: si el aviso de arriba lo dice, abajo basta con \"Link para acceder al proyecto\".",
    ],
  },
  {
    version: "38.7",
    cambios: [
      "El aviso vuelve a decir \"Tienes permiso para ver el proyecto en GitHub\", igual que dice los de edición. El link va debajo.",
      "Y el link respeta la mano elegida: a la derecha con el pulgar derecho, a la izquierda con el izquierdo. Se había quedado fijo a la izquierda.",
    ],
  },
  {
    version: "38.6",
    cambios: [
      "El link al proyecto en GitHub deja de estar escondido en \"Mi cuenta\": ahora está en el propio aviso que anuncia el permiso. Donde se anuncia es donde se entra.",
      "Va con relieve, como todo lo que se pulsa en la app, y dice claramente a dónde lleva.",
    ],
  },
  {
    version: "38.5",
    cambios: [
      "El aviso rojo \"Tienes permisos de edición\" ya no mete en la lista los permisos que solo dejan mirar (el mapa del sitio y el código de la app). Prometía algo que no era.",
      "Y la etiqueta \"Ver el código de la app\" deja de mencionar GitHub, que no le decía nada a quien no programa.",
    ],
  },
  {
    version: "38.4",
    cambios: [
      "Un tercer aro, el de más afuera, en un rojo más vivo que el burdeos de la app: así el borde de la onda se ve y no se disuelve en la foto.",
    ],
  },
  {
    version: "38.3",
    cambios: [
      "El latido del sello rojo gana un segundo aro, más grande y más suave: la onda llega casi el doble de lejos.",
    ],
  },
  {
    version: "38.2",
    cambios: [
      "El sello rojo late más fuerte: el halo casi dobla y el número crece un poco al latir.",
      "Y lleva un contorno blanco muy fino, para que se recorte bien sobre la foto y sobre las filas doradas.",
    ],
  },
  {
    version: "38.1",
    cambios: [
      "El número rojo del botón \"Abrir formulario\" late, igual que las fichas incompletas: mismo aviso, mismo latido. El botón no cambia.",
      "Más valores sueltos que se habían escapado del repaso de acabados (redondeos escritos como texto y opacidades de lo desactivado) pasan también a la escala.",
    ],
  },
  {
    version: "38",
    cambios: [
      "Acabado más fino, con el mismo estilo de siempre: los tamaños de letra pasan de 13 distintos a 6, los redondeos de esquina de 5 a 2, los grises del texto secundario de 9 a 2 y las sombras de 8 a 3.",
      "Un punto más de aire en tarjetas, paneles y formularios. Las tablas se quedan igual de compactas a propósito: con 140 invitados, más aire sería una lista que no cabe.",
      "El mando de la Música no se toca: tiene su propio aspecto, ya aprobado.",
      "Y para que no vuelva a desordenarse solo, hay una prueba que salta si alguien escribe un tamaño o un redondeo a mano.",
    ],
  },
  {
    version: "37.13",
    cambios: [
      "Corregido un fallo grave: si algún invitado tenía mesa asignada, no se podía salir del Modo Pruebas ni usar el Deshacer. La restauración devolvía los invitados antes que las mesas, y la mesa de cada uno apuntaba a una mesa que todavía no existía.",
      "Cuando algo falla, el aviso dice ahora el motivo exacto en letra pequeña, en vez de un \"no se pudo\" a secas.",
    ],
  },
  {
    version: "37.12",
    cambios: [
      "Ya no queda ni un aviso de los del navegador: todos salen en la ventana de la app, con el mismo aspecto que las preguntas de seguridad.",
      "Y salen en la ventana que estás mirando: si el aviso se dispara desde la Lista de invitados, Novedades o Música (que son ventanas aparte), aparece ahí y no en la pestaña de detrás.",
    ],
  },
  {
    version: "37.11",
    cambios: [
      "Email con casilla \"Sí\" marcada por defecto: si un adulto no da email, el colaborador la desmarca y deja de contar. Quien viene solo (S) tiene que darlo: para él no hay casilla.",
      "Al menos un email por familia (el del esposo o el de la esposa): si nadie de la familia lo tiene, el colaborador ve un aviso en el formulario, y la Revisión lo señala al anfitrión.",
    ],
  },
  {
    version: "37.10",
    cambios: [
      "Canción con la casilla \"Sí\" marcada por defecto, como la foto de boda: el colaborador escribe la canción o la desmarca, y ese \"no\" se guarda. Observaciones sigue sin marcar, y alergias sin ninguna casilla marcada (hay que contestar a propósito).",
    ],
  },
  {
    version: "37.9",
    cambios: [
      "Lista del colaborador: la sección \"Invitados NUEVOS\" pasa a llamarse \"Invitados INCOMPLETOS\" y recoge toda ficha que no esté en \"N de N\". El contador del botón \"Abrir formulario\" y el aviso \"Datos completos\" al anfitrión usan la misma regla.",
      "La ficha incompleta, más roja y con el latido más marcado.",
      "Los avisos de \"Datos completos\" y \"Pagos completos\" salen en una ventana de la app, no en la del navegador.",
    ],
  },
  {
    version: "37.8",
    cambios: [
      "Foto de boda con casilla \"Sí\", marcada por defecto. Si un matrimonio no tiene foto, el colaborador la desmarca: deja de contar como dato pendiente (vale para los dos cónyuges), en Aniversarios sale \"No tienen\" y la hoja de encargo ya no la espera.",
    ],
  },
  {
    version: "37.7",
    cambios: [
      "Lista del colaborador: cada ficha cerrada que no esté en \"N de N\" se ve con fondo rojo suave y un latido lento, para que se note sin molestar. Abierta no late.",
    ],
  },
  {
    version: "37.6",
    cambios: [
      "\"Datos X de Y\" de un invitado que también es colaborador: su email cuenta aunque lo haya puesto el anfitrión en Colaboradores (antes salía \"3 de 4\" en vez de \"4 de 4\").",
    ],
  },
  {
    version: "37.5",
    cambios: [
      "Formulario del colaborador: \"datos X de Y\" cuenta solo lo que se le pide a esa persona, así que completo es siempre \"N de N\" (un niño, por ejemplo, \"2 de 2\").",
      "Canción y observaciones llevan una casilla \"Sí\", como las alergias: sin marcar es \"no\", se quedan plegadas y no cuentan. Marcada, aparece el campo y cuenta. Desmarcarla con algo escrito pregunta antes de borrarlo.",
    ],
  },
  {
    version: "37.4",
    cambios: [
      "Revisión: excepciones. Junto a cada nombre hay un botón \"Excepción\" para dar por bueno un caso consciente (p. ej. la madre que va con el grupo de su hija para sentarse juntas). Pregunta antes, y la Revisión deja de avisar solo de ese caso; los demás casos iguales se siguen avisando. Abajo, en \"Excepciones permitidas\", se ven y se pueden quitar.",
    ],
  },
  {
    version: "37.3",
    cambios: [
      "Revisión de la Lista de invitados: botón \"Cerrar\" arriba y a la vista (antes tocar el título solo la plegaba y volvía a abrirse, y el cierre estaba al final de todo). Al cerrarla, la lista vuelve a como estaba antes de abrirla, aunque se haya pulsado algún nombre del informe.",
    ],
  },
  {
    version: "37.2",
    cambios: [
      "La Revisión avisa del colaborador que tenga menos de 10 o más de 12 invitados asignados, para que todos lleven el mismo trabajo y el mismo dinero a recoger. Pulsando su nombre, la lista enseña sus invitados. Los colaboradores sin ningún invitado no se avisan.",
    ],
  },
  {
    version: "37.1",
    cambios: [
      "La Revisión avisa del matrimonio con uno confirmado y el otro no: o falta confirmar al otro, o el que viene solo tiene que llevar P o S.",
    ],
  },
  {
    version: "37",
    cambios: [
      "Una familia no se separa en las mesas: al poner (o quitar) la mesa a uno, se pone (o se quita) a toda su familia confirmada. Si no caben todos, no se sienta a nadie y la app dice cuántos son y cuántos sitios quedan.",
      "Al confirmar a alguien cuya familia ya tiene mesa, se sienta con los suyos.",
      "La Revisión avisa de las familias que ya estaban repartidas en varias mesas.",
    ],
  },
  {
    version: "36.3",
    cambios: [
      "Las fotos de matrimonio, sobre champán en vez de verde: una línea dorada muy fina y aire hasta la foto, como un paspartú. En las miniaturas y en la vista en grande, en Aniversarios y en el formulario del colaborador.",
    ],
  },
  {
    version: "36.2",
    cambios: [
      "El año de boda se comparte entre los dos cónyuges, como la foto: el colaborador lo escribe en la ficha de uno y aparece también en la del otro. Antes el otro se quedaba sin año, o con uno distinto.",
    ],
  },
  {
    version: "36.1",
    cambios: [
      "La vibración en el iPhone, de verdad: Apple cerró en iOS 26.5 la forma que usaba la 36, así que no vibraba. Ahora cada botón lleva dentro un interruptor invisible que el dedo toca, y eso sí hace vibrar al iPhone.",
      "El clic se oye más (el de la 36 era casi inaudible en el altavoz del móvil). Con el iPhone en silencio no suena, como los clics del teclado.",
      "Mesas: los botones van del lado del pulgar, y \"Auto-asignar\" pierde el \"(preliminar)\".",
    ],
  },
  {
    version: "36",
    cambios: [
      "Todo lo que se pulsa tiene relieve y se hunde al tocarlo, también los desplegables de las tablas (asignar mesa, colaborador), los títulos que se pliegan y lo que antes era texto subrayado (\"Vaciar mesa\", \"Entendido\"…). Al pulsar suena un clic muy suave y el móvil vibra.",
      "Todos los botones de quitar son el mismo círculo rojo: X para quitar, papelera para borrar para siempre. Se ven pequeños, pero el dedo acierta en la medida mínima de un móvil (44 px).",
      "Nada se quita ni se borra sin preguntar antes. Hasta ahora, eliminar un invitado, un colaborador o una novedad se hacía de un solo toque.",
      "Las preguntas salen en una ventana de la app, no en la del navegador.",
      "Estado de cuentas: sus tres partes (Resumen, Recaudado por colaborador, Gastos) plegadas y solo una abierta a la vez, como en el tablón.",
    ],
  },
  {
    version: "35",
    cambios: [
      "Pulgar derecho o izquierdo: la primera vez que se entra desde el móvil, una ventanita pregunta con qué mano se usa, y los botones se colocan de ese lado. El móvil lo recuerda. Se cambia cuando se quiera en Mi cuenta. En el ordenador no cambia nada.",
    ],
  },
  {
    version: "34.10",
    cambios: [
      "Mi cuenta, todavía más estrecha: en el móvil ya no ocupa casi toda la pantalla. Lo de dentro —una contraseña, un email y los botones— cabe de sobra.",
    ],
  },
  {
    version: "34.9",
    cambios: [
      "Los botones de Mi cuenta, más estrechos: miden lo mismo que las filas del menú \"Abrir sección…\", y los rótulos se abrevian para caber (\"Código app\", \"Errores app\", \"Cambiar clave\").",
    ],
  },
  {
    version: "34.8",
    cambios: [
      "Los botones de Mi cuenta son ahora iguales que los del menú \"Abrir sección…\": misma pastilla, icono a la izquierda, y todos del ancho que marca el texto más largo. A la derecha, para el pulgar.",
      "La explicación sobre el email de acceso baja al pie de la ventana, plegada: la abre quien la necesite.",
    ],
  },
  {
    version: "34.7",
    cambios: [
      "Los botones de Mi cuenta van ahora a la derecha de la ventana, todos del mismo ancho: la app se maneja con el pulgar derecho.",
    ],
  },
  {
    version: "34.6",
    cambios: [
      "Todos los botones de Mi cuenta vuelven al estilo de inicio —la pastilla verde con letra dorada de la portada— y miden todos lo mismo, incluidos \"Cambiar contraseña\" y \"Cambiar email\".",
    ],
  },
  {
    version: "34.5",
    cambios: [
      "Mi cuenta es ahora una ventana estrecha, del ancho de un móvil, también en el ordenador: solo tiene una contraseña, un email y unos pocos accesos.",
      "Y esos accesos (Cerrar sesión, Novedades, Mapa del sitio…) miden todos lo mismo, en vez de cada uno lo que su texto.",
    ],
  },
  {
    version: "34.4",
    cambios: [
      "En Mi cuenta hay un botón nuevo, \"Errores de la app\", que abre directamente el panel donde se ven los fallos. Solo lo ve el anfitrión.",
    ],
  },
  {
    version: "34.3",
    cambios: [
      "Registro de errores: si a alguien le falla algo en la app, el fallo llega solo a Sentry, con la pantalla, el aparato y lo que pasó. Antes no quedaba rastro salvo que te lo contaran.",
      "Los avisos no llevan datos de los invitados: ni nombres, ni emails, ni la llave del tablón. Solo el error técnico.",
    ],
  },
  {
    version: "34.2",
    cambios: [
      "Nuevo permiso \"Ver el código de la app\": a quien se lo marques le aparece en Mi cuenta un enlace al código en GitHub. Pensado para el desarrollador que revisa la app: lo encuentra ahí dentro sin tener que mandárselo por otro lado.",
      "Ojo: el código está publicado, así que el permiso decide quién ve el enlace, no quién puede entrar.",
    ],
  },
  {
    version: "34.1",
    cambios: [
      "La app pesa casi tres veces menos al abrirla: lo primero que se descarga baja de 1,2 MB a 443 KB. Quien más lo nota es el invitado que abre el tablón desde el móvil.",
      "Lo que casi nunca se usa —el generador de PDF de los acuses o este historial— se descarga ahora solo cuando lo abres.",
      "La ventana de Música se queda siempre cargada a propósito: en el local no puede quedarse esperando al wifi.",
    ],
  },
  {
    version: "34",
    cambios: [
      "Deshacer de verdad. Antes de un reinicio, del borrado total o de salir del Modo Pruebas, la app guarda una copia EN EL SERVIDOR y aparece un botón \"Deshacer\" con la hora.",
      "Lo pulsas y todo vuelve a como estaba. Sin archivos, sin adjuntar nada a nadie.",
      "Se acabaron las descargas automáticas de copias: no se podían volver a subir a ninguna parte, así que no servían de nada.",
      "Solo se guarda la última: deshacer algo de anteayer sigue siendo cosa de la copia nocturna.",
    ],
  },
  {
    version: "33",
    cambios: [
      "La ventana del colaborador se abre con todo plegado, como Novedades: \"Tus datos\" y \"Estado de cuentas\" ya no ocupan sitio hasta que los abres.",
      "Solo puede haber una cosa abierta a la vez. Al abrir la ficha de un invitado se cierra lo demás.",
      "En el móvil, la ficha abierta es lo único en pantalla: para ver otra cosa hay que cerrarla. En el ordenador se sigue viendo la lista entera.",
    ],
  },
  {
    version: "32.5",
    cambios: [
      "Ahora sí: los títulos de los campos del formulario (EMAIL, AÑO NAC., CANCIÓN…) se ven en verde sobre el dorado. En la versión anterior el cambio no llegaba a aplicarse.",
    ],
  },
  {
    version: "32.4",
    cambios: [
      "Todo el texto del formulario del colaborador va ya en el mismo verde que el nombre de la persona. Quedaban letras en dorado que sobre el fondo dorado casi no se leían.",
      "El importe vuelve a fondo dorado con letra verde, pero en un dorado más claro que la ficha y con un filete verde fino, para que se recorte.",
      "Y más separación entre el año de boda y la foto.",
    ],
  },
  {
    version: "32.3",
    cambios: [
      "El importe del formulario lleva un filete verde muy fino, para que se recorte bien sobre el dorado de la ficha.",
    ],
  },
  {
    version: "32.2",
    cambios: [
      "El formulario del colaborador adopta la combinación de Aniversarios: la ficha en dorado con las letras en verde, sobre fondo verde.",
      "El importe se invierte para seguir destacando: ahora va en verde con letra dorada.",
    ],
  },
  {
    version: "32.1",
    cambios: [
      "La foto de boda del formulario del colaborador se ve y se maneja igual que en Aniversarios: recuadro en 16:9, se toca para subirla y, si ya está, se abre en grande.",
      "Desde esa vista grande se cambia la foto, y la papelera pide confirmación antes de borrarla.",
      "Fuera el botón \"Subir foto\" y la miniatura cuadrada: eran otra manera de hacer lo mismo.",
    ],
  },
  {
    version: "32",
    cambios: [
      "Retirado el botón \"Backup\" de Configuración. No tenía utilidad real: guardaba menos de la mitad de los datos y no se podía restaurar.",
      "La copia de seguridad de verdad se sigue haciendo sola cada noche, completa, fuera de la app.",
      "Y la copia que se descarga antes de un borrado o un reinicio sigue igual: esa no dependía de este botón.",
    ],
  },
  {
    version: "31.9",
    cambios: [
      "En el formulario del colaborador, el importe se ve al revés que el resto: fondo dorado y letra verde, y un punto más grande. Es el dato que más se mira.",
      "Y más aire entre el año de boda y el botón de subir foto, que estaban pegados.",
    ],
  },
  {
    version: "31.8",
    cambios: [
      "Arreglado el botón \"Acciones\" de la Lista de invitados, que se rompió al unificar los botones: había perdido el color claro sobre la barra verde y el enlace con su desplegable.",
    ],
  },
  {
    version: "31.7",
    cambios: [
      "\"Subir foto\" y \"Cerrar\" son ya idénticos: mismo alto, misma letra y el mismo contorno dorado. Antes el primero era más pequeño y llevaba otro borde.",
    ],
  },
  {
    version: "31.6",
    cambios: [
      "\"Subir foto\", en el formulario del colaborador, se ve ya como el botón \"Cerrar\" de esa misma pantalla: verde con letra dorada y relieve. Con solo contorno sobre el fondo verde parecía texto escrito en el fondo, no algo que se pulsa.",
    ],
  },
  {
    version: "31.5",
    cambios: [
      "Los botones de la app pasan a ser todos la misma pieza, con tres tipos claros: el principal de cada pantalla (verde), los secundarios (solo contorno) y los de peligro (rojo, para lo que no tiene vuelta atrás).",
      "Antes había 179 botones escritos uno a uno, con 12 tamaños distintos. Ahora 83 salen de una sola receta: si algún día cambia el aspecto, cambia en todos a la vez.",
      "Los botones de subir foto también tienen ya relieve, así se ve que se pueden pulsar.",
      "Se quedan como estaban, a propósito, el mando de música y los botones verdes sobre la foto de portada: tienen su propio estilo.",
    ],
  },
  {
    version: "31.4",
    cambios: [
      "Los botones de subir foto ya se pueden usar con el teclado. Estaban escondidos de una forma que dejaba fuera al tabulador, en las 11 pantallas donde se sube una imagen.",
      "Aviso: si en Safari el tabulador solo salta entre casillas de texto, no es la app. Es una opción suya: Safari → Ajustes → Avanzado → \"Pulsar Tab para resaltar cada elemento\". Con Opción + Tab funciona sin cambiar nada.",
    ],
  },
  {
    version: "31.3",
    cambios: [
      "Accesibilidad: al moverse por la app con el tabulador, ahora se ve un aro alrededor del botón donde está el cursor. Antes no se marcaba, y quien no usa ratón se perdía.",
      "Los botones que son solo un icono (papelera, cerrar, flechas del reproductor…) tienen ya un nombre que los lectores de pantalla pueden leer.",
      "No cambia nada de lo que ves con el ratón.",
    ],
  },
  {
    version: "31.2",
    cambios: [
      "En el formulario del colaborador, el año de nacimiento pasa a ser el PRIMER dato, por delante del email.",
      "Tiene sentido: de ese año depende todo lo demás. Si la persona es menor, el email ni se pide — y antes era justo lo primero que aparecía.",
    ],
  },
  {
    version: "31.1",
    cambios: [
      "El archivo que descargas incluye ahora una \"Hoja de encargo\": un bloque por foto, ya redactado, con los nombres, el año de boda y los años que cumplen, listo para copiar y pegar en ChatGPT.",
      "Solo se prepara si están todos los datos recogidos. Si falta algún año de boda o alguna foto, la app te dice quiénes son y te deja descargar solo las fotos.",
    ],
  },
  {
    version: "31",
    cambios: [
      "Las fotos de boda que suben los colaboradores se guardan ahora como ORIGINALES, a buen tamaño y en el almacén, sin hacer más pesada la app.",
      "Nuevo botón \"Originales\" en Aniversarios: descarga todas en un solo archivo, cada una con su nombre y año de boda, por ejemplo \"Abreu01 - Gustavo y Míriam - 1998.jpg\". Si alguna no tiene año, avisa antes.",
      "Después de montarlas en la plantilla, se suben desde la vista grande de la columna Boda. La original no se pierde: se puede comparar con la terminada y volver a ella.",
      "Mientras falte la de plantilla, la columna Boda enseña la original con la marca \"Sin plantilla\", y el círculo rojo de la cabecera cuenta cuántas quedan.",
    ],
  },
  {
    version: "30.16",
    cambios: [
      "En Aniversarios, pinchar una foto ya subida la abre en grande, en 16:9, tal y como se verá en la pantalla del local.",
      "La de aniversario se cambia desde esa vista, con el botón \"Cambiar foto\". Un recuadro vacío sigue sirviendo para subirla directamente.",
      "La foto de boda también se puede ver en grande, pero sin cambiarla: esa la sube el colaborador.",
    ],
  },
  {
    version: "30.15",
    cambios: [
      "La pregunta antes de quitar una foto de aniversario es la mitad de ancha, se titula \"¿Quitar la foto?\" y va al grano.",
    ],
  },
  {
    version: "30.14",
    cambios: [
      "Los marcos de las fotos de Aniversarios pasan a ser finos, con un poco de aire entre el canto y la foto, como un paspartú.",
    ],
  },
  {
    version: "30.13",
    cambios: [
      "Los recuadros de foto de Aniversarios llevan un marco verde, como un cuadro, en vez de parecer casillas de formulario. El de boda vacío deja de ser gris y pasa a un verde suave.",
      "Los nombres del matrimonio van en la letra con serifa de los títulos de la app.",
    ],
  },
  {
    version: "30.12",
    cambios: [
      "Quitar una foto de aniversario ya no es inmediato: primero pregunta, con el nombre del matrimonio, y hay que confirmar.",
      "Las filas pasan a un dorado metálico, con brillo y canto, en vez del dorado plano que tiraba a mostaza.",
      "Y más separación entre filas, para que no se lean como un solo bloque.",
    ],
  },
  {
    version: "30.11",
    cambios: [
      "En Aniversarios, el fondo que hay detrás de las filas pasa de marfil al verde de la app: las filas doradas resaltan más.",
    ],
  },
  {
    version: "30.10",
    cambios: [
      "Las filas de Aniversarios pasan a fondo dorado (el de las letras de la cabecera) con el texto en el verde de la app.",
      "El rombo que separa las dos fotos es algo más grande y en champán, para que se vea sobre el dorado.",
    ],
  },
  {
    version: "30.9",
    cambios: [
      "Los recuadros de foto de Aniversarios pasan a 16:9, la forma de la pantalla del local: al subir una foto ya ves cómo va a quedar proyectada.",
      "Las fotos se guardan ahora a tamaño de pantalla (hasta 1920×1080). Antes se reducían a 1080 por el lado más largo, y una foto apaisada se quedaba en unos 1080×608, poco para proyectarla.",
      "Si alguna foto no está en 16:9, se ve entera con bandas a los lados en vez de recortarse: así se nota cuál falta por pasar.",
    ],
  },
  {
    version: "30.8",
    cambios: [
      "En Aniversarios, el recuadro donde se pincha para poner la foto tiene ahora relieve, como los botones: champán claro en degradado, contorno dorado, y se levanta al pasar por encima y se hunde al pulsar.",
      "El de la foto de boda se queda plano a propósito: esa la sube el colaborador y pinchar ahí no hace nada.",
    ],
  },
  {
    version: "30.7",
    cambios: [
      "Aniversarios pierde los cuatro recuadros de números de la cabecera. En su lugar, un círculo rojo en la esquina de \"Aniv.\" con las fotos de aniversario que faltan — el mismo aviso que llevan los colaboradores con invitados sin atender. Desaparece solo cuando están todas.",
    ],
  },
  {
    version: "30.6",
    cambios: [
      "La cabecera de columnas de Aniversarios es ya como la de la Lista de invitados: barra verde pegada arriba, filete dorado y una banda por columna (Matrimonio, Boda, Aniv.), para que se lea como parte de la tabla y no como un rótulo suelto.",
    ],
  },
  {
    version: "30.5",
    cambios: [
      "Aniversarios se parece ya a la Lista de invitados: los números viven en recuadritos en la cabecera (Matrimonios, Boda, Aniversario, Faltan) en vez de en una frase suelta.",
      "Y \"BODA\" y \"ANIV.\" se quedan clavados arriba al desplazar, así que con 49 filas no pierdes de vista cuál es cuál.",
      "Fuera la frase explicativa: sobraba.",
    ],
  },
  {
    version: "30.4",
    cambios: [
      "En Aniversarios, \"ANIV.\" no caía centrado sobre su recuadro: la columna era más ancha que la de \"BODA\" para dejar sitio a la papelera. Ahora la papelera va encima de la miniatura y las dos columnas miden exactamente lo mismo.",
      "Más aire entre las dos, y un rombo dorado pequeño en medio como separación.",
    ],
  },
  {
    version: "30.3",
    cambios: [
      "Los dos recuadros de foto de Aniversarios llevan ahora su título arriba, como dos columnas: \"Boda\" y \"Aniv.\". Antes eran dos cuadros iguales y no había forma de saber cuál era cuál.",
      "Y van más separados entre sí, para que se lean como dos columnas y no como dos cuadros pegados.",
    ],
  },
  {
    version: "30.2",
    cambios: [
      "En Aniversarios, cada fila enseña los dos nombres del matrimonio y no solo el del cabeza de familia: \"Ruiz — Benito y Meritxell\".",
    ],
  },
  {
    version: "30.1",
    cambios: [
      "El mapa del sitio pasa de fondo verde oscuro a fondo champán, el mismo de las ventanas de la app. Cada sección es ahora una pastilla blanca con su contorno, así que se leen como botones y no como renglones de una lista.",
    ],
  },
  {
    version: "30",
    cambios: [
      "Nueva sección \"Aniversarios\", la primera de \"Abrir sección…\": una fila por matrimonio, con su año de boda y los años que cumplen, para ir cargando las dos fotos de cada pareja.",
      "Arriba te dice por dónde vas: \"31 de 48 hechas\".",
      "La foto de boda la sigue subiendo el colaborador en su formulario; la de aniversario la subes tú desde aquí.",
      "Las fotos ya no se guardan dentro de la base de datos, sino en un almacén cerrado: se reducen a 1080 al subirlas y solo las ve quien haya entrado en la app. Con unas 100 fotos por delante, guardarlas dentro habría hecho que la app se las descargara todas cada vez que se abre.",
    ],
  },
  {
    version: "29.1",
    cambios: [
      "El mapa ya no se abre en una pestaña del navegador, sino dentro de la app: tiene su X, se cierra con Escape y tocando fuera. En el móvil, una pestaña nueva no tiene botón de volver — no había forma clara de salir.",
      "Toca la imagen para ampliarla y leer los nombres; tócala otra vez para volver a verla entera.",
      "Y dos botones: Imprimir y Descargar. Para enviarlo, se descarga y se manda como una foto más.",
    ],
  },
  {
    version: "29",
    cambios: [
      "Nuevo \"Mapa del sitio\" dentro de \"Mi cuenta\": la imagen con todas las secciones de la app, para consultar dónde está cada cosa sin salir a buscarla fuera.",
      "Va ahí y no en \"Abrir sección…\" porque no es algo de la boda: es para moverse por la app y para conocerla.",
      "Se abre en una pestaña aparte, no en una ventana pequeña — así se puede ampliar con los dedos y leerlo de verdad.",
      "Y hay un permiso nuevo para dárselo a un colaborador: en Permisos aparece \"Ver el mapa del sitio\". Sin marcar, el colaborador no ve el enlace.",
    ],
  },
  {
    version: "28.1",
    cambios: [
      "La X de quitar mesa también se hunde al pulsarla, y es más grande: a 18 píxeles era difícil de acertar con el dedo.",
    ],
  },
  {
    version: "28",
    cambios: [
      "Los botones de Mesas (\"Añadir mesa\", \"Auto-asignar\" y el de avisos) ya responden al tacto: se levantan al pasar por encima y se hunden al pulsarlos.",
      "No es un adorno. Con casi veinte mesas, la nueva aparece al final de la fila, fuera de la vista, y no había forma de saber si el clic había entrado o no.",
      "Es el mismo relieve que ya usaban los demás botones de la app, definido en un solo sitio; en esta pantalla simplemente faltaba.",
    ],
  },
  {
    version: "27.15",
    cambios: [
      "Tercer intento, y este sí ataca la causa: el recuadro de una novedad solo existe cuando despliegas la tarjeta, y al desplegarla no cambia el texto — así que la medición del alto nunca llegaba a ejecutarse. Medía bien, pero en un momento que no ocurría.",
      "Por eso en los textos de email sí funcionaba: allí la sección entera se desmonta y se vuelve a montar.",
      "Y vuelve la esquina para estirar el recuadro a mano. Se había quitado por innecesaria y dejó al usuario atrapado con dos líneas cuando la medición falló.",
    ],
  },
  {
    version: "27.14",
    cambios: [
      "Segundo intento con el recuadro de las novedades en el móvil: el arreglo anterior funcionó en los textos de email pero no ahí.",
      "El motivo: Novedades se abre en una ventana aparte, y a esa ventana los estilos se le copian a mano y llegan un instante después. La medida se hacía antes, sobre un recuadro todavía sin estilo, y como el texto no cambiaba nadie volvía a medir.",
      "Ahora se mide también cuando el recuadro cambia de ancho, que es justo lo que pasa cuando los estilos por fin llegan.",
    ],
  },
  {
    version: "27.13",
    cambios: [
      "La duración de cada bloque del cronograma se elige de una lista de cinco en cinco minutos, como ya se elegía la hora de inicio. Antes había que teclear el número a mano, que en el móvil es un teclado y una errata esperando.",
      "Las duraciones largas se leen en horas: \"2 h 15 min\" en vez de \"135\".",
      "Si algún bloque tuviera una duración que no cae en los cincos, se sigue viendo tal cual — no se le cambia el valor a nadie por detrás.",
    ],
  },
  {
    version: "27.12",
    cambios: [
      "Al editar una novedad desde el móvil solo se veían tres líneas y no había forma de estirar el recuadro. Ahora se abre ya con el alto del texto que haya escrito, y crece según escribes.",
      "En el Mac no se notaba porque ahí se podía arrastrar la esquina; en el móvil esa esquina no existe.",
      "Lo mismo en los textos de los emails, que tenían el mismo recuadro de tres líneas.",
    ],
  },
  {
    version: "27.11",
    cambios: [
      "Armonía visual en la ventana de música: el panel de Reproducción acaba justo donde acaba la segunda fila de bloques, y el de Volumen donde acaba la última. Antes quedaban descuadrados por unos píxeles.",
      "El alto de un bloque depende de lo ancha que esté la ventana, así que no se puede dejar escrito: se mide en vivo y se recalcula al cambiar el tamaño.",
      "Y una raya fina, con margen a los lados, separa los tres mandos de la sección \"Pistas por bloque\", con aire entre las dos.",
    ],
  },
  {
    version: "27.10",
    cambios: [
      "Detalles del control de la cortinilla: el texto centrado en vez de pegado a la izquierda, y la raya de separación con más aire a ambos lados.",
    ],
  },
  {
    version: "27.9",
    cambios: [
      "El control de la cortinilla, colocado como el resto de la app: una raya fina lo separa del volumen, el texto va en su propia línea, y los − / + y la cifra quedan en la misma vertical que los del volumen de arriba.",
    ],
  },
  {
    version: "27.8",
    cambios: [
      "La música se aparta más durante la cortinilla: en el punto medio pasa del 26% al 14%. La cortinilla ya estaba al máximo posible, así que la única forma de que destaque más era bajar la música, no subirla a ella.",
    ],
  },
  {
    version: "27.7",
    cambios: [
      "Control nuevo para la cortinilla: cuánto destaca sobre la música, en puntos. Sale en el reproductor, debajo del volumen, y al tocarlo suena al momento para poder afinarlo de oído sin cambiar de bloque.",
      "No es un volumen aparte, es un realce: si bajas la música, la cortinilla baja con ella; pero puede sonar por encima, que es lo que hacía falta para distinguirla del fondo.",
      "El ajuste se guarda en el evento, no en el navegador, para poder consultarlo desde fuera al afinarlo.",
    ],
  },
  {
    version: "27.6",
    cambios: [
      "La transición ahora suena como tres personas hablando: la que está, un moderador que da paso, y la que entra.",
      "La que suena NO se calla al entrar la cortinilla: va bajando poco a poco. En el punto medio las dos pistas se apartan (26%) y la cortinilla se queda sola — ese es su momento, y por eso ahora se la oye.",
      "La entrada es la salida del revés: la nueva empieza a subir mientras la anterior aún está bajando, así que nunca hay un segundo de silencio.",
      "Sin cortinilla configurada no se aparta nadie: se cruzan a igual potencia, porque ahí no habría quien llenara el hueco.",
    ],
  },
  {
    version: "27.5",
    cambios: [
      "Arreglado el parpadeo de la ventana de música cada pocos segundos, en el Mac y en el móvil. La intuición del usuario era exacta: el sistema que reconstruye la conexión no paraba al conectarse.",
      "Lo que pasaba: al arrancar, el vigilante mira a los 2 segundos, cuando la conexión aún no ha terminado de establecerse, y programa una reconexión para 4 segundos después. Cuando esa reconexión saltaba, tiraba una conexión que ya funcionaba perfectamente. Al levantar la nueva había otro instante \"sin conectar\", y se programaba otra. Bucle sin fin.",
      "Ahora la reconexión vuelve a mirar antes de actuar, y el vigilante cancela la que hubiera en cola en cuanto confirma que hay conexión.",
      "Era solo visual — la música nunca se cortaba — pero tiraba y levantaba la conexión cada pocos segundos sin ninguna necesidad.",
    ],
  },
  {
    version: "27.4",
    cambios: [
      "La cortinilla se oía muy bajita. Era el mismo fallo que la transición, en otro sitio: el código quería bajarla \"un punto\" pero aplicaba el recorte antes de la curva del oído, y acababa sonando a un 61% en vez de a un 95%.",
      "Ahora suena al mismo volumen que la música. Y lo necesita: desde que el cruce mantiene la energía constante, durante la transición hay dos pistas sonando a plena potencia debajo de ella.",
    ],
  },
  {
    version: "27.3",
    cambios: [
      "Arreglada la transición entre bloques musicales. Las dos quejas de siempre — que sonaba brusca y que la anterior se cortaba antes de tiempo — eran el mismo fallo.",
      "El cruce usaba la misma curva que el mando de volumen, y esa curva ahí hace estragos: a mitad de camino las dos pistas quedaban al 12%, con un agujero de silencio en medio. La que salía se esfumaba en el primer cuarto y la que entraba aparecía de golpe al final.",
      "Ahora las dos van al 71% en el punto medio y la energía se mantiene constante de principio a fin. El cambio se oye continuo, sin hueco y sin salto.",
    ],
  },
  {
    version: "27.2",
    cambios: [
      "Arreglado en el tablón: a los invitados con la letra del móvil aumentada se les cortaba el título de cada apartado.",
      "La etiqueta FAQ / NOVEDADES se va a la derecha, donde estaba la fecha, y la fecha baja dentro del apartado al abrirlo. Así el título se queda con la línea entera y puede ocupar dos si hace falta.",
    ],
  },
  {
    version: "27.1",
    cambios: [
      "La imagen del cronograma pasa a tres bloques por fila. Antes la primera fila metía cuatro y el texto se quedaba estrecho.",
      "Se aplica siempre, tenga los bloques que tenga: desaparece el reparto fijo 4-3-2 que venía de cuando eran nueve y no se podían cambiar.",
    ],
  },
  {
    version: "27",
    cambios: [
      "El cronograma ya se monta entero desde la app: puedes añadir bloques y quitarlos. Hasta ahora eran nueve fijos y cambiarlos exigía tocar el código.",
      "El bloque nuevo entra DETRÁS del que estés viendo, no al final: al montar un cronograma se piensa \"después de la cena va esto\".",
      "Y vuelve a poder renombrarse un bloque. Se había quitado en agosto para ahorrar espacio, pero sin eso un bloque nuevo se quedaría llamándose \"Bloque nuevo\" para siempre.",
      "Quitar pide confirmación dentro de la propia ventana y avisa de que se pierde también quién lo atendía. Siempre queda al menos un bloque.",
      "La imagen que se imprime y la que ven los invitados se ajustan solas al número de bloques que haya.",
    ],
  },
  {
    version: "26.2",
    cambios: [
      "\"Sin revisar\" pasa a llamarse \"Sin rol\" en la columna Rol: dice mejor lo que falta. Cambiado en los tres sitios donde salía — el filtro, el contador de al lado y la ayuda de la columna — para que no digan cosas distintas.",
    ],
  },
  {
    version: "26.1",
    cambios: [
      "Ya no se puede asignar colaborador a alguien que no tenga rol familiar. Si lo intentas, sale un aviso rojo explicando por qué y no se asigna.",
      "El motivo: desde la versión anterior el formulario depende del rol. Un matrimonio asignado sin rol se quedaría sin poder dar su año ni su foto de boda, y nadie se enteraría.",
      "Funciona en los dos sitios donde se asigna: la Lista de invitados y las tarjetas de Datos Colab.",
      "Quitar la asignación nunca se bloquea: deshacer siempre tiene que poder hacerse.",
      "Y en Revisión hay un aviso nuevo, \"Asignados a un colaborador sin rol familiar\", para encontrar los que ya estuvieran así de antes — a esos el guardián no llega.",
    ],
  },
  {
    version: "26",
    cambios: [
      "El formulario de cada invitado se adapta a quién es. Ya no se le pide a todo el mundo lo mismo.",
      "Año de boda y foto de boda: solo a quien viene con su pareja (rol O o A). A un hijo, a un padre sin cónyuge o a alguien suelto ya no se le piden — en su lugar aparece \"No aplica\" con el motivo, para que no parezca que falta algo.",
      "Email: en cuanto se escribe el año de nacimiento, si esa persona es menor el día del evento, el campo se atenúa. Solo recogemos email de mayores de edad.",
      "Y el contador de \"datos N de M\" cuenta ahora solo lo que de verdad se le pide a esa persona. Antes un hijo se quedaba en \"5 de 7\" para siempre y parecía que faltaba algo.",
      "Sin año de nacimiento el email NO se bloquea: si no, el colaborador se lo encontraría cerrado justo antes de poder escribir la edad.",
    ],
  },
  {
    version: "25.2",
    cambios: [
      "El aviso del tablón, dos puntos más grande todavía (de 16 a 18).",
    ],
  },
  {
    version: "25.1",
    cambios: [
      "El aviso del tablón, más directo y con la letra más grande: \"NO COMPARTAS ESTE ENLACE\" en negrita arriba, y debajo la explicación.",
      "Y ahora se ve también ANTES de entrar, en la pantalla de la pregunta — que es justo el momento en que alguien podría estar a punto de reenviarlo.",
      "El aviso está escrito una sola vez aunque aparezca en dos sitios: cambiar el texto en el futuro no puede dejar una de las dos pantallas con la versión vieja.",
    ],
  },
  {
    version: "25",
    cambios: [
      "Banner rojo a lo ancho en el tablón, lo primero que se ve: \"Este enlace es exclusivo para ti como invitado confirmado. No lo compartas con nadie, ya que todos los invitados confirmados tienen acceso a él.\"",
      "Sustituye al aviso gris discreto que había al lado de \"Volver\". Con el enlace repartiéndose a los confirmados, que alguien lo reenvíe sin pensar deja de ser una posibilidad remota.",
    ],
  },
  {
    version: "24.5",
    cambios: [
      "La copia de seguridad ya guarda TODO. Antes guardaba cinco de las doce tablas: se dejaba fuera el tablón, las cuentas, el orden de las familias y el historial de avisos.",
      "Eso afectaba a los cuatro avisos de \"he guardado una copia\" que salen antes de borrar: Borrado total, desactivar Modo pruebas y los dos reinicios. Los cuatro decían la verdad a medias; ahora la dicen entera.",
      "Por qué pasaba: la copia pedía los datos uno a uno, y esa lista estaba escrita a mano en los cinco sitios que la usan. Añadir una tabla obligaba a tocar seis archivos, así que nadie lo hacía nunca. Ahora recibe todo de golpe y guarda lo que encuentre.",
      "A partir de ahora, cualquier tabla nueva entra sola en la copia. Hay un test que se pone rojo si alguien vuelve a escribir la lista a mano.",
      "Y guarda los identificadores y los permisos, que antes se perdían. El secreto del tablón se queda fuera a propósito: no debe viajar en un archivo descargado.",
    ],
  },
  {
    version: "24.4",
    cambios: [
      "Quitado el botón \"Restaurar todo\" de Copia de seguridad. Era una trampa: parecía una red de seguridad y no lo era.",
      "Lo que guardaba esa copia son 5 de las 12 tablas. Se dejaba fuera el tablón, las cuentas, el orden de las familias y los avisos enviados. Y de cada colaborador solo el nombre y el correo — ni su cuenta de acceso ni sus permisos: restaurarla habría dejado a los doce colaboradores sin poder entrar.",
      "Venía de la época en que la app vivía dentro de un chat y republicar borraba todo; entonces era la única forma de recuperar. Hoy hay base de datos de verdad y un volcado completo cada día.",
      "El botón de exportar se queda: sigue sirviendo como foto de mano antes de tocar algo.",
    ],
  },
  {
    version: "24.2",
    cambios: [
      "Retirado el último enlace con contraseña dentro. Los enlaces del tipo \"...?rol=XXXX\" ya no dan acceso a nadie. El de colaborador se había retirado en agosto; el del anfitrión seguía vivo \"como plan B\", y ese era justo el que abría toda la app.",
      "El motivo: una contraseña metida en una dirección web se queda en el historial del navegador, en cualquier captura de pantalla y en cualquier correo que se reenvíe. Con login real, CAPTCHA y recuperación por email ya montados, ese plan B costaba más de lo que daba.",
      "Quien pulse un enlace viejo no se queda mirando una pantalla rara: se le explica que se retiró por seguridad y se le lleva al inicio de sesión.",
      "Y un comando nuevo para el mantenimiento, \"npm run auditar\": se pone en la piel de un desconocido y comprueba 18 cosas contra la base de datos real — que las tablas públicas se leen pero no se escriben, y que las cerradas no se leen siquiera. No modifica nada.",
    ],
  },
  {
    version: "24",
    cambios: [
      "Agujero de seguridad real, encontrado y cerrado. Cuatro tablas (datos del evento, mesas, fotos familiares y orden de las familias) estaban abiertas a ESCRITURA para cualquiera de internet, sin contraseña ninguna. Comprobado en vivo contra la web real: un cambio anónimo era aceptado por el servidor.",
      "Lo grave: los textos de los emails automáticos viven en la tabla del evento. Reescribirlos desde fuera equivalía a decidir el contenido de los correos que la propia app envía, con el remitente legítimo del anfitrión, a todos los invitados.",
      "Por qué pasó: cuando se abrieron, esas tablas solo tenían las mesas y poco más — \"datos sin sensibilidad real\", y era cierto entonces. Después se le fueron añadiendo trece columnas al evento (plantillas de email, email del anfitrión, cronograma, cierre de llegadas) sin revisar esa decisión.",
      "Ahora se pueden LEER (el tablón público las necesita) pero solo se pueden escribir a través de funciones que comprueban quién eres — el mismo cierre que ya tenían la lista de invitados y la de colaboradores desde el principio.",
      "Un colaborador con permiso para editar los datos del evento solo puede tocar los campos de SU ventana. Antes ese permiso le habría dejado también abrir el control de llegadas o activar el Modo Pruebas.",
      "De paso, guardar las mesas dejó de poder quedarse a medias: era un borrado y un guardado por separado, ahora es una sola operación que o entra entera o no entra.",
    ],
  },
  {
    version: "23",
    cambios: [
      "Candado del control de llegadas, en Datos de colaboradores: un botón \"Llegadas: abiertas / cerradas\" en la misma línea que \"Añadir colaborador\". Con el marcado cerrado, ningún colaborador puede marcar a nadie — así no se ensucia el recuento marcando gente semanas antes para probar. Nace cerrado.",
      "Y no se puede marcar como llegada a quien le falten datos obligatorios o no haya pagado: marcarlo lo sacaría de las listas de pendientes justo el día en que hay que resolverlo. El check aparece atenuado y, al tocarlo, dice el motivo exacto.",
      "Las dos comprobaciones están EN EL SERVIDOR, no solo en la pantalla. Desmarcar nunca se bloquea: un error hay que poder deshacerlo, incluso con el marcado ya cerrado.",
      "Si el marcado está cerrado, el propio marcador de llegadas lo avisa — para que no parezca que simplemente no ha llegado nadie.",
      "EL DÍA DEL EVENTO la app se refresca cada 8 segundos en vez de cada minuto. El canal en vivo es lo que da la respuesta instantánea, pero no puede ser lo único de lo que dependa el recuento de llegadas: un WebSocket se cae, el navegador congela la pestaña que queda por detrás y el wifi de un local hace lo que quiere. Así, aunque el canal muera del todo, lo peor que pasa es esperar ocho segundos. El resto del año se queda en un minuto.",
      "Y la causa de que aun así no llegara al otro dispositivo: la conexión en vivo vive en la pestaña principal del navegador, y esa pestaña se congela cuando queda por detrás — por ejemplo mientras miras la Lista de invitados en su ventana aparte. Congelada, no llega ningún aviso y solo queda el refresco de cada minuto. Es exactamente lo que le pasaba al mando de la música. Ahora se reconecta al volver al frente, al recuperar la red, y sola cada dos segundos si se ha caído.",
      "El marcador de llegadas lleva un puntito de estado: verde si el canal en vivo está enganchado (las llegadas aparecen al instante) y rojo si no (tardarán hasta un minuto, por el refresco normal). Sin ese indicador no hay forma de distinguir \"no llega el aviso\" de \"el canal no está conectado\".",
      "Corregido el caso en que emisor y receptor son la misma sesión del navegador — el anfitrión previsualizando el formulario de un colaborador, o la Lista de invitados en su ventana aparte, que comparte cliente con la pestaña principal. Ahí el aviso no llegaba.",
      "Las llegadas se ven al instante, sin esperar. Toda la app se entera de los cambios preguntando cada minuto, y aquí eso se notaba demasiado: marcabas a alguien en el móvil y el recuento tardaba casi un minuto en moverse. Ahora usa el mismo canal en vivo que el mando de la música, así que el número cambia en el momento — y si un aviso se pierde, el refresco de siempre lo corrige.",
      "Control de llegada el día del evento. Cada colaborador ve un check redondo al final de la fila de cada uno de sus invitados, sin desplegar el formulario: lo pulsa según van llegando, con una confirmación por medio (\"¿Confirmas que Fulano ya está aquí?\") — las filas van juntas y un dedo puede marcar al de al lado.",
      "El nombre del invitado se corre un poco a la izquierda para dejarle sitio al check en el extremo derecho.",
      "Marcador de llegada en la cabecera de la Lista de invitados: recuadro propio con dos números grandes, YA ESTÁN y FALTAN, para verlo de un vistazo desde lejos mientras entra la gente. Aparece solo el día del evento (o antes, si ya hay alguien marcado, para poder probarlo).",
      "En la Lista de invitados aparece la columna \"Llegó\" con su filtro (Ya está / Falta, con sus cantidades) y, en cuanto llega el primero, el contador \"Ya están 12/130\" arriba junto al resto de cifras. Filtrando por \"Falta\" sale la lista de quién no ha aparecido.",
      "⚠️ Necesita ejecutar antes el bloque de SQL de la columna \"presente\".",
    ],
  },
  {
    version: "22.5",
    cambios: [
      "\"Texto emails\" deja de ser un botón de Configuración: las cuatro plantillas se mudan al final de Datos del evento, cada una en su propia sección plegada, con un vistazo de su contenido al lado del título. Así todo el texto editable de la app queda concentrado en un solo sitio.",
      "Con eso, el permiso \"Editar el texto de los emails\" desaparece: quien puede editar Datos del evento edita ya todo su contenido, textos incluidos. El permiso pasa a llamarse \"Editar los datos del evento (textos de email incluidos)\".",
      "⚠️ Si algún colaborador tenía concedido solo el permiso de textos, ahora se queda sin nada — hay que marcarle \"Editar los datos del evento\" en Permisos si se le quiere mantener el acceso.",
      "Configuración baja a nueve entradas.",
    ],
  },
  {
    version: "22.4",
    cambios: [
      "El filtro de Colaborador gana la opción \"Sin asignar\", para ver de un vistazo a quién todavía no le corresponde nadie.",
      "El filtro de Zona muestra ya cuántos invitados hay en cada una, igual que ya hacía el filtro de Rol.",
      "Y el de Colaborador también: cuántos invitados tiene asignados cada uno, de un vistazo, sin tener que filtrar uno a uno.",
      "Se retira la ventana \"Logística\": había dejado de aportar nada que no se viera ya en otro sitio de la app. Lo único que sí se seguía consultando — el resumen de qué colaborador tiene qué permiso — se muda a la propia ventana de Permisos, donde encaja de forma natural, plegado por defecto igual que estaba allí.",
      "Simplificado el menú \"Abrir sección…\": \"Fondo musical\" (dentro de Configuración) se retira como botón propio — solo servía para tocar un ajuste del tablón público — y su gestor de pistas pasa a ser una fila plegable más en el pie de Novedades, junto al WhatsApp y la pregunta de acceso, que son ajustes del mismo tablón.",
      "Y tres botones más de Configuración desaparecen del menú: Precios, Email anfitrión y URL web pasan a ser secciones plegadas dentro de Datos del evento, que es lo que son — datos del evento. Configuración baja de diez entradas a seis.",
      "Datos del evento gana además su propia sección plegada para las dos imágenes (portada y WhatsApp), que eran lo que más espacio ocupaba nada más abrirla. Cada sección plegada muestra su valor actual al lado del título, así que no hay que abrirlas para saber cómo están.",
      "El Plano de mesas deja de ser una ventana aparte y pasa a ser una sección plegada dentro de Mesas: es la misma información desde otra perspectiva — el plano no tiene datos propios, solo coloca en el espacio las mesas que se crean ahí (de hecho ya avisaba de \"créalas primero en Mesas\").",
      "Permisos, Backup, Progreso y Versiones bajan al segundo nivel, dentro de Configuración. El menú principal pasa de catorce entradas a nueve: solo lo que se usa a diario.",
      "Cada tarjeta de colaborador nace plegada: fuera quedan el nombre, cuántos lleva asignados y sus iconos de acción; el resto (email, avisar, invitados asignados) se despliega al tocar el nombre. Con doce colaboradores, doce tarjetas abiertas eran una ventana interminable. Si alguno tiene gente sin avisar, se ve desde fuera en rojo, sin abrir la tarjeta.",
      "En la tarjeta de cada colaborador se quita el aviso viejo de \"pendientes de avisar — avisa desde la ventana Avisos\": remitía a una ventana que ya no existe y decía lo mismo que la línea de al lado, la que ahora trae el botón para avisar. Y \"Añadir colaborador\" pasa a estar plegado, que se usa unas pocas veces y ocupaba media ventana.",
      "Desaparece la ventana \"Avisos\", que en realidad eran tres cosas de sitios distintos. \"Avisar ahora\" baja a la tarjeta de cada colaborador, junto a su email y sus pendientes — que es donde ya estás mirando cuando decides avisarle, y donde esa cuenta ya se calculaba. El historial de emails enviados se queda como sección plegada al final de Datos de colaboradores. Y su bloque de invitaciones se descarta: repetía la lista que la ventana Invitaciones ya tenía; solo se conservan sus tres cifras (Pendientes / Enviadas / Sin email), que allí faltaban.",
      "Reinicios: todas las opciones pasan a estar dentro de desplegables, ninguna suelta. Antes eran seis botones rojos a la vista de golpe más un séptimo al pie — en la ventana más peligrosa de la app. Ahora se elige qué reiniciar, luego a quién, y hay un único botón de acción.",
    ],
  },
  {
    version: "22.3",
    cambios: [
      "La cabecera con los filtros queda inmóvil de verdad al bajar por la lista: se ve siempre en qué columna estás trabajando. Estaba puesta como pegajosa desde la versión anterior, pero quien desplazaba era el cuerpo de la ventana, no la tabla, así que se iba hacia arriba con las filas. Ahora desplaza la tabla y la cabecera se queda.",
      "Imprimir deja de gastar el doble de papel. Salían cinco páginas y media en blanco antes de empezar: la lista de detrás se volvía invisible, pero seguía OCUPANDO su sitio — y 140 filas ocupan eso. Ahora desaparece de la maquetación mientras se imprime, así que el papel empieza donde tiene que empezar.",
    ],
  },
  {
    version: "22.2",
    cambios: [
      "La lista pasa a ser UNA SOLA PIEZA. Hasta ahora los encabezados y los filtros vivían en la barra verde de la ventana y las filas en la caja de abajo: dos sitios distintos que se hacían coincidir midiendo en píxeles el ancho de cada columna y copiándoselo al otro. Ahora comparten el mismo contenedor y la misma rejilla: cuadran porque son lo mismo, no porque alguien los mida.",
      "Los encabezados y filtros se quedan pegados arriba al desplazar la lista, con el mismo aspecto verde de siempre.",
      "Desaparecen 45 líneas de medición (con sus vigilantes, sus temporizadores de seguridad y su validación de \"¿es creíble esta medida?\") y la sincronización manual del desplazamiento lateral. Con ellas desaparece la causa de los cuatro fallos de estos días: cabecera fuera del marco, una sola columna, dos columnas gigantes y filtros recortados.",
      "La idea fue del usuario: \"en realidad la lista debería ser todo una sola pieza\".",
    ],
  },
  {
    version: "22.1",
    cambios: [
      "Arreglado el botón Acciones, que dejó de responder en la ventana independiente: su menú se dibujaba en la pestaña principal en vez de en la ventana nueva, así que se abría detrás, invisible. Ahora cualquier menú de la app deduce en qué ventana vive a partir del propio botón que lo abre, sin que haya que decírselo — vale para esta ventana y para las que vengan.",
      "La lista llena ya la ventana entera: tenía un tope de media pantalla que dejaba un tercio vacío debajo.",
      "Segunda vuelta del mismo fallo: se llegaban a ver dos columnas gigantes en vez de once. Cada celda lleva \"display: flex\" en su propio estilo, así que mientras no hay rejilla cada una ocupa el ancho ENTERO de la ventana — y esas medidas parecían buenas (once, ninguna aplastada). Ahora una medida solo vale si la fila ya es una rejilla de verdad y si las once columnas, sumadas, caben dentro de ella.",
      "Arreglada la lista en su ventana aparte, que se veía con una sola columna ocupándolo todo. La tabla mide el ancho de cada columna al abrirse, y en la ventana nueva esa medida se tomaba ANTES de que llegaran los estilos: medía una fila que todavía no era una rejilla y se quedaba con esa medida rota para siempre (el ancho total no cambiaba después, así que nada la corregía).",
      "Ahora se vuelve a medir cuando la ventana termina de cargar, cuando están listas las fuentes y en cuanto la fila cambia de tamaño. Y sobre todo: una medida solo se aplica si es creíble — tantas columnas como hay y ninguna aplastada. Si no lo es, se descarta y la tabla se queda con su reparto normal, que se ve bien.",
    ],
  },
  {
    version: "22",
    cambios: [
      "La Lista de invitados sale del navegador: se abre en su propia ventana del sistema, como Novedades, Logística y Música. Se puede llevar a otra pantalla y hacerla tan grande como haga falta — es la ventana que más se mira y la que más columnas tiene.",
      "Dentro de esa ventana no hay marco flotante ni segunda X: el marco, el tamaño y el cierre los pone el sistema operativo. Todo lo demás (título, cifras, cabecera y filtros) se ve exactamente igual.",
      "Los dos avisos de mesa (invitado sin confirmar, mesa completa) dejan de ser diálogos del navegador y pasan a ser un aviso dentro de la propia ventana: un diálogo nativo desde una ventana emergente sale en la pestaña equivocada y encima bloquea.",
      "Imprimir sigue funcionando desde ahí: entre el papel y la lista había tres contenedores de altura fija que confinaban la impresión a una sola página — el mismo fallo que costó dos rondas en agosto. Quedan neutralizados los tres.",
      "En el móvil no cambia nada: allí sigue abriéndose dentro de la página, porque una ventana aparte es otra pestaña y Safari las bloquea de fábrica.",
    ],
  },
  {
    version: "21.12",
    cambios: [
      "La Lista de invitados abre ya lo bastante ancha para ver las once columnas con sus filtros de un vistazo, sin desplazar nada. Se había quedado estrecha al pasar de nueve a once columnas.",
      "Y si la ventana se estrecha (pantalla pequeña o redimensionada a mano), la cabecera y los filtros dejan de salirse por fuera del marco: se recortan dentro y se desplazan a la vez que la tabla, cuadrando siempre columna a columna. Eso era lo que daba impresión de estar sin terminar.",
    ],
  },
  {
    version: "21.11",
    cambios: [
      "La Revisión avisa de los menores sentados sin ningún adulto DE SU FAMILIA en su mesa. Es la comprobación que más se notará cuando los colaboradores empiecen a rellenar las edades de verdad, y solo se puede hacer cruzando tres cosas a la vez: la edad, la mesa y la familia.",
      "Un adulto de otra familia en esa mesa no vale: el aviso es \"no tiene a los suyos al lado\", no \"está rodeado de adultos\".",
      "Usa 18 años, no los tramos de precio del evento: esos dicen quién paga y cuánto, que es otra cosa — un chaval de 12 paga como adulto y sigue sin poder quedarse solo en una mesa de desconocidos.",
      "A quien todavía no ha dado su año de nacimiento se le cuenta como adulto si lleva papel de adulto (O, A, P o S), para que el aviso no se dispare con cada hueco mientras se recogen los datos.",
    ],
  },
  {
    version: "21.10",
    cambios: [
      "La Revisión deja de repetir lo que la lista ya enseña columna a columna: fuera los datos incompletos, quién no ha pagado, quién no tiene mesa y quién está sin revisar. Todo eso son columnas con su filtro y su cifra arriba.",
      "El informe se queda solo con lo que obliga a cruzar filas entre sí — lo que ninguna columna puede enseñar por sí sola: hijos sin adulto, P sin hijos, S acompañada, dos cónyuges del mismo tipo en un grupo, gente sin familia y matrimonios sin año de boda.",
      "Y lo único que faltaba para poder mirarlo en la lista se ha añadido allí: el filtro de Mesa gana la opción \"Sin mesa\".",
    ],
  },
  {
    version: "21.9",
    cambios: [
      "La Revisión deja de ocupar sitio arriba de la lista: se abre desde Acciones → Revisión. Si hay algo mal, la propia entrada del menú lo dice con su número en rojo — un informe escondido que no avisa es un informe que nadie mira.",
      "El filtro de Rol ya no repite el total en \"Todos\" (ese número ya está arriba, en Previstos).",
      "Corregido \"Mat.\": ponía 96, que son los cónyuges (48 + 48), no los matrimonios. Ahora pone 48, que es lo que hay.",
    ],
  },
  {
    version: "21.8",
    cambios: [
      "Informe de revisión en la Lista de invitados, plegado arriba del todo: cuando todo cuadra es una línea que lo dice, y cuando no, señala qué falla. Solo lee — no toca ni cambia nada.",
      "Busca lo que la lista no puede ver mirando una fila sola, porque hay que cruzar familias enteras: hijos sin ningún adulto en su grupo, una P que viene sin hijos (sería S), una S metida en un grupo con más gente, dos esposos o dos esposas bajo el mismo apellido (falta numerar la familia), gente sin grupo familiar, y cónyuges marcados sin su pareja.",
      "Separa lo que está MAL de lo que solo está PENDIENTE (sin revisar, sin mesa, datos incompletos, sin pagar, matrimonios sin año de boda), para que el aviso no canse y se acabe ignorando.",
      "Cada hallazgo trae los nombres: al tocar uno, se busca en la lista de abajo. El informe señala; la lista sigue siendo donde se corrige.",
      "El filtro de Rol enseña ahora cuántos hay de cada uno: O (48), A (48), H (22)… y \"Mostrando 12/138\" aparece arriba en cuanto hay algún filtro puesto.",
    ],
  },
  {
    version: "21.7",
    cambios: [
      "Todas las filas de la Lista de invitados tienen ya la MISMA altura y una sola línea de texto. Un nombre largo deja de partirse en dos líneas: la hoja es más ancha (con desplazamiento lateral) y, si aun así no cabe, se recorta con puntos suspensivos — pero la fila no crece.",
      "Queda como norma de la app, escrita en el propio proyecto: cualquier tabla nueva nace así.",
    ],
  },
  {
    version: "21.6",
    cambios: [
      "Dos letras más, y la razón es la mesa, no el recuento: P = padre o madre que viene SIN su cónyuge (madre soltera, o el cónyuge se puso malo y el resto de la familia sí viene) — no forma matrimonio, pero hay que sentarlo con sus hijos. S = suelto de verdad: no hay a quién vincularlo, cabe en cualquier hueco que quede libre.",
      "El guion deja de significar dos cosas a la vez. Antes era \"unidad suelta\" Y \"todavía no lo he mirado\"; ahora significa solo SIN REVISAR, y quien está revisado y no encaja en ninguna familia lleva su S.",
      "Con eso aparece el contador \"Sin revisar\", que dice cuánto queda por repasar de los ~140 invitados y desaparece al llegar a cero. El filtro pasa a: Todos, Mat., O, A, H, P, S y Sin revisar.",
      "La columna pasa a llamarse \"Rol\", que ya no cabía como O/A/H.",
    ],
  },
  {
    version: "21.5",
    cambios: [
      "En el filtro O/A/H, \"En familia\" pasa a llamarse \"Mat.\" y enseña exactamente eso: los dos cónyuges, sin los hijos.",
      "Fuera la ventana Matrimonios: mostraba lo que la Lista de invitados ya enseña (nombres, zona, confirmados, el contador y el aviso de sin pareja) y encima no dejaba editar, cuando la raíz de todo es la propia lista. Dos sitios para lo mismo.",
      "Lo único que solo estaba allí se muda a la lista: columna \"Boda\" con el año y los años que cumplen el día del evento (\"2001 · 25\"), con su filtro (Con año / Sin año) y ordenable.",
      "Con eso, filtrar por O da una fila por pareja: la lista de las 70 parejas, filtrable e imprimible, en el sitio donde ya se trabaja. La columna sale también al imprimir.",
    ],
  },
  {
    version: "21.4",
    cambios: [
      "La marca de la familia gana la H de hijo: O esposo, A esposa, H hijo. Y dejarla en blanco pasa a significar algo — unidad suelta: alguien soltero, o el único miembro de un matrimonio que asiste (a esos no se les marca).",
      "El filtro de esa columna se adapta: Todos, En familia, O, A, H y Sueltos.",
      "El campo se llamaba \"cónyuge\" y con la H pasaba a mentir (un hijo no es un cónyuge), así que se ha renombrado entero a \"papel en la familia\". Una copia de seguridad hecha antes de hoy se restaura igual, sin perder lo ya marcado.",
      "⚠️ Necesita ejecutar antes el bloque de SQL del renombrado.",
    ],
  },
  {
    version: "21.3",
    cambios: [
      "El aviso de \"marca sin pareja\" salta también en la propia Lista de invitados, que es donde se marca: la letra sale en rojo con un \"!\" y, arriba, aparece la cifra \"Sin pareja\" (solo mientras haya algo que corregir).",
      "Regla del evento: los matrimonios vienen siempre los dos, así que si solo asiste uno de los cónyuges NO se le marca. Con esa regla, una marca suelta deja de ser un caso válido y pasa a ser un despiste que hay que cazar.",
      "La ventana Matrimonios lo señala: cifra \"Sin pareja\" arriba y, al pie, los nombres concretos de quienes están marcados sin su cónyuge — para ir a la lista y arreglarlo. Antes se ignoraban en silencio y esa pareja simplemente no aparecía.",
    ],
  },
  {
    version: "21.2",
    cambios: [
      "Texto de la ventana Matrimonios reducido a lo imprescindible: \"O (esposo), A (esposa). El aniversario que cumplen en el año del evento.\"",
      "La ventana Matrimonios se viste igual que la Lista de invitados: cabecera verde con la letra dorada, recuadro tenue alternando por columna y filas cebra. Gana además una columna Confirm., para ver de un vistazo si vienen los dos.",
      "Si a una pareja le falta el año de boda, la columna Aniversario se queda vacía sin más: que el dato no está ya se ve en la columna de al lado. El aviso rojo que había se convierte en una cifra más de la cabecera (\"Sin año de boda\"), junto al total de matrimonios.",
    ],
  },
  {
    version: "21.1",
    cambios: [
      "La columna O/A gana su filtro, como el resto: Todos, Cónyuges (los marcados con cualquiera de las dos), O, A y Sin marcar — este último para repasar de un vistazo a quién falta por marcar.",
      "En la columna O/A ya se ve la letra: la flecha del desplegable se comía el ancho entero de una columna estrecha a propósito. Se quita la flecha (sigue abriéndose igual al tocarlo) y la letra queda centrada, en dorado, sobre un recuadro suave que indica que se puede tocar.",
    ],
  },
  {
    version: "21",
    cambios: [
      "Matrimonios. La Lista de invitados gana una columna O/A: se marca a cada cónyuge con O (esposO) o A (esposA), y un esposo + una esposa de la misma familia forman un matrimonio. Arriba, junto a Previstos y Confirmados, sale el total de matrimonios.",
      "Ventana nueva \"Matrimonios\" (en Abrir sección…): cada pareja con su familia, sus dos nombres, su zona, el año de boda y los años que cumplen EL DÍA DEL EVENTO — el número que va en el sello de cada foto. Avisa de a cuántas parejas les falta el año de boda.",
      "El año de boda ya existía y lo rellena el colaborador en su formulario, así que no hay nada nuevo que pedirle a nadie.",
      "⚠️ Necesita ejecutar antes el bloque de SQL de la columna \"conyuge\".",
    ],
  },
  {
    version: "20.28.1",
    cambios: [
      "La cortinilla sigue ahora al volumen general. Antes se quedaba con el volumen que hubiera en el primer clic de la noche: bajar la música al 30% la dejaba atronando al 70, y silenciar no la callaba. Suena un punto por debajo de la música, porque va encima de dos pistas a la vez.",
    ],
  },
  {
    version: "20.28",
    cambios: [
      "La cortinilla ya hace su trabajo: al cambiar de bloque, el anterior NO se corta en seco. Las dos pistas se solapan — la que sale se va apagando mientras la que entra sube — y la cortinilla suena por encima de las dos. Se acabó el silencio incómodo en cada transición.",
      "El cruce dura lo que dure la cortinilla (entre segundo y medio y seis segundos), para que quepa entera dentro del solape.",
      "Si tocas el volumen o silencias en mitad de un cruce, el cruce lo respeta en vez de pelearse contigo. Y si pulsas pausa, el que salía se calla ya.",
      "Sigue sin reiniciarse nada: el bloque que dejas se queda anotado en el segundo en que lo dejaste, no en el que acaba el cruce.",
    ],
  },
  {
    version: "20.27",
    cambios: [
      "Arreglado el ordenador quedándose clavado en \"el canal del mando no conecta\" mientras el móvil iba fino. La reconexión no reconectaba nada: volvía a suscribir el MISMO canal, y esa llamada no hace absolutamente nada si el canal no está cerrado del todo. Ahora se tira el canal roto y se levanta uno nuevo.",
      "Además se reconecta al volver a primer plano o al recuperar la red. Esa era la causa de fondo: la conexión vive en la pestaña principal, y el navegador la congela cuando queda por detrás de la ventana de música — por eso le pasaba al ordenador y no al móvil, que estaba siempre en primer plano.",
      "Si el canal sigue mudo más de doce segundos, se levanta uno nuevo por su cuenta, sin esperar a que nadie avise.",
      "El aviso muestra ahora el motivo exacto que da el navegador, para no tener que diagnosticar a ciegas.",
    ],
  },
  {
    version: "20.26",
    cambios: [
      "Cada bloque recuerda dónde se quedó. Si estás en Recepción y saltas a Cóctel, Recepción no vuelve a empezar cuando la retomes: sigue exactamente donde la interrumpiste, con su cortinilla de entrada igual.",
      "Los bloques dejados a medias se marcan con el puntito dorado rodeado de un halo (arriba a la derecha del botón), y al mirarlos se lee \"pausado en 4:12\" en vez de \"sin sonar\". Una pista que termina sola no deja marca: la próxima vez arranca desde el principio.",
      "El móvil ve esas marcas igual que el ordenador — viajan con el resto del estado.",
      "Corregido: el ordenador había perdido su ventana independiente si el navegador no estaba a pantalla completa. Se decidía por el ancho de la ventana, y ahora se decide por el aparato (táctil o no), que es lo que se quería desde el principio: ventana aparte en el Mac, pantalla completa dentro de la página solo en móvil o tablet.",
    ],
  },
  {
    version: "20.25",
    cambios: [
      "En el móvil, Música del evento ya no intenta abrirse como ventana aparte: se abre a pantalla completa dentro de la propia página. Pulsar \"Música\" en el móvil no hacía absolutamente nada — sin aviso ni error — porque Safari en iOS trae activado de fábrica el bloqueo de ventanas emergentes. El mando a distancia vive en el móvil, así que no puede depender de un permiso del navegador.",
      "En el ordenador sigue abriéndose en su ventana aparte, como hasta ahora; si el navegador la bloqueara, cae también en la pantalla completa dentro de la página en vez de quedarse en nada.",
    ],
  },
  {
    version: "20.24",
    cambios: [
      "La ventana de música ya no se cae entera si el canal del mando no puede abrirse. Al suscribirse, Supabase puede lanzar un error de verdad (por ejemplo si el navegador no consigue abrir la conexión), y ese error subía hasta React y tumbaba la ventana — cuando lo cierto es que la música no depende de eso: suena desde el archivo guardado en el ordenador. Ahora un fallo del canal se queda en un aviso y la ventana funciona igual.",
      "Ningún envío ni aviso del mando puede ya tumbar la ventana: todas las llamadas al canal están protegidas.",
      "Cuando algo falla dentro de una ventana emergente, el aviso muestra el MENSAJE del error (antes solo se podía leer en la consola del navegador — imposible desde un móvil) y los botones son los que sirven ahí: Reintentar, Restablecer el aspecto y Cerrar la ventana. \"Recargar\" se ha quitado en ese caso: una ventana emergente se abre sin dirección, así que recargarla la dejaba en blanco de verdad.",
    ],
  },
  {
    version: "20.23",
    cambios: [
      "Arreglada la ventana en blanco al volver a abrir Música del evento con una imagen de fondo puesta. La foto se estaba pintando por separado en cada pieza (el chasis, cada panel y cada una de las teclas): el navegador tenía que decodificar la misma imagen quince veces antes de mostrar nada, y con un PNG pesado se atragantaba. Ahora se pinta UNA vez en el chasis y las piezas son translúcidas — se ve igual, y arranca al instante.",
      "La ventana ya no espera a la foto para abrirse: aparece con su acabado y la imagen entra cuando está descargada. Si no llega a cargar, la ventana funciona igual y lo dice.",
      "Si la imagen que hay subida pesa de más, sale un aviso con su tamaño real y un botón Optimizar que la reduce sin tener que buscar el archivo original.",
      "Música del evento tiene ahora su propia red de seguridad: si algo falla dentro de esa ventana ya no se queda en blanco sin explicación — muestra el aviso, un botón para recargarla (esa ventana, no la principal) y otro para devolver el aspecto a como venía de fábrica.",
    ],
  },
  {
    version: "20.22",
    cambios: [
      "El icono de wifi cambia de significado: antes decía si ESTE navegador había enganchado con el servidor, cosa que pasa aunque estés solo — por eso el ordenador se declaraba conectado sin haber abierto siquiera el mando. Ahora dice si está el OTRO aparato, que es lo que importa: tachado (sin canal), tenue (canal listo, falta el otro) o dorado (los dos enlazados).",
      "Con el canal listo pero sin el otro aparato, sale un aviso tranquilo que dice qué falta por hacer, en vez de una alarma roja.",
      "Subir un fondo ya no se puede quedar colgado: la imagen se reduce a 1920px ANTES de subirla (una captura o una foto del carrete puede pesar 20 MB, y eso era lo que colgaba la ventana), la subida se rinde sola a los 45 segundos con un mensaje claro, y mientras tanto hay un botón \"Dejarlo\" para recuperar el control.",
      "Elegir dos veces seguidas el mismo archivo ya funciona (antes el segundo intento no hacía nada y parecía otro cuelgue).",
    ],
  },
  {
    version: "20.21",
    cambios: [
      "La imagen de fondo pasa a guardarse en la nube, no en el navegador: por eso la que se subía en el Mac no aparecía en el móvil (lo que se guarda en un aparato no existe para el otro). Ahora se sube una vez y se ve en los dos. ⚠️ Necesita ejecutar antes el bloque de SQL del almacén 'musica-fondo'.",
      "La imagen viste la ventana ENTERA — fondo, paneles y teclas —, no solo el fondo. Y deja de combinarse con un acabado por debajo: si pones tu imagen, manda ella.",
      "Con la imagen puesta aparecen dos botones, Imagen oscura / Imagen clara, que es lo único que hay que decidir: de eso depende que el texto y los mandos vayan en claro o en oscuro por encima.",
      "La casilla de la imagen muestra el NOMBRE que le pusiste al archivo, en vez de un genérico \"Mi imagen\".",
    ],
  },
  {
    version: "20.20",
    cambios: [
      "Arreglada la imagen de fondo propia: subirla parecía no hacer nada. Eran dos cosas a la vez — el velo que se le ponía encima era tan opaco (85%) que tapaba la foto casi por completo, y además no aparecía por ningún sitio para poder elegirla.",
      "Ahora la imagen es una casilla MÁS del catálogo de acabados, con su miniatura de verdad: se toca para ponerla y se vuelve a tocar para quitarla, como los otros cuatro. Al subir una se pone sola.",
      "El velo es mucho más liviano y se abre por el centro: carga arriba y abajo, donde están la cabecera y los mandos, y deja ver la foto en medio. Con foto puesta, los paneles pasan a ser opacos para que los mandos no cambien de color según la zona de la imagen que les toque debajo.",
    ],
  },
  {
    version: "20.19",
    cambios: [
      "El volumen queda en DOS filas, no en tres: arriba la barra con el botón de silenciar pegado a su izquierda, y debajo los dos botones grandes de Bajar y Subir con el porcentaje en medio, como el visor de un equipo.",
      "Esa sección tiene ahora exactamente la misma altura que el reproductor, así que los dos paneles quedan a la par tanto en horizontal como en vertical.",
    ],
  },
  {
    version: "20.18",
    cambios: [
      "Arreglado de verdad el wifi tachado: el mando podía estar gobernando el ordenador y la ventana seguía diciendo \"conectando\" en los dos aparatos. El aviso de Supabase en el que se apoyaba llega UNA sola vez y podía no llegar nunca; ahora, cada 2 segundos, se mira la realidad — si el canal está unido o si acaba de llegar un mensaje del otro aparato, está conectado, y punto.",
      "Si el canal se cae, el reintento vuelve a registrar el aviso de errores (antes se reconectaba mudo y ya no informaba de nada más).",
      "Retirado el acabado \"Acero pulido\": dibujado con CSS no parecía acero, solo rayas verticales. Un metal convincente pide una foto de metal, y para eso ya está la opción de poner una imagen de fondo propia.",
    ],
  },
  {
    version: "20.17",
    cambios: [
      "Mucho más contraste entre el chasis y los mandos, en los cinco acabados: los paneles dejan de ser un velo translúcido sobre el fondo (sobre champán eran casi el mismo color) y pasan a tener color y borde propios, y las teclas ganan canto marcado.",
      "Acabado nuevo: Acero pulido — metal cepillado de verdad, con microlíneas y reflejo curvo, manteniendo el latón de los mandos para no perder el aire de la fiesta.",
      "El volumen pasa de una fila apretada a tres: silenciar arriba, la barra con el porcentaje en grande en el medio, y abajo dos botones anchos de Bajar y Subir (que siguen repitiendo si se mantienen pulsados).",
      "El latido del bloque que suena cambia de color según el acabado: el dorado claro se perdía por completo sobre champán o acero.",
    ],
  },
  {
    version: "20.16",
    cambios: [
      "Música del evento se puede personalizar: botón de paleta en la cabecera con cuatro acabados (Verde anodizado, Champán, Grafito y Marfil). Cada uno cambia la paleta ENTERA, no solo el fondo — sobre champán o marfil, el texto y los mandos se oscurecen solos para seguir leyéndose.",
      "También se puede poner una imagen propia de fondo, que se guarda dentro del navegador. Va bajo un velo del acabado elegido, para que ninguna foto deje media pantalla ilegible.",
      "Los paneles (bloques, reproducción, volumen y pistas) se pueden colocar en el orden que se quiera, con \"Mover paneles\": arrastrando en el ordenador o con las flechas (el único camino en el móvil, donde el arrastre del navegador no existe).",
      "En el ordenador se elige además entre colocarlos en horizontal (la ventana abierta del todo en el MacBook: los cuatro paneles en fila) o en vertical (una sola columna estrecha a un lado de la pantalla).",
      "El icono de wifi tachado ya explica QUÉ pasa: si el canal del mando no conecta, aparece un aviso que dice el motivo y aclara que la música no se ve afectada — suena desde el archivo guardado en el ordenador, sin pasar por internet. Lo que no funciona hasta que conecte es el mando del móvil.",
      "Si el canal se cae, ahora se reintenta solo cada 4 segundos, en vez de quedarse muerto el resto de la noche.",
    ],
  },
  {
    version: "20.15",
    cambios: [
      "Música del evento estrena acabado metálico, con la idea de un equipo de audio real: aluminio anodizado verde con mandos de latón. Mantiene los colores de la fiesta — el verde deja de parecer pintura plana y pasa a parecer metal teñido.",
      "Los 9 bloques y las teclas de salto y volumen son ahora piezas con bisel: filo de luz arriba, filo oscuro abajo y sombra proyectada.",
      "La barra de progreso pasa a estar HUNDIDA en el chasis, como el visor de un equipo, en vez de pintada por encima.",
      "El botón de play es un mando de latón torneado, con el reflejo arriba a la izquierda y aro fino en el canto.",
    ],
  },
  {
    version: "20.14",
    cambios: [
      "Los 9 bloques dejan de ser cuadrados y pasan a rectángulos, quitándoles solo un poco de altura. Ganan relieve de verdad (también los no seleccionados, que antes iban planos y parecían recuadros pintados en vez de botones) y algo más de separación entre ellos.",
    ],
  },
  {
    version: "20.13",
    cambios: [
      "Música del evento, más compacta: en el móvil ya no hace falta hacer scroll para llegar al volumen ni al play — todo lo que se toca en directo cabe en una pantalla.",
      "El reloj y el estado (en hora / con retraso) se meten en la cabecera, donde no roban altura. El volumen pasa de tres filas a una sola: silencio, barra, porcentaje y los botones − y +.",
      "En el reproductor, el nombre del bloque y los tiempos comparten línea, y el ajuste de salto sube junto a los botones en vez de ocupar una fila para él solo.",
      "En el ordenador, la lista de pistas por bloque nace plegada (con un contador del tipo 3/9): se usa una vez antes de la boda, no en directo.",
    ],
  },
  {
    version: "20.12",
    cambios: [
      "Repaso a fondo del acabado de Música del evento: ahora solo el botón de play va en dorado macizo. El bloque seleccionado y la barra de «sonando ahora» pasan a un tratamiento más discreto — antes había tres cosas doradas compitiendo y ninguna destacaba de verdad.",
      "Las tarjetas ganan relieve (filo de luz arriba y sombra suave debajo, como el resto de la app) en vez de ser rectángulos planos, y todas comparten el mismo redondeo.",
      "Tipografía con escala real: rótulos pequeños en versalitas, nombres de bloque en peso medio en vez de negrita máxima, y las cifras alineadas para que no bailen al cambiar.",
      "El reloj deja de ser una caja con una frase suelta debajo y pasa a explicarse solo, con la hora a un lado y el estado al otro.",
    ],
  },
  {
    version: "20.11",
    cambios: [
      "Música del evento se queda con un solo botón de cerrar: se quita el que puse en la cabecera, porque la ventana ya trae el suyo del sistema operativo (y ese no se puede quitar desde una página web).",
      "El aviso no se pierde: ahora el navegador pregunta al cerrar la ventana del ordenador si hay música puesta. Cerrar el mando no pregunta nada — la música sigue sonando igual.",
    ],
  },
  {
    version: "20.10",
    cambios: [
      'Música del evento, más minimalista: las tarjetas pierden los contornos (sobre el fondo oscuro ya se distinguen solas), el nombre del archivo pasa a segundo plano y las flechas de salto se quedan limpias.',
      'Las opciones de salto (10s / 30s / 1min) dejan de ocupar sitio siempre: ahora hay un chip discreto que dice cuánto salta, y al tocarlo aparecen las tres. Eliges y se vuelven a esconder.',
    ],
  },
  {
    version: "20.9",
    cambios: [
      "Música del evento estrena look: fondo verde profundo con dorado, en vez del verde claro pálido de antes. Es la única pantalla que se usa a oscuras y de un vistazo rápido, así que ahora el bloque seleccionado va en dorado macizo y el botón de play también — resaltan muchísimo más.",
      "Mismo aspecto en el ordenador y en el móvil: lo único que sigue cambiando entre los dos son los tamaños y el reparto en columnas, no los colores.",
    ],
  },
  {
    version: "20.8",
    cambios: [
      'La barra de "Sonando ahora" (debajo de los 9 bloques) pasa a ser protagonista cuando miras otro bloque: fondo verde oscuro con letra dorada, el nombre en grande, ecualizador al doble, el mismo latido que el bloque, y el "Ir" como botón dorado de verdad.',
    ],
  },
  {
    version: "20.7",
    cambios: [
      "El mando pasa a fondo verde esmeralda claro: sobre el crema de antes, los botones blancos apenas se distinguían. El ordenador se queda con el crema del resto de la app.",
      "Botón de cerrar en la cabecera de la ventana, con aviso antes de cerrar de verdad — y el aviso dice qué se pierde en cada caso: cerrar el ordenador para la música, cerrar el mando solo te deja sin control.",
    ],
  },
  {
    version: "20.6",
    cambios: [
      "Los botones de volumen − y + ahora repiten al mantenerlos pulsados: un toque suelto da un paso, y si lo dejas apretado sigue subiendo o bajando solo, paso a paso. Antes había que dar un toque por cada 2%.",
    ],
  },
  {
    version: "20.5",
    cambios: [
      "El bloque que está sonando ahora late despacio con un halo dorado, para distinguirlo de un vistazo aunque estés mirando otro. Antes solo lo marcaba un ecualizador diminuto en una esquina que apenas se veía.",
      "El ecualizador pasa a estar debajo del nombre del bloque, centrado y al doble de tamaño.",
      'Corregido: al pulsar "Ir" en la barra de «Sonando ahora», la vista volvía sola al bloque anterior al segundo. Ahora se queda donde le dices.',
    ],
  },
  {
    version: "20.4",
    cambios: [
      "Las pistas y la cortinilla ya no se pierden al recargar: quedan guardadas dentro del navegador del ordenador que suena. Se eligen una vez y siguen ahí aunque cierres el navegador o reinicies el Mac.",
      "Como no se descargan de internet, la noche del evento la música no depende del wifi del local.",
      "Corregido: el mando no veía las pistas cargadas en el ordenador. El Mac ahora repite su estado cada 3 segundos y el mando lo pide nada más conectarse, así que ya da igual en qué orden se abran las dos ventanas.",
      "Si el mando todavía no ha recibido nada del ordenador, lo dice claramente en vez de mostrar una pantalla vacía que parece rota.",
    ],
  },
  {
    version: "20.3",
    cambios: [
      "Corregido: las ventanas emergentes (Música, Novedades, Logística, Cronograma) se veían diminutas al abrirlas desde el móvil, como si fueran la versión de escritorio. Les faltaba la etiqueta que le dice al teléfono que la página es para su pantalla.",
      "Mirar un bloque ya no corta la música: ahora \"el bloque que miras\" y \"el bloque que suena\" son cosas distintas. Puedes repasar los demás bloques con la música puesta, y volver al que sonaba sin que empiece desde cero.",
      "El bloque que está sonando se marca con un ecualizador animado, y si estás mirando otro aparece una barra que recuerda qué suena, con un toque para volver a él.",
    ],
  },
  {
    version: "20.2",
    cambios: [
      "Música del evento ahora tiene DOS formatos según el papel de cada aparato, en vez de uno solo para todo: el móvil (mando) va en una columna y con todo grande para el pulgar; el Mac (reproductor) pasa a puesto de control en dos columnas, más denso y con la lista completa de pistas a la vista para cargarlas de una sentada.",
      "La pantalla de elegir aparato es común a los dos: solo dos botones grandes, se acierta igual con el ratón que con el dedo.",
      "La gestión de archivos desaparece del móvil — las pistas se cargan en el ordenador que suena, que es donde tiene sentido.",
    ],
  },
  {
    version: "20.1",
    cambios: [
      'Música del evento, rehecha a tamaño de uso real: la primera versión salió con medidas de escritorio (letra diminuta, botones de volumen del tamaño de una letra). Ahora nada que se toque baja de 44px y ningún texto baja de 13px -- pensada para usarse de pie, en penumbra y con una sola mano.',
      "Los saltos (10s/30s/1min) pasan a estar siempre a la vista, en vez de escondidos tras un enlace minúsculo. Botones de volumen −/+ grandes y a lo ancho.",
    ],
  },
  {
    version: "20",
    cambios: [
      'Nueva ventana "Música del evento" (menú principal, junto a Novedades y Logística): una pista por cada bloque del cronograma, con los 9 botones, el reloj de estado y el reproductor.',
      "Mando a distancia desde el móvil: el Mac se declara como el aparato que suena (ese primer clic desbloquea el audio del navegador) y desde cualquier otro dispositivo se controla play/pausa, cambio de bloque, saltos y volumen sin acercarse al Mac.",
      "Control de volumen con pasos cortos y curva ajustada al oído, para que no haya subidas bruscas. Con botón de silencio rápido y cortinilla de transición entre bloques.",
      "PASO 1 de 4: falta probar el mando en vivo (Mac + móvil), guardar las pistas dentro del navegador y poder delegar el mando en un colaborador.",
    ],
  },
  {
    version: "19.4",
    cambios: [
      'Al crear una entrada nueva en Novedades, ahora nace como borrador (sin "Publicada" marcada) y con la etiqueta "NOVEDADES" ya puesta -- antes nacía publicada y como FAQ.',
    ],
  },
  {
    version: "19.3",
    cambios: [
      "Corregido de verdad (el intento anterior, v19.2, no bastó): imprimir la Lista de invitados solo sacaba una página (hasta donde cupiera), no la lista entera -- el modal que la contiene ya no se imprime con su recorte de pantalla, así que ahora pagina en tantas hojas como haga falta.",
    ],
  },
  {
    version: "19.2",
    cambios: [
      "Corregido: imprimir la Lista de invitados solo sacaba lo que se veía en pantalla en ese momento, no la lista entera -- la zona de impresión no escapaba del scroll de la ventana.",
    ],
  },
  {
    version: "19.1",
    cambios: [
      '"Cerrar sesión" y "Novedades", dentro de Mi cuenta, cambian del verde plano de antes al mismo estilo que el resto de botones de la app (degradado + contorno dorado), y de un ancho estirado a su ancho justo -- filosofía de la app: todo lo más compacto posible.',
    ],
  },
  {
    version: "19",
    cambios: [
      'La cabecera de la Portada queda con un único botón visible ("Mi cuenta") -- "Cerrar sesión" y el enlace a "Novedades" ahora viven dentro de ese mismo modal, como dos botones del mismo ancho exacto, en vez de ir apilados aparte.',
    ],
  },
  {
    version: "18.3",
    cambios: [
      "El contorno dorado de los botones baja de intensidad (más suave) para que resalten más el icono y la letra de dentro.",
    ],
  },
  {
    version: "18.2",
    cambios: [
      'Contorno dorado (igual que la letra) en "Cerrar sesión", "Abrir sección…" y cada fila de los menús desplegables -- antes era blanco translúcido.',
    ],
  },
  {
    version: "18.1",
    cambios: [
      "Aviso fijo en la pantalla de acceso al tablón: el apellido tiene que ser el familiar de la invitación, no cualquier otro apellido que la persona pueda tener.",
    ],
  },
  {
    version: "18",
    cambios: [
      'Botón "Deshacer" (vuelve a como estaba antes de tu último cambio, sin necesidad de guardar) en el cuerpo de cada novedad y en las plantillas de email.',
      'Historial de guardado en esos mismos dos textos: "Ver versiones anteriores" guarda las últimas 10 versiones de cada uno y deja restaurar cualquiera.',
      "Las plantillas de email ahora guardan al salir del campo, no en cada pulsación (necesario para que Deshacer y el historial tengan sentido).",
    ],
  },
  {
    version: "17",
    cambios: [
      'El acceso al tablón público deja de depender de una pregunta de sí/no compartida: ahora pide "Nombre y apellido tal como en tu invitación" y se comprueba contra los invitados confirmados de verdad (sin tildes ni mayúsculas, coma opcional).',
      "El propio anfitrión (información pública, cualquiera sabe que se casa) puede excluirse -- y excluir a quien haga falta -- de servir como respuesta válida, desde Lista de invitados.",
      "Si el mismo nombre entra desde varios dispositivos distintos, aparece como aviso en Novedades y en Logística -- nunca bloquea a nadie automáticamente.",
    ],
  },
  {
    version: "16.3",
    cambios: [
      "Cronograma pasa a ser una ventana de verdad del sistema operativo (como Novedades y Logística), independiente del navegador -- se abre desde Configuración → Cronograma.",
    ],
  },
  {
    version: "16.2",
    cambios: [
      '"Quién lo atiende" (Cronograma) ya se pliega por defecto -- primero eliges Interno (colaboradores/invitados con rol) o Externo, y si es Externo, si es "del local" o "contratado" (para bloques como la Cena, que cubre el propio restaurante, o el Baile, con un DJ contratado).',
    ],
  },
  {
    version: "16.1",
    cambios: [
      "Configuración → Cronograma, mucho más compacta: sin el párrafo explicativo de arriba, el nombre de cada bloque ya no sale duplicado (antes se veía una vez en el desplegable y otra vez en un campo para renombrar) y los minutos van justo al lado del desplegable, en la misma línea. La imagen queda mucho más arriba.",
    ],
  },
  {
    version: "16",
    cambios: [
      'Quien tiene permiso de "editar el texto de Novedades" ya puede marcar también "Publicada (visible en el tablón)" -- editar el texto lleva implícita la opción de publicarlo o no.',
      "El pie de la ventana Novedades (pregunta de acceso, enlace de WhatsApp, ocultar fecha) pasa a ser exclusivo del administrador -- ni siquiera se muestra a quien solo edita texto -- y queda plegado por defecto.",
    ],
  },
  {
    version: "15.1",
    cambios: [
      'Etiquetas en negrita ("Barrios:", "Mesa:", "Colab.:") en la invitación, con el resto del texto en letra normal -- "Mesa" gana también los dos puntos que le faltaban. El bloque entero se corre un poco más a la izquierda, y la hora sube ligeramente.',
    ],
  },
  {
    version: "15",
    cambios: [
      "Nueva casilla en Novedades: ocultar la fecha del evento en el tablón público, con carácter temporal -- no afecta a la portada, Datos evento ni a la invitación.",
      "La invitación usa ya la misma letra (sin negrita) en las 3 líneas de familia/mesa/colaborador y en fecha/hora/lugar -- antes eran distintas entre los dos recuadros.",
    ],
  },
  {
    version: "14",
    cambios: [
      'Ventana Invitaciones gana 3 casillas ("Imprimir: Fecha / Hora / Lugar") para poder quitar cualquiera de las tres de la imagen de invitación sin tener que vaciar esos datos en Configuración -- las 3 activas por defecto, la invitación se sigue viendo igual que siempre hasta que desmarques alguna.',
    ],
  },
  {
    version: "13.5",
    cambios: [
      "Ajustes finos de fecha/hora/lugar en la invitación: letra normal (menos gruesa), el bloque de texto un poco más a la izquierda, y el nombre del lugar + dirección subidos 20px.",
    ],
  },
  {
    version: "13.4",
    cambios: [
      "Fecha/hora/lugar en la invitación: se quita el fondo que tapaba el texto de ejemplo (a la espera de una plantilla nueva sin ese texto quemado) y se dejan los iconos originales de la plantilla tal cual, sin sustituirlos.",
    ],
  },
  {
    version: "13.3",
    cambios: [
      "Quitado el fondo sombreado detrás de las 3 líneas de familia/mesa/colaborador en la invitación -- sobresalía de las esquinas redondeadas del propio recuadro (que ya tiene su fondo crema). Ahora el texto va directamente sobre ese fondo.",
    ],
  },
  {
    version: "13.2",
    cambios: [
      "Las 3 líneas de la invitación (familia, mesa, colaborador) usan ya la misma letra y el mismo tamaño, con lo que el espacio entre ellas queda igualado solo. El conjunto sube ligeramente para encajar mejor en el recuadro.",
    ],
  },
  {
    version: "13.1",
    cambios: [
      'Arreglada la línea de colaborador en la invitación (se salía del recuadro): ahora usa la misma letra que la línea 1, dice "Colab." en vez de "Colaborador", y siempre cabe en una sola línea (se encoge un poco si hace falta, nunca salta a una segunda línea).',
    ],
  },
  {
    version: "13",
    cambios: [
      'Nueva línea en la imagen de invitación: "Colaborador: [nombre]", justo debajo de la mesa -- así el invitado sabe de antemano quién es la primera cara amiga que verá al llegar a Recepción.',
    ],
  },
  {
    version: "12",
    cambios: [
      "Cronograma: el bloque de Recepción ya no se asigna a mano -- lo cubren automáticamente los colaboradores que tienen invitados confirmados a su cargo. En el resto de bloques, ya se puede asignar también a invitados con rol de trabajo, no solo a colaboradores.",
      "Nuevo: marcar quién es el \"responsable\" de un rol de trabajo (una estrella junto al rol, en el mismo panel de Lista de invitados) -- uno solo por rol, el mismo para todo el evento sea cual sea el bloque.",
    ],
  },
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
            className="flex items-start gap-3 p-4 rounded"
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
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Versiones anteriores completas (resumidas):
          </p>
          <div className="space-y-2">
            {RESUMEN_VERSIONES_ANTERIORES.map((v) => (
              <div
                key={v.version}
                className="flex items-start gap-3 p-2 rounded"
                style={{ background: C.paperDark, opacity: OP.secundario }}
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
