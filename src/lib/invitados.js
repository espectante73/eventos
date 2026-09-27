// Lógica pura sobre invitados: qué cuenta como "datos completos", edad,
// importe esperado según precios/edad, y el parseo del pegado masivo de
// invitados. Sin JSX, sin estado — movida fuera de App.jsx en el reparto
// del 2026-08-08 (ver CLAUDE.md).
import { parsePrecio } from "./formato";
import { ROL_FAMILIAR } from "./rolFamiliar";
import { requisitosActivos } from "./modoPruebas";
import { emailValido } from "./validacion";

export function datosCompletos(g) {
  // Únicos datos obligatorios: año de nacimiento y alergias (aunque la
  // respuesta sea "No", tiene que estar contestada explícitamente). Todo lo
  // demás (boda, foto, email, canción) es opcional — puede ser soltero/a,
  // menor de edad, o simplemente no querer compartir más datos.
  return Boolean(g.anioNacimiento) && Boolean(g.alergias);
}

// Los 6 campos de texto que rellena el colaborador, más la foto familiar
// (que vive aparte, en fotosFamiliares). El pago no cuenta aquí — tiene
// su propia insignia ("Pagado"/"Pendiente de pago") aparte.
const CAMPOS_DATOS_INVITADO = [
  "anioNacimiento",
  "anioBoda",
  "email",
  "cancion",
  "alergias",
  "observaciones",
];

// ---------- Qué se le pide a cada persona (2026-09-14) ----------
// Hasta ahora se le pedía lo mismo a todo el mundo, y había dos casos en
// los que eso no tiene ningún sentido: el año de boda y la foto de boda
// de un hijo de 8 años, y el email de un menor. A petición del usuario,
// el formulario del colaborador se adapta al rol familiar y a la edad.
//
// Vive aquí, en funciones puras, y no dentro del componente: el
// formulario las usa para atenuar campos, y el contador de "datos N de
// M" las usa para no exigir lo que no se está pidiendo. Si estuvieran
// escritas en el componente, el contador y los campos se desincronizarían
// al primer retoque (misma regla de "una sola pieza" de CLAUDE.md).

export const EDAD_ADULTO = 18;

// Año de boda y foto de boda: solo a quien viene con su cónyuge (O y A).
// Todos los demás roles quedan fuera a propósito, decidido con el usuario
// el 2026-09-14: "todos los que no tengan ni A ni O, no le pediremos la
// foto ni su año de boda". Eso incluye el rol VACÍO (sin revisar): hasta
// que el anfitrión no marca el rol, no se piden esos dos datos.
export function pideDatosDeBoda(g) {
  return g?.rolFamiliar === ROL_FAMILIAR.ESPOSO || g?.rolFamiliar === ROL_FAMILIAR.ESPOSA;
}

// Menor a fecha del evento (calcularEdad ya usa evento.fecha como
// referencia). Sin año de nacimiento la edad es desconocida: NO se le
// trata como menor, o el email quedaría bloqueado justo antes de que el
// colaborador rellene la edad.
export function esMenorDeEdad(g, evento) {
  const edad = calcularEdad(g?.anioNacimiento, evento);
  return edad !== null && edad < EDAD_ADULTO;
}

// Email solo de mayores de edad, a petición del usuario.
export function pideEmail(g, evento) {
  return !esMenorDeEdad(g, evento);
}

// ---------- Email: al menos uno por familia (usuario, 2026-09-19) ----------
// Quien viene solo (S) tiene que darlo. Y cada familia necesita al menos
// UN email de un adulto (esposo, esposa, padre o madre sin pareja, o el
// propio suelto); si no hay ninguno, el formulario no guarda sin él
// (emailObligatorio).
// ⚠️ Esta regla está DOS veces, a propósito: aquí (el anfitrión ve a toda
// la familia) y en SQL, `colaborador_familias_sin_email` (el colaborador
// solo ve a SUS invitados, y un matrimonio puede tener dos colaboradores).
// Si cambia una, cambiar la otra.
export const ROLES_CON_EMAIL_FAMILIAR = [
  ROL_FAMILIAR.ESPOSO,
  ROL_FAMILIAR.ESPOSA,
  ROL_FAMILIAR.PADRE,
  ROL_FAMILIAR.SUELTO,
];

export function claveFamilia(g) {
  return String(g?.grupoFamiliar || g?.apellido || "").trim().toLowerCase();
}

