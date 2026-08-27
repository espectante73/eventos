// Generación de la imagen de invitación (dibujo sobre <canvas>): partido de
// líneas, justificado de texto, cuadrícula de calibración y el dibujo final
// sobre la plantilla. Sin estado de React — movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { formatearFecha, formatearDiaSemana, listaConY } from "./formato";

// Sombreado ajustado a una línea de texto -- nunca un recuadro grande. El
// ancho SIEMPRE es el de la columna disponible (no el del texto medido):
// la plantilla ya trae un valor de ejemplo quemado en esa misma línea (p.ej.
// "Benito y Meritxell"), y si el texto nuevo es más corto que el viejo, un
// sombreado ajustado solo al texto nuevo deja un trozo del viejo asomando
// por el lado. Con el ancho de columna completo eso no puede pasar, y aun
// así solo se sombrea esa línea -- no el recuadro entero.
function resaltarLinea(ctx, x, yBase, anchoColumna, fontSizePx, colorFondo) {
  const padX = fontSizePx * 0.6;
  const arriba = fontSizePx * 1.4;
  const abajo = fontSizePx * 1.0;
  ctx.fillStyle = colorFondo;
  ctx.fillRect(x - padX, yBase - arriba, anchoColumna + padX * 2, arriba + abajo);
}

