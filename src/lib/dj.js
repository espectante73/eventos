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
