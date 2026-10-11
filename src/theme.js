// Paleta de colores y estilo base de los campos de texto — usado por
// prácticamente todos los componentes de la app. Vive en su propio módulo
// (en vez de en App.jsx) para que tanto App.jsx como los componentes bajo
// src/components/ puedan importarlo sin depender el uno del otro. Movido
// fuera de App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).

export const C = {
  paper: "#EFE9DE",
  paperDark: "#E4DCC9",
  ink: "#1F3A2E",
  wax: "#8C2F39",
  gold: "#B08D57",
  // C.gold es demasiado apagado sobre fondos oscuros (los botones/paneles
  // de cristal del repaso visual de 2026-08-12, fondo verde tinta) --
  // este dorado más claro se lee mucho mejor ahí. C.gold se queda para
  // fondos claros (el uso original, mayoritario en la app).
  goldClaro: "#D9B778",
  // El champán de los marcos de foto (Aniversarios y el formulario del
  // colaborador). Vivía dentro de HuecoFoto.jsx, que es un componente:
  // ningún otro sitio podía usarlo sin copiarlo a mano. Subido a la
  // paleta el 2026-09-23, cuando el mapa lo necesitó.
  champan: "#E8D5AE",
  champanHondo: "#D6BE8F",
  // Dorado más claro que el de la ficha del colaborador, para que una
  // pastilla de dato (importe, zona) se despegue del fondo. Estaba
  // escrito a mano dentro del importe; al pedir el usuario una segunda
  // pastilla igual (la zona, 2026-09-24) habría que copiarlo, que es
  // justo como derivaron los rojos.
  champanClaro: "#F2DFAE",
  charcoal: "#2B2620",
  line: "#C9BFA9",
  // Rojo de aviso/peligro y su fondo suave a juego — centralizados el
  // 2026-08-24 (examen honesto del código, a petición del usuario):
  // antes cada sitio llevaba su propio "#B00020"/"#FBEAEC" copiado a
  // mano, y ya había una desviación real sin querer (VentanaMesas.jsx
  // usaba "#FBEAEA", un carácter distinto, visualmente idéntico) --
  // prueba de que copiar hexadecimales a mano deriva solo con el tiempo.
  peligro: "#B00020",
  avisoFondo: "#FBEAEC",
  // El reposo del latido de una ficha incompleta (.ficha-incompleta, en
  // index.css), un poco más rojo que avisoFondo.
  incompletaFondo: "#F9DADF",

  // ---- Subidos aquí en v62.7 (él: «aspecto más profesional»): estaban
  // escritos a mano en las pantallas, con el MISMO valor. ----
  blanco: "#FFFFFF",
  negro: "#000000",
  // El verde del final del degradado de los paneles oscuros (Portada,
  // Progreso, login, tablón) y el oliva del fondo de la Portada sin foto.
  verdeHondo: "#24402F",
  oliva: "#5C6B3F",
  // «Todo bien» y «cuidado», en suave: mesa con sitio o llena, balance
  // positivo o negativo, dinero recogido.
  okFondo: "#E3E9AE",
  cuidadoFondo: "#F0D3C8",
  // Un aviso que solo informa (el email cambiado de un colaborador).
  infoFondo: "#EAF2EC",
  // El fondo del total en el acuse de recibo.
  waxSuave: "#F0D9CE",
  // El icono de imagen sobre el champán de los marcos de foto.
  champanTinta: "#7A5C24",
  // El papel del plano de mesas.
  papelPlano: "#F7F4EA",
  // El control de llegadas abierto, en vivo.
  enVivo: "#7FC99A",
  // El verde de WhatsApp: es su marca, así se reconoce el botón.
  whatsapp: "#25D366",
  // El modo de calibrar la invitación: magenta, para que no se confunda
  // con nada de la plantilla.
  calibracion: "#C2006B",
  calibracionLinea: "#DC0078",
  calibracionFondo: "#FDECF3",
};

// Un color de la paleta, transparente: conAlfa(C.ink, 0.07) es el verde de
// la app al 7 %. Así un tono translúcido sigue saliendo de la paleta.
export function conAlfa(hex, alfa) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

// El dedo: lo mínimo para acertarle con él (44, como piden Apple y Google).
export const DEDO = 44;

