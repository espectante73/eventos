// Quién ha entrado al tablón (él, v75.2): un circulito tras su nombre en
// la Lista, sin columna nueva. Verde claro si ha entrado, rojo si nunca.
// Solo cuentan las entradas desde que la puerta pide también el año (v70,
// él: «solo me interesan los que han entrado desde el último cambio»): eso
// lo filtra la base (anfitrion_entradas_tablon).
//
// Llevan circulito solo quienes PUEDEN entrar: la puerta deja pasar a los
// confirmados que no están excluidos del tablón (tablon_verificar_respuesta);
// y, de ellos, los de 16 años cumplidos (él: «menores de 16 no cuentan»; la
// misma edad que el email propio y las fotos de la fiesta). «No asiste»,
// tampoco.
import { calcularEdad, EDAD_EMAIL } from "./invitados";

// `entradas`: { idInvitado: última entrada }, o null mientras no ha llegado
// (entonces, ningún circulito: un rojo antes de tiempo diría algo falso).
export function estadoTablon(g, entradas, evento) {
  if (!entradas || !g.confirmado || g.noAsiste || g.excluidoTablon) return null;
  const edad = calcularEdad(g.anioNacimiento, evento);
  if (edad !== null && edad < EDAD_EMAIL) return null;
  const cuando = entradas[g.id];
  return cuando ? { entro: true, cuando } : { entro: false, sinAnio: edad === null };
}

// El recuento de la cabecera de la Lista (él, v75.2: «otros dos contadores
// con su círculo verde o rojo»): los mismos circulitos de las filas,
// contados. null mientras no han llegado las entradas.
export function contarTablon(invitados, entradas, evento) {
  if (!entradas) return null;
  const estados = invitados.map((g) => estadoTablon(g, entradas, evento)).filter(Boolean);
  const entraron = estados.filter((e) => e.entro).length;
  return { entraron, sinEntrar: estados.length - entraron };
}
