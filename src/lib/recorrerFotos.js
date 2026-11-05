// Pasar por las fotos en grande sin cerrar (él, v82.2: «es un lío abrir y
// cerrar»): con ← → o ‹ ›, por la lista de la columna abierta. Al llegar a la
// última vuelve a la primera.

// La de al lado (paso 1 o -1). Si la abierta ya no está en la lista (otro
// filtro, o se quitó su foto), empieza por un extremo.
export function vecina(lista, esLaAbierta, paso) {
  if (!lista.length) return null;
  const i = lista.findIndex(esLaAbierta);
  if (i < 0) return lista[paso > 0 ? 0 : lista.length - 1];
  return lista[(i + paso + lista.length) % lista.length];
}

// «3 de 48», o null si la abierta no está en la lista.
export function posicion(lista, esLaAbierta) {
  const i = lista.findIndex(esLaAbierta);
  return i < 0 ? null : { n: i + 1, de: lista.length };
}

// En Boda se sigue viendo la misma versión (original o con plantilla) si la
// siguiente la tiene; si no, la que tenga.
export function versionDeBoda(preferida, { original, final }) {
  if (preferida === "final") return final ? "final" : "original";
  return original ? "original" : "final";
}
