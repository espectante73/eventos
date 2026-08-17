// Generación de la imagen de invitación (dibujo sobre <canvas>): partido de
// líneas, justificado de texto, cuadrícula de calibración y el dibujo final
// sobre la plantilla. Sin estado de React — movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { formatearFecha, formatearDiaSemana, listaConY } from "./formato";

// Sombreado ajustado SOLO al texto que se va a escribir encima -- nunca un
// recuadro grande. La plantilla real (public/invitacion-defecto.jpg) no
// tiene un recuadro con borde en la zona de fecha/hora/lugar (es texto
// suelto sobre el fondo de la página), así que rellenar una caja entera ahí
// se salía por todos lados. Esto tapa justo el ancho/alto de la línea de
// texto, con un margen pequeño, tanto si hay un recuadro real detrás (como
// en familia/mesa) como si no.
function resaltarTexto(ctx, x, yBase, ancho, fontSizePx, colorFondo) {
  const padX = fontSizePx * 0.35;
  const arriba = fontSizePx * 1.1;
  const abajo = fontSizePx * 0.9;
  ctx.fillStyle = colorFondo;
  ctx.fillRect(x - padX, yBase - arriba, ancho + padX * 2, arriba + abajo);
}

export function partirLineas(ctx, texto, maxWidth) {
  const palabras = texto.split(" ");
  let linea = "";
  const lineas = [];
  for (let n = 0; n < palabras.length; n++) {
    const prueba = linea + palabras[n] + " ";
    if (ctx.measureText(prueba).width > maxWidth && n > 0) {
      lineas.push(linea.trim());
      linea = palabras[n] + " ";
    } else {
      linea = prueba;
    }
  }
  lineas.push(linea.trim());
  return lineas;
}

// Canvas no tiene alineación "justificada" nativa: se reparte el espacio
// sobrante entre palabras a mano. La última línea de cada bloque no se
// estira (así es como se ve un párrafo justificado normal).
export function dibujarLineaJustificada(ctx, linea, x, y, maxWidth, esUltima) {
  const palabras = linea.split(" ").filter(Boolean);
  ctx.textAlign = "left";
  if (esUltima || palabras.length < 2) {
    ctx.fillText(linea, x, y);
    return;
  }
  const anchoTexto = palabras.reduce((s, p) => s + ctx.measureText(p).width, 0);
  const espacioExtra = (maxWidth - anchoTexto) / (palabras.length - 1);
  let cursorX = x;
  palabras.forEach((palabra) => {
    ctx.fillText(palabra, cursorX, y);
    cursorX += ctx.measureText(palabra).width + espacioExtra;
  });
}

export function dibujarParrafoJustificado(ctx, lineas, x, y, maxWidth, lineHeight) {
  lineas.forEach((linea, i) => {
    dibujarLineaJustificada(ctx, linea, x, y + i * lineHeight, maxWidth, i === lineas.length - 1);
  });
}

// Igual que dibujarParrafoJustificado, pero primero sombrea cada línea
// (ajustado a su ancho real: el ancho completo si va justificada, o el
// ancho medido del texto si es la última línea/una sola palabra) antes de
// escribir encima. Así el sombreado nunca es más grande que el propio texto.
function dibujarParrafoConSombra(ctx, lineas, x, y, maxWidth, lineHeight, fontSizePx, colorFondo, colorTexto) {
  lineas.forEach((linea, i) => {
    const esUltima = i === lineas.length - 1;
    const palabras = linea.split(" ").filter(Boolean);
    const esJustificada = !esUltima && palabras.length >= 2;
    const anchoLinea = esJustificada ? maxWidth : ctx.measureText(linea).width;
    resaltarTexto(ctx, x, y + i * lineHeight, anchoLinea, fontSizePx, colorFondo);
  });
  ctx.fillStyle = colorTexto;
  dibujarParrafoJustificado(ctx, lineas, x, y, maxWidth, lineHeight);
}

