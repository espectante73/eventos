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

export const inputStyle = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: R.caja,
  padding: "6px 9px",
  color: C.charcoal,
  fontFamily: "'Inter', sans-serif",
  fontSize: T.normal,
};
