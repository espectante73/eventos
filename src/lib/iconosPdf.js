// Los iconos de la app (lucide) en PNG, para estamparlos en un PDF: jsPDF
// no dibuja SVG. Se pintan con el MISMO componente que la pantalla, así
// el dibujo es el mismo y no una copia a mano de sus trazos.
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Utensils, User } from "lucide-react";

// A 64px se ve nítido aunque en el papel mida 13pt; trazo más grueso que
// en pantalla, para que se vea bien impreso en blanco y negro.
const PX = 64;
const TRAZO = 2.5;

async function iconoPng(Icono, color) {
  const caja = document.createElement("div");
  const raiz = createRoot(caja);
  flushSync(() => raiz.render(createElement(Icono, { size: PX, color, strokeWidth: TRAZO })));
  const svg = caja.innerHTML;
  raiz.unmount();
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const lienzo = document.createElement("canvas");
  lienzo.width = PX;
  lienzo.height = PX;
  lienzo.getContext("2d").drawImage(img, 0, 0, PX, PX);
  return lienzo.toDataURL("image/png");
}

// Mesa = los cubiertos de "Mesas" en el menú; persona = la silueta de la app.
export async function iconosAcomodadores(color) {
  const [mesa, persona] = await Promise.all([iconoPng(Utensils, color), iconoPng(User, color)]);
  return { mesa, persona };
}
