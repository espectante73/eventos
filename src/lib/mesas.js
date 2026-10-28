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
// Se sientan los CONFIRMADOS (la mesa es sitio real para quien va a venir).
// Quien de la familia no está confirmado todavía se queda sin mesa; al
// confirmarlo, se sienta con los suyos (confirmarConSuFamilia). Desde la
// v74.2, en «Mesas y acomodación» se sienta también a quien aún no ha
// confirmado: su sitio queda reservado y cuenta en la mesa (seSientaEnMesa).

import { nombreCompleto } from "./formato";

// ⚠️ Es `claveFamilia` (lib/invitados.js) MÁS el id como último recurso:
// dos fichas a medio crear, sin grupo ni apellido, compartirían clave y
// acabarían sentadas en la misma mesa. En el resto de la app esa clave
// vacía simplemente se salta, así que allí no hace falta.
export function claveFamiliaMesa(g) {
  return String(g?.grupoFamiliar || g?.apellido || g?.id || "").trim().toLowerCase();
}

function nombreFamilia(g) {
  return g.grupoFamiliar || g.apellido || `${g.nombre || ""}`.trim() || "(sin nombre)";
}

// Quién ocupa sitio en una mesa: los confirmados y, desde la v74.2 (él:
// «sentar también a los no confirmados para cuadrar con tiempo»), quien
// aún no lo está pero ya tiene su sitio reservado. «No asiste» libera el
// suyo. Una sola regla para asignar a mano, confirmar, auto-asignar, el
// reparto por familias y las cifras de cada mesa.
// `conSinConfirmar`: en «Mesas y acomodación» se sientan también los que aún
// no han confirmado ni tienen sitio.
export function seSientaEnMesa(g, conSinConfirmar = false) {
  return Boolean(g.confirmado) || (!g.noAsiste && (conSinConfirmar || g.mesa != null));
}

// Los sitios ocupados de una mesa.
export function ocupacion(invitados, numero) {
  return invitados.filter((g) => g.mesa === numero && seSientaEnMesa(g)).length;
}

// Pone (o quita, con numero = null) la mesa a un invitado Y a toda su
// familia confirmada. Devuelve { invitados, aviso }: si hay aviso, la lista
// vuelve sin tocar y el aviso dice por qué.
// Opciones (las usa «Mesas y acomodación»): `comoSeLlama`, cómo nombrar a la
// familia en el aviso (por su «O»: «de García, Isaias»); `conSinConfirmar`,
// sentar también a los que aún no han confirmado (seSientaEnMesa).
export function asignarMesaConSuFamilia(invitados, id, numero, mesas, { comoSeLlama, conSinConfirmar = false } = {}) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };
  const clave = claveFamiliaMesa(g);
  const familia = invitados.filter((x) => claveFamiliaMesa(x) === clave);

  // Quitar la mesa: a toda la familia, confirmada o no.
  if (!numero) {
    const ids = new Set(familia.map((x) => x.id));
    return { invitados: invitados.map((x) => (ids.has(x.id) ? { ...x, mesa: null } : x)), aviso: "" };
  }

  if (!seSientaEnMesa(g, conSinConfirmar)) {
    return {
      invitados,
      aviso: nombreCompleto(g) + " todavía no está confirmado: confírmalo antes de asignarle mesa.",
    };
  }

  // Con los suyos que ya tienen sitio reservado, aunque no hayan confirmado:
  // si se quedaran en la mesa de antes, la familia se partiría.
  const sentados = familia.filter((x) => seSientaEnMesa(x, conSinConfirmar));
  const entran = sentados.filter((x) => x.mesa !== numero).length;
  const mesa = mesas.find((m) => m.numero === numero);
  if (mesa && ocupacion(invitados, numero) + entran > mesa.capacidad) {
    const libres = Math.max(mesa.capacidad - ocupacion(invitados, numero), 0);
    const quedan = libres === 0 ? "no queda ningún sitio" : libres === 1 ? "solo queda 1 sitio" : `solo quedan ${libres} sitios`;
    return {
      invitados,
      aviso:
        `La familia ${comoSeLlama || nombreFamilia(g)} son ${sentados.length} y en la mesa ${numero} ${quedan}. ` +
        "Una familia no se separa: sube la capacidad de la mesa o elige otra.",
    };
  }

  const ids = new Set(sentados.map((x) => x.id));
  return { invitados: invitados.map((x) => (ids.has(x.id) ? { ...x, mesa: numero } : x)), aviso: "" };
}

