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
import { nombreCompleto } from "./formato";
import { comoColaborador, calcularEdad, pideEmail } from "./invitados";
import { emailValido } from "./validacion";
import { ROL_FAMILIAR, LETRA_ROL } from "./rolFamiliar";

// Dos personas son "la misma" si coinciden nombre y apellido, sin
// mirar mayúsculas, tildes ni espacios de más — el mismo criterio que
// usa el tablón para reconocer a un invitado.
// Un texto sin mayúsculas, tildes ni espacios de más: así se comparan los
// nombres (y, en «Nuevo invitado», las zonas y las familias).
const limpio = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function mismaPersona(a, b) {
  const limpiar = (g) => limpio(`${g?.nombre || ""} ${g?.apellido || ""}`);
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
  // Lo demás que traiga (rol, colaborador, año, email: «Nuevo invitado», v77).
  const { rolFamiliar = "", colaboradorId = null, anioNacimiento = "", email = "" } = datos || {};
  const nuevo = invitadoNuevo({ nombre, apellido, grupoFamiliar, zona: String(datos?.zona || "").trim(), rolFamiliar, colaboradorId, anioNacimiento, email });
  // Se AÑADE igual y solo se avisa: dos personas pueden llamarse igual
  // (un padre y un hijo). Bloquearlo sería decidir por el usuario.
  const repetido = invitados.some((g) => mismaPersona(g, nuevo));
  return {
    invitados: [...invitados, nuevo],
    aviso: repetido ? `Ojo: ya había un ${nombreCompleto({ nombre, apellido })} en la lista. Se ha añadido igual.` : "",
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
    if (yaEsta) saltados.push(nombreCompleto(candidato));
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

// Eliminar. Si ese invitado es además colaborador, se elimina DEL TODO (él,
// v53.8): la persona, su ficha de colaborador y su cuenta de acceso (eso lo
// hace la base en el mismo guardado, anfitrion_guardar_invitados). Sus
// invitados asignados se quedan pendientes de colaborador, como las
// personas de una mesa que se quita, y el aviso dice quiénes.
export function eliminarInvitado(invitados, id, colaboradores = []) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };

  const suCuenta = comoColaborador(g, colaboradores);
  const pendientes = suCuenta
    ? invitados.filter((x) => x.id !== id && x.colaboradorId === suCuenta.id)
    : [];
  const idsPendientes = new Set(pendientes.map((x) => x.id));
  const siguiente = invitados
    .filter((x) => x.id !== id)
    .map((x) => (idsPendientes.has(x.id) ? { ...x, colaboradorId: null } : x));

  const aviso = pendientes.length
    ? "Pendientes de asignar colaborador:\n" + pendientes.map(nombreCompleto).sort((a, b) => a.localeCompare(b, "es")).join("\n")
    : "";
  return { invitados: siguiente, aviso };
}