// El velo detrás de lo que se abre encima (él, v63.5): una ventana que hay
// que atender o un menú desplegado. El marfil de la app, translúcido y
// esmerilado: aclara el fondo en vez de oscurecerlo.
export const VELO = {
  background: conAlfa(C.paper, 0.55),
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};

// El degradado verde de los paneles oscuros, escrito igual en cuatro sitios.
export const FONDO_VERDE = `linear-gradient(180deg, ${C.ink} 0%, ${C.verdeHondo} 100%)`;

// Los grises de lo que se imprime en una hoja en blanco (las listas de
// acomodadores): filas y columnas alternas, flojos para no gastar tinta.
export const IMPRESION = {
  fila: "#F2F2F2",
  columna: "#F8F8F8",
  columnaEnFila: "#EAEAEA",
};

// ---------- La escala del acabado (2026-09-20) ----------
//
// El usuario, después de la v37.13: "la app debe tener un aspecto más
// refinado en sus acabados, mismo aspecto general y estandarizado".
//
// Al medirlo salió que el estilo estaba bien elegido, pero los VALORES
// se habían escrito uno a uno y habían derivado: 13 tamaños de letra
// distintos (8, 10, 11, 12, 13, 14, 15, 17, 18, 20, 22, 26), 5
// redondeos de esquina, 9 opacidades para el texto secundario y 8
// sombras a mano. Ninguno se ve mal por separado; sumados son lo que
// hace que algo parezca "casi terminado" en vez de terminado. Es el
// mismo problema que ya había pasado con los rojos copiados a mano
// (ver C.peligro, arriba).
//
// Desde aquí NO se escribe un número suelto: se elige de estas tablas.
// Si hace falta un valor que no está, la pregunta correcta es si de
// verdad hace falta -- y si lo hace, se añade AQUÍ, no en el sitio.

// Tamaños de letra. Cinco de texto y uno aparte para las cifras
// grandes de los paneles de resumen.
export const T = {
  micro: 10, // marcas dentro de miniaturas y fichas de mesa
  pequeno: 12, // texto secundario, etiquetas
  normal: 14, // el cuerpo de la app
  destacado: 18, // el dato que manda en una tarjeta
  titulo: 22, // títulos de ventana, números de mesa
  cifra: 26, // solo los totales grandes del resumen
};

// Redondeos. Dos: recto-con-canto-suave y redondo del todo.
export const R = {
  caja: 4,
  redondo: 9999,
};

// Sombras. Tres, y el relieve de lo que se pulsa vive aparte, en
// .boton-3d de index.css.
export const S = {
  sutil: "0 1px 2px rgba(31, 25, 15, 0.18)",
  flotante: "0 8px 30px rgba(0, 0, 0, 0.12)",
  // La misma, para paneles de fondo oscuro (Música, Portada).
  flotanteOscura: "0 8px 30px rgba(0, 0, 0, 0.35)",
};

// Cuánto se apaga lo que no es el protagonista. Dos tonos para el
// texto secundario, uno para lo que está desactivado o no aplica, y uno
// para líneas y separadores (que no son texto).
export const OP = {
  secundario: 0.7,
  tenue: 0.5,
  apagado: 0.35, // botón deshabilitado, icono que no aplica
  linea: 0.3,
};

// El dorado metálico de las fichas: el formulario del colaborador y las
// miniaturas de Aniversarios. El fondo, el relieve y la versión con
// sombra estaban escritos a mano en los DOS sitios, idénticos.
export const DORADO = {
  fondo: "linear-gradient(135deg, #B8893F 0%, #E6C77F 38%, #D4AE5E 62%, #A97D34 100%)",
  relieve: "inset 0 1px 0 rgba(255,244,214,0.55), inset 0 -1px 0 rgba(90,62,20,0.35)",
  relieveFlotante:
    "inset 0 1px 0 rgba(255,244,214,0.55), inset 0 -1px 0 rgba(90,62,20,0.35), 0 2px 6px rgba(0,0,0,0.35)",
};

export const inputStyle = {
  background: C.blanco,
  border: `1px solid ${C.line}`,
  borderRadius: R.caja,
  padding: "6px 9px",
  color: C.charcoal,
  fontFamily: "'Inter', sans-serif",
  fontSize: T.normal,
};
