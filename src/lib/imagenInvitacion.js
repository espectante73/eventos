// Generación de la imagen de invitación (dibujo sobre <canvas>): partido de
// líneas, justificado de texto, cuadrícula de calibración y el dibujo final
// sobre la plantilla. Sin estado de React — movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { formatearFecha, listaConY } from "./formato";

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

// Rejilla temporal (cada 5% del ancho/alto) con la fracción escrita en cada
// línea — sirve para leer directamente en la imagen las coordenadas que hay
// que darle a RECUADRO/RECUADRO_DATOS, en vez de estimarlas a ojo desde una
// captura. Solo se activa con el modo calibración; nunca en una invitación
// real enviada a un invitado.
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
    // Recuadro recalibrado con precisión sobre la plantilla real, con margen
    // interior comprobado (izquierda, derecha, arriba, abajo como fracción
    // del ancho/alto de la imagen)
    const RECUADRO = { left: 0.505, right: 0.96, top: 0.83, bottom: 0.915 };

    // Recuadro grande de la izquierda (FECHA / HORA / LUGAR con su icono ya
    // impreso en la plantilla) — el valor se escribe en el hueco a la
    // derecha de cada icono, sin tapar nada (ahí no hay texto de ejemplo).
    const RECUADRO_DATOS = { left: 0.065, right: 0.49, top: 0.345, bottom: 0.65 };

    const dibujarDatosGenerales = (ctx, W, H) => {
      // Los valores van DEBAJO de su etiqueta (no al lado), usando casi
      // todo el ancho del recuadro — así la letra puede ser más grande.
      const xValor = RECUADRO_DATOS.left * W + (RECUADRO_DATOS.right - RECUADRO_DATOS.left) * W * 0.27;
      const anchoValor = (RECUADRO_DATOS.right - RECUADRO_DATOS.left) * W * 0.68;
      const altoDatos = (RECUADRO_DATOS.bottom - RECUADRO_DATOS.top) * H;
      // Pequeño ajuste fino en píxeles reales (el canvas tiene exactamente
      // el tamaño de la imagen, así que -1/-2 aquí son 1/2 píxeles de verdad)
      // para ganar algo de aire y poder agrandar la letra de lugar.
      const yFecha = RECUADRO_DATOS.top * H + altoDatos * (1 / 6) - 1;
      const yHora = RECUADRO_DATOS.top * H + altoDatos * (3 / 6) - 3;
      const yLugar = RECUADRO_DATOS.top * H + altoDatos * (5 / 6) - 3;
      // La distancia entre el centro de una fila y la siguiente es
      // altoDatos/3 — hay que bajar bastante menos que eso, si no el
      // valor cae encima de la etiqueta de abajo.
      const bajarDesdeEtiqueta = altoDatos * 0.15;

      ctx.fillStyle = "#1F3A2E";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const fechaValor = evento.fecha ? formatearFecha(evento.fecha) : "";
      const horaValor = evento.hora ? `${evento.hora}h` : "";
      const lugarValor = [evento.lugar, evento.direccion].filter(Boolean).join(", ").trim();

      ctx.font = `bold ${Math.round(W * 0.028)}px 'Fraunces', serif`;
      if (fechaValor) ctx.fillText(fechaValor, xValor, yFecha + bajarDesdeEtiqueta);
      // Posición fija según la cuadrícula de calibración (y=0.53 del alto
      // total), sin acumular más offsets sobre la fórmula anterior.
      if (horaValor) ctx.fillText(horaValor, xValor, 0.53 * H);

      if (lugarValor) {
        // La dirección suele ser larga: letra más pequeña, también debajo
        // de su etiqueta y bajando desde ahí línea a línea.
        ctx.font = `bold ${Math.round(W * 0.023) + 2}px 'Fraunces', serif`;
        const lineHeightLugar = Math.round(W * 0.028) + 2;
        // Aquí no se baja tanto: el hueco hasta el borde inferior del
        // recuadro es pequeño y hay que dejar sitio para varias líneas.
        const lineasLugar = partirLineas(ctx, lugarValor, anchoValor);
        lineasLugar.forEach((linea, i) =>
          ctx.fillText(linea, xValor, yLugar + bajarDesdeEtiqueta * 0.3 + i * lineHeightLugar)
        );
      }

      // El resto del dibujo (nombre/mesa) asume la base de línea por
      // defecto — se restaura para no descuadrarlo.
      ctx.textBaseline = "alphabetic";
    };

    const dibujarTextoYResolver = (canvas, ctx) => {
      const W = canvas.width;
      const H = canvas.height;
      const xIzq = RECUADRO.left * W + (RECUADRO.right - RECUADRO.left) * W * 0.04;
      const anchoDisponible = (RECUADRO.right - RECUADRO.left) * W * 0.92;
      const yTop = RECUADRO.top * H;
      const altoRecuadro = (RECUADRO.bottom - RECUADRO.top) * H;

      dibujarDatosGenerales(ctx, W, H);

      // Fondo sólido (mismo tono crema del recuadro) para tapar el texto
      // de ejemplo de la plantilla antes de escribir el de verdad encima.
      ctx.fillStyle = "#DEC8B0";
      ctx.fillRect(RECUADRO.left * W, yTop, (RECUADRO.right - RECUADRO.left) * W, altoRecuadro);

      ctx.fillStyle = "#1F3A2E";

      const fuenteNombres = `bold ${Math.round(W * 0.031)}px 'Fraunces', serif`;
      const fuenteDetalle = `bold ${Math.round(W * 0.037)}px 'Fraunces', serif`;
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
        lineHeight: lineHeightNombres,
      });
      if (mesaTexto) {
        ctx.font = fuenteDetalle;
        bloques.push({
          lineas: partirLineas(ctx, mesaTexto, anchoDisponible),
          font: fuenteDetalle,
          lineHeight: lineHeightDetalle,
        });
      }

      // Posición fija según la cuadrícula de calibración: y=0.85 del alto
      // total es directamente donde se apoya la línea de base del texto
      // (sin ningún desplazamiento añadido, para que coincida con lo que
      // se lee en la cuadrícula).
      let cursorY = 0.85 * H;

      bloques.forEach((b) => {
        ctx.font = b.font;
        dibujarParrafoJustificado(ctx, b.lineas, xIzq, cursorY, anchoDisponible, b.lineHeight);
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
