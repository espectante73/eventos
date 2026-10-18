// Informe de revisión de la Lista de invitados (2026-09-04).
//
// Para qué: el usuario lo pidió con estas palabras -- "cuanto más
// crezca, más posibilidad de error voy a tener con algún invitado y es
// algo que no quiero que me pase". Con ~140 invitados, un despiste no
// se ve mirando la lista: hay que buscarlo.
//
// ⚠️ Esto NO vuelve a listar invitados. Es la regla que ya nos costó
// una ventana entera (ver CLAUDE.md, "La Lista de invitados es la
// raíz"): una vista que solo reordena lo que la lista ya enseña es un
// duplicado. Aquí solo se calculan INCOHERENCIAS -- cosas que la lista
// no puede decir por sí sola porque hay que cruzar filas entre ellas.
// Cada hallazgo devuelve las personas afectadas para poder saltar a
// ellas en la propia lista, que sigue siendo donde se corrige.
import { ROL_FAMILIAR } from "./rolFamiliar";
import { calcularEdad, familiasSinEmail, claveFamilia, ROLES_CON_EMAIL_FAMILIAR } from "./invitados";
import { conyugesSueltos, matrimoniosDeInvitados, EXCEPCION_SIN_PAREJA } from "./matrimonios";
import { colaboradoresSinFichaEnlazada, mismaPersona } from "./edicionInvitados";
import { NOMBRES_HABITUALES } from "./nombresHabituales";

// Quién necesita a un adulto suyo al lado en la mesa.
//
// ⚠️ REGLA DEL EVENTO, confirmada por el usuario el 2026-09-04: en esta
// boda NO habrá mesa de niños. Todos los menores se sientan con sus
// padres, y solo los mayores de edad pueden sentarse en otra mesa. Por
// eso esta comprobación es estricta a propósito y no admite
// excepciones: un menor lejos de los suyos SIEMPRE es un error, nunca
// una mesa de niños montada aposta. Si en un evento futuro sí la
// hubiera, esto habría que replantearlo, no silenciarlo.
//
// Y por eso el corte son 18 años exactos, que es justo la frontera que
// puso el usuario. No se usan los tramos de precio
// (`edadNinoDesde`/`edadNinoHasta`) porque esos dicen quién PAGA y
// cuánto, que es otra cosa: un chaval de 12 paga como adulto y sigue
// sin poder quedarse solo en una mesa de desconocidos.
const EDAD_MENOR = 18;

// REGLA DEL USUARIO (2026-09-19): cada colaborador lleva un número parecido
// de invitados, entre 10 y 12, para que el trabajo y el dinero a recoger
// sean iguales para todos ("el mismo peso de responsabilidad"). Está por
// encima de juntar a un matrimonio con un mismo colaborador.
export const INVITADOS_POR_COLABORADOR = { minimo: 10, maximo: 12 };

// Un adulto es quien tiene 18 o más. A quien no ha dado su año de
// nacimiento todavía se le cuenta como adulto SI lleva un papel de
// adulto (O, A, P o S): en plena recogida de datos falta media lista, y
// un informe que se dispara con cada hueco acaba ignorándose.
//
// Esta indulgencia es TRANSITORIA por diseño, no un agujero: el año de
// nacimiento es uno de los dos datos obligatorios del formulario (con
// las alergias, ver datosCompletos en lib/invitados.js), así que un
// invitado no cuenta como completo hasta que está. Cuando la recogida
// termine no quedará ni una edad sin saber, y esta rama dejará de
// usarse sola.
function esAdulto(g, evento) {
  const edad = calcularEdad(g.anioNacimiento, evento);
  if (edad !== null) return edad >= EDAD_MENOR;
  return [ROL_FAMILIAR.ESPOSO, ROL_FAMILIAR.ESPOSA, ROL_FAMILIAR.PADRE, ROL_FAMILIAR.SUELTO].includes(g.rolFamiliar);
}

function agruparPorFamilia(invitados) {
  const grupos = new Map();
  for (const g of invitados || []) {
    const clave = claveFamilia(g);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(g);
  }
  return grupos;
}

