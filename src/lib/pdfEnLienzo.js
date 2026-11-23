// Un lienzo que entiende las órdenes de jsPDF que usan los dibujos para
// imprimir (tarjetas de acomodación, v97; sobres de los matrimonios): así
// la vista previa sale del MISMO dibujo que el PDF (norma 7), y se ve igual
// en el ordenador y en el móvil (un PDF dentro de la página, en el iPhone,
// solo enseña la primera hoja).
// `medida`: el papel, en puntos. `crearLienzo(ancho, alto)` da un <canvas>.
// `imagenes`: las imágenes ya cargadas, por el mismo dato que se le pasa a
// addImage (el PDF las lee del dato; el lienzo necesita la cargada).
import { C } from "../theme";

export const PUNTOS_POR_MM = 72 / 25.4;

export const crearCanvas = (ancho, alto) => Object.assign(document.createElement("canvas"), { width: ancho, height: alto });

// Las familias de letra de jsPDF, en el navegador. Las dos de la
// invitación (tarjetas de acomodación, v99.2), con el mismo archivo que va
// dentro del PDF (cargarAdornos las registra con estos nombres).
const FAMILIAS = {
  helvetica: "Helvetica, Arial, sans-serif",
  times: "'Times New Roman', Times, serif",
  fraunces: "'Fraunces Tarjeta', 'Fraunces', serif",
  alexbrush: "'Alex Brush Tarjeta', 'Alex Brush', cursive",
};

export class PdfEnLienzo {
  constructor({ medida, escala, crearLienzo = crearCanvas, imagenes = new Map() }) {
    this.ancho = medida.ancho;
    this.alto = medida.alto;
    this.escala = escala;
    this.crearLienzo = crearLienzo;
    this.imagenes = imagenes;
    this.paginas = [];
    this.familia = "helvetica";
    this.estilo = "normal";
    this.tam = 12;
    this.colorTexto = C.ink;
    this.addPage();
  }
  addPage() {
    const lienzo = this.crearLienzo(Math.round(this.ancho * this.escala), Math.round(this.alto * this.escala));
    const ctx = lienzo.getContext?.("2d");
    this.paginas.push(lienzo);
    this.ctx = ctx || null;
    if (!ctx) return;
    ctx.scale(this.escala, this.escala);
    ctx.fillStyle = C.blanco;
    ctx.fillRect(0, 0, this.ancho, this.alto);
    this.fuente();
  }
  fuente() {
    if (this.ctx) this.ctx.font = `${this.estilo === "bold" ? "bold " : ""}${this.tam}px ${FAMILIAS[this.familia] || FAMILIAS.helvetica}`;
  }
  pintar(estilo = "S") {
    if (!this.ctx) return;
    if (estilo.includes("F")) this.ctx.fill();
    if (estilo.includes("S") || estilo.includes("D")) this.ctx.stroke();
  }
  setFillColor(c) { if (this.ctx) this.ctx.fillStyle = c; }
  setDrawColor(c) { if (this.ctx) this.ctx.strokeStyle = c; }
  setTextColor(c) { this.colorTexto = c; }
  setLineWidth(w) { if (this.ctx) this.ctx.lineWidth = w; }
  setLineDashPattern(patron) { this.ctx?.setLineDash(patron); }
  // La transparencia, como en jsPDF: setGState(new pdf.GState({ opacity })).
  GState = class { constructor(o) { Object.assign(this, o); } };
  setGState(g) { if (this.ctx) this.ctx.globalAlpha = g.opacity ?? 1; }
  setFont(familia = "helvetica", estilo = "normal") { this.familia = familia; this.estilo = estilo; this.fuente(); }
  setFontSize(tam) { this.tam = tam; this.fuente(); }
  getTextWidth(texto) { return this.ctx ? this.ctx.measureText(texto).width : 0; }
  rect(x, y, w, h, estilo) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.pintar(estilo);
  }
  roundedRect(x, y, w, h, rx, _ry, estilo) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.roundRect ? this.ctx.roundRect(x, y, w, h, rx) : this.ctx.rect(x, y, w, h);
    this.pintar(estilo);
  }
  circle(x, y, r, estilo) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.pintar(estilo);
  }
  line(x1, y1, x2, y2) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
  // Como función de la clase y no método: la regla de la compresión
  // (reglas-del-proyecto) busca llamadas a addImage, y esta no lo es.
  addImage = (dato, _formato, x, y, w, h) => {
    const imagen = this.imagenes.get(dato);
    if (this.ctx && imagen) this.ctx.drawImage(imagen, x, y, w, h);
  };
  // `charSpace`: el aire entre letras, como en jsPDF (letra a letra: así
  // sale igual en todos los navegadores). `align: "center"`, centrado en x
  // (las tarjetas QR, v99.3).
  text(texto, x, y, { angle = 0, charSpace = 0, align } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = this.colorTexto;
    ctx.textBaseline = "alphabetic";
    ctx.translate(x, y);
    if (angle) ctx.rotate((-angle * Math.PI) / 180);
    const letras = [...texto];
    const ancho = charSpace ? letras.reduce((s, l) => s + ctx.measureText(l).width, 0) + charSpace * Math.max(0, letras.length - 1) : ctx.measureText(texto).width;
    let dx = align === "center" ? -ancho / 2 : align === "right" ? -ancho : 0;
    if (!charSpace) ctx.fillText(texto, dx, 0);
    else {
      for (const letra of letras) {
        ctx.fillText(letra, dx, 0);
        dx += ctx.measureText(letra).width + charSpace;
      }
    }
    ctx.restore();
  }
}

// Una imagen de la app (el logo de los sobres, los adornos de las
// tarjetas), cargada una vez: el dato para el PDF y la imagen para el lienzo.
export async function cargarImagen(ruta) {
  const blob = await (await fetch(ruta)).blob();
  const dato = await new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = mal;
    lector.readAsDataURL(blob);
  });
  const imagen = new Image();
  imagen.src = dato;
  await imagen.decode();
  return { dato, imagen, proporcion: imagen.naturalHeight / imagen.naturalWidth };
}