// La pregunta antes de eliminar a un invitado que es colaborador. Texto del
// usuario, palabra por palabra (v53.8).
export const PREGUNTA_ELIMINAR_COLABORADOR_DESDE_INVITADOS =
  "Si eliminas a este colaborador desde invitados, eliminas al invitado y su función de colaborador. Todos los invitados asociados a él estarán pendientes de que se les asigne un nuevo colaborador.";

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
  // avisa con la cifra, como manda la norma 11.
  if (campo === "apellido" || campo === "grupoFamiliar") {
    const antes = claveFamiliaMesa(g);
    const ahora = claveFamiliaMesa(siguiente.find((x) => x.id === id));
    if (antes !== ahora) {
      const quedan = invitados.filter((x) => x.id !== id && claveFamiliaMesa(x) === antes).length;
      if (quedan > 0) {
        return {
          invitados: siguiente,
          aviso:
            nombreCompleto(g) +
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

// ---------- «Nuevo invitado» (él, v77) ----------
//
// El formulario flotante de la Lista, pensado sobre todo para el móvil en
// vertical: Apellido · Nombre, Familia · Rol, Zona · Colaborador y, plegado,
// Año · Email. Familia y Zona se eligen de las que ya hay; lo nuevo va
// fuera de esa lista, con su «＋» (él: «mejor que esa opción sea fuera de
// esa lista pero sí en ese mismo formulario»).

// Lo que ve el desplegable de Rol: su letra y cómo se llama, corto.
export const ROLES_FORMULARIO = [
  { valor: ROL_FAMILIAR.ESPOSO, texto: `${LETRA_ROL[ROL_FAMILIAR.ESPOSO]} · Esposo` },
  { valor: ROL_FAMILIAR.ESPOSA, texto: `${LETRA_ROL[ROL_FAMILIAR.ESPOSA]} · Esposa` },
  { valor: ROL_FAMILIAR.HIJO, texto: `${LETRA_ROL[ROL_FAMILIAR.HIJO]} · Hijo` },
  { valor: ROL_FAMILIAR.PADRE, texto: `${LETRA_ROL[ROL_FAMILIAR.PADRE]} · Padre o madre` },
  { valor: ROL_FAMILIAR.SUELTO, texto: `${LETRA_ROL[ROL_FAMILIAR.SUELTO]} · Suelto` },
];

const unicos = (valores) => {
  const vistos = new Map();
  for (const v of valores) {
    const t = String(v || "").trim();
    if (t && !vistos.has(limpio(t))) vistos.set(limpio(t), t);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
};
// Las zonas y las familias que ya hay, escritas como están en la Lista.
export const zonasDe = (invitados) => unicos(invitados.map((g) => g.zona));
export const familiasDe = (invitados) => unicos(invitados.map((g) => g.grupoFamiliar));

// Una familia nueva empieza con el apellido: «Pacheco01», o el siguiente
// número libre si ya existe.
export function familiaNuevaPara(invitados, apellido) {
  const base = String(apellido || "").trim().split(/\s+/)[0] || "";
  if (!base) return "";
  const usadas = new Set(familiasDe(invitados).map(limpio));
  for (let n = 1; n < 100; n += 1) {
    const nombre = `${base}${String(n).padStart(2, "0")}`;
    if (!usadas.has(limpio(nombre))) return nombre;
  }
  return base;
}

// El aviso de asignar colaborador a quien no tiene rol: el mismo en la
// Lista y en «Nuevo invitado» (norma 7).
export const avisoFaltaRol = (nombre) =>
  `${nombre} todavía no tiene rol familiar. Ponle su rol (O, A, H, P o S) antes de asignarle colaborador: el formulario que verá el colaborador depende de ese rol.`;

// Guarda lo del formulario. `familiaNueva` / `zonaNueva`: si se escribieron
// a mano (con su «＋»). Devuelve { invitados, aviso } como las demás: si la
// lista no cambia, el aviso dice qué falta.
export function nuevoDesdeFormulario(invitados, datos, { familiaNueva = false, zonaNueva = false, evento } = {}) {
  const sinCambio = (aviso) => ({ invitados, aviso });
  let { grupoFamiliar = "", zona = "", anioNacimiento = "", email = "" } = datos;
  grupoFamiliar = String(grupoFamiliar).trim();
  zona = String(zona).trim();
  anioNacimiento = String(anioNacimiento).trim();
  email = String(email).trim();
  const nombre = nombreCompleto({ nombre: String(datos.nombre || "").trim(), apellido: String(datos.apellido || "").trim() });

  // Una familia «nueva» que ya existe uniría a esta persona con otros: no
  // se adivina, se pregunta eligiéndola.
  const familiaQueYaHay = familiasDe(invitados).find((f) => limpio(f) === limpio(grupoFamiliar));
  if (familiaNueva && familiaQueYaHay) return sinCambio(`La familia «${familiaQueYaHay}» ya existe: elígela en la lista o escribe otra.`);
  // Una zona «nueva» que ya existe con otra grafía: la de la Lista (así no
  // salen dos en el tablón), y se dice.
  let salvedad = "";
  const zonaQueYaHay = zonasDe(invitados).find((z) => limpio(z) === limpio(zona));
  if (zonaNueva && zonaQueYaHay) {
    if (zonaQueYaHay !== zona) salvedad = `Se ha usado la zona «${zonaQueYaHay}», como ya estaba en la Lista.`;
    zona = zonaQueYaHay;
  }

  if (datos.colaboradorId && !datos.rolFamiliar) return sinCambio(avisoFaltaRol(nombre || "Este invitado"));
  if (anioNacimiento && (!/^\d{4}$/.test(anioNacimiento) || calcularEdad(anioNacimiento, evento) === null)) {
    return sinCambio("El año de nacimiento son cuatro cifras, como 1988.");
  }
  // El email, como en el formulario del colaborador: desde los 16 años.
  if (!pideEmail({ anioNacimiento }, evento)) email = "";
  if (email && !emailValido(email)) return sinCambio("Ese email no parece válido: revisa que tenga @ y un punto.");

  const { invitados: siguiente, aviso } = agregarInvitado(invitados, { ...datos, grupoFamiliar, zona, anioNacimiento, email });
  return { invitados: siguiente, aviso: [aviso, siguiente !== invitados ? salvedad : ""].filter(Boolean).join(" ") };
}
