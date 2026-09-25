// Dibuja public/mapa-de-la-aplicacion.png: el mapa de las secciones del
// menú "Abrir sección..." del anfitrión, en 1920x1080 (16:9), con la
// paleta real de la app (theme.js).
//
//   node scripts/dibujar-mapa.mjs [destino.png]
//
// Se dibuja con `canvas` (el mismo que ya se usaba para verificar el
// acuse en PDF). ⚠️ `canvas` NO está declarado en package.json a
// propósito: es una dependencia nativa y pesada, y declararla haría que
// Vercel intentara compilarla en cada despliegue. Si falta, instalarla
// solo en local:  npm i -D canvas --no-save
//
// ⚠️ AL CAMBIAR EL MENÚ hay que actualizar las listas `nivel1` y
// `config` de más abajo. La fuente de verdad es ORDEN_VENTANAS /
// ETIQUETAS_VENTANAS (components/VentanaFlotante.jsx) y
// SUBMENU_CONFIGURACION (components/DesplegableSecciones.jsx) -- el
// mapa anterior quedó desactualizado justo por no hacer esto cuando el
// primer nivel pasó de 14 entradas a 8.
// La versión y la fecha salen de la app, no escritas a mano: las dos se
// quedaron antiguas (el mapa decía "v24.3 · 7 septiembre" en pleno v29)
// porque nadie se acuerda de tocarlas al regenerar.
//
// ⚠️ Pero eso solo arregla la mitad: si NADIE ejecuta este script, la
// imagen sigue siendo la vieja por mucho que el script sepa la versión
// buena. Volvió a pasar (el usuario, 2026-09-23: "no coincide la versión
// del mapa con la que estamos"): la imagen era del 19 de septiembre y la
// app iba por la v39.4.
// Por eso el script deja también una FICHA (scripts/mapa-generado.json)
// con la versión con la que se dibujó, y dibujar-mapa.test.js se pone en
// rojo si no coincide con VERSION_APP. Regenerar es entonces parte de
// subir una versión, no algo que hay que acordarse de hacer.
import { VERSION_APP } from "../src/constants.js";
import { C as TEMA } from "../src/theme.js";
import { createCanvas, registerFont } from "canvas";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Fraunces (titulares) e Inter (texto) son las mismas dos familias que
// usa la app. Se descargan una vez a la carpeta temporal del sistema en
// vez de guardarse en el repositorio: son ~1 MB que no hace falta
// versionar para una imagen que se regenera de vez en cuando.
const F = join(tmpdir(), "eventos-fuentes-mapa");
const FUENTES = [
  ["fraunces-600.ttf", "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcUByjDg.ttf", "Fraunces", "600"],
  ["inter-400.ttf", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf", "Inter", "400"],
  ["inter-600.ttf", "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", "Inter", "600"],
];

if (!existsSync(F)) mkdirSync(F, { recursive: true });
for (const [nombre, url, familia, peso] of FUENTES) {
  const ruta = join(F, nombre);
  if (!existsSync(ruta)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo descargar ${nombre}: HTTP ${res.status}`);
    writeFileSync(ruta, Buffer.from(await res.arrayBuffer()));
  }
  registerFont(ruta, { family: familia, weight: peso });
}

const W = 1920, H = 1080;
// Fondo claro desde el 2026-09-17, a petición del usuario: sobre el verde
// oscuro de antes los botones se fundían con el fondo. En claro cada
// entrada es una pastilla con su propio contorno, que es lo que se busca:
// que se lean como botones, no como líneas de una lista.
// El oro tuvo que oscurecerse (#D9B778 sobre blanco casi no se ve) y la
// crema pasó a ser verde tinta: sobre papel, el texto claro desaparece.
// ⚠️ La paleta SALE DE theme.js, no copiada a mano. Estaba copiada y ya
// había derivado: los dos dorados del mapa no existían en la app
// (#A87C3A y #8A6A34 frente a C.gold #B08D57). Es la misma historia que
// los rojos y los tamaños de letra -- lo que se copia, deriva. Ahora un
// cambio de paleta en la app aparece en el mapa al regenerarlo
// (usuario, 2026-09-23: "si hemos hecho algún ajuste en los botones que
// se refleje en el mapa").
//
// Las tres tintas oscuras son variantes del verde de la app para dar
// volumen a los paneles; se calculan a partir de C.ink en vez de
// escribirlas, para que sigan al original si algún día cambia.
function aclarar(hex, cuanto) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v + cuanto)))
  );
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const C = {
  tinta: TEMA.ink,
  tintaAlta: aclarar(TEMA.ink, 8),
  tintaBaja: aclarar(TEMA.ink, -9),
  // El champán de la app. Se probó primero un casi-blanco y el usuario
  // prefirió este, que además es el que ya usan las ventanas.
  papel: TEMA.paper,
  papelHondo: TEMA.paperDark,
  texto: TEMA.ink,
  crema: TEMA.paper,
  // El dorado de la app (usuario, 2026-09-23: "usa el dorado de la
  // app"). Antes el mapa llevaba dos dorados propios, #A87C3A y #8A6A34,
  // que no existían en la paleta.
  //
  // ⚠️ El mapa es TODO de fondo claro (champán), así que aquí no sirve
  // C.goldClaro: es el dorado para fondos oscuros y sobre este papel se
  // desvanece (contraste 1,6 sobre 1). El que corresponde es C.gold, el
  // que la app usa sobre papel.
  //
  // `oroHondo` es ese MISMO dorado, oscurecido: lo llevan rótulos de 12
  // y 13 px en mayúsculas, y C.gold tal cual se queda en 2,6 de
  // contraste, por debajo de lo que se lee cómodo. Oscurecido llega a
  // 4,4 — mejor incluso que el #8A6A34 inventado que había antes. Se
  // calcula a partir de C.gold, no se escribe: así sigue al original si
  // algún día cambia la paleta.
  oro: TEMA.gold,
  oroHondo: aclarar(TEMA.gold, -40),
  // El champán de los marcos de foto, ya en la paleta (theme.js): es el
  // fondo suave de la app.
  champan: TEMA.champan,
  granate: TEMA.wax,
};
// Un color de la paleta, transparente. Así las líneas y los rellenos
// suaves también salen de theme.js (lo vigila dibujar-mapa.test.js).
function velado(hex, opacidad) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacidad})`;
}

const linea = velado(TEMA.ink, 0.2);
const lineaFirme = velado(TEMA.ink, 0.34);
const tenue = velado(TEMA.ink, 0.62);

const c = createCanvas(W, H);
const x = c.getContext("2d");

// Fondo: degradado en diagonal, muy suave, para que no sea un blanco plano
const g = x.createLinearGradient(0, 0, W, H);
g.addColorStop(0, C.papel); g.addColorStop(0.55, C.papel); g.addColorStop(1, C.papelHondo);
x.fillStyle = g; x.fillRect(0, 0, W, H);

const fraunces = (s) => `600 ${s}px Fraunces`;
const inter = (s, w = 400) => `${w} ${s}px Inter`;

function redondeado(px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

// Mayúsculas espaciadas (canvas no tiene letter-spacing)
function espaciado(txt, px, py, sep) {
  let cx = px;
  for (const ch of txt) { x.fillText(ch, cx, py); cx += x.measureText(ch).width + sep; }
  return cx - px - sep;
}
function anchoEspaciado(txt, sep) {
  let w = 0;
  for (const ch of txt) w += x.measureText(ch).width + sep;
  return w - sep;
}

function hairline(x1, y1, x2, color = linea) {
  x.strokeStyle = color; x.lineWidth = 1;
  x.beginPath(); x.moveTo(x1, y1 + 0.5); x.lineTo(x2, y1 + 0.5); x.stroke();
}

const PAD = 72;

// ---------- Cabecera ----------
x.font = fraunces(64); x.textBaseline = "alphabetic";
x.fillStyle = C.texto; x.fillText("Mapa de ", PAD, 138);
const anchoMapa = x.measureText("Mapa de ").width;
x.fillStyle = C.oro; x.fillText("secciones", PAD + anchoMapa, 138);

x.font = inter(18); x.fillStyle = tenue;
x.fillText("Todo lo que se abre desde la portada del anfitrión, en los tres niveles que tiene el menú.", PAD, 176);
x.fillText("Dentro de cada nivel, las entradas van en orden alfabético.", PAD, 202);

function fechaDeHoy() {
  const meses = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO",
                 "AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const d = new Date();
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

x.font = fraunces(38); x.fillStyle = C.oro;
const vTxt = `v${VERSION_APP}`;
x.fillText(vTxt, W - PAD - x.measureText(vTxt).width, 138);
x.font = inter(13); x.fillStyle = tenue;
const fTxt = fechaDeHoy();
x.fillText("", 0, 0);
espaciado(fTxt, W - PAD - anchoEspaciado(fTxt, 1.6), 168, 1.6);

hairline(PAD, 232, W - PAD);

// ---------- Columnas ----------
const COL_W = 560, GAP = 48;
const COLS = [PAD, PAD + COL_W + GAP, PAD + 2 * (COL_W + GAP)];

function tituloNivel(cx, cy, texto) {
  x.font = inter(13, 600); x.fillStyle = C.oroHondo;
  const w = espaciado(texto.toUpperCase(), cx, cy, 2.2);
  hairline(cx + w + 16, cy - 5, cx + COL_W);
}

const ALTO = 58, SALTO = 71;

// tipo: "normal" | "abre" | "rojoFuerte" | "rojoSuave"
function entrada(cx, cy, nombre, { tipo = "normal", fuera = false } = {}) {
  let fondo = "#FFFFFF", borde = linea;
  if (tipo === "abre") { fondo = velado(C.oro, 0.1); borde = C.oro; }
  if (tipo === "rojoFuerte") { fondo = velado(C.granate, 0.13); borde = C.granate; }
  if (tipo === "rojoSuave") { fondo = velado(C.granate, 0.06); borde = C.granate; }

  // Contorno propio en cada entrada: sobre papel, un relleno casi blanco
  // sin borde no se distingue del fondo -- es justo lo que se quería evitar.
  x.fillStyle = fondo; redondeado(cx, cy, COL_W, ALTO, 6); x.fill();
  x.strokeStyle = linea; x.lineWidth = 1;
  redondeado(cx + 0.5, cy + 0.5, COL_W - 1, ALTO - 1, 6); x.stroke();
  x.fillStyle = borde; x.fillRect(cx, cy + 4, 3, ALTO - 8);

  x.font = fraunces(20); x.fillStyle = C.texto;
  x.fillText(nombre, cx + 20, cy + 36);

  let dcha = cx + COL_W - 18;
  if (tipo === "abre") {
    x.font = fraunces(24); x.fillStyle = C.oro;
    const w = x.measureText("›").width;
    x.fillText("›", dcha - w, cy + 37);
    dcha -= w + 14;
  }
  if (fuera) {
    x.font = inter(11, 600);
    const txt = "VENTANA APARTE";
    const w = anchoEspaciado(txt, 0.9) + 20;
    x.strokeStyle = linea; x.lineWidth = 1;
    redondeado(dcha - w, cy + 20, w, 19, 3); x.stroke();
    x.fillStyle = C.oroHondo;
    espaciado(txt, dcha - w + 10, cy + 33, 0.9);
  }
}

// --- Columna 1 ---
tituloNivel(COLS[0], 268, "Primer nivel");
x.fillStyle = velado(C.oro, 0.12);
redondeado(COLS[0], 292, 196, 44, 22); x.fill();
x.strokeStyle = lineaFirme; x.lineWidth = 1;
redondeado(COLS[0], 292, 196, 44, 22); x.stroke();
x.font = inter(19, 600); x.fillStyle = C.oro;
x.fillText("Abrir sección…", COLS[0] + 26, 320);

let y = 362;
const nivel1 = [
  ["Aniversarios", {}],
  ["Colaboradores", { tipo: "abre" }],
  ["Configuración", { tipo: "abre" }],
  ["Cuentas", {}],
  ["Invitaciones", {}],
  ["Invitados", { fuera: true }],
  ["Mesas", {}],
  ["Música", { fuera: true }],
  ["Novedades", { fuera: true }],
];
for (const [n, o] of nivel1) { entrada(COLS[0], y, n, o); y += SALTO; }

// --- Columna 2 ---
tituloNivel(COLS[1], 268, "Colaboradores");
y = 300;
entrada(COLS[1], y, "Datos Colab.", {}); y += SALTO;
entrada(COLS[1], y, "Formularios", { tipo: "abre" }); y += ALTO + 12;

// Tercer nivel: caja anidada con filete discontinuo
const bx = COLS[1] + 34, bw = COL_W - 34, bh = 150;
x.strokeStyle = lineaFirme; x.lineWidth = 1;
x.setLineDash([4, 4]);
x.beginPath(); x.moveTo(bx + 0.5, y); x.lineTo(bx + 0.5, y + bh); x.stroke();
x.setLineDash([]);
x.font = inter(12, 600); x.fillStyle = C.oroHondo;
espaciado("TERCER NIVEL", bx + 20, y + 22, 2);
x.font = fraunces(19); x.fillStyle = C.texto;
x.fillText("Anfitrión", bx + 20, y + 52);
x.font = inter(16); x.fillStyle = tenue;
x.fillText("…y cada colaborador, uno por línea", bx + 20, y + 80);
x.font = inter(15);
x.fillText("Cambia la vista para ver su formulario tal y", bx + 20, y + 110);
x.fillText("como lo ve esa persona, sin salir de tu sesión.", bx + 20, y + 132);

// --- Columna 3 ---
tituloNivel(COLS[2], 268, "Configuración");
y = 300;
const config = [
  ["Borrado total", { tipo: "rojoFuerte" }],
  ["Cronograma", { fuera: true }],
  ["Datos evento", {}],
  ["Modo pruebas", { tipo: "rojoSuave" }],
  ["Permisos", {}],
  ["Progreso", {}],
  ["Reinicios", {}],
  ["Versiones", {}],
];
for (const [n, o] of config) { entrada(COLS[2], y, n, o); y += SALTO; }

// ---------- Pie ----------
hairline(PAD, 985, W - PAD);
let px = PAD;
x.font = fraunces(22); x.fillStyle = C.oro;
x.fillText("›", px, 1024); px += x.measureText("›").width + 12;
x.font = inter(15); x.fillStyle = tenue;
x.fillText("Despliega otro nivel", px, 1022); px += x.measureText("Despliega otro nivel").width + 44;

x.font = inter(11, 600);
const et = "VENTANA APARTE";
const ew = anchoEspaciado(et, 0.9) + 20;
x.strokeStyle = linea; x.lineWidth = 1;
redondeado(px, 1007, ew, 19, 3); x.stroke();
x.fillStyle = C.oroHondo; espaciado(et, px + 10, 1020, 0.9);
px += ew + 12;
x.font = inter(15); x.fillStyle = tenue;
x.fillText("Se abre fuera del navegador", px, 1022);
px += x.measureText("Se abre fuera del navegador").width + 44;

x.fillStyle = velado(C.granate, 0.22); x.fillRect(px, 1008, 16, 16);
x.fillStyle = C.granate; x.fillRect(px, 1008, 2.5, 16);
px += 16 + 12;
x.fillStyle = tenue; x.fillText("Sin vuelta atrás", px, 1022);

x.font = inter(15); x.fillStyle = C.oroHondo;
const nota = "Las cuatro «ventana aparte» pueden no abrirse en iPhone";
x.fillText(nota, W - PAD - x.measureText(nota).width, 1022);

// En public/ y no en docs/: así hay UNA sola copia, la misma que sirve la
// web (la ventana "Mapa de la app" la carga desde /mapa-de-la-aplicacion.png)
// y la misma que se ve en GitHub. Dos copias serían dos cosas que
// sincronizar a mano.
const destino = process.argv[2] || "public/mapa-de-la-aplicacion.png";
writeFileSync(destino, c.toBuffer("image/png"));

// La ficha de lo que se acaba de dibujar. No es documentación: es lo que
// mira el test para saber si la imagen está al día. Va en scripts/ y no
// en public/ porque no hay que servirla a nadie.
writeFileSync(
  "scripts/mapa-generado.json",
  JSON.stringify({ version: VERSION_APP, generadoEn: new Date().toISOString().slice(0, 10) }, null, 2) + "\n"
);
console.log(`escrito: ${destino} (v${VERSION_APP})`);
