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
import { ROL_FAMILIAR } from "./rolFamiliar";
import { claveFamilia } from "./invitados";

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
    if (g?.rolFamiliar !== ROL_FAMILIAR.ESPOSO && g?.rolFamiliar !== ROL_FAMILIAR.ESPOSA) continue;
    const clave = claveFamilia(g);
    if (!porFamilia.has(clave)) porFamilia.set(clave, { esposos: [], esposas: [] });
    const familia = porFamilia.get(clave);
    if (g.rolFamiliar === ROL_FAMILIAR.ESPOSO) familia.esposos.push(g);
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

// Personas marcadas con O o A que se han quedado sin pareja dentro de
// su familia. REGLA DEL EVENTO, fijada por el usuario el 2026-09-04:
// los matrimonios vienen siempre los dos, así que si solo asiste uno de
// los cónyuges NO se le marca. Por tanto una marca suelta ya no es un
// caso válido que ignorar en silencio -- es una marca a medias (falta
// la pareja, o la familia está mal puesta) y hay que enseñarla para
// poder corregirla.
export function conyugesSueltos(invitados) {
  const porFamilia = new Map();
  for (const g of invitados || []) {
    if (g?.rolFamiliar !== ROL_FAMILIAR.ESPOSO && g?.rolFamiliar !== ROL_FAMILIAR.ESPOSA) continue;
    const clave = claveFamilia(g);
    if (!porFamilia.has(clave)) porFamilia.set(clave, { esposos: [], esposas: [] });
    const familia = porFamilia.get(clave);
    if (g.rolFamiliar === ROL_FAMILIAR.ESPOSO) familia.esposos.push(g);
    else familia.esposas.push(g);
  }

  const sueltos = [];
  for (const { esposos, esposas } of porFamilia.values()) {
    // Los que sobran del lado más largo: los primeros ya forman pareja.
    const parejas = Math.min(esposos.length, esposas.length);
    sueltos.push(...esposos.slice(parejas), ...esposas.slice(parejas));
  }
  return sueltos.sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es")
  );
}

// Los casados que vienen SIN su pareja y que él ha dado por buenos en la
// Revisión («Cónyuge sin su pareja», marcado como excepción, v71): no es una
// marca a medias, es así. Tienen su boda, su aniversario y su foto, así que
// en Aniversarios y en la cuenta de matrimonios son un matrimonio de uno.
// Sin esa excepción, una marca suelta sigue siendo un error que corregir.
export const EXCEPCION_SIN_PAREJA = "conyugeSinPareja";
export const vieneSinPareja = (g) => Array.isArray(g?.excepcionesRevision) && g.excepcionesRevision.includes(EXCEPCION_SIN_PAREJA);

export function matrimoniosConLosQueVienenSolos(invitados, fechaEvento) {
  const anioEvento = anioDelEvento(fechaEvento);
  const solos = conyugesSueltos(invitados)
    .filter(vieneSinPareja)
    .map((g) => {
      const anioBodaNumero = parseInt(g.anioBoda, 10);
      return {
        clave: `${claveFamilia(g)}-solo-${g.id}`,
        familia: primeroNoVacio(g.grupoFamiliar, g.apellido),
        esposo: g.rolFamiliar === ROL_FAMILIAR.ESPOSO ? g : null,
        esposa: g.rolFamiliar === ROL_FAMILIAR.ESPOSA ? g : null,
        zona: g.zona || "",
        anioBoda: String(g.anioBoda || ""),
        aniversario:
          anioEvento && Number.isFinite(anioBodaNumero) && anioBodaNumero > 1900 ? anioEvento - anioBodaNumero : null,
        confirmados: Boolean(g.confirmado),
        vieneSolo: true,
      };
    });
  return [...matrimoniosDeInvitados(invitados, fechaEvento), ...solos].sort((a, b) => a.familia.localeCompare(b.familia, "es"));
}

// «Gustavo y Míriam», o solo el nombre de quien viene sin su pareja.
export const nombresMatrimonio = (m) => [m?.esposo?.nombre, m?.esposa?.nombre].filter(Boolean).join(" y ");

export function contarMatrimonios(invitados) {
  return matrimoniosConLosQueVienenSolos(invitados, "").length;
}
