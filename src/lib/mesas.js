// Mesas y familias: una familia NO se separa (regla inflexible del
// usuario, 2026-09-19). "Les he puesto el mismo apellido y el rol porque no
// deben separarse en el evento."
//
// La familia es la misma que ya usaba el "Auto-asignar": el grupo familiar
// o, si está vacío, el apellido. Una sola definición para las dos cosas
// (claveFamiliaMesa), así asignar a mano y asignar solo nunca pueden
// entender "familia" de dos maneras distintas.
//
// Un hijo mayor que va con otro apellido es OTRO grupo familiar: esta regla
// no le afecta, y se le sienta aparte si hace falta. Eso es a propósito.
//
// Solo se sientan los CONFIRMADOS (la mesa es sitio real para quien va a
// venir). Quien de la familia no está confirmado todavía se queda sin mesa;
// al confirmarlo, se sienta con los suyos (confirmarConSuFamilia).

export function claveFamiliaMesa(g) {
  return String(g?.grupoFamiliar || g?.apellido || g?.id || "").trim().toLowerCase();
}

function nombreFamilia(g) {
  return g.grupoFamiliar || g.apellido || `${g.nombre || ""}`.trim() || "(sin nombre)";
}

function ocupacion(invitados, numero) {
  return invitados.filter((g) => g.mesa === numero && g.confirmado).length;
}

// Pone (o quita, con numero = null) la mesa a un invitado Y a toda su
// familia confirmada. Devuelve { invitados, aviso }: si hay aviso, la lista
// vuelve sin tocar y el aviso dice por qué.
export function asignarMesaConSuFamilia(invitados, id, numero, mesas) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };
  const clave = claveFamiliaMesa(g);
  const familia = invitados.filter((x) => claveFamiliaMesa(x) === clave);

  // Quitar la mesa: a toda la familia, confirmada o no.
  if (!numero) {
    const ids = new Set(familia.map((x) => x.id));
    return { invitados: invitados.map((x) => (ids.has(x.id) ? { ...x, mesa: null } : x)), aviso: "" };
  }

  if (!g.confirmado) {
    return {
      invitados,
      aviso: `${g.nombre} ${g.apellido}`.trim() + " todavía no está confirmado: confírmalo antes de asignarle mesa.",
    };
  }

  const confirmados = familia.filter((x) => x.confirmado);
  const entran = confirmados.filter((x) => x.mesa !== numero).length;
  const mesa = mesas.find((m) => m.numero === numero);
  if (mesa && ocupacion(invitados, numero) + entran > mesa.capacidad) {
    const libres = Math.max(mesa.capacidad - ocupacion(invitados, numero), 0);
    return {
      invitados,
      aviso:
        `La familia ${nombreFamilia(g)} son ${confirmados.length} y en la mesa ${numero} ` +
        `${libres === 1 ? "solo queda 1 sitio" : `solo quedan ${libres} sitios`}. ` +
        "Una familia no se separa: sube la capacidad de la mesa o elige otra.",
    };
  }

  const ids = new Set(confirmados.map((x) => x.id));
  return { invitados: invitados.map((x) => (ids.has(x.id) ? { ...x, mesa: numero } : x)), aviso: "" };
}

// Confirmar (o desconfirmar) a un invitado. Si al confirmarlo su familia ya
// está sentada en una mesa, se sienta con ella -- si cabe. Si no cabe, se
// confirma igual, se queda sin mesa y el aviso lo dice.
export function confirmarConSuFamilia(invitados, id, mesas) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };
  const confirmado = !g.confirmado;
  const siguiente = invitados.map((x) => (x.id === id ? { ...x, confirmado } : x));
  if (!confirmado || g.mesa) return { invitados: siguiente, aviso: "" };

  const clave = claveFamiliaMesa(g);
  const mesasDeLaFamilia = [
    ...new Set(
      siguiente
        .filter((x) => x.id !== id && x.confirmado && x.mesa && claveFamiliaMesa(x) === clave)
        .map((x) => x.mesa)
    ),
  ];
  // Sin mesa todavía, o ya repartida (eso lo avisa la Revisión): no se toca.
  if (mesasDeLaFamilia.length !== 1) return { invitados: siguiente, aviso: "" };

  const numero = mesasDeLaFamilia[0];
  const mesa = mesas.find((m) => m.numero === numero);
  if (mesa && ocupacion(siguiente, numero) + 1 > mesa.capacidad) {
    return {
      invitados: siguiente,
      aviso:
        `${g.nombre} ${g.apellido}`.trim() +
        ` ya está confirmado, pero en la mesa ${numero} de su familia no queda sitio: ` +
        "sube la capacidad de esa mesa para sentarlo con los suyos.",
    };
  }
  return { invitados: siguiente.map((x) => (x.id === id ? { ...x, mesa: numero } : x)), aviso: "" };
}