function partirLineas(ctx, texto, maxWidth) {
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
function dibujarLineaJustificada(ctx, linea, x, y, maxWidth, esUltima) {
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

function dibujarParrafoJustificado(ctx, lineas, x, y, maxWidth, lineHeight) {
  lineas.forEach((linea, i) => {
    dibujarLineaJustificada(ctx, linea, x, y + i * lineHeight, maxWidth, i === lineas.length - 1);
  });
}

// Igual que dibujarParrafoJustificado, pero primero sombrea cada línea (al
// ancho de columna completo -- ver resaltarLinea) antes de escribir encima.
function dibujarParrafoConSombra(ctx, lineas, x, y, maxWidth, lineHeight, fontSizePx, colorFondo, colorTexto) {
  lineas.forEach((linea, i) => {
    resaltarLinea(ctx, x, y + i * lineHeight, maxWidth, fontSizePx, colorFondo);
  });
  ctx.fillStyle = colorTexto;
  dibujarParrafoJustificado(ctx, lineas, x, y, maxWidth, lineHeight);
}

// Rejilla temporal (cada 5% del ancho/alto) con la fracción escrita en cada
// línea — sirve para leer directamente en la imagen las coordenadas que hay
// que darle a las constantes de más abajo, en vez de estimarlas a ojo desde
// una captura. Solo se activa con el modo calibración; nunca en una
// invitación real enviada a un invitado.
function dibujarCuadriculaCalibracion(ctx, W, H) {
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

// Los mismos 3 iconos que usa la app en su propia página de inicio
// (Portada.jsx: Calendar/Clock/MapPin de lucide-react) -- paths SVG
// copiados tal cual de lucide-react para que se vean idénticos, en vez de
// los iconos que trae quemados la plantilla de fondo.
const ICONOS_SVG = {
  fecha: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  hora: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  lugar: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};

function cargarIcono(pathsSvg, color) {
  return new Promise((resolve) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathsSvg}</svg>`;
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export function generarInvitacionImagen(
  evento,
  apellidoFamilia,
  nombresMiembros,
  mesaTexto,
  mostrarCuadricula = false,
  nombreColaborador = ""
) {
  // Los 3 iconos (mismo trazo dorado que el resto del diseño) se cargan
  // antes de dibujar nada -- son imágenes (SVG a data URI) y necesitan su
  // propio onload, igual que la plantilla de fondo.
  return Promise.all([
    cargarIcono(ICONOS_SVG.fecha, "#B08D57"),
    cargarIcono(ICONOS_SVG.hora, "#B08D57"),
    cargarIcono(ICONOS_SVG.lugar, "#B08D57"),
  ]).then(
    ([iconoFecha, iconoHora, iconoLugar]) =>
      new Promise((resolve) => {
        // Las dos zonas de abajo se midieron 2026-08-17 con cuadrícula de
        // coordenadas sobre la plantilla real (confirmada contra una captura
        // en vivo de la app con la cuadrícula activada: coinciden). AMBAS son
        // recuadros reales con esquinas redondeadas y borde dorado, con datos
        // de ejemplo quemados en el diseño ("FARIÑA; Benito y Meritxell" /
        // "Mesa 5; 2 personas", "13 de noviembre de 2026", "18:30 h",
        // "Icod de los Vinos, Tenerife"...) que hay que tapar línea a línea al
        // escribir los datos reales encima.

        // Recuadro de familia/mesa (abajo a la derecha).
        const RECUADRO = { left: 0.505, right: 0.965, top: 0.797, bottom: 0.925 };

        // Recuadro de fecha/hora/lugar (izquierda). Las etiquetas ("FECHA",
        // "HORA", "LUGAR") son fijas y no se tocan -- solo se sombrea y
        // reescribe el VALOR de cada campo. Los iconos, en cambio, si se
        // redibujan (ver ICONOS más abajo): la plantilla trae unos iconos
        // quemados y el usuario pidió sustituirlos por los mismos que usa
        // la propia app (Calendar/Clock/MapPin de lucide-react).
        const DATOS = {
          x: 0.16, // columna de texto (a la derecha de los iconos)
          anchoTexto: 0.26, // ancho de columna dentro del recuadro (hasta su borde derecho)
          yFechaZonaInicio: 0.468,
          yFechaZonaFin: 0.521,
          yFechaValor: 0.487,
          yDiaSemanaValor: 0.508,
          yHoraZonaInicio: 0.562,
          yHoraZonaFin: 0.607,
          yHoraValor: 0.58,
          yLugarZonaInicio: 0.64,
          yLugarZonaFin: 0.7,
          yLugarValor: 0.65,
        };

        // Posición e icono de cada fila, en columna con el texto. Centro Y
        // aproximado de cada etiqueta (FECHA/HORA/LUGAR) medido sobre la
        // plantilla real, para que el icono nuevo quede a la misma altura
        // que el que sustituye.
        // x/tam recalibrados: la versión anterior (x=0.048, tam=0.075) hacía
        // que el parche de fondo se saliera por la izquierda del recuadro
        // real (que empieza en x=0.045) -- con tam más grande, el margen del
        // parche (tam*0.35) por sí solo ya superaba ese borde. Ahora el
        // icono es más pequeño y el parche va ceñido a su propio tamaño
        // (no al tamaño del icono viejo que tapa), así que cabe con margen
        // dentro del recuadro en vez de sobresalir.
        const ICONOS = {
          x: 0.08,
          tam: 0.06,
          fecha: { y: 0.465, img: iconoFecha },
          hora: { y: 0.56, img: iconoHora },
          lugar: { y: 0.635, img: iconoLugar },
        };

        const dibujarIcono = (ctx, W, H, def) => {
          if (!def.img) return;
          const tam = ICONOS.tam * W;
          const xIcono = ICONOS.x * W;
          const yCentro = def.y * H;
          const margen = tam * 0.12;
          // Parche ceñido al propio icono nuevo (más pequeño que antes),
          // no al icono viejo que tapa -- ya no se sale del recuadro.
          ctx.fillStyle = "#F5F0E6";
          ctx.fillRect(xIcono - margen, yCentro - tam / 2 - margen, tam + margen * 2, tam + margen * 2);
          ctx.drawImage(def.img, xIcono, yCentro - tam / 2, tam, tam);
        };

        const dibujarDatosGenerales = (ctx, W, H) => {
          const x = DATOS.x * W - 4;
          const anchoTexto = DATOS.anchoTexto * W;
          const padX = W * 0.032;

          const fechaValor = evento.fecha ? formatearFecha(evento.fecha) : "";
          const diaSemanaValor = evento.fecha ? formatearDiaSemana(evento.fecha) : "";
          const horaValor = evento.hora ? `${evento.hora} h` : "";
          // Líneas explícitas en vez de partir por ancho: 1) nombre del lugar,
          // 2) cada tramo de la dirección separado por coma en su propia línea
          // (p.ej. "Ctra. el Amparo 190" / "38430 Icod de los Vinos") -- así
          // coincide con el salto de línea real de la dirección en vez de con
          // donde el texto justo deja de caber en el ancho disponible.
          const lineasLugar = [
            evento.lugar,
            ...(evento.direccion ? evento.direccion.split(",").map((s) => s.trim()) : []),
          ].filter(Boolean);

          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";

          const tapZona = (zonaInicio, zonaFin) => {
            ctx.fillStyle = "#F5F0E6";
            ctx.fillRect(x - padX, zonaInicio * H, anchoTexto + padX * 2 - 15, (zonaFin - zonaInicio) * H);
          };

          const tamFecha = Math.round(W * 0.028);
          const tamDia = tamFecha;

          if (fechaValor || diaSemanaValor) {
            tapZona(DATOS.yFechaZonaInicio, DATOS.yFechaZonaFin);
            ctx.fillStyle = "#1F3A2E";
            if (fechaValor) {
              ctx.font = `bold ${tamFecha}px 'Fraunces', serif`;
              ctx.fillText(fechaValor, x, DATOS.yFechaValor * H);
            }
            if (diaSemanaValor) {
              ctx.font = `italic ${tamDia}px 'Fraunces', serif`;
              ctx.fillText(diaSemanaValor, x, DATOS.yDiaSemanaValor * H);
            }
            // El icono se dibuja el último, encima del sombreado de texto,
            // para quedar siempre en primer plano (antes el sombreado podía
            // pintar por encima de una esquina del icono).
            dibujarIcono(ctx, W, H, ICONOS.fecha);
          }

          if (horaValor) {
            tapZona(DATOS.yHoraZonaInicio, DATOS.yHoraZonaFin);
            ctx.font = `bold ${tamFecha}px 'Fraunces', serif`;
            ctx.fillStyle = "#1F3A2E";
            ctx.fillText(horaValor, x, DATOS.yHoraValor * H);
            dibujarIcono(ctx, W, H, ICONOS.hora);
          }

          if (lineasLugar.length > 0) {
            tapZona(DATOS.yLugarZonaInicio, DATOS.yLugarZonaFin);
            const tamLugar = Math.round(W * 0.022);
            // El nombre del lugar (primera línea, p.ej. "Rte. El Rincón")
            // va más grande que el resto de la dirección -- pedido
            // explícito del usuario.
            const tamLugarNombre = Math.round(W * 0.027);
            ctx.fillStyle = "#1F3A2E";
            const lineHeight = Math.round(H * 0.024);
            const xLugar = x - 3;
            let y = DATOS.yLugarValor * H + 3;
            lineasLugar.forEach((linea, i) => {
              ctx.font = `bold ${i === 0 ? tamLugarNombre : tamLugar}px 'Fraunces', serif`;
              ctx.fillText(linea, xLugar, y);
              y += lineHeight;
            });
            dibujarIcono(ctx, W, H, ICONOS.lugar);
          }
        };

        const dibujarTextoYResolver = (canvas, ctx) => {
          const W = canvas.width;
          const H = canvas.height;
          const xIzq = RECUADRO.left * W + (RECUADRO.right - RECUADRO.left) * W * 0.025;
          const anchoDisponible = (RECUADRO.right - RECUADRO.left) * W * 0.88;

          dibujarDatosGenerales(ctx, W, H);

          // Las 3 líneas (nombres, mesa, colaborador) usan ahora la MISMA
          // letra -- a petición del usuario, 2026-08-27, para que se vean
          // homogéneas y el espacio entre ellas quede igualado solo
          // (mismo lineHeight en las 3). "fuenteDetalle"/"tamDetalle"
          // (más grande, solo para la mesa) se retiraron por completo al
          // dejar de usarse en ningún sitio.
          const fuenteNombres = `bold ${Math.round(W * 0.031)}px 'Fraunces', serif`;
          const tamNombres = Math.round(W * 0.031);
          const lineHeightNombres = Math.round(W * 0.035);
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
          // Mesa iguala ahora la letra de la línea 1 (fuenteNombres, no
          // fuenteDetalle) -- a petición del usuario, 2026-08-27: las 3
          // líneas deben verse del mismo tamaño, y con eso el espacio
          // entre ellas también queda igualado solo (mismo lineHeight
          // en las 3, mismo espacioEntreBloques de siempre).
          if (mesaTexto) {
            ctx.font = fuenteNombres;
            bloques.push({
              lineas: partirLineas(ctx, mesaTexto, anchoDisponible),
              font: fuenteNombres,
              fontSizePx: tamNombres,
              lineHeight: lineHeightNombres,
            });
          }
          // Tercera línea, a petición del usuario, 2026-08-27: quién es
          // su colaborador -- será la primera cara amiga que vea al
          // llegar a Recepción, así que conviene que lo sepa de
          // antemano. Corregido tras verla en una invitación real
          // (2026-08-27, misma tarde): se salía del recuadro y usaba una
          // letra distinta a la línea 1 -- ahora usa la MISMA letra que
          // la línea 1 (fuenteNombres, no fuenteDetalle), "Colab." en
          // vez de "Colaborador" para ahorrar sitio, y NUNCA se parte en
          // dos líneas -- si no cabe en una a ese tamaño, se encoge la
          // letra (nunca por debajo del 70% del tamaño de partida) en
          // vez de dejar que salte de línea o se salga del recuadro.
          if (nombreColaborador) {
            const etiquetaColaborador = `Colab.: ${nombreColaborador}`;
            let tamColaborador = tamNombres;
            ctx.font = `bold ${tamColaborador}px 'Fraunces', serif`;
            while (ctx.measureText(etiquetaColaborador).width > anchoDisponible && tamColaborador > tamNombres * 0.7) {
              tamColaborador -= 1;
              ctx.font = `bold ${tamColaborador}px 'Fraunces', serif`;
            }
            bloques.push({
              lineas: [etiquetaColaborador],
              font: `bold ${tamColaborador}px 'Fraunces', serif`,
              fontSizePx: tamColaborador,
              lineHeight: Math.round(lineHeightNombres * (tamColaborador / tamNombres)),
            });
          }

          // Posición fija según la cuadrícula de calibración: ahí es donde
          // caen las líneas de ejemplo "FARIÑA; Benito y Meritxell" / "Mesa 5;
          // 2 personas" de la plantilla. Subida ligeramente (0.840, antes
          // 0.845) a petición del usuario, 2026-08-27, tras ver las 3
          // líneas ya con el mismo tamaño -- si sigue sin quedar donde
          // debería, dime el valor exacto de la cuadrícula (0.83, 0.835...)
          // y lo ajusto sin tener que adivinar.
          let cursorY = 0.84 * H;

          bloques.forEach((b) => {
            ctx.font = b.font;
            dibujarParrafoConSombra(ctx, b.lineas, xIzq, cursorY, anchoDisponible, b.lineHeight, b.fontSizePx, "#EFE3CE", "#1F3A2E");
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
      })
  );
}
