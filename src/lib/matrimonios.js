// Matrimonios entre los invitados (2026-09-03).
//
// Necesidad real del usuario: saber cuántos matrimonios hay en la lista
// y quiénes son. Cada pareja ya tiene su foto de boda, y está previsto
// hacerles una foto nueva en el evento -- ver la idea "Las bodas de
// todos", donde cada imagen lleva el sello con los años que cumplen.
//
// ⚠️ Cómo se empareja, decidido con el usuario antes de construir: por
// FAMILIA. Se marca a cada persona como "esposo" o "esposa" y la pareja
// sale de juntar a los dos dentro del mismo grupo familiar. No hay
// ningún campo que apunte de uno al otro. Es lo más cómodo de mantener
// (un solo dato por persona, sin emparejar a mano), a cambio de dos
// límites conocidos y aceptados: da por hecho un matrimonio por familia
// y una pareja de esposo + esposa. Si algún día hace falta más (dos
// matrimonios en una familia, matrimonios del mismo sexo, un cónyuge
// cuya pareja no está invitada), lo que toca es un emparejado
// explícito, no parchear esta función.
import { CONYUGE } from "./conyuge";

// La familia se identifica igual que en el resto de la app:
// `grupoFamiliar` y, si está vacío, el apellido.
function claveFamilia(g) {
  return String(g.grupoFamiliar || g.apellido || "").trim().toLowerCase();
}

function primeroNoVacio(...valores) {
  return valores.find((v) => String(v || "").trim() !== "") || "";
}

// El año del evento sale de `evento.fecha` ("2026-11-13"). Sin fecha
// válida no se puede calcular ningún aniversario: se devuelve null y
// quien pinte la tabla pone un guion, en vez de inventarse un número.
export function anioDelEvento(fecha) {
  const anio = parseInt(String(fecha || "").split("-")[0], 10);
  return Number.isFinite(anio) ? anio : null;
}

// Devuelve un matrimonio por cada pareja esposo+esposa encontrada,
// ordenados por familia. Cada uno trae ya todo lo que hace falta para
// pintarlo: los dos nombres, la zona, el año de boda y los años que
// cumplen EL DÍA DEL EVENTO (no hoy: la foto se hace ese día).
export function matrimoniosDeInvitados(invitados, fechaEvento) {
  const anioEvento = anioDelEvento(fechaEvento);
  const porFamilia = new Map();

  for (const g of invitados || []) {
    if (g?.conyuge !== CONYUGE.ESPOSO && g?.conyuge !== CONYUGE.ESPOSA) continue;
    const clave = claveFamilia(g);
    if (!porFamilia.has(clave)) porFamilia.set(clave, { esposos: [], esposas: [] });
    const familia = porFamilia.get(clave);
    if (g.conyuge === CONYUGE.ESPOSO) familia.esposos.push(g);
    else familia.esposas.push(g);
  }

  const matrimonios = [];
  for (const [clave, { esposos, esposas }] of porFamilia) {
    // Si una familia tuviera dos de cada (poco probable, pero no
    // imposible), se emparejan en el orden en que vengan en vez de
    // descartarlos: perder gente de la lista sería peor que emparejar
    // regular, y se ve a simple vista en la tabla.
    const parejas = Math.min(esposos.length, esposas.length);
    for (let i = 0; i < parejas; i++) {
      const esposo = esposos[i];
      const esposa = esposas[i];
      const anioBoda = primeroNoVacio(esposo.anioBoda, esposa.anioBoda);
      const anioBodaNumero = parseInt(anioBoda, 10);
      matrimonios.push({
        clave: `${clave}-${i}`,
        familia: primeroNoVacio(esposo.grupoFamiliar, esposa.grupoFamiliar, esposo.apellido, esposa.apellido),
        esposo,
        esposa,
        zona: primeroNoVacio(esposo.zona, esposa.zona),
        anioBoda,
        aniversario:
          anioEvento && Number.isFinite(anioBodaNumero) && anioBodaNumero > 1900
            ? anioEvento - anioBodaNumero
            : null,
        // Para la foto del evento hace falta que vengan los dos.
        confirmados: Boolean(esposo.confirmado && esposa.confirmado),
      });
    }
  }

  return matrimonios.sort((a, b) => a.familia.localeCompare(b.familia, "es"));
}

export function contarMatrimonios(invitados) {
  return matrimoniosDeInvitados(invitados, "").length;
}
