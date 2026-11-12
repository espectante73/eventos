// Mensajes de WhatsApp a un invitado (él, v82.4-82.6): una plantilla por
// caso, «Faltan datos», «Música» y «Pagos», que sale en su ficha si le toca
// a alguien de SU FAMILIA. El mensaje es el mismo para toda la familia y
// solo cambia a quién va: lo encabeza «PACHECO, Omar:» (apellido familiar
// en mayúsculas, coma, nombre; él, v82.6), y lo pone la app. Al elegirlo,
// WhatsApp se abre ya escrito; quien lo manda solo pulsa «Enviar» (enviar
// solo, sin pulsar, exige la plataforma de pago de WhatsApp: descartado).
// Los textos los escribe el anfitrión en Datos del evento, y valen para
// todos; mientras no lo haga, a quien viene solo le salen en singular.
import { huecosCanciones, MAX_CANCIONES } from "./canciones";
import { euros } from "./formato";
import { apellidoDelGrupo } from "./revisionInvitados";

// El enlace va en su hueco, {enlace}, y debajo, en otro párrafo, cómo
// tenerlo a mano (él, v85.2). Si al editarlo se borra el hueco, la app lo
// pone al final: el mensaje nunca sale sin su enlace.
const TEXTO_ENLACE =
  "este es tu enlace personal al tablón de «{evento}». Es solo tuyo: no lo reenvíes.\n{enlace}\n\n" +
  "Por favor, para que puedas acceder con facilidad a tu tablón, después de abrirlo crea un acceso directo en el escritorio de tu móvil. " +
  "Así no tendrás que estar buscándolo en el historial de WhatsApp con tu colaborador. " +
  "Si no sabes hacerlo, pide ayuda a alguien que se maneje con los dispositivos electrónicos.";

export const PLANTILLAS_WHATSAPP = [
  {
    id: "datos",
    campo: "plantillaWhatsappDatos",
    titulo: "Faltan datos",
    porDefecto: "para la boda del {fecha} nos faltan algunos datos de la familia: {faltan}. ¿Nos los mandan cuando puedan? ¡Gracias!",
    porDefectoSolo: "para la boda del {fecha} nos faltan algunos datos tuyos: {faltan}. ¿Nos los mandas cuando puedas? ¡Gracias!",
  },
  {
    id: "musica",
    campo: "plantillaWhatsappMusica",
    titulo: "Música",
    porDefecto: `¿qué canciones les gustaría bailar en la fiesta? Cada uno puede pedir hasta ${MAX_CANCIONES}: dígannos el título y quién la canta.`,
    porDefectoSolo: `¿qué canciones te gustaría bailar en la fiesta? Puedes pedir hasta ${MAX_CANCIONES}: dinos el título y quién la canta.`,
  },
  {
    id: "pagos",
    campo: "plantillaWhatsappPagos",
    titulo: "Pagos",
    porDefecto: "queda pendiente el pago de la familia: {importe}. Cuando lo hagan, avísennos y lo apuntamos. ¡Gracias!",
    porDefectoSolo: "queda pendiente tu pago: {importe}. Cuando lo hagas, avísanos y lo apuntamos. ¡Gracias!",
  },
  // Su enlace personal al tablón (v85.2, él): abre el tablón sabiendo quién
  // es, y solo le pide el año. Es de cada uno, no de la familia: el enlace
  // lo pone la app debajo del texto, para que no se pueda borrar al editarlo.
  // Con el nombre del evento y la cabecera de siempre (la miniatura de
  // WhatsApp, la misma del enlace del grupo), para que no parezca un timo.
  {
    id: "enlace",
    campo: "plantillaWhatsappEnlace",
    titulo: "Enlace tablón",
    porDefecto: TEXTO_ENLACE,
    porDefectoSolo: TEXTO_ENLACE,
  },
];

export const HUECOS_WHATSAPP = ["{fecha}", "{faltan}", "{importe}", "{evento}", "{enlace}"];

// El nombre del evento como se escribe en un mensaje: el de la base, sin el
// punto final («Las Bodas de todos.» → «Las Bodas de todos»).
export const nombreDelEvento = (evento) => String(evento?.nombre || "").trim().replace(/\.+$/, "");

