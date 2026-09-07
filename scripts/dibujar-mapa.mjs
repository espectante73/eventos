// Dibuja docs/mapa-de-la-aplicacion.png: el mapa de las secciones del
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
const C = {
  tinta: "#1F3A2E", tintaAlta: "#24402F", tintaBaja: "#16291F",
  crema: "#EFE9DE", oro: "#D9B778", oroHondo: "#B08D57", granate: "#8C2F39",
};
const linea = "rgba(217,183,120,0.28)";
const lineaFirme = "rgba(217,183,120,0.52)";
const tenue = "rgba(239,233,222,0.62)";

const c = createCanvas(W, H);
const x = c.getContext("2d");

// Fondo: mismo degradado en diagonal que el artefacto
const g = x.createLinearGradient(0, 0, W, H);
g.addColorStop(0, C.tintaAlta); g.addColorStop(0.55, C.tinta); g.addColorStop(1, C.tintaBaja);
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
x.fillStyle = C.crema; x.fillText("Mapa de ", PAD, 138);
const anchoMapa = x.measureText("Mapa de ").width;
x.fillStyle = C.oro; x.fillText("secciones", PAD + anchoMapa, 138);

x.font = inter(18); x.fillStyle = tenue;
x.fillText("Todo lo que se abre desde la portada del anfitrión, en los tres niveles que tiene el menú.", PAD, 176);
x.fillText("Dentro de cada nivel, las entradas van en orden alfabético.", PAD, 202);

x.font = fraunces(38); x.fillStyle = C.oro;
const vTxt = "v24.3";
x.fillText(vTxt, W - PAD - x.measureText(vTxt).width, 138);
x.font = inter(13); x.fillStyle = tenue;
const fTxt = "7 SEPTIEMBRE 2026";
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
  let fondo = "rgba(239,233,222,0.045)", borde = linea;
  if (tipo === "abre") { fondo = "rgba(217,183,120,0.09)"; borde = C.oro; }
  if (tipo === "rojoFuerte") { fondo = "rgba(140,47,57,0.30)"; borde = C.granate; }
  if (tipo === "rojoSuave") { fondo = "rgba(140,47,57,0.14)"; borde = C.granate; }

  x.fillStyle = fondo; x.fillRect(cx, cy, COL_W, ALTO);
  x.fillStyle = borde; x.fillRect(cx, cy, 2.5, ALTO);

  x.font = fraunces(20); x.fillStyle = C.crema;
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
x.fillStyle = "rgba(217,183,120,0.12)";
redondeado(COLS[0], 292, 196, 44, 22); x.fill();
x.strokeStyle = lineaFirme; x.lineWidth = 1;
redondeado(COLS[0], 292, 196, 44, 22); x.stroke();
x.font = inter(19, 600); x.fillStyle = C.oro;
x.fillText("Abrir sección…", COLS[0] + 26, 320);

let y = 362;
const nivel1 = [
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
x.font = fraunces(19); x.fillStyle = C.crema;
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
  ["Backup", {}],
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

x.fillStyle = "rgba(140,47,57,0.55)"; x.fillRect(px, 1008, 16, 16);
x.fillStyle = C.granate; x.fillRect(px, 1008, 2.5, 16);
px += 16 + 12;
x.fillStyle = tenue; x.fillText("Sin vuelta atrás", px, 1022);

x.font = inter(15); x.fillStyle = C.oroHondo;
const nota = "Las cuatro «ventana aparte» pueden no abrirse en iPhone";
x.fillText(nota, W - PAD - x.measureText(nota).width, 1022);

const destino = process.argv[2] || "docs/mapa-de-la-aplicacion.png";
writeFileSync(destino, c.toBuffer("image/png"));
console.log(`escrito: ${destino}`);
