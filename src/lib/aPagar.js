// «A pagar», en Contabilidad (él, v88): lo recogido tiene que cubrir a tres
// acreedores —el local, el DJ y sus propios gastos— y se ve qué toca a cada
// uno. Lo que ENTRA (recaudado + propinas) y lo que SALE no se mezclan: la
// entrada del invitado (precioAdulto/precioNino) es una cosa y lo que cobra
// el local, otra; solo comparten las edades (tramoDeEdad).
//
// Los datos los escribe él, nunca van en el código (él: «datos que pueden
// ser variables»). Viven en evento."aPagar", privado (fuera de evento_publico):
//   { partidas: [{ id, concepto, adulto, nino }],  // por persona: menú, cóctel, tarta…
//     otros:    [{ id, concepto, importe }],        // del local, a mano
//     dj: "600" }                                   // lo que dice el DJ
// Los importes, como texto, igual que los gastos (parsePrecio al sumar).
// Las personas las cuenta la app: los confirmados de la Lista, el DJ también
// (el local le sirve como a uno más); sin año, como adulto.
import { parsePrecio } from "./formato";
import { calcularEdad, tramoDeEdad, importeEsperadoInvitado, esDj, TRAMO } from "./invitados";
import { totalGastos } from "./gastos";

const texto = (v) => String(v ?? "").trim();
const redondear = (n) => Math.round(n * 100) / 100;
const suma = (lista, campo) => redondear(lista.reduce((s, x) => s + parsePrecio(x[campo]), 0));

// Lo guardado, siempre con su forma (sin el SQL de la v88, o sin nada
// apuntado aún, vacío).
export function aPagarDe(evento) {
  const a = evento?.aPagar || {};
  return {
    partidas: Array.isArray(a.partidas) ? a.partidas : [],
    otros: Array.isArray(a.otros) ? a.otros : [],
    dj: texto(a.dj),
  };
}

// Sin el SQL de la v88 la base no tiene dónde guardarlo.
export const faltaSqlAPagar = (evento) => !evento || !("aPagar" in evento);

// Los confirmados, por tramo de edad. `sinAnio`: cuántos de los adultos lo
// son por no tener año (se enseña, para que se sepa que la cifra puede bajar).
export function personasDelLocal(invitados = [], evento) {
  const cuenta = { adulto: 0, nino: 0, bebe: 0, sinAnio: 0 };
  for (const g of invitados) {
    if (!g.confirmado) continue;
    cuenta[tramoDeEdad(g.anioNacimiento, evento)]++;
    if (calcularEdad(g.anioNacimiento, evento) === null) cuenta.sinAnio++;
  }
  return cuenta;
}

// Lo que cobra el local por cada persona: la suma de sus partidas.
export const precioPorPersona = (partidas = []) => ({ adulto: suma(partidas, "adulto"), nino: suma(partidas, "nino") });

export function costeLocal(aPagar, personas) {
  const porPersona = precioPorPersona(aPagar.partidas);
  const adultos = redondear(personas.adulto * porPersona.adulto);
  const ninos = redondear(personas.nino * porPersona.nino);
  const otros = suma(aPagar.otros, "importe");
  return { porPersona, adultos, ninos, otros, total: redondear(adultos + ninos + otros) };
}

// La cuenta del local, para pagarle (él, v93.1): cada partida (cóctel,
// cena, tarta…) con sus adultos y sus niños, y lo demás del local. Sin lo
// recaudado: es lo que se le enseña al local. El total es el mismo de «A
// pagar» (costeLocal).
export function cuentaDelLocal(aPagar, personas) {
  const partidas = aPagar.partidas.map((p) => {
    const adulto = parsePrecio(p.adulto);
    const nino = parsePrecio(p.nino);
    const adultos = redondear(personas.adulto * adulto);
    const ninos = redondear(personas.nino * nino);
    return { id: p.id, concepto: p.concepto, adulto, nino, adultos, ninos, total: redondear(adultos + ninos) };
  });
  const otros = aPagar.otros.map((o) => ({ id: o.id, concepto: o.concepto, importe: parsePrecio(o.importe) }));
  return { partidas, otros, total: costeLocal(aPagar, personas).total };
}

