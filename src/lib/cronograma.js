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
import { mismaPersona } from "./edicionInvitados";


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

// ---------- Quién puede atender un bloque ----------
//
// Son DOS listas que se solapan: los colaboradores y los invitados con
// algún rol de trabajo (acomodador, etc.). Un colaborador casi siempre es
// también invitado, así que quien era las dos cosas salía dos veces. Lo
// cazó él el 2026-09-24: "tiene los nombres duplicados cuando son
// acomodadores".
//
// Aquí se juntan en una sola fila por persona. El id que manda es el del
// COLABORADOR, porque es el que los bloques ya venían guardando; el del
// invitado se queda de alias, para que lo guardado antes de juntarlos
// siga saliendo marcado.
// El colaborador guarda su nombre en UN solo campo ("Barrios, Jacob") y
// el invitado lo tiene en dos. Se parte por la coma para poder
// preguntárselo a `mismaPersona`, que es quien decide en toda la app si
// dos personas son la misma (nombre y apellido, sin mirar mayúsculas ni
// tildes). Sin coma no se adivina nada: se deja el apellido vacío, que
// no casará con nadie.
function fichaDelColaborador(colaborador) {
  const partes = String(colaborador?.nombre || "").split(",");
  return partes.length > 1
    ? { apellido: partes[0], nombre: partes.slice(1).join(" ") }
    : { nombre: partes[0] || "", apellido: "" };
}

export function personasAsignables(colaboradores, invitadosConRol, responsablesRol = {}) {
  const etiquetaRoles = (g) =>
    (g.rolesTrabajo || []).map((r) => (responsablesRol[r] === g.id ? `★ ${r}` : r));

  const yaListados = new Set();
  const personas = (colaboradores || []).map((c) => {
    // El enlace explícito manda, pero casi ningún colaborador lo tiene:
    // se crean escribiendo el nombre, no eligiendo una ficha de invitado.
    // Por eso hay segundo camino, por nombre y apellido (él, 2026-09-24:
    // los mismos cinco seguían duplicados después del primer arreglo).
    const conRol = invitadosConRol || [];
    const comoInvitado =
      (c.invitadoId ? conRol.find((g) => g.id === c.invitadoId) : null) ||
      conRol.find((g) => mismaPersona(fichaDelColaborador(c), g));
    if (comoInvitado) yaListados.add(comoInvitado.id);
    return {
      id: c.id,
      nombre: c.nombre,
      roles: comoInvitado ? etiquetaRoles(comoInvitado) : [],
      alias: comoInvitado ? [comoInvitado.id] : [],
    };
  });

  for (const g of invitadosConRol || []) {
    if (yaListados.has(g.id)) continue;
    personas.push({ id: g.id, nombre: g.nombre, roles: etiquetaRoles(g), alias: [] });
  }
  return personas;
}

export function estaAsignada(asignados, persona) {
  const actuales = Array.isArray(asignados) ? asignados : [];
  return actuales.some((id) => id === persona.id || (persona.alias || []).includes(id));
}

// Marcar o desmarcar a una persona. Al marcarla se queda SOLO su id
// principal: si ese bloque traía guardado el id de invitado de cuando
// eran dos filas, se sustituye en vez de dejar los dos dentro.
export function alternarPersonaAsignada(asignados, persona) {
  const actuales = Array.isArray(asignados) ? asignados : [];
  const suyos = [persona.id, ...(persona.alias || [])];
  const sinEsaPersona = actuales.filter((id) => !suyos.includes(id));
  return estaAsignada(actuales, persona) ? sinEsaPersona : [...sinEsaPersona, persona.id];
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

// Ancho mínimo de un recuadro: lo que necesita la hora ("23:10") para
// poder leerse. Por debajo de eso el recuadro ya no explica nada.
const ANCHO_MINIMO = 58;

// Reparto de los bloques en filas con UNA SOLA escala de minutos para
// todo el cronograma.
//
// ⚠️ Antes el ancho se repartía DENTRO de cada fila: cada fila se
// estiraba hasta ocupar el ancho entero, así que un bloque corto que
// cayera solo en su fila salía enorme. Lo cazó él el 2026-09-24 con una
// captura: "Final apenas son unos minutos y se ve más grande que Baile,
// que es lo que más dura". La proporcionalidad era la petición original
// del diseño (2026-08-27) y solo se cumplía dentro de una misma fila.
//
// Ahora el minuto vale lo mismo en todo el dibujo: la escala sale del
// bloque más largo, que es el que ocupa una fila entera, y los demás se
// miden contra él. Las filas quedan desiguales por la derecha, y eso es
// justo lo que deja ver de un vistazo cuál dura más.
export function repartirEnFilas(bloques, anchoUtil, gap = GAP, minimo = ANCHO_MINIMO) {
  const duracionMax = Math.max(1, ...bloques.map((b) => b.duracion));
  const porMinuto = anchoUtil / duracionMax;
  const conAncho = bloques.map((b) => ({
    ...b,
    ancho: Math.min(anchoUtil, Math.max(minimo, b.duracion * porMinuto)),
  }));

  const filas = [];
  let fila = [];
  let usado = 0;
  for (const b of conAncho) {
    if (fila.length && usado + gap + b.ancho > anchoUtil) {
      filas.push(fila);
      fila = [];
      usado = 0;
    }
    usado += (fila.length ? gap : 0) + b.ancho;
    fila.push(b);
  }
  if (fila.length) filas.push(fila);
  return filas;
}

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

  const filas = repartirEnFilas(conDatos, ANCHO - MARGEN * 2);

  const alto = MARGEN * 2 + filas.length * ALTURA_FILA + (filas.length - 1) * GAP;
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, alto);

  let y = MARGEN;
  filas.forEach((fila) => {
    let x = MARGEN;
    fila.forEach((b) => {
      ctx.font = FONT_TEXTO;
      const lineas = partirEnLineas(ctx, b.texto || "", b.ancho - 8);
      dibujarBloque(ctx, x, y, b.ancho, ALTURA_FILA, b.hora, lineas);
      x += b.ancho + GAP;
    });
    y += ALTURA_FILA + GAP;
  });

  return canvas.toDataURL("image/png");
}