// Confirmar (o desconfirmar) a un invitado. Si al confirmarlo su familia ya
// está sentada en una mesa, se sienta con ella -- si cabe. Si no cabe, se
// confirma igual, se queda sin mesa y el aviso lo dice.
export function confirmarConSuFamilia(invitados, id, mesas) {
  const g = invitados.find((x) => x.id === id);
  if (!g) return { invitados, aviso: "" };
  const confirmado = !g.confirmado;
  // Confirmar a quien dijo que no iba lo quita de «No asiste» (también lo
  // hace la base, trg_pago_y_asistencia).
  const siguiente = invitados.map((x) => (x.id === id ? { ...x, confirmado, ...(confirmado ? { noAsiste: false } : {}) } : x));
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
        nombreCompleto(g) +
        ` ya está confirmado, pero en la mesa ${numero} de su familia no queda sitio: ` +
        "sube la capacidad de esa mesa para sentarlo con los suyos.",
    };
  }
  return { invitados: siguiente.map((x) => (x.id === id ? { ...x, mesa: numero } : x)), aviso: "" };
}

// Auto-asignar (antes en la ventana Mesas; desde la v74.6, una propuesta
// dentro de la prueba de «Mesas y acomodación», que se repasa antes de
// aplicarla). Nunca reparte una familia entre varias mesas por su cuenta:
// si parte ya está sentada, completa el resto en esa misma mesa; si no cabe
// entera (ahí o en cualquier otra), la deja sin mesa y lo dice en `avisos`.
// Sienta a los confirmados; cuenta los sitios ya reservados (ocupacion).
export function autoAsignarMesas(invitados, mesas) {
  const nuevos = invitados.map((g) => ({ ...g }));
  const ocupados = {};
  mesas.forEach((m) => {
    ocupados[m.numero] = ocupacion(nuevos, m.numero);
  });

  const grupos = {};
  nuevos.forEach((g) => {
    if (g.confirmado) (grupos[claveFamiliaMesa(g)] = grupos[claveFamiliaMesa(g)] || []).push(g);
  });

  const avisos = [];
  // Las familias con más gente sin sentar van primero, para que no se queden
  // sin hueco por culpa de familias pequeñas que se adelantaron.
  const ordenados = Object.values(grupos).sort((a, b) => b.filter((g) => !g.mesa).length - a.filter((g) => !g.mesa).length);
  const sentar = (sinMesa, numero) => {
    sinMesa.forEach((g) => {
      g.mesa = numero;
    });
    ocupados[numero] = (ocupados[numero] || 0) + sinMesa.length;
  };
  const personas = (n) => `${n} persona${n !== 1 ? "s" : ""}`;

  ordenados.forEach((grupo) => {
    const sinMesa = grupo.filter((g) => !g.mesa);
    if (sinMesa.length === 0) return;
    const familia = nombreFamilia(grupo[0]);
    const usadas = [...new Set(grupo.filter((g) => g.mesa).map((g) => g.mesa))];

    if (usadas.length > 1) {
      avisos.push({ familia, motivo: `ya está repartida a mano entre las mesas ${usadas.join(", ")}: revísalo si no era a propósito` });
      return;
    }
    const suya = usadas.length === 1 ? mesas.find((m) => m.numero === usadas[0]) : null;
    if (suya) {
      const hueco = suya.capacidad - (ocupados[suya.numero] || 0);
      if (hueco >= sinMesa.length) sentar(sinMesa, suya.numero);
      else avisos.push({ familia, motivo: `no caben ${personas(sinMesa.length)} más en la mesa ${suya.numero} (solo ${Math.max(hueco, 0)} libres): se quedan sin mesa` });
      return;
    }
    const libre = mesas.find((m) => m.capacidad - (ocupados[m.numero] || 0) >= sinMesa.length);
    if (libre) sentar(sinMesa, libre.numero);
    else avisos.push({ familia, motivo: `ninguna mesa tiene ${sinMesa.length} sitio${sinMesa.length !== 1 ? "s" : ""} libres juntos: se queda sin mesa` });
  });

  return { invitados: nuevos, avisos };
}