// Las familias (clave) con algún confirmado y sin ningún adulto con email.
// El email de un invitado que es colaborador vive en Colaboradores.
export function familiasSinEmail(invitados, colaboradores) {
  const conEmail = new Set();
  const conConfirmados = new Set();
  for (const g of invitados || []) {
    const clave = claveFamilia(g);
    if (!clave) continue;
    if (g.confirmado) conConfirmados.add(clave);
    if (!ROLES_CON_EMAIL_FAMILIAR.includes(g.rolFamiliar)) continue;
    // El de su ficha O el de Colaboradores: igual que en la función SQL.
    const vinculado = (colaboradores || []).find((c) => c.invitadoId === g.id);
    if (String(g.email || "").trim() || String(vinculado?.email || "").trim()) conEmail.add(clave);
  }
  return new Set([...conConfirmados].filter((clave) => !conEmail.has(clave)));
}

// ¿Tiene que dar email ESTA persona? Al menos uno por familia: quien viene
// solo (S), siempre; si nadie de la familia lo tiene todavía, quien puede
// darlo por ella (ROLES_CON_EMAIL_FAMILIAR: los dos cónyuges, hasta que uno
// lo ponga). A los demás no: su email no cuenta para la familia. Al menor
// no se le pide, y el de quien también es colaborador se edita en
// Colaboradores.
export function emailObligatorio(g, evento, { familiaSinEmail = false, colaboradorVinculado = null } = {}) {
  if (colaboradorVinculado || !pideEmail(g, evento)) return false;
  if (g?.rolFamiliar === ROL_FAMILIAR.SUELTO) return true;
  return familiaSinEmail && ROLES_CON_EMAIL_FAMILIAR.includes(g?.rolFamiliar);
}

// Los obligatorios que faltan en el formulario del colaborador (v50): sin
// ellos, "Guardar" no guarda y los marca en rojo. Devuelve sus nombres de
// campo, en el orden del formulario.
export function faltanObligatorios(g, evento, opciones = {}) {
  const faltan = [];
  if (!String(g?.anioNacimiento || "").trim()) faltan.push("anioNacimiento");
  if (emailObligatorio(g, evento, opciones) && !emailValido(String(g?.email || "").trim())) faltan.push("email");
  if (!String(g?.alergias || "").trim()) faltan.push("alergias");
  return faltan;
}

// Las fichas incompletas de un colaborador: sus confirmados que no están
// en "N de N" (estadoDatos). Una sola cuenta para su sello, el suyo cuando
// lo mira el anfitrión y el del anfitrión cuando también es colaborador
// (v50.6).
export function fichasIncompletasDe(colaboradorId, { invitados, colaboradores, evento, fotosFamiliares, fotosSinBoda }) {
  return (invitados || []).filter(
    (g) =>
      g.confirmado &&
      resolverColaborador(g, colaboradores || [])?.id === colaboradorId &&
      estadoDatos(g, {
        evento,
        foto: fotosFamiliares?.[g.grupoFamiliar || ""],
        sinFotoBoda: Boolean(fotosSinBoda?.[g.grupoFamiliar || ""]),
        colaboradorVinculado: (colaboradores || []).find((c) => c.invitadoId === g.id),
      }).incompleta
  );
}

// El colaborador que tiene este email (el del anfitrión, que también es
// colaborador). Si hay más de uno, ninguno: mejor sin sello que con los
// avisos de otro.
export function colaboradorConEmail(colaboradores, email) {
  const buscado = String(email || "").trim().toLowerCase();
  if (!buscado) return null;
  const iguales = (colaboradores || []).filter((c) => String(c.email || "").trim().toLowerCase() === buscado);
  return iguales.length === 1 ? iguales[0] : null;
}

const relleno = (g, campo) => String(g?.[campo] || "").trim() !== "";

// Lo que cuenta en "datos X de Y" (él, v52): lo obligatorio SIEMPRE -- año
// de nacimiento, alergias y el email de quien viene solo --; lo demás, solo
// si se ha rellenado. Vacío y no obligatorio no cuenta. Así una ficha está
// completa en cuanto tiene lo obligatorio, sea quien sea.
export function camposQueAplican(g, evento) {
  return CAMPOS_DATOS_INVITADO.filter((campo) => {
    if (campo === "anioNacimiento" || campo === "alergias") return true;
    if (campo === "email") return pideEmail(g, evento) && (g?.rolFamiliar === ROL_FAMILIAR.SUELTO || relleno(g, "email"));
    if (campo === "anioBoda") return pideDatosDeBoda(g) && relleno(g, campo);
    return relleno(g, campo);
  });
}

// Un invitado que además es colaborador guarda su email en Colaboradores,
// no en su ficha (que se deja vacía a propósito: ver CLAUDE.md, "El email
// de un invitado que también es colaborador vive en dos sitios"). Para
// contar sus datos vale ese: si no, salía "3 de 4" aunque el anfitrión ya
// hubiera puesto el email (Raúl Sierra, 2026-09-19).
export function conEmailDeColaborador(g, colaboradorVinculado) {
  if (!colaboradorVinculado) return g;
  return { ...g, email: colaboradorVinculado.email || "" };
}

