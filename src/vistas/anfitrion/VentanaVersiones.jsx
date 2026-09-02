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
