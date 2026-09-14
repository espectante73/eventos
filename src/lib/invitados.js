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

// Los campos de texto que SÍ se le piden a esta persona en concreto.
export function camposQueAplican(g, evento) {
  return CAMPOS_DATOS_INVITADO.filter((campo) => {
    if (campo === "anioBoda") return pideDatosDeBoda(g);
    if (campo === "email") return pideEmail(g, evento);
    return true;
  });
}

// El "de M" del contador, ajustado a esta persona: si no se le pide el
// año de boda ni la foto, un hijo se quedaría en "5 de 7" para siempre y
// parecería que falta algo cuando no falta nada.
export function totalDatosInvitado(g, evento) {
  return camposQueAplican(g, evento).length + (pideDatosDeBoda(g) ? 1 : 0);
}

export function contarDatosRellenados(g, foto, evento) {
  const rellenos = camposQueAplican(g, evento).filter((c) => (g[c] || "").trim() !== "").length;
  return rellenos + (pideDatosDeBoda(g) && foto ? 1 : 0);
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
