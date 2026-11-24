// «De dónde venimos» (v73, él): las zonas de los confirmados en el tablón,
// como una noticia más. En orden ALFABÉTICO, no por cantidad: «no muestra
// favoritismo, es imparcial; el orden alfabético es universal». Cada zona
// tal como está escrita en la Lista (la raíz, norma 8): sin retocarla.
// Las cifras las da el servidor (tablon_zonas). Y, tocando una zona, sus
// familias (v99.9, él): solo nombre de pila y apellido, nada más de la ficha.
export const TITULO_ZONAS = "De dónde venimos";

export const tituloZonas = (evento) => String(evento?.zonasTablonTitulo || "").trim() || TITULO_ZONAS;

export function ordenarZonas(zonas = []) {
  return [...zonas].sort((a, b) => String(a.zona).localeCompare(String(b.zona), "es", { sensitivity: "base" }));
}

// Las familias de una zona, para cuando se toca (v99.9, él: boceto 2, «como
// la invitación»): «Abreu: Luis y Ana». Por apellido, en orden alfabético,
// como las zonas. Los nombres de cada una llegan ya en el orden de la
// invitación (resumen_zonas, en schema.sql). Vacío si el servidor aún no las
// manda: entonces la zona no se abre.
export function familiasDeZona(zona) {
  return (Array.isArray(zona?.familias) ? zona.familias : [])
    .map((f) => ({
      apellido: String(f?.apellido || "").trim(),
      nombres: (Array.isArray(f?.nombres) ? f.nombres : []).map((n) => String(n || "").trim()).filter(Boolean),
    }))
    .filter((f) => f.nombres.length > 0)
    .sort((a, b) => a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" }));
}

// De dos en dos, como se ven las zonas: la lista de familias se abre debajo
// de la línea de la zona tocada, a todo lo ancho.
export function deDosEnDos(lista = []) {
  const filas = [];
  for (let i = 0; i < lista.length; i += 2) filas.push(lista.slice(i, i + 2));
  return filas;
}

// Las líneas del pie van a trozos: los números son las cantidades, que se
// pintan en negrita (v84, él). Los de «de 0 a 4 años» son texto: no lo son.
// «67 confirmados · 7 zonas».
export function pieZonas(zonas = []) {
  const personas = zonas.reduce((suma, z) => suma + (Number(z.confirmados) || 0), 0);
  return [personas, ` ${personas === 1 ? "confirmado" : "confirmados"} · `, zonas.length, ` ${zonas.length === 1 ? "zona" : "zonas"}`];
}

// La zona que sale en verde en la vista previa, de ejemplo: en el tablón,
// cada invitado ve la suya. La de más confirmados.
export function zonaDeEjemplo(zonas = []) {
  return ordenarZonas(zonas).reduce((mayor, z) => (!mayor || Number(z.confirmados) > Number(mayor.confirmados) ? z : mayor), null)?.zona || "";
}

// Cuántos niños vienen, para los padres (v83.9, él). Solo en total y nunca
// por zona: en una zona pequeña, la cifra señalaría a un niño concreto. Sin
// la franja de 12 a 18 (él). Nada si el servidor aún no lo manda.
export function pieNinos(ninos) {
  if (!ninos) return [];
  return ["Niños de 0 a 4 años: ", Number(ninos.de0a4) || 0, " · de 5 a 11: ", Number(ninos.de5a11) || 0];
}
