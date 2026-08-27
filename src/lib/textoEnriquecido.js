// Utilidad compartida para los botones de negrita/cursiva/subrayado de
// cualquier <textarea> con HTML sencillo (mismo criterio ya usado en
// Novedades y en las plantillas de email de Configuración: <b>/<i>/<u>,
// nada más). Extraída de VentanaNovedades.jsx a un módulo aparte,
// 2026-08-27, para poder reutilizarla también en
// VentanaConfigPlantillasEmail.jsx sin duplicar la función.
//
// Envuelve la selección actual del textarea con <tag>...</tag> (o la
// inserta vacía si no hay nada seleccionado), y deja el cursor dentro de
// las etiquetas nuevas para poder seguir escribiendo o encadenar otro
// formato (p.ej. negrita + cursiva).
export function envolverSeleccion(textarea, valor, tag, onCambio) {
  const inicio = textarea.selectionStart;
  const fin = textarea.selectionEnd;
  const seleccion = valor.slice(inicio, fin);
  const nuevo = `${valor.slice(0, inicio)}<${tag}>${seleccion}</${tag}>${valor.slice(fin)}`;
  onCambio(nuevo);
  requestAnimationFrame(() => {
    textarea.focus();
    const nuevoInicio = inicio + tag.length + 2;
    textarea.setSelectionRange(nuevoInicio, nuevoInicio + seleccion.length);
  });
}