// La foto de boda, como lo demás que no es obligatorio: cuenta si está.
export function totalDatosInvitado(g, evento, foto) {
  return camposQueAplican(g, evento).length + (pideDatosDeBoda(g) && foto ? 1 : 0);
}

export function contarDatosRellenados(g, foto, evento) {
  const rellenos = camposQueAplican(g, evento).filter((c) => relleno(g, c)).length;
  return rellenos + (pideDatosDeBoda(g) && foto ? 1 : 0);
}

// "Datos X de Y" de una ficha y si está INCOMPLETA (no está en N de N). Una
// sola definición para toda la vista del colaborador (usuario, 2026-09-19):
// la fila en rojo, la sección INCOMPLETOS, el contador de "Abrir
// formulario" y el aviso "Datos completos" al anfitrión.
export function estadoDatos(g, { evento, foto, colaboradorVinculado } = {}) {
  const conEmail = conEmailDeColaborador(g, colaboradorVinculado);
  const rellenos = contarDatosRellenados(conEmail, foto, evento);
  const total = totalDatosInvitado(conEmail, evento, foto);
  return { rellenos, total, incompleta: rellenos < total };
}

export function tieneAlergiaReal(g) {
  // "No" es una respuesta explícita de que no hay alergia — no cuenta como alergia.
  return Boolean(g.alergias && g.alergias.trim() && g.alergias.trim() !== "No");
}

export function calcularEdad(anioNacimiento, evento) {
  const anio = parseInt(anioNacimiento, 10);
  if (!anio || isNaN(anio)) return null;
  const anioReferencia =
    evento && evento.fecha ? new Date(evento.fecha).getFullYear() : new Date().getFullYear();
  const edad = anioReferencia - anio;
  return edad > 0 && edad < 130 ? edad : null;
}

export function edadPromedio(invitados, evento) {
  const edades = invitados
    .map((g) => calcularEdad(g.anioNacimiento, evento))
    .filter((e) => e !== null);
  if (edades.length === 0) return null;
  return Math.round(edades.reduce((a, b) => a + b, 0) / edades.length);
}

// Importe que le corresponde a un invitado según su edad (calculada a partir del
// año de nacimiento y la fecha del evento) y el rango/precios fijados en Configuración.
// Por debajo de "desde" no paga (bebés); entre "desde" y "hasta" paga precio niño;
// de "hasta" en adelante paga precio adulto.
export function importeEsperadoInvitado(g, evento) {
  const edad = calcularEdad(g.anioNacimiento, evento);
  const desde = parseInt(evento?.edadNinoDesde, 10);
  const hasta = parseInt(evento?.edadNinoHasta, 10);
  const precioAdulto = parsePrecio(evento?.precioAdulto);
  const precioNino = parsePrecio(evento?.precioNino);
  if (edad === null) return precioAdulto;
  if (!isNaN(desde) && edad < desde) return 0;
  if (!isNaN(hasta) && edad < hasta) return precioNino;
  return precioAdulto;
}

// Una familia recibe la invitación cuando todos sus confirmados han pagado
// y tienen mesa. En Modo Pruebas basta con un confirmado.
export function familiaListaParaInvitacion(confirmados, evento) {
  if (confirmados.length === 0) return false;
  if (!requisitosActivos(evento)) return true;
  return confirmados.every((m) => m.pagado && m.mesa);
}

// La asignación de colaborador es siempre manual y exclusiva del Anfitrión.
export function resolverColaborador(g, colaboradores) {
  if (!g.colaboradorId) return null;
  return colaboradores.find((c) => c.id === g.colaboradorId) || null;
}

export function parseImport(texto, colaboradores) {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = (line.includes("\t") ? line.split("\t") : line.split(","))
        .map((p) => p.trim());
      const grupoFamiliarRaw = parts[0] || "";
      const apellido = parts[1] || "";
      const nombre = parts[2] || "";
      const colaboradorNombre = parts[3] || "";
      const zona = parts[4] || "";
      const grupoFamiliar = grupoFamiliarRaw || apellido;
      const colaboradorMatch = colaboradorNombre
        ? colaboradores.find(
            (c) => c.nombre.trim().toLowerCase() === colaboradorNombre.trim().toLowerCase()
          )
        : null;
      return {
        apellido,
        nombre,
        zona,
        grupoFamiliar,
        colaboradorId: colaboradorMatch ? colaboradorMatch.id : null,
      };
    })
    .filter((r) => r.nombre && r.apellido && r.apellido.toLowerCase() !== "apellido");
}
