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
// Todas devuelven `{ invitados, aviso }`, el mismo trato que
// `lib/mesas.js`. El `aviso` es lo que hay que contarle al usuario; para
// saber si algo cambió se compara la lista devuelta con la de entrada
// (`siguiente !== invitados`). A veces se hace el cambio Y se avisa —por
// ejemplo, al añadir a alguien que se llama igual que otro—, porque
// bloquearlo sería decidir por él.
import { uid } from "./id";
import { claveFamiliaMesa } from "./mesas";

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

// El colaborador guarda su nombre en UN solo campo, "Apellido, Nombre";
// el invitado lo tiene en dos. Se parte por la coma para poder
// preguntárselo a `mismaPersona`. Sin coma no se adivina nada: el
// apellido se deja vacío, y así no casa con nadie por error.
export function fichaDelColaborador(colaborador) {
  const partes = String(colaborador?.nombre || "").split(",");
  return partes.length > 1
    ? { apellido: partes[0], nombre: partes.slice(1).join(" ") }
    : { nombre: partes[0] || "", apellido: "" };
}

// Colaboradores que ESTÁN en la lista de invitados pero cuya cuenta no
// está enlazada con su ficha (`invitadoId` vacío). No es un capricho de
// orden: de ese enlace cuelgan tres cosas que fallan en silencio --
//   · su email no cuenta para el "al menos un email por familia",
//   · el motor de invitaciones no lo encuentra como destinatario,
//   · y en la Lista de invitados no le sale la ★ de colaborador.
// Pasa con los colaboradores creados antes de que dar de alta a uno
// obligara a elegir su ficha. Los que NO están invitados (alguien que
// ayuda sin venir) no cuentan: ahí el enlace vacío es lo correcto.
export function colaboradoresSinFichaEnlazada(colaboradores = [], invitados = []) {
  const parejas = [];
  for (const c of colaboradores) {
    if (c?.invitadoId && invitados.some((g) => g.id === c.invitadoId)) continue;
    const ficha = invitados.find((g) => mismaPersona(fichaDelColaborador(c), g));
    if (ficha) parejas.push({ colaborador: c, invitado: ficha });
  }
  return parejas;
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

// ---------- Cambiar un campo suelto ----------
//
// Estaba escrito cinco veces, una por campo (nombre, apellido, zona,
// grupo familiar, rol familiar), con el mismo `map` copiado. Cinco
// copias del mismo gesto son cinco sitios donde equivocarse.
const CAMPOS = ["nombre", "apellido", "zona", "grupoFamiliar", "rolFamiliar"];

export function cambiarCampo(invitados, id, campo, valor) {
  if (!CAMPOS.includes(campo)) return { invitados, aviso: `Campo desconocido: ${campo}.` };
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };

  const limpio = String(valor ?? "").trim();
  if (limpio === String(g[campo] ?? "")) return { invitados, aviso: "" };

  const siguiente = invitados.map((x) => (x.id === id ? { ...x, [campo]: limpio } : x));

  // ⚠️ Cambiar el apellido o el grupo familiar CAMBIA DE FAMILIA a esa
  // persona, y de eso dependen la mesa (una familia no se separa), los
  // matrimonios y el acceso al tablón. Es legítimo —el hijo mayor con
  // otro apellido— pero no debe pasar sin que se vea. Se hace y se
  // avisa con la cifra, como manda la norma 16.
  if (campo === "apellido" || campo === "grupoFamiliar") {
    const antes = claveFamiliaMesa(g);
    const ahora = claveFamiliaMesa(siguiente.find((x) => x.id === id));
    if (antes !== ahora) {
      const quedan = invitados.filter((x) => x.id !== id && claveFamiliaMesa(x) === antes).length;
      if (quedan > 0) {
        return {
          invitados: siguiente,
          aviso:
            `${g.nombre} ${g.apellido}`.trim() +
            ` pasa a ser de otra familia. Los otros ${quedan} se quedan como estaban, ` +
            "así que ya no se sentarán juntos por la regla de la familia.",
        };
      }
    }
  }
  return { invitados: siguiente, aviso: "" };
}

// ---------- Roles de trabajo del día ----------
export function alternarRolTrabajo(invitados, id, rol) {
  const limpio = String(rol || "").trim();
  if (!limpio) return { invitados, aviso: "" };
  return {
    invitados: invitados.map((g) => {
      if (g.id !== id) return g;
      const actuales = Array.isArray(g.rolesTrabajo) ? g.rolesTrabajo : [];
      return {
        ...g,
        rolesTrabajo: actuales.includes(limpio)
          ? actuales.filter((r) => r !== limpio)
          : [...actuales, limpio],
      };
    }),
    aviso: "",
  };
}

// ---------- Excluir del tablón público ----------
export function alternarExcluidoTablon(invitados, id) {
  return {
    invitados: invitados.map((g) => (g.id === id ? { ...g, excluidoTablon: !g.excluidoTablon } : g)),
    aviso: "",
  };
}

// ---------- Excepciones de la Revisión ----------
export function permitirExcepcion(invitados, id, clave) {
  return {
    invitados: invitados.map((g) =>
      g.id === id
        ? { ...g, excepcionesRevision: [...new Set([...(g.excepcionesRevision || []), clave])] }
        : g
    ),
    aviso: "",
  };
}

export function quitarExcepcion(invitados, id, clave) {
  return {
    invitados: invitados.map((g) =>
      g.id === id
        ? { ...g, excepcionesRevision: (g.excepcionesRevision || []).filter((c) => c !== clave) }
        : g
    ),
    aviso: "",
  };
}

// ---------- Responsable de un rol ----------
// No toca a los invitados: vive en `evento.rolesTrabajoResponsables`,
// un mapa { rol: invitadoId }. Uno solo por rol para todo el evento.
// Pulsar sobre el que ya es responsable lo quita.
export function marcarResponsable(responsables, rol, invitadoId) {
  const siguiente = { ...(responsables || {}) };
  if (siguiente[rol] === invitadoId) delete siguiente[rol];
  else siguiente[rol] = invitadoId;
  return siguiente;
}