// Cómo se dice cada dato obligatorio que falta (los de faltanObligatorios).
const NOMBRE_DEL_DATO = {
  anioNacimiento: "año de nacimiento",
  email: "email",
  anioBoda: "año de boda",
  fotoBoda: "foto de boda",
  alergias: "alergias",
};
const datos = (faltan) => enLista(faltan.map((f) => NOMBRE_DEL_DATO[f] || f));
// La foto y el año de boda son del matrimonio, no de cada uno (norma 11):
// en el mensaje de familia se nombran una vez, al final.
const DE_LA_PAREJA = { anioBoda: "el año de boda", fotoBoda: "la foto de boda" };

// Lo que falta en la familia: «Omar (email y alergias), Lucía (año de
// nacimiento) y la foto de boda».
function faltasDeLaFamilia(conFaltas) {
  const personas = conFaltas
    .map(({ m, faltan }) => ({ m, suyas: faltan.filter((f) => !DE_LA_PAREJA[f]) }))
    .filter((x) => x.suyas.length > 0)
    .map(({ m, suyas }) => `${String(m.nombre || "").trim()} (${datos(suyas)})`);
  const deLaPareja = Object.keys(DE_LA_PAREJA).filter((f) => conFaltas.some((x) => x.faltan.includes(f))).map((f) => DE_LA_PAREJA[f]);
  return enLista([...personas, ...deLaPareja]);
}

// «a», «a y b», «a, b y c».
export function enLista(cosas) {
  if (cosas.length < 2) return cosas.join("");
  return `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}`;
}

// «11 de diciembre»; sin fecha confirmada, «día que se confirme».
export function fechaDelMensaje(evento) {
  const [a, m, d] = String(evento?.fecha || "").split("-").map(Number);
  if (!a || !m || !d || evento?.fechaSinConfirmar) return "día que se confirme";
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

// «PACHECO, Omar»: el apellido de la familia (su grupo, sin el número), en
// mayúsculas, y el nombre de quien lo recibe.
export function saludoWhatsapp(g) {
  const apellido = apellidoDelGrupo(g?.grupoFamiliar) || String(g?.apellido || "").trim();
  return `${apellido.toLocaleUpperCase("es")}, ${String(g?.nombre || "").trim()}`;
}

export function rellenar(plantilla, valores) {
  return String(plantilla || "").replace(/\{(nombre|fecha|faltan|importe|evento|enlace)\}/g, (_, hueco) => valores[hueco] ?? "");
}

const sinCanciones = (g) => huecosCanciones(g?.cancion).every((h) => !String(h.titulo || "").trim());
const debePagar = (g) => Boolean(g?.confirmado) && !g?.pagado && !g?.noAsiste;

// Los mensajes para `invitado`, ya escritos. `familia`: los confirmados de
// su familia que lleva este colaborador, él incluido; `faltanDe(m)`, los
// obligatorios que le faltan a cada uno (faltanObligatorios); `importeDe(m)`,
// lo suyo en euros; `enlace`, su enlace personal al tablón (vacío, no sale).
export function mensajesWhatsapp({ invitado, familia = [], evento, faltanDe = () => [], importeDe = () => 0, enlace = "" }) {
  const miembros = familia.some((m) => m.id === invitado?.id) ? familia : [invitado, ...familia];
  const solo = miembros.length === 1;
  const conFaltas = miembros.map((m) => ({ m, faltan: faltanDe(m) })).filter((x) => x.faltan.length > 0);
  const pendiente = miembros.filter(debePagar).reduce((s, m) => s + (Number(importeDe(m)) || 0), 0);
  const valores = {
    nombre: String(invitado?.nombre || "").trim(),
    fecha: fechaDelMensaje(evento),
    faltan: solo ? datos(conFaltas[0]?.faltan || []) : faltasDeLaFamilia(conFaltas),
    importe: euros(pendiente),
    evento: nombreDelEvento(evento),
    enlace,
  };
  const toca = { datos: conFaltas.length > 0, musica: miembros.some(sinCanciones), pagos: pendiente > 0, enlace: Boolean(enlace) };
  const saludo = saludoWhatsapp(invitado);
  return PLANTILLAS_WHATSAPP.filter((p) => toca[p.id]).map((p) => {
    const propio = String(evento?.[p.campo] || "").trim();
    const cuerpo = propio || (solo ? p.porDefectoSolo : p.porDefecto);
    return {
      id: p.id,
      etiqueta: p.id === "pagos" ? `${p.titulo} · ${valores.importe}` : p.titulo,
      texto: `${saludo}: ${rellenar(cuerpo, valores)}${p.id === "enlace" && !cuerpo.includes("{enlace}") ? `\n${enlace}` : ""}`,
    };
  });
}
