// Mensajes de WhatsApp a un invitado (él, v82.4): una plantilla por caso,
// «Faltan datos», «Música» y «Pagos», que sale en su ficha solo si le toca.
// Al elegirla, WhatsApp se abre con el mensaje ya escrito y sus datos
// puestos; quien lo manda solo pulsa «Enviar» (enviar solo, sin pulsar,
// exige la plataforma de pago de WhatsApp: descartado). Los textos los
// escribe el anfitrión en Datos del evento; vacíos, valen los de aquí.
import { huecosCanciones, MAX_CANCIONES } from "./canciones";
import { euros } from "./formato";

export const PLANTILLAS_WHATSAPP = [
  {
    id: "datos",
    campo: "plantillaWhatsappDatos",
    titulo: "Faltan datos",
    porDefecto: "Hola, {nombre}: para la boda del {fecha} nos faltan algunos datos tuyos: {faltan}. ¿Nos los mandas cuando puedas? ¡Gracias!",
  },
  {
    id: "musica",
    campo: "plantillaWhatsappMusica",
    titulo: "Música",
    porDefecto: `Hola, {nombre}: ¿qué canciones te gustaría bailar en la fiesta? Puedes pedir hasta ${MAX_CANCIONES}: dinos el título y quién la canta.`,
  },
  {
    id: "pagos",
    campo: "plantillaWhatsappPagos",
    titulo: "Pagos",
    porDefecto: "Hola, {nombre}: queda pendiente el pago de {importe}. Cuando lo hagas, avísanos y lo apuntamos. ¡Gracias!",
  },
];

export const HUECOS_WHATSAPP = ["{nombre}", "{fecha}", "{faltan}", "{importe}"];

// Cómo se dice cada dato obligatorio que falta (los de faltanObligatorios).
const NOMBRE_DEL_DATO = {
  anioNacimiento: "año de nacimiento",
  email: "email",
  anioBoda: "año de boda",
  fotoBoda: "foto de boda",
  alergias: "alergias",
};

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

export function rellenar(plantilla, valores) {
  return String(plantilla || "").replace(/\{(nombre|fecha|faltan|importe)\}/g, (_, hueco) => valores[hueco] ?? "");
}

// Los mensajes que le tocan a este invitado, ya escritos, en el orden de
// las plantillas. `faltan`: los datos obligatorios que le faltan
// (faltanObligatorios); `importe`: lo suyo, en euros.
export function mensajesWhatsapp({ invitado, evento, faltan = [], importe = 0 }) {
  const valores = {
    nombre: String(invitado?.nombre || "").trim(),
    fecha: fechaDelMensaje(evento),
    faltan: enLista(faltan.map((f) => NOMBRE_DEL_DATO[f] || f)),
    importe: euros(importe),
  };
  const sinCanciones = huecosCanciones(invitado?.cancion).every((h) => !String(h.titulo || "").trim());
  const toca = {
    datos: faltan.length > 0,
    musica: sinCanciones,
    pagos: Boolean(invitado?.confirmado) && !invitado?.pagado && !invitado?.noAsiste && importe > 0,
  };
  return PLANTILLAS_WHATSAPP.filter((p) => toca[p.id]).map((p) => ({
    id: p.id,
    etiqueta: p.id === "pagos" ? `${p.titulo} · ${valores.importe}` : p.titulo,
    texto: rellenar(String(evento?.[p.campo] || "").trim() || p.porDefecto, valores),
  }));
}
