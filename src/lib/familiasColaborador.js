// El colaborador, por familias (él, v60): el trato persona a persona es
// solo para recoger datos. Con los datos de una familia cerrados, cobrar y
// acreditar van por unidad familiar, también quien viene solo (es su
// propia familia). Aquí se arman esas familias; la pantalla las pinta.
import { claveFamilia, importeEsperadoInvitado, pideDatosDeBoda } from "./invitados";

// Un miembro: { id, nombre, apellido, anioNacimiento, anioBoda,
// grupoFamiliar, rolFamiliar, datosCompletos, pagado, presente, esMio,
// pagoPendienteHasta, plazosPago }.
// Lo da la base (colaborador_mis_familias) o, al anfitrión, su lista.

// ¿Está cerrada la recogida de datos de la familia? Todos con sus datos
// obligatorios, ninguna ficha suya a medias y, si hay matrimonio, la foto
// de boda o «No» (y con foto, su año: v58.2-58.4, en bloque).
export function familiaCerrada(miembros, { fotosFamiliares = {}, fotosSinBoda = {}, incompletas = new Set() } = {}) {
  if (!miembros.length) return false;
  if (miembros.some((m) => !m.datosCompletos || (m.esMio && incompletas.has(m.id)))) return false;
  const matrimonio = miembros.filter(pideDatosDeBoda);
  if (!matrimonio.length) return true;
  const grupo = miembros[0].grupoFamiliar || "";
  const foto = fotosFamiliares[grupo];
  if (!foto && !fotosSinBoda[grupo]) return false;
  return !foto || matrimonio.every((m) => String(m.anioBoda || "").trim());
}

// Las familias del colaborador, en orden alfabético. `etiqueta` es el
// apellido; si dos familias suyas comparten apellido, con su número
// (Abreu 1, Abreu 2), como lo dice él.
export function agruparFamilias(miembros, opciones = {}, evento) {
  const porClave = new Map();
  for (const m of miembros || []) {
    const clave = claveFamilia(m);
    if (!clave) continue;
    if (!porClave.has(clave)) porClave.set(clave, []);
    porClave.get(clave).push(m);
  }
  const familias = [...porClave.entries()].map(([clave, lista]) => {
    const ordenados = [...lista].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
    const porPagar = ordenados.filter((m) => !m.pagado);
    return {
      clave,
      apellido: ordenados[0].apellido || clave,
      grupoFamiliar: ordenados[0].grupoFamiliar || "",
      miembros: ordenados,
      cerrada: familiaCerrada(ordenados, opciones),
      porPagar,
      totalPorPagar: porPagar.reduce((s, m) => s + importeEsperadoInvitado(m, evento), 0),
      todosPagados: porPagar.length === 0,
      todosPresentes: ordenados.every((m) => m.presente),
      // El suyo por el que se pregunta a la base: tiene que llevarlo él.
      representante: ordenados.find((m) => m.esMio) || null,
    };
  });
  const repetidos = new Set(
    familias.map((f) => f.apellido.toLowerCase()).filter((a, i, todos) => todos.indexOf(a) !== i)
  );
  for (const f of familias) {
    const numero = f.grupoFamiliar.match(/(\d+)\s*$/)?.[1];
    f.etiqueta = repetidos.has(f.apellido.toLowerCase()) && numero ? `${f.apellido} ${parseInt(numero, 10)}` : f.apellido;
  }
  return familias.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"));
}

// Los miembros a partir de la lista entera (el anfitrión viendo el
// formulario de un colaborador): las mismas familias que daría la base.
export function miembrosDesdeLista(invitados, colaboradorId, datosCompletos) {
  const confirmados = (invitados || []).filter((g) => g.confirmado);
  const claves = new Set(confirmados.filter((g) => g.colaboradorId === colaboradorId).map(claveFamilia).filter(Boolean));
  return confirmados
    .filter((g) => claves.has(claveFamilia(g)))
    .map((g) => ({
      id: g.id,
      nombre: g.nombre,
      apellido: g.apellido,
      anioNacimiento: g.anioNacimiento,
      anioBoda: g.anioBoda,
      grupoFamiliar: g.grupoFamiliar,
      rolFamiliar: g.rolFamiliar,
      datosCompletos: datosCompletos(g),
      pagado: Boolean(g.pagado),
      presente: Boolean(g.presente),
      esMio: g.colaboradorId === colaboradorId,
      pagoPendienteHasta: g.pagoPendienteHasta || null,
      plazosPago: Number(g.plazosPago) || 0,
    }));
}
