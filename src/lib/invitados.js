// Lógica pura sobre invitados: qué cuenta como "datos completos", edad,
// importe esperado según precios/edad, y el parseo del pegado masivo de
// invitados. Sin JSX, sin estado — movida fuera de App.jsx en el reparto
// del 2026-08-08 (ver CLAUDE.md).
import { parsePrecio } from "./formato";
import { ROL_FAMILIAR } from "./rolFamiliar";

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

// Canción y observaciones llevan una casilla "Sí" en el formulario
// (usuario, 2026-09-19): "lo obligado es marcar sí o no". Marcada, aparece
// el campo y cuenta; sin marcar, se pliega y NO cuenta.
// - Canción: "Sí" POR DEFECTO. Por eso su "no" hay que guardarlo aparte
//   (`sinCancion`): sin él, una canción vacía es "falta ponerla".
// - Observaciones: "No" por defecto. "Sí" es simplemente tener texto.
// `abiertos` ({ cancion, observaciones }): lo que el formulario tiene
// marcado ahora mismo; sin él, se deduce de lo guardado.
export const CAMPOS_OPCIONALES = ["cancion", "observaciones"];

export function eligeOpcional(g, campo, abiertos) {
  // Quien viene solo (S) tiene que dar email: para él no hay "no".
  if (campo === "email" && g?.rolFamiliar === ROL_FAMILIAR.SUELTO) return true;
  if (abiertos && campo in abiertos) return Boolean(abiertos[campo]);
  if (String(g?.[campo] || "").trim() !== "") return true;
  if (campo === "cancion") return !g?.sinCancion;
  if (campo === "email") return !g?.sinEmail;
  return false;
}

// ---------- Email: al menos uno por familia (usuario, 2026-09-19) ----------
// El email lleva casilla "Sí" MARCADA por defecto (se guarda su "no" en
// `sinEmail`), salvo para quien viene solo (S): ahí es obligatorio. Y cada
// familia necesita al menos UN email de un adulto (esposo, esposa, padre o
// madre sin pareja, o el propio suelto); si no hay ninguno, el colaborador
// ve un aviso.
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

// Los campos de texto que SÍ se le piden a esta persona en concreto: lo
// que no aplica (el email de un menor, el año de boda de quien no es O ni
// A) o lo opcional que no ha elegido, no cuenta. Así "completo" es
// siempre "N de N", sea quien sea.
export function camposQueAplican(g, evento, abiertos) {
  return CAMPOS_DATOS_INVITADO.filter((campo) => {
    if (campo === "anioBoda") return pideDatosDeBoda(g);
    if (campo === "email") return pideEmail(g, evento) && eligeOpcional(g, "email", abiertos);
    if (CAMPOS_OPCIONALES.includes(campo)) return eligeOpcional(g, campo, abiertos);
    return true;
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

// La foto de boda se pide a O y A, SALVO que el colaborador haya marcado
// que ese matrimonio no tiene (usuario, 2026-09-19). Al revés que canción y
// observaciones, su casilla "Sí" nace MARCADA: lo normal es que la haya.
// `abiertos.fotoBoda === false` = marcado que no tienen.
export function pideFotoBoda(g, abiertos) {
  return pideDatosDeBoda(g) && abiertos?.fotoBoda !== false;
}

// El "de M" del contador, ajustado a esta persona.
export function totalDatosInvitado(g, evento, abiertos) {
  return camposQueAplican(g, evento, abiertos).length + (pideFotoBoda(g, abiertos) ? 1 : 0);
}

export function contarDatosRellenados(g, foto, evento, abiertos) {
  const rellenos = camposQueAplican(g, evento, abiertos).filter((c) => String(g[c] || "").trim() !== "").length;
  return rellenos + (pideFotoBoda(g, abiertos) && foto ? 1 : 0);
}

// "Datos X de Y" de una ficha y si está INCOMPLETA (no está en N de N). Una
// sola definición para toda la vista del colaborador (usuario, 2026-09-19):
// la fila en rojo, la sección INCOMPLETOS, el contador de "Abrir
// formulario" y el aviso "Datos completos" al anfitrión.
export function estadoDatos(g, { evento, foto, sinFotoBoda = false, colaboradorVinculado } = {}) {
  const opciones = { fotoBoda: !sinFotoBoda };
  const rellenos = contarDatosRellenados(conEmailDeColaborador(g, colaboradorVinculado), foto, evento, opciones);
  const total = totalDatosInvitado(g, evento, opciones);
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
