// Cronograma del día del evento: cálculo de las horas absolutas a partir
// de una hora de inicio + la duración (en minutos) de cada bloque, y el
// dibujo de la imagen final sobre <canvas> -- sustituye a la imagen que
// antes subía el anfitrión a mano (Configuración → Cronograma). Diseño
// validado con el usuario a base de varias rondas de pruebas visuales
// antes de construirlo, 2026-08-27: ancho de cada bloque proporcional a
// su duración, altura homogénea en todas las filas, hora en la esquina
// superior izquierda (marca el INICIO del tramo), etiqueta centrada de
// verdad, chevron abierto (no un triángulo relleno) cerca del borde
// derecho.
//
// Segundo ajuste, mismo día: en vez de escribir la hora exacta de cada
// bloque a mano (y tener que recalcular todas las siguientes si cambia
// una), cada bloque solo guarda cuántos MINUTOS dura -- la hora de cada
// uno se calcula sola sumando las duraciones anteriores a la hora de
// inicio del cronograma. Cambiar un solo bloque desplaza automáticamente
// todos los que van después, sin tocarlos a mano.
import { C } from "../theme";

// Agrupación en filas -- fija a propósito (la interfaz de edición tiene
// siempre 9 bloques, nunca se añaden ni se quitan desde ahí) igual que
// la imagen original que sirvió de referencia.
const FILAS = [4, 3, 2];

function sumarMinutos(horaBase, minutos) {
  const [h, m] = String(horaBase || "0:00").split(":").map(Number);
  let total = ((h || 0) * 60 + (m || 0) + minutos) % (24 * 60);
  if (total < 0) total += 24 * 60;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Hora absoluta de INICIO de cada bloque -- nunca se escribe a mano, se
// calcula sola sumando las duraciones de todos los bloques anteriores a
// la hora de inicio del cronograma entero.
export function calcularHorasAbsolutas(horaInicio, bloques) {
  const horas = [];
  let acumulado = 0;
  bloques.forEach((b) => {
    horas.push(sumarMinutos(horaInicio, acumulado));
    acumulado += Number(b.duracionMin) || 0;
  });
  return horas;
}

function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function partirEnLineas(ctx, texto, maxWidth) {
  const palabras = texto.split(" ");
  const lineas = [];
  let actual = "";
  palabras.forEach((p) => {
    const prueba = actual ? actual + " " + p : p;
    if (ctx.measureText(prueba).width > maxWidth && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  });
  if (actual) lineas.push(actual);
  return lineas;
}

const FONT_HORA = "bold 20px sans-serif";
const FONT_TEXTO = "15px sans-serif";
const ALTURA_FILA = 82;
const MARGEN = 14;
const GAP = 8;
const ANCHO = 720;

function dibujarBloque(ctx, x, y, w, h, hora, lineasTexto) {
  redondeado(ctx, x, y, w, h, 14);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.gold;
  ctx.stroke();

  // Hora en la esquina superior izquierda -- marca el inicio del tramo,
  // no un dato genérico flotando en el centro.
  ctx.fillStyle = C.goldClaro;
  ctx.font = FONT_HORA;
  ctx.textAlign = "left";
  ctx.fillText(hora, x + 12, y + 22);

  // Etiqueta SIEMPRE centrada (vertical y horizontal) en el recuadro
  // entero, sin importar dónde está la hora.
  ctx.textAlign = "center";
  ctx.font = FONT_TEXTO;
  const lineHeight = 14;
  const yInicio = y + h / 2 - ((lineasTexto.length - 1) * lineHeight) / 2 + 5;
  lineasTexto.forEach((linea, i) => {
    ctx.fillText(linea, x + w / 2, yInicio + i * lineHeight);
  });

  // Chevron abierto (">"), no un triángulo relleno, cerca del borde derecho.
  if (w > 60) {
    const cx = x + w - 10;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 11);
    ctx.lineTo(cx + 3, cy);
    ctx.lineTo(cx - 3, cy + 11);
    ctx.strokeStyle = C.goldClaro;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

// Devuelve un data URL (PNG) con el cronograma dibujado -- síncrono, sin
// depender de ninguna fuente externa (usa la fuente del sistema, no
// Fraunces/IBM Plex, para no tener que precargar nada).
export function generarImagenCronograma(horaInicio, bloques) {
  const horas = calcularHorasAbsolutas(horaInicio, bloques);
  const conDatos = bloques.map((b, i) => ({
    ...b,
    hora: horas[i],
    duracion: Math.max(1, Number(b.duracionMin) || 1),
  }));

  // Agrupación en filas defensiva: si algún día hay un número de bloques
  // distinto de 9, se reparte en filas de 4 en vez de fallar.
  const filas = [];
  let cursor = 0;
  const patron = conDatos.length === FILAS.reduce((s, n) => s + n, 0) ? FILAS : null;
  if (patron) {
    patron.forEach((n) => {
      filas.push(conDatos.slice(cursor, cursor + n));
      cursor += n;
    });
  } else {
    while (cursor < conDatos.length) {
      filas.push(conDatos.slice(cursor, cursor + 4));
      cursor += 4;
    }
  }

  const alto = MARGEN * 2 + filas.length * ALTURA_FILA + (filas.length - 1) * GAP;
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, alto);

  let y = MARGEN;
  filas.forEach((fila) => {
    const anchoDisponible = ANCHO - MARGEN * 2 - GAP * (fila.length - 1);
    const totalDuracion = fila.reduce((s, b) => s + b.duracion, 0);
    let x = MARGEN;
    fila.forEach((b) => {
      const w = (b.duracion / totalDuracion) * anchoDisponible;
      ctx.font = FONT_TEXTO;
      const lineas = partirEnLineas(ctx, b.texto || "", w - 8);
      dibujarBloque(ctx, x, y, w, ALTURA_FILA, b.hora, lineas);
      x += w + GAP;
    });
    y += ALTURA_FILA + GAP;
  });

  return canvas.toDataURL("image/png");
}
