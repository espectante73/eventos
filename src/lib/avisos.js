// Los avisos de "no se ha podido guardar" y parecidos, en la ventana de
// siempre (la de PreguntaSeguridad) en vez de window.alert.
//
// window.alert está prohibido en la app por dos motivos: BLOQUEA el
// navegador hasta que alguien lo cierra, y apunta siempre al `window` de
// la pestaña principal -- desde una ventana emergente (Lista de
// invitados, Novedades, Música) salía en el sitio equivocado y dejaba la
// ventana como colgada hasta encontrarlo.
//
// Una sola pieza: aquí solo vive la lista de "sitios donde se puede
// enseñar un aviso". Cada documento que puede enseñarlo se apunta con
// registrarHostAvisos (el componente AvisosGlobales), y el aviso sale en
// el documento que la persona está mirando -- la pestaña o la ventana
// emergente que tenga el foco.

const hosts = new Set();
// Si algo avisa antes de que haya nadie escuchando (un fallo al arrancar,
// antes del primer render), el mensaje espera en vez de perderse.
let pendientes = [];
const MAXIMO_EN_ESPERA = 5;

function hostElegido() {
  const lista = [...hosts];
  const conFoco = lista.find((h) => {
    try {
      return h.doc.hasFocus();
    } catch (_) {
      return false;
    }
  });
  return conFoco || lista[lista.length - 1] || null;
}

export function registrarHostAvisos(host) {
  hosts.add(host);
  if (pendientes.length) {
    const cola = pendientes;
    pendientes = [];
    cola.forEach(({ mensaje, titulo }) => host.mostrar(mensaje, titulo));
  }
  return () => hosts.delete(host);
}

// Parte el mensaje en título + línea explicativa, como el resto de
// preguntas de la app ("¿Quitar la mesa 3?" + qué va a pasar). El título
// es la primera frase si es corta; si no cabe, va entero en el cuerpo.
export function partirAviso(mensaje, titulo) {
  const texto = String(mensaje || "").trim();
  if (titulo) return { titulo, texto };
  const corte = texto.search(/\.(\s|$)/);
  if (corte > 0 && corte <= 70) return { titulo: texto.slice(0, corte + 1), texto: texto.slice(corte + 1).trim() };
  if (texto.length <= 70) return { titulo: texto, texto: "" };
  return { titulo: "Aviso", texto };
}

// Enseña un aviso. Devuelve false si no había ningún sitio donde
// enseñarlo (queda en espera al primero que se apunte).
export function avisoEnPantalla(mensaje, titulo) {
  const host = hostElegido();
  if (!host) {
    if (pendientes.length < MAXIMO_EN_ESPERA) pendientes.push({ mensaje, titulo });
    return false;
  }
  host.mostrar(mensaje, titulo);
  return true;
}
