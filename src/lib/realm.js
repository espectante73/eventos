// ⚠️ De qué VENTANA es un trozo de pantalla. Fallo real (2026-09-05): al
// llevar la Lista de invitados a una ventana propia del sistema, el botón
// "Acciones" dejó de hacer nada -- el panel se pintaba con un portal a
// `document.body`, y ese `document` es el de la PESTAÑA PRINCIPAL, no el
// de la ventana emergente, así que aparecía en la otra ventana, detrás.
// Igual con `window.innerWidth/innerHeight` (medidas de la pantalla
// equivocada) y con los escuchadores del ratón y del teclado: dentro de la
// Lista, las ventanas flotantes no se dejaban arrastrar (él, v80.1).
//
// En vez de pasar la ventana como prop por toda la app, se deduce del
// propio nodo: `ownerDocument` siempre es el documento donde ESE nodo
// vive. Así funciona en cualquier ventana sin que quien lo use tenga que
// enterarse. Lo usan MenuFlotante y VentanaFlotante.
export function realmDe(nodo) {
  const doc = nodo?.ownerDocument || document;
  return { doc, win: doc.defaultView || window };
}
