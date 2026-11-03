// La escucha previa (él, v81.1): 30 s de Deezer para saber si una canción
// está bien escrita («si no aparece, es que está mal escrita»). Lo busca
// api/canciones.js, que tolera letras de menos y un cantante equivocado.
// La pieza de pantalla, components/EscucharCancion.jsx.

// Lo que se le pide al buscador para una fila de la lista: su canción y su
// artista y, si Deezer ya la encontró, su número (así suena esa misma).
export function consultaDeFila(f, catalogo) {
  const [titulo, ...artista] = String(f.cancion || "").split(" — ");
  const e = catalogo?.[f.clave];
  return { titulo, artista: artista.join(" — "), ...(e?.deezer && !e.noEncontrada && !e.descartada ? { deezer: e.deezer } : {}) };
}

// Al buscador: con la llave del anfitrión, la sesión de un colaborador o el
// enlace y la clave del DJ. Devuelve { candidatos, soloTitulo } o { error }.
export async function pedirMuestras({ consulta, token = null, sesion = null, dj = null }, f = fetch) {
  try {
    const r = await f("/api/canciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(sesion ? { Authorization: `Bearer ${sesion}` } : {}) },
      body: JSON.stringify({ escuchar: consulta, ...(token ? { token } : {}), ...(dj ? { dj } : {}) }),
    });
    const datos = await r.json().catch(() => ({}));
    return r.ok ? datos : { error: datos.error || `El buscador respondió ${r.status}.` };
  } catch (e) {
    return { error: `No se pudo llegar al buscador (${e.message}).` };
  }
}