// `tipo` separa lo que está MAL de lo que solo está pendiente: un hijo
// sin adulto es un error de datos, y un confirmado sin mesa es trabajo
// que queda. Mezclarlos haría que el informe cansara y se ignorara.
// Como compara el tablón (normalizar_nombre_tablon, en la base; si cambia
// allí, supabase/schema.test.js avisa de cambiarlo aquí): ni
// mayúsculas, ni tildes (tampoco la ç o la ñ), ni comas ni espacios de más.
export function comoElTablon(texto) {
  return String(texto || "")
    .replace(/[,\s]+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// El apellido de una familia: su grupo sin el número ("Medina01" -> "Medina").
export const apellidoDelGrupo = (grupo) => String(grupo || "").replace(/\s*\d+\s*$/, "").trim();

// ¿Se diferencian en una sola letra (una cambiada, de más o de menos, o
// dos seguidas al revés)?
export function unaLetraDeDiferencia(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length)
    return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

// Los nombres habituales, por cómo los compara el tablón -> bien escritos.
const HABITUALES = new Map(NOMBRES_HABITUALES.map((n) => [comoElTablon(n), n]));
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y"]);

// Si un nombre parece mal escrito, a cuál se parece: no es habitual (ni se
// repite en la lista, que lo da por bueno) y se queda a una letra de uno
// que sí lo es. Por palabras: «María del Carmn» -> «Carmen».
export function nombreParecido(nombre, conocidos = new Set()) {
  for (const palabra of comoElTablon(nombre).split(" ")) {
    if (palabra.length < 3 || PARTICULAS.has(palabra) || HABITUALES.has(palabra) || conocidos.has(palabra)) continue;
    const parecidos = [...HABITUALES.keys()].filter((h) => unaLetraDeDiferencia(palabra, h));
    if (parecidos.length) return parecidos.slice(0, 2).map((h) => HABITUALES.get(h));
  }
  return null;
}

function hallazgo(clave, titulo, ayuda, personas, tipo = "error") {
  return { clave, titulo, ayuda, tipo, personas };
}

function todosLosHallazgos(invitados = [], evento = {}, colaboradores = []) {
  const grupos = agruparPorFamilia(invitados);
  const hallazgos = [];

  const sueltos = conyugesSueltos(invitados);
  if (sueltos.length)
    hallazgos.push(
      hallazgo(
        EXCEPCION_SIN_PAREJA,
        "Cónyuge sin su pareja",
        "Marcados con O o con A pero sin el otro en su familia. O falta marcar al cónyuge, o esa marca sobra (si viene solo, va P o S).",
        sueltos
      )
    );

  const hijosHuerfanos = [];
  const padresSinHijos = [];
  const sueltosAcompanados = [];
  const gruposConDobleConyuge = [];

  for (const miembros of grupos.values()) {
    const roles = miembros.map((g) => g.rolFamiliar);
    const hayAdulto = roles.some(
      (r) => r === ROL_FAMILIAR.ESPOSO || r === ROL_FAMILIAR.ESPOSA || r === ROL_FAMILIAR.PADRE
    );
    const hayHijo = roles.includes(ROL_FAMILIAR.HIJO);

    for (const g of miembros) {
      if (g.rolFamiliar === ROL_FAMILIAR.HIJO && !hayAdulto) hijosHuerfanos.push(g);
      if (g.rolFamiliar === ROL_FAMILIAR.PADRE && !hayHijo) padresSinHijos.push(g);
      // Una S es "no hay a quién vincularlo": si comparte familia con
      // alguien más, o no es suelto o el grupo está mal puesto.
      if (g.rolFamiliar === ROL_FAMILIAR.SUELTO && miembros.length > 1) sueltosAcompanados.push(g);
    }

    const esposos = roles.filter((r) => r === ROL_FAMILIAR.ESPOSO).length;
    const esposas = roles.filter((r) => r === ROL_FAMILIAR.ESPOSA).length;
    if (esposos > 1 || esposas > 1) gruposConDobleConyuge.push(...miembros.filter((g) => g.rolFamiliar));
  }

  if (hijosHuerfanos.length)
    hallazgos.push(
      hallazgo(
        "hijoSinAdulto",
        "Hijo sin ningún adulto en su familia",
        "Marcados con H, pero en su grupo familiar no hay ni O, ni A, ni P. Nadie con quien sentarlos.",
        hijosHuerfanos
      )
    );

  if (padresSinHijos.length)
    hallazgos.push(
      hallazgo(
        "padreSinHijos",
        "Padre o madre sin hijos en su familia",
        "La P es para quien viene sin su cónyuge pero CON sus hijos. Si viene solo del todo, le corresponde una S.",
        padresSinHijos
      )
    );

  if (sueltosAcompanados.length)
    hallazgos.push(
      hallazgo(
        "sueltoConFamilia",
        "Suelto dentro de un grupo con más gente",
        "La S dice que no hay a quién vincularlo, pero comparte grupo familiar con otras personas. O no es suelto, o el grupo está mal.",
        sueltosAcompanados
      )
    );

  if (gruposConDobleConyuge.length)
    hallazgos.push(
      hallazgo(
        "dobleConyuge",
        "Dos esposos o dos esposas en el mismo grupo",
        "Probablemente son dos matrimonios distintos bajo el mismo apellido: hay que numerarlos (García 01, García 02) como el resto.",
        gruposConDobleConyuge
      )
    );

  const sinGrupo = invitados.filter((g) => !claveFamilia(g));
  if (sinGrupo.length)
    hallazgos.push(
      hallazgo(
        "sinGrupoFamiliar",
        "Sin grupo familiar ni apellido",
        "Se quedan fuera del reparto de mesas y de las invitaciones por familia.",
        sinGrupo
      )
    );

  // Menores sentados sin ningún adulto DE SU FAMILIA en su mesa. Es la
  // comprobación que más se va a notar cuando los colaboradores
  // empiecen a rellenar las edades de verdad, y solo se puede hacer
  // cruzando tres cosas a la vez (edad, mesa y familia) -- ninguna
  // columna de la lista lo enseña. Idea del usuario, 2026-09-04.
  const menoresSolos = invitados.filter((g) => {
    if (!g.mesa) return false; // sin mesa ya lo dice el filtro "Sin mesa"
    const edad = calcularEdad(g.anioNacimiento, evento);
    if (edad === null || edad >= EDAD_MENOR) return false;
    return !invitados.some(
      (otro) =>
        otro.id !== g.id &&
        otro.mesa === g.mesa &&
        claveFamilia(otro) === claveFamilia(g) &&
        esAdulto(otro, evento)
    );
  });
  if (menoresSolos.length)
    hallazgos.push(
      hallazgo(
        "menorSinAdultoEnMesa",
        "Menores sin un adulto suyo en la mesa",
        "Tienen menos de 18 años y en su mesa no se sienta ningún adulto de su familia.",
        menoresSolos
      )
    );

  // Una familia repartida en varias mesas. Desde el 2026-09-19 la app ya no
  // deja hacerlo (regla inflexible del usuario, lib/mesas.js), pero lo que
  // se repartió a mano antes hay que poder encontrarlo.
  const familiasRepartidas = [];
  for (const [clave, miembros] of grupos) {
    if (!clave) continue;
    const sentados = miembros.filter((g) => g.confirmado && g.mesa);
    if (new Set(sentados.map((g) => g.mesa)).size > 1) familiasRepartidas.push(...sentados);
  }
  if (familiasRepartidas.length)
    hallazgos.push(
      hallazgo(
        "familiaRepartida",
        "Familia repartida en varias mesas",
        "Una familia no se separa. Elige la mesa de uno de ellos y se moverá la familia entera.",
        familiasRepartidas
      )
    );

  // Asignados a un colaborador pero sin rol familiar. Desde el
  // 2026-09-14 la app impide crear casos nuevos (ver asignarColaborador
  // en VistaAnfitrion.jsx), pero los que ya existían de antes hay que
  // poder encontrarlos: el formulario que ve el colaborador depende del
  // rol, así que sin rol no se les pide ni el año ni la foto de boda.
  const asignadosSinRol = invitados.filter((g) => g.colaboradorId && !g.rolFamiliar);
  if (asignadosSinRol.length)
    hallazgos.push(
      hallazgo(
        "asignadoSinRolFamiliar",
        "Asignados a un colaborador sin rol familiar",
        "El formulario que ve el colaborador depende del rol: sin marcarlo, a un matrimonio no se le pedirá el año ni la foto de boda. Ponles su rol (O, A, H, P o S).",
        asignadosSinRol
      )
    );

  // Un matrimonio con uno confirmado y el otro no (usuario, 2026-09-19). Su
  // propia regla: la O y la A son solo para quien viene con su pareja; el
  // que viene solo lleva P o S. Así que esto es o un "sí" a medias o una
  // letra mal puesta.
  // ⚠️ Que los dos cónyuges tengan COLABORADORES distintos NO se avisa, a
  // propósito: el usuario reparte 10-12 invitados por colaborador para
  // igualar el trabajo y el dinero a recoger, y eso obliga a veces a
  // separar a una pareja. Esa regla está por encima.
  const matrimoniosAMedias = matrimoniosDeInvitados(invitados, evento.fecha)
    .filter((m) => Boolean(m.esposo.confirmado) !== Boolean(m.esposa.confirmado))
    .flatMap((m) => [m.esposo, m.esposa]);
  if (matrimoniosAMedias.length)
    hallazgos.push(
      hallazgo(
        "matrimonioAMedias",
        "Matrimonio con uno confirmado y el otro no",
        "Un matrimonio (O y A) viene siempre junto. O falta confirmar al otro, o el que viene solo tiene que llevar P o S.",
        matrimoniosAMedias
      )
    );

  // El reparto entre colaboradores. Los que tienen 0 no cuentan: no llevan
  // invitados (p. ej. el desarrollador, dado de alta solo para ver el
  // código) o todavía no se ha empezado a repartir. Cada "persona" aquí es
  // un colaborador con su cifra; al pulsarlo, la lista se filtra por él.
  const { minimo, maximo } = INVITADOS_POR_COLABORADOR;
  const fueraDelReparto = (colaboradores || [])
    .map((c) => ({ c, n: invitados.filter((g) => g.colaboradorId === c.id).length }))
    .filter(({ n }) => n > 0 && (n < minimo || n > maximo))
    .map(({ c, n }) => ({
      id: `colaborador-${c.id}`,
      etiqueta: `${c.nombre || "Sin nombre"}: ${n}`,
      filtros: { texto: "", colaboradorId: c.id },
    }));
  if (fueraDelReparto.length)
    hallazgos.push(
      hallazgo(
        "repartoColaboradores",
        `Colaboradores fuera del reparto (${minimo} a ${maximo} invitados)`,
        "Para que todos lleven el mismo trabajo y el mismo dinero a recoger. Pulsa uno para ver sus invitados.",
        fueraDelReparto,
        "pendiente"
      )
    );

  // Al menos un email por familia (usuario, 2026-09-19): la misma regla que
  // el aviso del colaborador (lib/invitados.js, familiasSinEmail). Se
  // señalan sus adultos confirmados, que son quienes podrían darlo.
  const sinEmail = familiasSinEmail(invitados, colaboradores);
  const adultosSinEmail = [...grupos]
    .filter(([clave]) => sinEmail.has(clave))
    .flatMap(([, miembros]) => {
      const confirmados = miembros.filter((g) => g.confirmado);
      const adultos = confirmados.filter((g) => ROLES_CON_EMAIL_FAMILIAR.includes(g.rolFamiliar));
      return adultos.length ? adultos : confirmados;
    });
  if (adultosSinEmail.length)
    hallazgos.push(
      hallazgo(
        "familiaSinEmail",
        "Familias sin ningún email",
        "Hace falta al menos un email por familia: el del esposo o el de la esposa (el que viene solo, el suyo).",
        adultosSinEmail,
        "pendiente"
      )
    );

  // Dos fichas para la misma persona. La app ya avisa al AÑADIR a alguien
  // que ya estaba, pero eso solo protege en ese momento: una lista
  // importada dos veces, o una ficha recreada, deja dobles que nadie ve
  // después. Y un doble sale caro -- cuenta dos veces en el aforo, puede
  // ocupar dos sitios en la mesa, recibir dos invitaciones, y hace que
  // la app trate a una persona como dos (lo que pasó en el cronograma el
  // 2026-09-24). Dos personas distintas que se llamen igual existen: para
  // eso está marcar la excepción.
  const yaAgrupados = new Set();
  const repetidos = [];
  for (const g of invitados) {
    if (yaAgrupados.has(g.id)) continue;
    if (!String(g.nombre || "").trim() && !String(g.apellido || "").trim()) continue;
    const iguales = invitados.filter((x) => mismaPersona(x, g));
    if (iguales.length > 1) {
      iguales.forEach((x) => yaAgrupados.add(x.id));
      repetidos.push(...iguales);
    }
  }
  if (repetidos.length)
    hallazgos.push(
      hallazgo(
        "invitadoRepetido",
        "La misma persona, dos veces en la lista",
        "Hay dos o más fichas con el mismo nombre y apellido. Cada una cuenta por separado: en el aforo, en la mesa y en las invitaciones. Si de verdad son dos personas distintas que se llaman igual, márcalo como excepción.",
        repetidos,
        "error"
      )
    );

  // La cuenta de un colaborador va enlazada a su ficha de invitado. Sin
  // ese enlace fallan tres cosas en silencio (ver
  // `colaboradoresSinFichaEnlazada`), y la más cara es la del email: su
  // familia puede salir como "sin ningún email" teniéndolo él puesto en
  // Colaboradores.
  const sinFicha = colaboradoresSinFichaEnlazada(colaboradores, invitados);
  if (sinFicha.length)
    hallazgos.push(
      hallazgo(
        "colaboradorSinFicha",
        "Colaboradores sin su ficha enlazada",
        "Están en la lista de invitados, pero su cuenta de colaborador no está unida a su ficha. Por eso su email no cuenta para su familia, el motor de invitaciones no los encuentra y no les sale la ★ de colaborador.",
        sinFicha.map((x) => x.invitado),
        "pendiente"
      )
    );

  // Solo con alguno confirmado (él, v64.9): el año lo pide el colaborador
  // al confirmar; antes es imposible tenerlo.
  const matrimoniosSinBoda = matrimoniosDeInvitados(invitados, evento.fecha)
    .filter((m) => m.aniversario === null && (m.esposo.confirmado || m.esposa.confirmado))
    .map((m) => m.esposo);
  if (matrimoniosSinBoda.length)
    hallazgos.push(
      hallazgo(
        "matrimonioSinAnioBoda",
        "Matrimonios sin año de boda",
        "Sin ese dato no se puede calcular el aniversario que cumplen el día del evento.",
        matrimoniosSinBoda,
        "pendiente"
      )
    );

  // El apellido de cada uno, contra el de su familia (él, v64.5). En el
  // tablón se entra con el apellido de la ficha, y la invitación enseña el
  // de la familia: si no coinciden, esa persona no puede entrar. Se compara
  // como el tablón, así que solo sale lo que de verdad fallaría. Esta y las
  // dos de abajo, solo con los confirmados (él, v64.9): de los demás aún no
  // se han pedido los datos.
  const confirmados = invitados.filter((g) => g.confirmado);
  const apellidoDistinto = confirmados
    .filter((g) => {
      const familia = apellidoDelGrupo(g.grupoFamiliar);
      return familia && comoElTablon(g.apellido) !== comoElTablon(familia);
    })
    .map((g) => ({ ...g, detalle: `familia ${g.grupoFamiliar}` }));
  if (apellidoDistinto.length)
    hallazgos.push(
      hallazgo(
        "apellidoDistintoFamilia",
        "Apellido distinto al de su familia",
        "En el tablón se entra con el apellido de la ficha, y la invitación enseña el de la familia: así no podrá entrar. Corrige el que esté mal escrito.",
        apellidoDistinto
      )
    );

  // Familias cuyo apellido se diferencia en una sola letra (v64.5):
  // «Gonzalez01» y «Gonzales02» suele ser una errata. Si son familias
  // distintas de verdad, se marca la excepción.
  const unaPorApellido = new Map();
  for (const g of confirmados) {
    const familia = comoElTablon(apellidoDelGrupo(g.grupoFamiliar));
    if (familia.length >= 4 && !unaPorApellido.has(familia)) unaPorApellido.set(familia, g);
  }
  const apellidos = [...unaPorApellido.keys()];
  const casiIguales = [];
  apellidos.forEach((a, i) =>
    apellidos.slice(i + 1).forEach((b) => {
      if (!unaLetraDeDiferencia(a, b)) return;
      const [ga, gb] = [unaPorApellido.get(a), unaPorApellido.get(b)];
      casiIguales.push({ ...ga, detalle: `familia ${ga.grupoFamiliar} ≈ ${gb.grupoFamiliar}` });
      casiIguales.push({ ...gb, detalle: `familia ${gb.grupoFamiliar} ≈ ${ga.grupoFamiliar}` });
    })
  );
  if (casiIguales.length)
    hallazgos.push(
      hallazgo(
        "familiasCasiIguales",
        "Familias con el apellido casi igual",
        "Una sola letra de diferencia suele ser una errata. Si son familias distintas, marca la excepción.",
        casiIguales,
        "pendiente"
      )
    );

  // Nombres que a todas luces están mal escritos (él, v64.5): «Pedo» por
  // «Pedro», «Lus» por «Luis». Una palabra que se repite en dos invitados
  // distintos se da por buena: no es una errata, es un nombre.
  const vecesPorPalabra = new Map();
  for (const g of invitados)
    for (const p of new Set(comoElTablon(g.nombre).split(" "))) vecesPorPalabra.set(p, (vecesPorPalabra.get(p) || 0) + 1);
  const repetidas = new Set([...vecesPorPalabra].filter(([, n]) => n > 1).map(([p]) => p));
  const nombresRaros = confirmados
    .map((g) => ({ g, parecidos: nombreParecido(g.nombre, repetidas) }))
    .filter(({ parecidos }) => parecidos)
    .map(({ g, parecidos }) => ({ ...g, detalle: `¿${parecidos.join("?, ¿")}?` }));
  if (nombresRaros.length)
    hallazgos.push(
      hallazgo(
        "nombreMalEscrito",
        "Nombres que parecen mal escritos",
        "Se quedan a una letra de un nombre habitual. Si está bien escrito, marca la excepción.",
        nombresRaros,
        "pendiente"
      )
    );

  // ⚠️ Aquí NO se comprueban los datos incompletos, ni quién no ha
  // pagado, ni quién está sin revisar, ni quién no tiene mesa: todo eso
  // ya son columnas de la lista, con su filtro y su cifra en la
  // cabecera. Estuvieron un rato y el usuario los quitó por duplicados
  // (2026-09-04), con razón. Este informe se queda SOLO con lo que la
  // lista no puede enseñar por muchas columnas que tenga: cruzar filas
  // entre sí, o un dato con otro (apellido y familia) o con lo habitual.
  return hallazgos;
}

// EXCEPCIONES (usuario, 2026-09-19). La Revisión avisa porque "en líneas
// generales esto sería un error", pero hay casos conscientes: una madre con
// S dentro del grupo Gatell01 de su hija, para sentarse juntas. Se aceptan
// UNO a UNO, por persona y por tipo de aviso: se guarda en el propio
// invitado (`excepcionesRevision`, la lista de claves aceptadas) y la
// Revisión deja de avisar SOLO de ese caso; los demás casos iguales se
// siguen avisando. Las aceptadas se listan aparte para poder quitarlas.
function aceptada(g, clave) {
  return Array.isArray(g?.excepcionesRevision) && g.excepcionesRevision.includes(clave);
}

export function revisarConExcepciones(invitados = [], evento = {}, colaboradores = []) {
  const hallazgos = [];
  const excepciones = [];
  for (const h of todosLosHallazgos(invitados, evento, colaboradores)) {
    const pendientesDeVer = [];
    for (const g of h.personas) {
      if (aceptada(g, h.clave)) excepciones.push({ clave: h.clave, titulo: h.titulo, persona: g });
      else pendientesDeVer.push(g);
    }
    if (pendientesDeVer.length) hallazgos.push({ ...h, personas: pendientesDeVer });
  }
  return { hallazgos, excepciones };
}

// Solo los avisos que quedan, ya sin las excepciones aceptadas.
export function revisarInvitados(invitados = [], evento = {}, colaboradores = []) {
  return revisarConExcepciones(invitados, evento, colaboradores).hallazgos;
}
