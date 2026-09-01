// Curva de volumen ajustada al oído, para "Música del evento".
//
// El volumen que entiende el navegador (`audio.volume`) es LINEAL: 0.5
// es literalmente la mitad de amplitud. Pero el oído humano no funciona
// así -- con pasos iguales sobre esa escala, la zona baja del recorrido
// pega saltos enormes y la zona alta apenas se nota. A petición del
// usuario (2026-08-31): "que los pasos de subida sean cortos para que
// no haya una subida brusca de volumen".
//
// Solución: la persona mueve un porcentaje del 0 al 100 (escala
// perceptual, pasos regulares al oído) y aquí se convierte a lo que el
// navegador necesita, elevándolo al cubo -- la aproximación clásica de
// "audio taper". Con eso, subir 2 puntos suena igual de grande al 20%
// que al 90%, y el 0 sigue siendo silencio real.
const EXPONENTE = 3;

// Paso corto a propósito (2%): 50 posiciones en todo el recorrido, para
// poder afinar sin saltos -- ver el comentario de arriba.
export const PASO_VOLUMEN = 2;

export function porcentajeAVolumen(porcentaje) {
  const p = Math.min(100, Math.max(0, Number(porcentaje) || 0));
  return Math.pow(p / 100, EXPONENTE);
}

// La inversa: solo hace falta si algún día hay que partir de un
// `audio.volume` ya puesto y mostrar el porcentaje correspondiente.
export function volumenAPorcentaje(volumen) {
  const v = Math.min(1, Math.max(0, Number(volumen) || 0));
  return Math.round(Math.pow(v, 1 / EXPONENTE) * 100);
}

// Sube o baja un paso, sin salirse de 0-100.
export function ajustarPorcentaje(porcentaje, pasos) {
  const siguiente = (Number(porcentaje) || 0) + pasos * PASO_VOLUMEN;
  return Math.min(100, Math.max(0, siguiente));
}

// ---------- Fundido cruzado entre bloques ----------
// Cuánto dura el solape de dos pistas al cambiar de bloque. Se ajusta a
// la cortinilla si la hay: la idea es que la cortinilla quepa ENTERA
// dentro del cruce, que para eso está -- antes la pista se cortaba en
// seco y la cortinilla entraba sobre un silencio, que era justo la
// pausa incómoda que se quería evitar (2026-09-01).
//
// Topes: por debajo de 1,5s el cruce no se percibe como tal, y por
// encima de 6s las dos pistas conviven demasiado tiempo y se emborrona
// todo. Sin cortinilla (o con una duración que el navegador todavía no
// sabe: `undefined`, NaN, Infinity) se usa un valor medio.
export const CRUCE_POR_DEFECTO = 2500;
export const CRUCE_MINIMO = 1500;
export const CRUCE_MAXIMO = 6000;

export function duracionCruce(segundosCortinilla) {
  const ms = Number(segundosCortinilla) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return CRUCE_POR_DEFECTO;
  return Math.min(CRUCE_MAXIMO, Math.max(CRUCE_MINIMO, ms));
}
