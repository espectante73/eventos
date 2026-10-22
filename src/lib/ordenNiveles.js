// Ordenar una lista por niveles, como en una hoja de cálculo (él, v72.5):
// el primer título que se toca manda y el siguiente ordena dentro de él
// («por Zona y, dentro de cada zona, por Familia»). Antes cada título
// borraba el anterior: ordenar por Familia deshacía el orden por Zona.
export const MAX_NIVELES = 3;

// Tocar un título: si no estaba, entra como siguiente nivel (▲); si estaba
// en ▲, pasa a ▼; si estaba en ▼, se quita y los de debajo suben. Con los
// tres niveles puestos, uno nuevo sustituye al último.
export function tocarTitulo(niveles, columna) {
  const i = niveles.findIndex((n) => n.columna === columna);
  if (i === -1) {
    const nuevo = { columna, direccion: "asc" };
    return niveles.length < MAX_NIVELES ? [...niveles, nuevo] : [...niveles.slice(0, MAX_NIVELES - 1), nuevo];
  }
  if (niveles[i].direccion === "asc") return niveles.map((n, j) => (j === i ? { ...n, direccion: "desc" } : n));
  return niveles.filter((_, j) => j !== i);
}

const comparar = (va, vb) =>
  typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");

// Compara dos filas nivel a nivel (`valorDe(fila, columna)`); si empatan en
// todos, decide `desempate`.
export function compararPorNiveles(niveles, valorDe, desempate) {
  return (a, b) => {
    for (const { columna, direccion } of niveles) {
      const r = comparar(valorDe(a, columna), valorDe(b, columna));
      if (r !== 0) return direccion === "desc" ? -r : r;
    }
    return desempate(a, b);
  };
}
