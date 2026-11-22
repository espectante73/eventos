// El zoom del Plano de mesas y el tamaño de sus mesas (v94.1, él: «falta
// que se pueda hacer zoom o reducir» y «también zoom en las mesas»). Son dos
// cosas distintas, a propósito:
// - el ZOOM es solo para mirar de cerca: ni se guarda ni se imprime;
// - el TAMAÑO DE LAS MESAS se guarda en el evento (`tamanoMesasPlano`, en %)
//   y sale igual en el papel: es para que encajen en el dibujo del local
//   como en la realidad.

// Lo que mide una mesa del plano, con sus sillas, al 100 %: un 10 % del
// ancho del plano (v94, él: «ordenarla en el plano teniendo en cuenta cómo
// estarán las mesas en el local»). Crece y encoge con el plano, como el
// dibujo del local de fondo; en píxeles fijos, al agrandar la ventana el
// local crecía y la mesa no, y el plano engañaba. El 10 % sale de su dibujo.
export const ANCHO_MESA_PLANO = 10;

export const PASOS_ZOOM_PLANO = [100, 150, 200, 300];

export const TAMANO_MESAS = { minimo: 50, maximo: 200, paso: 10 };

const entre = (n, min, max) => Math.min(max, Math.max(min, n));

// El paso de zoom siguiente (+1) o anterior (-1); en los extremos, se queda.
export function zoomSiguiente(actual, direccion) {
  const i = PASOS_ZOOM_PLANO.indexOf(actual);
  const desde = i === -1 ? 0 : i;
  return PASOS_ZOOM_PLANO[entre(desde + direccion, 0, PASOS_ZOOM_PLANO.length - 1)];
}

// El tamaño guardado; sin guardar (o algo raro), el 100 %.
export function tamanoMesasDe(evento) {
  const n = Number(evento?.tamanoMesasPlano);
  if (!Number.isFinite(n) || n <= 0) return 100;
  return entre(Math.round(n), TAMANO_MESAS.minimo, TAMANO_MESAS.maximo);
}

export function tamanoMesasSiguiente(actual, direccion) {
  return entre(actual + direccion * TAMANO_MESAS.paso, TAMANO_MESAS.minimo, TAMANO_MESAS.maximo);
}

// El ancho de la mesa, en % del ancho del plano.
export function anchoMesaPlano(tamano) {
  return (ANCHO_MESA_PLANO * tamano) / 100;
}