// Lo recaudado, por edades (él, v94.5: «cuántos de más de 8 años pagaron los
// 47 €, cuántos como niños»): los confirmados ya pagados, sin el DJ, cada uno
// por el precio de su entrada (importeEsperadoInvitado: la suma es la misma
// de «Recaudado»). Los bebés no pagan: salen todos los confirmados.
export function desgloseRecaudado(invitados = [], evento) {
  const tramos = { adulto: { personas: 0, importe: 0 }, nino: { personas: 0, importe: 0 }, bebe: { personas: 0 } };
  for (const g of invitados) {
    if (!g.confirmado || esDj(g)) continue;
    const tramo = tramoDeEdad(g.anioNacimiento, evento);
    if (tramo === TRAMO.BEBE) {
      tramos.bebe.personas++;
      continue;
    }
    if (!g.pagado) continue;
    tramos[tramo].personas++;
    tramos[tramo].importe += importeEsperadoInvitado(g, evento);
  }
  tramos.adulto.importe = redondear(tramos.adulto.importe);
  tramos.nino.importe = redondear(tramos.nino.importe);
  return { ...tramos, precioAdulto: parsePrecio(evento?.precioAdulto), precioNino: parsePrecio(evento?.precioNino) };
}

// Todo junto: lo que entra, lo que sale a cada uno y lo que sobra (o falta,
// si `diferencia` es negativa).
export function resumenAPagar({ evento, invitados, gastos = [], recaudado = 0, propinas = 0 }) {
  const aPagar = aPagarDe(evento);
  const personas = personasDelLocal(invitados, evento);
  const local = costeLocal(aPagar, personas);
  const dj = parsePrecio(aPagar.dj);
  const tusGastos = redondear(totalGastos(gastos));
  const entra = redondear(recaudado + propinas);
  const sale = redondear(local.total + dj + tusGastos);
  return { personas, local, dj, tusGastos, entra, sale, diferencia: redondear(entra - sale) };
}

// Un importe escrito a mano: vacío vale (aún no se sabe); si hay algo, tiene
// que ser un número de 0 en adelante. Devuelve el texto limpio, o null.
function importeValido(valor) {
  const t = texto(valor);
  if (!t) return "";
  if (!/^\d+([.,]\d{1,2})?$/.test(t.replace(/\s*€$/, ""))) return null;
  return t.replace(/\s*€$/, "");
}

// Lo de la ventanita «Lo que cobra el local», listo para guardar. Las filas
// vacías se quitan. Devuelve { valor, aviso }: con aviso, no se guarda.
export function limpiarLocal(borrador, actual) {
  const partidas = [];
  for (const p of borrador.partidas || []) {
    const concepto = texto(p.concepto);
    const adulto = importeValido(p.adulto);
    const nino = importeValido(p.nino);
    if (!concepto && !texto(p.adulto) && !texto(p.nino)) continue;
    if (!concepto) return { valor: actual, aviso: "A una partida le falta el nombre (Menú, Cóctel…)." };
    if (adulto === null || nino === null) return { valor: actual, aviso: `El precio de «${concepto}»: escribe solo el número, por ejemplo 65 o 6,50.` };
    partidas.push({ id: p.id, concepto, adulto, nino });
  }
  const otros = [];
  for (const o of borrador.otros || []) {
    const concepto = texto(o.concepto);
    const importe = importeValido(o.importe);
    if (!concepto && !texto(o.importe)) continue;
    if (!concepto) return { valor: actual, aviso: "A un gasto del local le falta el nombre." };
    if (importe === null) return { valor: actual, aviso: `El importe de «${concepto}»: escribe solo el número, por ejemplo 200.` };
    otros.push({ id: o.id, concepto, importe });
  }
  return { valor: { ...aPagarDe({ aPagar: actual }), partidas, otros }, aviso: "" };
}

// Lo que cobra el DJ, escrito en su línea. Devuelve { valor, aviso }.
export function conDj(actual, valor) {
  const dj = importeValido(valor);
  if (dj === null) return { valor: actual, aviso: "Lo del DJ: escribe solo el número, por ejemplo 600." };
  return { valor: { ...aPagarDe({ aPagar: actual }), dj }, aviso: "" };
}
