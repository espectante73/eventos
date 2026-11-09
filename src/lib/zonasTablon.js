// «De dónde venimos» (v73, él): las zonas de los confirmados en el tablón,
// como una noticia más. En orden ALFABÉTICO, no por cantidad: «no muestra
// favoritismo, es imparcial; el orden alfabético es universal». Cada zona
// tal como está escrita en la Lista (la raíz, norma 8): sin retocarla.
// Las cifras las da el servidor (tablon_zonas): nunca nombres.
export const TITULO_ZONAS = "De dónde venimos";

export const tituloZonas = (evento) => String(evento?.zonasTablonTitulo || "").trim() || TITULO_ZONAS;

export function ordenarZonas(zonas = []) {
  return [...zonas].sort((a, b) => String(a.zona).localeCompare(String(b.zona), "es", { sensitivity: "base" }));
}

// El pie: «67 confirmados · 7 zonas».
export function pieZonas(zonas = []) {
  const personas = zonas.reduce((suma, z) => suma + (Number(z.confirmados) || 0), 0);
  return `${personas} ${personas === 1 ? "confirmado" : "confirmados"} · ${zonas.length} ${zonas.length === 1 ? "zona" : "zonas"}`;
}

// Cuántos niños vienen, para los padres (v83.9, él). Solo en total y nunca
// por zona: en una zona pequeña, la cifra señalaría a un niño concreto. Sin
// la franja de 12 a 18 (él). Vacío si el servidor aún no lo manda.
export function pieNinos(ninos) {
  if (!ninos) return "";
  return `Niños de 0 a 4 años: ${Number(ninos.de0a4) || 0} · de 5 a 11: ${Number(ninos.de5a11) || 0}`;
}
