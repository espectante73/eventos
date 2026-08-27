// Generación de la imagen de invitación (dibujo sobre <canvas>): partido de
// líneas, justificado de texto, cuadrícula de calibración y el dibujo final
// sobre la plantilla. Sin estado de React — movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { formatearFecha, formatearDiaSemana, listaConY } from "./formato";

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

export function generarInvitacionImagen(
  evento,
  apellidoFamilia,
  nombresMiembros,
  mesaTexto,
  mostrarCuadricula = false,
  nombreColaborador = ""
) {
  return (
    new Promise((resolve) => {
        // Las dos zonas de abajo se midieron 2026-08-17 con cuadrícula de
        // coordenadas sobre la plantilla real (confirmada contra una captura
        // en vivo de la app con la cuadrícula activada: coinciden). AMBAS son
        // recuadros reales con esquinas redondeadas y borde dorado, con datos
        // de ejemplo quemados en el diseño ("FARIÑA; Benito y Meritxell" /
        // "Mesa 5; 2 personas", "13 de noviembre de 2026", "18:30 h",
        // "Icod de los Vinos, Tenerife"...) que hay que tapar línea a línea al
        // escribir los datos reales encima.
        //
        // 2026-08-27: a petición del usuario, la zona de fecha/hora/lugar deja
        // de taparse (sin fondo) -- sabiendo que la plantilla ACTUAL todavía
        // trae esos valores de ejemplo quemados; el usuario va a subir una
        // plantilla nueva sin ese texto de ejemplo, y prueba mientras tanto
        // con la actual. Si se ve el texto viejo asomando, es justo ese
        // motivo, no un bug nuevo. Los iconos se dejan tal cual los trae la
        // plantilla (los originales, sin sustituirlos ni taparlos).

        // Recuadro de familia/mesa (abajo a la derecha).
        const RECUADRO = { left: 0.505, right: 0.965, top: 0.797, bottom: 0.925 };

        // Recuadro de fecha/hora/lugar (izquierda). Las etiquetas ("FECHA",
        // "HORA", "LUGAR") y los iconos son fijos y no se tocan -- a
        // petición del usuario, 2026-08-27, se dejan los iconos ORIGINALES
        // de la plantilla tal cual, sin sustituirlos ni taparlos. Solo se
        // reescribe el VALOR de cada campo, sin ningún fondo detrás (ver
        // aviso más arriba sobre el texto de ejemplo quemado).
        const DATOS = {
          x: 0.15, // columna de texto (a la derecha de los iconos) -- corrida un poco a la izquierda, 2026-08-27
          yFechaValor: 0.487,
          yDiaSemanaValor: 0.508,
          yHoraValor: 0.58,
          yLugarValor: 0.65,
        };

        const dibujarDatosGenerales = (ctx, W, H) => {
          const x = DATOS.x * W - 4;
          // Cada uno se puede desactivar por separado desde la ventana
          // Invitaciones ("Imprimir: Fecha/Hora/Lugar") -- a petición del
          // usuario, 2026-08-27. "!== false" para que, antes de pegar el
          // SQL nuevo (evento sin este dato todavía), se comporte igual
          // que siempre: mostrando los 3.
          const fechaValor = evento.fecha && evento.imprimirFecha !== false ? formatearFecha(evento.fecha) : "";
          const diaSemanaValor =
            evento.fecha && evento.imprimirFecha !== false ? formatearDiaSemana(evento.fecha) : "";
          const horaValor = evento.hora && evento.imprimirHora !== false ? `${evento.hora} h` : "";
          // Líneas explícitas en vez de partir por ancho: 1) nombre del lugar,
          // 2) cada tramo de la dirección separado por coma en su propia línea
          // (p.ej. "Ctra. el Amparo 190" / "38430 Icod de los Vinos") -- así
          // coincide con el salto de línea real de la dirección en vez de con
          // donde el texto justo deja de caber en el ancho disponible.
          const lineasLugar =
            evento.imprimirLugar === false
              ? []
              : [evento.lugar, ...(evento.direccion ? evento.direccion.split(",").map((s) => s.trim()) : [])].filter(
                  Boolean
                );

          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";

          const tamFecha = Math.round(W * 0.028);
          const tamDia = tamFecha;

          // Letra normal (no "bold") en las 4 -- a petición del usuario,
          // 2026-08-27: se veía "muy gruesa" para el poco espacio de este
          // recuadro.
          if (fechaValor || diaSemanaValor) {
            ctx.fillStyle = "#1F3A2E";
            if (fechaValor) {
              ctx.font = `${tamFecha}px 'Fraunces', serif`;
              ctx.fillText(fechaValor, x, DATOS.yFechaValor * H);
            }
            if (diaSemanaValor) {
              ctx.font = `italic ${tamDia}px 'Fraunces', serif`;
              ctx.fillText(diaSemanaValor, x, DATOS.yDiaSemanaValor * H);
            }
          }

          if (horaValor) {
            ctx.font = `${tamFecha}px 'Fraunces', serif`;
            ctx.fillStyle = "#1F3A2E";
            ctx.fillText(horaValor, x, DATOS.yHoraValor * H);
          }

          if (lineasLugar.length > 0) {
            const tamLugar = Math.round(W * 0.022);
            // El nombre del lugar (primera línea, p.ej. "Rte. El Rincón")
            // va más grande que el resto de la dirección -- pedido
            // explícito del usuario.
            const tamLugarNombre = Math.round(W * 0.027);
            ctx.fillStyle = "#1F3A2E";
            const lineHeight = Math.round(H * 0.024);
            const xLugar = x - 3;
            // Bloque completo (nombre del lugar + dirección) subido 20px --
            // a petición del usuario, 2026-08-27.
            let y = DATOS.yLugarValor * H + 3 - 20;
            lineasLugar.forEach((linea, i) => {
              ctx.font = `${i === 0 ? tamLugarNombre : tamLugar}px 'Fraunces', serif`;
              ctx.fillText(linea, xLugar, y);
              y += lineHeight;
            });
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
          // Sin "bold" -- a petición del usuario, 2026-08-27, para que
          // coincida con la letra normal ya usada en fecha/hora/lugar.
          const fuenteNombres = `${Math.round(W * 0.031)}px 'Fraunces', serif`;
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
            ctx.font = `${tamColaborador}px 'Fraunces', serif`;
            while (ctx.measureText(etiquetaColaborador).width > anchoDisponible && tamColaborador > tamNombres * 0.7) {
              tamColaborador -= 1;
              ctx.font = `${tamColaborador}px 'Fraunces', serif`;
            }
            bloques.push({
              lineas: [etiquetaColaborador],
              font: `${tamColaborador}px 'Fraunces', serif`,
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

          // Sin sombreado de fondo por línea -- a petición del usuario,
          // 2026-08-27: este recuadro (familia/mesa/colaborador) ya tiene
          // su propio fondo crema de la propia plantilla; el rectángulo de
          // resaltado (pensado para texto sobre la FOTO, con esquinas
          // rectas) sobresalía de las esquinas redondeadas de este
          // recuadro. Solo el texto, directamente sobre el fondo que ya
          // hay.
          bloques.forEach((b) => {
            ctx.font = b.font;
            ctx.fillStyle = "#1F3A2E";
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
      })
  );
}
