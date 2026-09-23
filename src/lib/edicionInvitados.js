// Las operaciones que ESCRIBEN en la lista de invitados.
//
// Vivían dentro de SeccionInvitados.jsx, un componente de 2.100 líneas.
// Ahí no se podían probar: para llamar a "eliminar un invitado" había
// que dibujar la pantalla entera. Un desarrollador que miró el código lo
// dijo en general; al medirlo salió lo concreto — 16 funciones que tocan
// los datos y ninguna con una prueba (2026-09-23).
//
// La lista de invitados es la base de toda la app: si aquí se pierde
// alguien, no se nota hasta que falta en la boda. Por eso estas
// funciones son PURAS: reciben la lista y devuelven la lista nueva, sin
// tocar pantalla ni base de datos. Así se pueden probar en frío, con
// todos los casos raros, tantas veces como haga falta.
//
// Todas devuelven `{ invitados, aviso }`, el mismo trato que `lib/mesas.js`:
// si `aviso` trae texto, NO se ha tocado nada y ahí está el motivo. Es la
// norma de la casa: nada a medias, y se avisa con cifras.
import { uid } from "./id";

// Dos personas son "la misma" si coinciden nombre y apellido, sin
// mirar mayúsculas, tildes ni espacios de más — el mismo criterio que
// usa el tablón para reconocer a un invitado.
export function mismaPersona(a, b) {
  const limpiar = (g) =>
    `${g?.nombre || ""} ${g?.apellido || ""}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  return limpiar(a) === limpiar(b);
}

// Los campos de un invitado recién creado. En un solo sitio: estaban
// escritos dos veces (al añadir a mano y al importar) y ya se habían
// separado — el de importar se había quedado sin `presente`.
function invitadoNuevo(datos) {
  return {
    id: uid(),
    nombre: "",
    apellido: "",
    zona: "",
    grupoFamiliar: "",
    colaboradorId: null,
    confirmado: false,
    mesa: null,
    anioNacimiento: "",
    anioBoda: "",
    rolFamiliar: "",
    email: "",
    cancion: "",
    alergias: "",
    observaciones: "",
    pagado: false,
    presente: false,
    ...datos,
  };
}

// Añadir uno a mano. Nombre, apellido y grupo familiar son obligatorios:
// sin ellos la ficha no se puede ni buscar ni agrupar.
export function agregarInvitado(invitados, datos) {
  const nombre = String(datos?.nombre || "").trim();
  const apellido = String(datos?.apellido || "").trim();
  const grupoFamiliar = String(datos?.grupoFamiliar || "").trim();
  if (!nombre || !apellido || !grupoFamiliar) {
    return { invitados, aviso: "Faltan el nombre, el apellido o el grupo familiar." };
  }
  const nuevo = invitadoNuevo({ nombre, apellido, grupoFamiliar, zona: String(datos?.zona || "").trim() });
  // Se AÑADE igual y solo se avisa: dos personas pueden llamarse igual
  // (un padre y un hijo). Bloquearlo sería decidir por el usuario.
  const repetido = invitados.some((g) => mismaPersona(g, nuevo));
  return {
    invitados: [...invitados, nuevo],
    aviso: repetido ? `Ojo: ya había un ${nombre} ${apellido} en la lista. Se ha añadido igual.` : "",
  };
}

// Importar una lista pegada. ⚠️ Antes no miraba duplicados: pegar dos
// veces el mismo texto metía a todo el mundo por duplicado y en
// silencio. Ahora los repetidos se saltan y se dice cuántos y quiénes.
export function importarInvitados(invitados, filas) {
  if (!filas || filas.length === 0) return { invitados, aviso: "No hay nada que importar." };

  const nuevos = [];
  const saltados = [];
  for (const fila of filas) {
    const candidato = invitadoNuevo({
      nombre: fila.nombre,
      apellido: fila.apellido,
      zona: fila.zona,
      grupoFamiliar: fila.grupoFamiliar,
      colaboradorId: fila.colaboradorId ?? null,
    });
    // Contra la lista que ya hay Y contra los de esta misma importación:
    // el texto pegado también puede traer repetidos dentro.
    const yaEsta = [...invitados, ...nuevos].some((g) => mismaPersona(g, candidato));
    if (yaEsta) saltados.push(`${candidato.nombre} ${candidato.apellido}`.trim());
    else nuevos.push(candidato);
  }

  if (nuevos.length === 0) {
    return { invitados, aviso: `Ninguno se ha importado: los ${saltados.length} ya estaban en la lista.` };
  }
  return {
    invitados: [...invitados, ...nuevos],
    aviso:
      saltados.length === 0
        ? ""
        : `Importados ${nuevos.length}. Se han saltado ${saltados.length} porque ya estaban: ${saltados.join(", ")}.`,
  };
}

// Eliminar. ⚠️ Si ese invitado es además un colaborador, borrarlo le
// deja la cuenta sin su ficha (la base pone su `invitadoId` a nulo sin
// avisar). Eso no se hace en silencio: no se borra y se dice por qué.
export function eliminarInvitado(invitados, id, colaboradores = []) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };

  const esColaborador = (colaboradores || []).find((c) => c.invitadoId === id);
  if (esColaborador) {
    return {
      invitados,
      aviso:
        `${g.nombre} ${g.apellido}`.trim() +
        ` es también el colaborador "${esColaborador.nombre}". Quítalo primero de la lista de colaboradores.`,
    };
  }
  return { invitados: invitados.filter((x) => x.id !== id), aviso: "" };
}
