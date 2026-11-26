// «Lo invita el evento» (él, v103: «tengo una nueva pareja que su importe lo
// invita el evento… debe de salir el sello pagado porque sí está pagado pero
// no por ellos»). Lo marca el anfitrión en la Lista, en «Editar».
//
// Marcarlo deja a la persona pagada (la base también, trg_pago_y_asistencia:
// lo guarde quien lo guarde), con todo lo que va con pagar: el sello PAGADO
// de la invitación, el QR, el tablón y la entrada. Pero nadie cobra nada: su
// entrada vale 0 € (importeEsperadoInvitado), no está en «Entra», y lo que
// cobra el local por ella va en su propio apunte (invitacionesDelEvento, en
// lib/aPagar.js), como el DJ.
//
// Quitarlo la deja sin pagar: lo suyo no lo cobró ningún colaborador.
//
// Va por familia (norma 11): la pantalla pregunta con Sí/No si es para toda
// la familia; `familia: true`, todos los confirmados de su familia
// (claveFamilia), como el pago.
//
// ⚠️ Como al cobrar, antes tienen que estar sus datos obligatorios (año y
// alergias): pagado, la ficha se cierra al colaborador
// (fichaCerradaAlColaborador), y ya no podría rellenarlos. Si a alguno le
// faltan, no se marca a nadie y se avisa. En Modo Pruebas, no se exige.
import { claveFamilia, datosCompletos, esDj, loInvitaElEvento } from "./invitados";
import { listaConY, nombreCompleto } from "./formato";
import { requisitosActivos } from "./modoPruebas";

// A quién toca: la persona, o los confirmados de su familia. El DJ nunca (ya
// lo invita el evento por ser el DJ, v95.6, con su propio apunte).
export function aQuienInvita(invitados = [], id, familia = false) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return [];
  const clave = claveFamilia(g);
  const todos = familia && clave ? invitados.filter((x) => x.id === id || (x.confirmado && claveFamilia(x) === clave)) : [g];
  return todos.filter((x) => !esDj(x));
}

// `valor`: true marca, false quita. Devuelve { invitados, aviso }.
export function marcarInvitaEvento(invitados = [], id, valor, { familia = false, evento } = {}) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "No se encuentra a esa persona en la Lista: vuelve a abrirla." };
  if (esDj(g)) return { invitados, aviso: "Al DJ ya lo invita el evento: lleva su propio apunte en la Contabilidad." };

  const marcar = Boolean(valor);
  const cambian = aQuienInvita(invitados, id, familia).filter((x) => loInvitaElEvento(x) !== marcar);
  if (cambian.length === 0) return { invitados, aviso: "" };
  const sinDatos = marcar && requisitosActivos(evento) ? cambian.filter((x) => !datosCompletos(x)) : [];
  if (sinDatos.length > 0) {
    const varios = cambian.length > 1;
    const quienes = listaConY(sinDatos.map(nombreCompleto));
    return {
      invitados,
      aviso:
        `${varios ? "No se ha marcado a nadie" : "No se ha marcado"}: a ${quienes} ${sinDatos.length === 1 ? "le" : "les"} faltan los datos obligatorios (año de nacimiento y alergias). ` +
        `Primero, que los rellene su colaborador (o tú en la Lista): ${varios ? "al marcarlos cuentan como pagados y sus fichas se le cierran" : "al marcarlo cuenta como pagado y su ficha se le cierra"} al colaborador.`,
    };
  }
  const ids = new Set(cambian.map((x) => x.id));

  // Quien ya figuraba como pagado (lo cobró un colaborador): se marca igual,
  // pero se cuenta, porque ese dinero deja de sumar en «Entra».
  const yaPagados = marcar ? cambian.filter((x) => x.pagado) : [];
  const aviso =
    yaPagados.length === 0
      ? ""
      : `${listaConY(yaPagados.map(nombreCompleto))} ya ${yaPagados.length === 1 ? "figuraba" : "figuraban"} como ${yaPagados.length === 1 ? "pagado" : "pagados"}: si se cobró, ese dinero ya no cuenta en «Entra».`;

  return {
    invitados: invitados.map((x) =>
      ids.has(x.id)
        ? marcar
          ? // Lo mismo que hace la base al pagar: sin plazo pendiente.
            { ...x, invitaEvento: true, pagado: true, pagoPendienteHasta: null, plazosPago: 0 }
          : { ...x, invitaEvento: false, pagado: false }
        : x
    ),
    aviso,
  };
}

// La pregunta antes de marcar o quitar (normas 9 y 11): si en su familia hay
// alguien más a quien le afecte, «¿… a toda la familia?», y «No» es solo a
// esa persona. Si no, Sí / No a secas. `familia`: si se hace la pregunta de
// la familia (y entonces «No» = solo a ella).
export function preguntaInvitaEvento(invitados = [], id) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return null;
  const marcar = !loInvitaElEvento(g);
  const otros = aQuienInvita(invitados, id, true).filter((x) => x.id !== id && loInvitaElEvento(x) !== marcar);
  const quien = nombreCompleto(g);
  if (otros.length === 0) {
    return marcar
      ? { marcar, familia: false, titulo: "¿Lo invita el evento?", texto: `${quien} queda pagado sin que nadie le cobre: la invitación sale con el sello PAGADO y en la Contabilidad lleva su propio apunte.` }
      : { marcar, familia: false, titulo: "¿Quitar «Lo invita el evento»?", texto: `${quien} vuelve a estar sin pagar: su colaborador tendrá que cobrarle.` };
  }
  const todos = listaConY([g, ...otros].map(nombreCompleto));
  return marcar
    ? {
        marcar,
        familia: true,
        titulo: "¿Lo invita el evento a toda la familia?",
        texto: `${todos}: quedan pagados sin que nadie les cobre, con el sello PAGADO en la invitación y su propio apunte en la Contabilidad.\nCon «No», solo ${quien}.`,
      }
    : {
        marcar,
        familia: true,
        titulo: "¿Quitarlo a toda la familia?",
        texto: `${todos} dejan de estar invitados por el evento y vuelven a estar sin pagar.\nCon «No», solo ${quien}.`,
      };
}

// Lo que ve el colaborador si toca el sello «Pagado» de quien invita el
// evento: no puede quitarlo (la base lo deja pagado), y se le dice por qué.
export const AVISO_INVITA_EVENTO_COLABORADOR = "Su entrada la invita el evento: figura como pagado sin que nadie le cobre. Solo el anfitrión lo cambia, en la Lista.";

// Sin el SQL de la v103 la base no lo guarda: las filas no traen la columna.
export const faltaSqlInvitaEvento = (invitados = []) => invitados.length > 0 && !invitados.some((g) => "invitaEvento" in g);
