import { importeEsperadoInvitado } from "./invitados";
import { euros } from "./formato";

// La guía de las tres rondas, en el tablón de cada invitado (él, v69.4):
// Datos, Recaudación y Acreditación, y en cuál está. La marca su propio
// ritmo, no el anfitrión:
//   - sin los datos completos, sigue en Datos;
//   - con ellos, pasa a Recaudación aunque su colaborador no le haya pedido
//     todavía el dinero: si quiere, paga ya, y sale «Pagado»;
//   - el día del evento, al abrir el anfitrión las Llegadas, todos pasan a
//     Acreditación; ya acreditado, «Ya estás dentro».
// Cada ronda: «ahora» (la suya), «hecha» (cumplida, clara y con su visto)
// o «pendiente» (difuminada, pero se lee).
//
// «Pagado» lleva su importe (él, v70.1: «Pagado · 94 €»): el de su entrada,
// con la misma cuenta que usa el colaborador al cobrar
// (importeEsperadoInvitado), con el año con el que entró (`yo.anio`).
//
// `yo` viene de tablon_quien_soy: solo sí o no, nunca sus datos. Sin esos
// tres (el servidor aún sin el SQL v69.4) no hay guía: mejor nada que una
// ronda equivocada.
// El importe de su entrada: el año con el que entró y su zona (el DJ, 0 €);
// a quien invita el evento (v103), 0 €: su «Pagado» va sin cifra.
// Una sola cuenta para la guía y para «Te falta» (norma 7).
const importeDe = (yo, evento) =>
  yo?.anio ? importeEsperadoInvitado({ anioNacimiento: yo.anio, zona: yo.zona, invitaEvento: yo.invitaEvento }, evento) : 0;

export function rondasTablon(yo, evento) {
  if (!yo || yo.datosCompletos === undefined) return null;
  const importe = importeDe(yo, evento);
  const ronda = evento?.asistenciaAbierta ? 3 : !yo.datosCompletos ? 1 : 2;
  const estado = (n, hecha) => (hecha ? "hecha" : ronda === n ? "ahora" : "pendiente");
  return [
    { id: "datos", etiqueta: "Datos", estado: estado(1, yo.datosCompletos), nota: "Completos" },
    // A quien invita el evento (v103.1, él: «deberían poder ver ese regalo
    // dorado en pago»), el regalo de la Lista en vez del visto.
    {
      id: "recaudacion",
      etiqueta: "Recaudación",
      estado: estado(2, yo.pagado),
      nota: importe > 0 ? `Pagado · ${euros(importe)}` : "Pagado",
      ...(yo.invitaEvento === true && { regalo: true }),
    },
    { id: "acreditacion", etiqueta: "Acreditación", estado: estado(3, ronda === 3 && yo.presente), nota: "Ya estás dentro" },
  ];
}

// «Te falta» (él, v87.2): al abrir el tablón, lo que le queda por dar a su
// colaborador, en una ventana con el resto atenuado. Primero, y muy
// resaltado, el importe: «es muy importante poder recoger el dinero de tu
// entrada». Debajo, más apagados, la foto de boda (solo el matrimonio, sin
// «No tienen») y las alergias (con el año ya puesto, porque entró con él,
// datosCompletos solo puede fallar por ellas). Lo que la base no manda (un
// SQL sin subir), no sale. null: no le falta nada.
export function pendientesDelTablon(yo, evento) {
  if (!yo) return null;
  const importe = importeDe(yo, evento);
  const pendientes = {
    importe: yo.pagado === false && importe > 0 ? importe : 0,
    fotoBoda: yo.faltaFotoBoda === true,
    alergias: yo.datosCompletos === false,
  };
  return pendientes.importe || pendientes.fotoBoda || pendientes.alergias ? pendientes : null;
}
