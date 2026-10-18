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
// `yo` viene de tablon_quien_soy: solo sí o no, nunca sus datos. Sin esos
// tres (el servidor aún sin el SQL v69.4) no hay guía: mejor nada que una
// ronda equivocada.
export function rondasTablon(yo, evento) {
  if (!yo || yo.datosCompletos === undefined) return null;
  const ronda = evento?.asistenciaAbierta ? 3 : !yo.datosCompletos ? 1 : 2;
  const estado = (n, hecha) => (hecha ? "hecha" : ronda === n ? "ahora" : "pendiente");
  return [
    { id: "datos", etiqueta: "Datos", estado: estado(1, yo.datosCompletos), nota: "Completos" },
    { id: "recaudacion", etiqueta: "Recaudación", estado: estado(2, yo.pagado), nota: "Pagado" },
    { id: "acreditacion", etiqueta: "Acreditación", estado: estado(3, ronda === 3 && yo.presente), nota: "Ya estás dentro" },
  ];
}
