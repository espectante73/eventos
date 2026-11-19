// La página del DJ (él, v81): lo que llega de la base (dj_canciones) hecho
// lista, y sus filtros. La lista es la misma que ve el anfitrión
// (cancionesPedidas): una fila por petición, sin nombres.
import { cancionesPedidas } from "./canciones";
import { contiene } from "./formato";
import { calcularEdad } from "./invitados";
import { cancionesDistintas, duracionTotal, textoDuracion } from "./repasoCanciones";

// Lo que llega de la base: { peticiones: [{ cancion, edad }], catalogo, … }.
export function filasDelDj(datos) {
  const peticiones = (datos?.peticiones || []).map((p, i) => ({ id: `p${i}`, cancion: p.cancion, edad: p.edad ?? null }));
  // Las que el anfitrión dejó fuera (v84.3) no llegan a la lista, y con ellas
  // tampoco a lo que el DJ imprima o exporte, ni a la duración.
  const fuera = new Set(datos?.fuera || []);
  return cancionesPedidas(peticiones, (p) => p.edad).filter((f) => !fuera.has(f.clave));
}

// Por canción o artista (sin mayúsculas ni tildes) y por un tramo de edad.
// Con un tramo puesto, las que no tienen edad quedan fuera.
export function filtrarPeticiones(filas, { texto = "", desde = "", hasta = "" } = {}) {
  const min = desde === "" ? null : Number(desde);
  const max = hasta === "" ? null : Number(hasta);
  return filas.filter((f) => {
    if (texto.trim() && !contiene(f.cancion, texto)) return false;
    if (min === null && max === null) return true;
    if (f.edad === null) return false;
    return (min === null || f.edad >= min) && (max === null || f.edad <= max);
  });
}

// Por qué no entra, en sencillo (norma 13: qué pudo fallar y qué no importa).
export const MOTIVOS_DJ = {
  clave: "Esa clave no es. Son 5 letras y números; dan igual las mayúsculas.",
  bloqueado: "Demasiadas claves equivocadas. Pide al anfitrión un enlace nuevo.",
  enlace: "Este enlace ya no vale. Pide al anfitrión uno nuevo.",
};

// Lo mismo que trae la base (colaborador_canciones_dj), sacado de los datos
// del anfitrión: su vista previa de la ventana del DJ con «Cambiar vista»
// (v91.5). Todos los que piden canción, como en la base.
export function datosDjDesdeLista(invitados = [], evento = {}) {
  return {
    evento: evento?.nombre || "",
    catalogo: evento?.catalogoCanciones || {},
    fuera: evento?.cancionesFueraDj || [],
    peticiones: invitados
      .filter((g) => String(g.cancion || "").trim())
      .map((g) => ({ cancion: g.cancion, edad: calcularEdad(g.anioNacimiento, evento) })),
  };
}

// Las cifras de arriba: peticiones, canciones distintas y cuánto duran (con
// «≈» si alguna no tiene su duración de Deezer). La página del enlace y la
// ventana de la cuenta del DJ dicen lo mismo (norma 7).
export function cifrasDelDj(datos) {
  const todas = filasDelDj(datos);
  const distintas = cancionesDistintas(todas);
  const { segundos, estimadas } = duracionTotal(distintas, datos?.catalogo || {});
  return [
    { label: "Peticiones", value: todas.length },
    { label: "Distintas", value: distintas.length },
    { label: "Duración", value: `${estimadas ? "≈ " : ""}${textoDuracion(segundos)}` },
  ];
}

// ---------- Canciones nuevas o cambiadas (él, v92) ----------
// Sin esperar a que nadie pulse nada («se puede despistar»): la app recuerda
// la lista que el DJ vio por última vez y, cada día, compara con la última
// que vio UN DÍA ANTERIOR. Así lo nuevo sigue marcado todo el día aunque
// abra varias veces, y lo que llega cuando ya no mira le sale al día
// siguiente: no se le escapa nada. Se compara QUÉ canciones hay, no
// cuántas: cambiar una por otra deja el número igual. Una canción es la
// misma por su clave (claveCancion: el título sin mayúsculas ni tildes);
// una cambiada sale como nueva, porque la lista no dice de quién es.
// Se recuerda en cada aparato (sin SQL): si lo ve en el móvil y luego abre
// el ordenador, ahí le vuelve a salir. Sobra algún aviso, nunca falta.

// Las canciones distintas de su lista, por su clave.
export const clavesDelDj = (datos) => [...new Set(filasDelDj(datos).map((f) => f.clave))].sort();

// «2026-11-19», en la hora de este aparato.
export function diaDe(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// Con qué se compara hoy, y de qué día es. La primera vez de todas, con lo
// que hay: nada sale como nuevo.
// `memoria`: { dia, desde, referencia, ultima } (ver memoriaCancionesDj).
export function referenciaCancionesDj(memoria, dia, claves) {
  if (!memoria?.dia) return { referencia: claves, desde: dia };
  if (memoria.dia === dia) return { referencia: memoria.referencia || [], desde: memoria.desde || dia };
  return { referencia: memoria.ultima || [], desde: memoria.dia };
}

// Lo que se recuerda tras verla hoy: con qué se compara y lo último que vio.
export function memoriaCancionesDj(memoria, dia, claves) {
  return { dia, ...referenciaCancionesDj(memoria, dia, claves), ultima: claves };
}

// Las claves de las que no estaban en la referencia.
export const clavesNuevas = (claves, referencia) => new Set(claves.filter((c) => !referencia.includes(c)));

// «5 canciones nuevas o cambiadas desde el 18 nov» / «… hoy».
export function textoCancionesNuevas(n, desde, hoy = diaDe()) {
  const cuantas = n === 1 ? "1 canción nueva o cambiada" : `${n} canciones nuevas o cambiadas`;
  if (!desde || desde === hoy) return `${cuantas} hoy`;
  const [a, m, d] = desde.split("-").map(Number);
  return `${cuantas} desde el ${new Date(a, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
}

// En la memoria de este aparato, una por persona (el anfitrión que mira con
// «Cambiar vista» no pisa la del DJ). Sin memoria (modo privado), no hay
// aviso: nada sale como nuevo.
const claveMemoria = (quien) => `canciones-dj-vistas-${quien || "yo"}`;
export function leerMemoriaDj(quien) {
  try {
    const texto = window.localStorage.getItem(claveMemoria(quien));
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}
export function guardarMemoriaDj(quien, memoria) {
  try {
    window.localStorage.setItem(claveMemoria(quien), JSON.stringify(memoria));
  } catch {
    // Sin memoria en este aparato: la próxima vez, como la primera.
  }
}
