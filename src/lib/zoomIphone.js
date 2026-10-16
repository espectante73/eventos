// El iPhone acerca la pantalla al tocar un campo con letra de menos de
// 16 px —en la app casi todos: 12 y 14— y la deja acercada al salir: la
// ventana queda cortada y sin su X a la vista (él, v68.4, en la Lista de
// invitados: «¿cómo salgo de aquí?»). Con `maximum-scale=1` Safari deja de
// acercarla solo; ampliar con dos dedos sigue funcionando, porque iOS lo
// ignora para el pellizco. Solo en iPhone e iPad: en Android sí quitaría
// el pellizco. Agrandar la letra de todos los campos rompería las tablas
// de una línea (norma 6).
export function esIOS(nav = navigator) {
  return /iPad|iPhone|iPod/.test(nav.userAgent || "") || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
}

export function evitarZoomAlEscribir(doc = document, nav = navigator) {
  if (!esIOS(nav)) return false;
  const meta = doc.querySelector('meta[name="viewport"]');
  if (!meta) return false;
  const contenido = meta.getAttribute("content") || "";
  if (!/maximum-scale/.test(contenido)) meta.setAttribute("content", `${contenido}, maximum-scale=1`);
  return true;
}
