// Quién ha entrado al tablón (él, v75.2): un circulito tras su nombre en
// la Lista, sin columna nueva. Verde claro si ha entrado, rojo si nunca.
// Solo cuentan las entradas desde que la puerta pide también el año (v70,
// él: «solo me interesan los que han entrado desde el último cambio»): eso
// lo filtra la base (anfitrion_entradas_tablon).
//
// Llevan circulito los confirmados que no están excluidos del tablón
// (tablon_verificar_respuesta); «No asiste», no.
//
// Un tercer color, negro (él, v101.5: «necesito un tercer indicador de que
// no hay tablón»): quien no tiene tablón. Así el rojo cuenta solo a quien
// SÍ podría entrar y no lo ha hecho. Sin tablón = SIN TELÉFONO, tenga la
// edad que tenga (v101.6, él: «que no haya entrado es rojo, que no pueda es
// negro»): su enlace personal va por WhatsApp, y con «Solo con el enlace
// personal» por nombre no se entra. Los menores, que antes no llevaban
// circulito, cuentan como todos: con teléfono, rojo o verde. El negro es
// FIJO (él: «depende de lo que yo ya sepa de ese invitado»; el rojo y el
// verde cambian según entren): no mira las entradas.
import { calcularEdad } from "./invitados";

// `entradas`: { idInvitado: última entrada }, o null mientras no ha llegado
// (entonces, ningún circulito: un rojo antes de tiempo diría algo falso).
// `sinTablon`: sin teléfono, no puede entrar (negro).
export function estadoTablon(g, entradas, evento) {
  if (!entradas || !g.confirmado || g.noAsiste || g.excluidoTablon) return null;
  const sinAnio = calcularEdad(g.anioNacimiento, evento) === null;
  if (!String(g.telefono || "").trim()) return { entro: false, sinAnio, sinTablon: true };
  const cuando = entradas[g.id];
  return cuando ? { entro: true, cuando } : { entro: false, sinAnio, sinTablon: false };
}

// El recuento de la cabecera de la Lista (él, v75.2: «otros dos contadores
// con su círculo verde o rojo»): los mismos circulitos de las filas,
// contados. null mientras no han llegado las entradas.
export function contarTablon(invitados, entradas, evento) {
  if (!entradas) return null;
  const estados = invitados.map((g) => estadoTablon(g, entradas, evento)).filter(Boolean);
  const entraron = estados.filter((e) => e.entro).length;
  const sinTablon = estados.filter((e) => !e.entro && e.sinTablon).length;
  return { entraron, sinEntrar: estados.length - entraron - sinTablon, sinTablon };
}
