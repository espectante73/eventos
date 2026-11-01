// «Importar teléfonos» (él, v78.2): los teléfonos de los invitados, sacados
// del archivo que exporta Contactos del Mac (vCard, .vcf), en vez de
// escribir 140 números. El archivo se lee en el navegador y no sale de él;
// de cada contacto solo se miran el nombre, los apellidos y los teléfonos.
// Nada se guarda sin pasar por la lista de repaso.
import { limpiarTelefono, telefonoValido, pideTelefono } from "./telefono";
import { nombreCompleto } from "./formato";

// Sin mayúsculas, tildes ni signos: así se comparan los nombres.
const palabras = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-zñ0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// vCard escapa «,», «;» y «\» con una barra.
const sinEscapes = (v) => v.replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ");

// El tipo de un teléfono, como se lee: móvil, casa, trabajo u otro.
function tipoDe(cabecera) {
  const t = cabecera.toUpperCase();
  if (/CELL|IPHONE|MOBILE/.test(t)) return "móvil";
  if (/HOME/.test(t)) return "casa";
  if (/WORK/.test(t)) return "trabajo";
  return "otro";
}
// En España, un móvil empieza por 6 o 7: va primero aunque no lo diga.
const esMovil = (tel) => tel.tipo === "móvil" || /^\+34[67]/.test(tel.numero);

// Los contactos del archivo: { nombre, apellidos, completo, telefonos: [{ numero, tipo }] }.
export function leerVCard(texto) {
  // Una línea que empieza por espacio sigue a la anterior.
  const lineas = String(texto || "").replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const contactos = [];
  let actual = null;
  for (const linea of lineas) {
    if (/^BEGIN:VCARD/i.test(linea)) actual = { nombre: "", apellidos: "", completo: "", telefonos: [] };
    else if (/^END:VCARD/i.test(linea)) {
      if (actual && actual.telefonos.length) contactos.push(actual);
      actual = null;
    } else if (actual) {
      const dos = linea.indexOf(":");
      if (dos < 0) continue;
      // «item1.TEL;type=CELL» → «TEL;type=CELL».
      const cabecera = linea.slice(0, dos).replace(/^[^.;:]*\./, "");
      const valor = sinEscapes(linea.slice(dos + 1));
      const campo = cabecera.split(";")[0].toUpperCase();
      if (campo === "N") {
        const [apellidos = "", nombre = ""] = valor.split(";");
        actual.apellidos = apellidos.trim();
        actual.nombre = nombre.trim();
      } else if (campo === "FN") actual.completo = valor.trim();
      else if (campo === "TEL" && telefonoValido(valor)) {
        const numero = limpiarTelefono(valor);
        if (!actual.telefonos.some((t) => t.numero === numero)) actual.telefonos.push({ numero, tipo: tipoDe(cabecera) });
      }
    }
  }
  // El móvil, el primero.
  for (const c of contactos) c.telefonos.sort((a, b) => Number(esMovil(b)) - Number(esMovil(a)));
  return contactos;
}

// ¿Es este contacto este invitado? Su nombre entero y su primer apellido
// tienen que estar en el contacto (con su orden o sin él): «Pacheco, Rubén»
// casa con «Rubén Pacheco García», no con «Rubén primo». `exacto`: también
// el resto de sus apellidos.
function casa(g, contacto) {
  const delContacto = new Set([...palabras(contacto.nombre), ...palabras(contacto.apellidos), ...palabras(contacto.completo)]);
  const nombre = palabras(g.nombre);
  const apellidos = palabras(g.apellido);
  if (!nombre.length || !apellidos.length) return null;
  if (!nombre.every((p) => delContacto.has(p)) || !delContacto.has(apellidos[0])) return null;
  return { exacto: apellidos.every((p) => delContacto.has(p)) };
}

const textoContacto = (c) => [c.nombre, c.apellidos].filter(Boolean).join(" ") || c.completo;

// La lista de repaso. Solo los invitados a los que se les pide teléfono
// (16 años o más). En cinco grupos:
// - nuevos: sin teléfono en la app y un solo contacto suyo (se marcan).
// - distintos: ya tienen uno y su contacto trae otro (no se marcan).
// - dudosos: más de un contacto posible (se elige o nada).
// - yaEstan: su número ya está, o tienen uno y no aparecen.
// - sinEncontrar: ni teléfono ni contacto.
export function repasoTelefonos(invitados, contactos, evento) {
  const repaso = { nuevos: [], distintos: [], dudosos: [], yaEstan: [], sinEncontrar: [] };
  for (const g of invitados) {
    if (!pideTelefono(g, evento)) continue;
    const posibles = contactos.map((c) => ({ c, ok: casa(g, c) })).filter((x) => x.ok);
    const exactos = posibles.filter((x) => x.ok.exacto);
    const elegidos = (exactos.length ? exactos : posibles).map((x) => x.c);
    const actual = limpiarTelefono(g.telefono);
    const opciones = (c) => c.telefonos;
    if (actual && elegidos.some((c) => c.telefonos.some((t) => t.numero === actual))) repaso.yaEstan.push({ invitado: g, numero: actual });
    else if (elegidos.length > 1) {
      repaso.dudosos.push({
        invitado: g,
        candidatos: elegidos.map((c) => ({ numero: c.telefonos[0].numero, texto: textoContacto(c) })),
        actual,
      });
    } else if (elegidos.length === 1) {
      const grupo = actual ? "distintos" : "nuevos";
      repaso[grupo].push({ invitado: g, opciones: opciones(elegidos[0]), actual });
    } else if (actual) repaso.yaEstan.push({ invitado: g, numero: actual });
    else repaso.sinEncontrar.push({ invitado: g });
  }
  const porNombre = (a, b) => nombreCompleto(a.invitado).localeCompare(nombreCompleto(b.invitado), "es");
  for (const grupo of Object.values(repaso)) grupo.sort(porNombre);
  return repaso;
}

// Guarda los elegidos: { idInvitado: número }. Devuelve { invitados, aviso }:
// cuántos se han puesto.
export function ponerTelefonos(invitados, elegidos) {
  let cuantos = 0;
  const siguiente = invitados.map((g) => {
    const numero = elegidos[g.id];
    if (!numero || limpiarTelefono(numero) === limpiarTelefono(g.telefono)) return g;
    cuantos += 1;
    return { ...g, telefono: limpiarTelefono(numero) };
  });
  if (!cuantos) return { invitados, aviso: "No había ningún teléfono que guardar." };
  return { invitados: siguiente, aviso: cuantos === 1 ? "Guardado 1 teléfono." : `Guardados ${cuantos} teléfonos.` };
}