// Rejilla temporal (cada 5% del ancho/alto) con la fracción escrita en cada
// línea — sirve para leer directamente en la imagen las coordenadas que hay
// que darle a las constantes de más abajo, en vez de estimarlas a ojo desde
// una captura. Solo se activa con el modo calibración; nunca en una
// invitación real enviada a un invitado.
export function dibujarCuadriculaCalibracion(ctx, W, H) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.font = "bold 16px monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const dibujarEtiqueta = (texto, x, y) => {
    const ancho = ctx.measureText(texto).width;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(x, y, ancho + 4, 18);
    ctx.fillStyle = "#C2006B";
    ctx.fillText(texto, x + 2, y + 1);
  };

  ctx.strokeStyle = "rgba(220,0,120,0.5)";
  for (let i = 1; i < 20; i++) {
    const frac = i * 0.05;
    const x = Math.round(frac * W);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
    dibujarEtiqueta(frac.toFixed(2), x + 2, 2);
  }
  for (let i = 1; i < 20; i++) {
    const frac = i * 0.05;
    const y = Math.round(frac * H);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    dibujarEtiqueta(frac.toFixed(2), 2, y + 2);
  }
  ctx.restore();
}

export function generarInvitacionImagen(evento, apellidoFamilia, nombresMiembros, mesaTexto, mostrarCuadricula = false) {
  return new Promise((resolve) => {
    // Recuadro de familia/mesa (abajo a la derecha) -- este sí es un
    // recuadro real de la plantilla, con esquinas redondeadas y borde
    // dorado. Medido 2026-08-17 con cuadrícula de coordenadas directamente
    // sobre la plantilla real (public/invitacion-defecto.jpg, la que de
    // verdad usa la app), no sobre una captura ni un archivo de referencia
    // aparte -- un intento anterior se calibró contra un mockup distinto y
    // no coincidía con la plantilla en vivo.
    const RECUADRO = { left: 0.478, right: 0.965, top: 0.805, bottom: 0.918 };

    // Zona de fecha/hora/lugar: a diferencia de familia/mesa, AQUÍ NO HAY
    // NINGÚN RECUADRO en la plantilla -- son icono + etiqueta + valor
    // impresos directamente sobre el fondo de la página. Las etiquetas
    // ("FECHA", "HORA", "LUGAR") y los iconos ya vienen fijos en el diseño
    // y no cambian de una invitación a otra, así que no se tocan. Solo se
    // sombrea y reescribe el VALOR de cada campo (la parte que sí cambia
    // según el evento), con un sombreado ajustado a ese texto concreto,
    // nunca un recuadro. Coordenadas medidas 2026-08-17 igual que arriba.
    const DATOS = {
      x: 0.15, // columna de texto (a la derecha de los iconos)
      anchoTexto: 0.36, // ancho disponible antes de invadir la foto de la pareja
      yFecha: 0.487,
      yDiaSemana: 0.508,
      yHora: 0.573,
      yLugar: 0.638,
    };

    const dibujarDatosGenerales = (ctx, W, H) => {
      const x = DATOS.x * W;
      const anchoTexto = DATOS.anchoTexto * W;

      const fechaValor = evento.fecha ? formatearFecha(evento.fecha) : "";
      const diaSemanaValor = evento.fecha ? formatearDiaSemana(evento.fecha) : "";
      const horaValor = evento.hora ? `${evento.hora} h` : "";
      const lugarValor = [evento.lugar, evento.direccion].filter(Boolean).join(", ").trim();

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      const escribirLinea = (texto, y, fontSizePx, font, colorTexto, colorFondo) => {
        if (!texto) return;
        ctx.font = font;
        resaltarTexto(ctx, x, y, ctx.measureText(texto).width, fontSizePx, colorFondo);
        ctx.fillStyle = colorTexto;
        ctx.fillText(texto, x, y);
      };

      const tamFecha = Math.round(W * 0.028);
      escribirLinea(fechaValor, DATOS.yFecha * H, tamFecha, `bold ${tamFecha}px 'Fraunces', serif`, "#1F3A2E", "#F5F0E6");
      const tamDia = Math.round(W * 0.02);
      escribirLinea(diaSemanaValor, DATOS.yDiaSemana * H, tamDia, `italic ${tamDia}px 'Fraunces', serif`, "#1F3A2E", "#F5F0E6");
      escribirLinea(horaValor, DATOS.yHora * H, tamFecha, `bold ${tamFecha}px 'Fraunces', serif`, "#1F3A2E", "#F5F0E6");

      if (lugarValor) {
        const tamLugar = Math.round(W * 0.02);
        const fontLugar = `bold ${tamLugar}px 'Fraunces', serif`;
        const lineHeight = Math.round(H * 0.024);
        ctx.font = fontLugar;
        let y = DATOS.yLugar * H;
        partirLineas(ctx, lugarValor, anchoTexto).forEach((linea) => {
          resaltarTexto(ctx, x, y, ctx.measureText(linea).width, tamLugar, "#F5F0E6");
          ctx.fillStyle = "#1F3A2E";
          ctx.fillText(linea, x, y);
          y += lineHeight;
        });
      }
    };

    const dibujarTextoYResolver = (canvas, ctx) => {
      const W = canvas.width;
      const H = canvas.height;
      const xIzq = RECUADRO.left * W + (RECUADRO.right - RECUADRO.left) * W * 0.06;
      const anchoDisponible = (RECUADRO.right - RECUADRO.left) * W * 0.88;

      dibujarDatosGenerales(ctx, W, H);

      const fuenteNombres = `bold ${Math.round(W * 0.031)}px 'Fraunces', serif`;
      const fuenteDetalle = `bold ${Math.round(W * 0.037)}px 'Fraunces', serif`;
      const tamNombres = Math.round(W * 0.031);
      const tamDetalle = Math.round(W * 0.037);
      const lineHeightNombres = Math.round(W * 0.035);
      const lineHeightDetalle = Math.round(W * 0.041);
      const espacioEntreBloques = Math.round(W * 0.02);

      // Solo nombre de familia y mesa van en este recuadro — está calibrado
      // muy justo para esos dos bloques. Fecha/hora/lugar (genéricos, iguales
      // en todas las invitaciones) se dibujan aparte, no aquí.
      const bloques = [];
      ctx.font = fuenteNombres;
      bloques.push({
        lineas: partirLineas(ctx, `${apellidoFamilia}: ${listaConY(nombresMiembros)}`, anchoDisponible),
        font: fuenteNombres,
        fontSizePx: tamNombres,
        lineHeight: lineHeightNombres,
      });
      if (mesaTexto) {
        ctx.font = fuenteDetalle;
        bloques.push({
          lineas: partirLineas(ctx, mesaTexto, anchoDisponible),
          font: fuenteDetalle,
          fontSizePx: tamDetalle,
          lineHeight: lineHeightDetalle,
        });
      }

      // Posición fija según la cuadrícula de calibración: ahí es donde
      // caen las líneas de ejemplo "[Familia]" / "[Mesa]" de la plantilla.
      let cursorY = 0.855 * H;

      bloques.forEach((b) => {
        ctx.font = b.font;
        dibujarParrafoConSombra(ctx, b.lineas, xIzq, cursorY, anchoDisponible, b.lineHeight, b.fontSizePx, "#DEC8B0", "#1F3A2E");
        cursorY += b.lineas.length * b.lineHeight + espacioEntreBloques;
      });

      if (mostrarCuadricula) dibujarCuadriculaCalibracion(ctx, W, H);

      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (_) {
        resolve(null);
      }
    };

    const imagenBase = evento.imagenInvitacion || evento.imagen;

    if (!imagenBase) {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1414; // proporción vertical, como si fuera para móvil
      const ctx = canvas.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, "#24402F");
      g.addColorStop(1, "#B08D57");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      dibujarTextoYResolver(canvas, ctx);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Lienzo EXACTAMENTE del tamaño de la plantilla vertical: no se
      // recorta, no se estira, no se añade nada extra. Solo se escribe encima,
      // y solo dentro del recuadro que ya trae la plantilla para ese fin.
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      dibujarTextoYResolver(canvas, ctx);
    };
    img.onerror = () => resolve(null);
    img.src = imagenBase;
  });
}
