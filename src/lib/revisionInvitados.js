// Informe de revisión de la Lista de invitados (2026-09-04).
//
// Para qué: el usuario lo pidió con estas palabras -- "cuanto más
// crezca, más posibilidad de error voy a tener con algún invitado y es
// algo que no quiero que me pase". Con ~140 invitados, un despiste no
// se ve mirando la lista: hay que buscarlo.
//
// ⚠️ Esto NO vuelve a listar invitados. Es la regla que ya nos costó
// una ventana entera (ver CLAUDE.md, "La Lista de invitados es la
// raíz"): una vista que solo reordena lo que la lista ya enseña es un
// duplicado. Aquí solo se calculan INCOHERENCIAS -- cosas que la lista
// no puede decir por sí sola porque hay que cruzar filas entre ellas.
// Cada hallazgo devuelve las personas afectadas para poder saltar a
// ellas en la propia lista, que sigue siendo donde se corrige.
import { ROL_FAMILIAR } from "./rolFamiliar";
import { conyugesSueltos, matrimoniosDeInvitados } from "./matrimonios";

function claveFamilia(g) {
  return String(g.grupoFamiliar || g.apellido || "").trim().toLowerCase();
}

function agruparPorFamilia(invitados) {
  const grupos = new Map();
  for (const g of invitados || []) {
    const clave = claveFamilia(g);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(g);
  }
  return grupos;
}

// `tipo` separa lo que está MAL de lo que solo está pendiente: un hijo
// sin adulto es un error de datos, y un confirmado sin mesa es trabajo
// que queda. Mezclarlos haría que el informe cansara y se ignorara.
function hallazgo(clave, titulo, ayuda, personas, tipo = "error") {
  return { clave, titulo, ayuda, tipo, personas };
}

export function revisarInvitados(invitados = [], evento = {}) {
  const grupos = agruparPorFamilia(invitados);
  const hallazgos = [];

  const sueltos = conyugesSueltos(invitados);
  if (sueltos.length)
    hallazgos.push(
      hallazgo(
        "conyugeSinPareja",
        "Cónyuge sin su pareja",
        "Marcados con O o con A pero sin el otro en su familia. O falta marcar al cónyuge, o esa marca sobra (si viene solo, va P o S).",
        sueltos
      )
    );

  const hijosHuerfanos = [];
  const padresSinHijos = [];
  const sueltosAcompanados = [];
  const gruposConDobleConyuge = [];

  for (const miembros of grupos.values()) {
    const roles = miembros.map((g) => g.rolFamiliar);
    const hayAdulto = roles.some(
      (r) => r === ROL_FAMILIAR.ESPOSO || r === ROL_FAMILIAR.ESPOSA || r === ROL_FAMILIAR.PADRE
    );
    const hayHijo = roles.includes(ROL_FAMILIAR.HIJO);

    for (const g of miembros) {
      if (g.rolFamiliar === ROL_FAMILIAR.HIJO && !hayAdulto) hijosHuerfanos.push(g);
      if (g.rolFamiliar === ROL_FAMILIAR.PADRE && !hayHijo) padresSinHijos.push(g);
      // Una S es "no hay a quién vincularlo": si comparte familia con
      // alguien más, o no es suelto o el grupo está mal puesto.
      if (g.rolFamiliar === ROL_FAMILIAR.SUELTO && miembros.length > 1) sueltosAcompanados.push(g);
    }

    const esposos = roles.filter((r) => r === ROL_FAMILIAR.ESPOSO).length;
    const esposas = roles.filter((r) => r === ROL_FAMILIAR.ESPOSA).length;
    if (esposos > 1 || esposas > 1) gruposConDobleConyuge.push(...miembros.filter((g) => g.rolFamiliar));
  }

  if (hijosHuerfanos.length)
    hallazgos.push(
      hallazgo(
        "hijoSinAdulto",
        "Hijo sin ningún adulto en su familia",
        "Marcados con H, pero en su grupo familiar no hay ni O, ni A, ni P. Nadie con quien sentarlos.",
        hijosHuerfanos
      )
    );

  if (padresSinHijos.length)
    hallazgos.push(
      hallazgo(
        "padreSinHijos",
        "Padre o madre sin hijos en su familia",
        "La P es para quien viene sin su cónyuge pero CON sus hijos. Si viene solo del todo, le corresponde una S.",
        padresSinHijos
      )
    );

  if (sueltosAcompanados.length)
    hallazgos.push(
      hallazgo(
        "sueltoConFamilia",
        "Suelto dentro de un grupo con más gente",
        "La S dice que no hay a quién vincularlo, pero comparte grupo familiar con otras personas. O no es suelto, o el grupo está mal.",
        sueltosAcompanados
      )
    );

  if (gruposConDobleConyuge.length)
    hallazgos.push(
      hallazgo(
        "dobleConyuge",
        "Dos esposos o dos esposas en el mismo grupo",
        "Probablemente son dos matrimonios distintos bajo el mismo apellido: hay que numerarlos (García 01, García 02) como el resto.",
        gruposConDobleConyuge
      )
    );

  const sinGrupo = invitados.filter((g) => !claveFamilia(g));
  if (sinGrupo.length)
    hallazgos.push(
      hallazgo(
        "sinGrupoFamiliar",
        "Sin grupo familiar ni apellido",
        "Se quedan fuera del reparto de mesas y de las invitaciones por familia.",
        sinGrupo
      )
    );

  const matrimoniosSinBoda = matrimoniosDeInvitados(invitados, evento.fecha)
    .filter((m) => m.aniversario === null)
    .map((m) => m.esposo);
  if (matrimoniosSinBoda.length)
    hallazgos.push(
      hallazgo(
        "matrimonioSinAnioBoda",
        "Matrimonios sin año de boda",
        "Sin ese dato no se puede calcular el aniversario que cumplen el día del evento.",
        matrimoniosSinBoda,
        "pendiente"
      )
    );

  // ⚠️ Aquí NO se comprueban los datos incompletos, ni quién no ha
  // pagado, ni quién está sin revisar, ni quién no tiene mesa: todo eso
  // ya son columnas de la lista, con su filtro y su cifra en la
  // cabecera. Estuvieron un rato y el usuario los quitó por duplicados
  // (2026-09-04), con razón. Este informe se queda SOLO con lo que
  // obliga a cruzar filas entre sí, que es lo que la lista no puede
  // enseñar por muchas columnas que tenga.
  return hallazgos;
}
