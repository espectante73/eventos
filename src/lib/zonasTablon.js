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
