// «Exportar contactos» (él, v93.4): lo contrario de «Importar tel.» (lib/
// importarTelefonos.js). Los datos de los invitados que van en una agenda
// —nombre, apellidos, teléfono y email— en un archivo de contactos (vCard,
// .vcf) para completar la del teléfono: a algunos no tenía su email.
// Contactos del Mac lo importa y, con los que ya tiene (por el nombre),
// avisa de repetidos: al aceptar, los une en una sola ficha (probado por
// él, v93.6). «Revisar» cierra Contactos: fallo de Apple, no del archivo.
//
// El email, de TODOS (él): la nota de privacidad habla de lo guardado en la
// app; su agenda es suya y la mayoría ya estaban en ella. Se arma en el
// navegador y solo sale a su carpeta de Descargas.
//
// Y de qué los conoce (él, v93.5): en «Notas», «Evento: Las Bodas de
// todos» (él lo eligió ahí, en la agenda del iPhone). Al unir, Contactos
// suma las dos notas: la suya queda arriba y la del evento debajo.
import { emailDeInvitado } from "./invitados";

export const ARCHIVO_CONTACTOS = "contactos-invitados.vcf";

const texto = (v) => String(v ?? "").trim();
// vCard escapa «\», «,» y «;» con una barra.
const escapar = (v) => texto(v).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, " ");
// Líneas de 70 caracteres como mucho (la norma pide 75 bytes); la que
// sigue empieza por un espacio.
const plegar = (linea) => {
  const trozos = [];
  for (let i = 0; i < linea.length; i += 70) trozos.push((i ? " " : "") + linea.slice(i, i + 70));
  return trozos.join("\r\n");
};

// La ficha de un invitado, o "" si no tiene nada que añadir a una agenda
// (ni teléfono ni email). Apellidos y nombre como los lee Contactos: «N»
// es «Apellidos;Nombre».
// `evento`: su nombre, sin el punto final, va en la nota.
export const notaDelEvento = (evento) => {
  const nombre = texto(evento?.nombre).replace(/\.$/, "");
  return nombre ? `Evento: ${nombre}` : "";
};
export function fichaVCard(g, colaboradores = [], evento = null) {
  const nota = notaDelEvento(evento);
  const nombre = texto(g.nombre);
  const apellido = texto(g.apellido);
  const telefono = texto(g.telefono);
  const email = emailDeInvitado(g, colaboradores);
  if (!(nombre || apellido) || !(telefono || email)) return "";
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapar(apellido)};${escapar(nombre)};;;`,
    `FN:${escapar([nombre, apellido].filter(Boolean).join(" "))}`,
    ...(telefono ? [`TEL;type=CELL;type=VOICE;type=pref:${escapar(telefono)}`] : []),
    ...(email ? [`EMAIL;type=INTERNET;type=HOME;type=pref:${escapar(email)}`] : []),
    ...(nota ? [`NOTE:${escapar(nota)}`] : []),
    "END:VCARD",
  ]
    .map(plegar)
    .join("\r\n");
}

// Todo el archivo: una ficha por invitado de la Lista, en el orden de la
// Lista. `cuantos`, las fichas que lleva.
export function contactosDeInvitados(invitados = [], colaboradores = [], evento = null) {
  const fichas = invitados.map((g) => fichaVCard(g, colaboradores, evento)).filter(Boolean);
  return { texto: fichas.length ? fichas.join("\r\n") + "\r\n" : "", cuantos: fichas.length };
}
