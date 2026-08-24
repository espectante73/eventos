// Ventana "Versiones": historial de cambios de la app. No depende de
// ningún dato del evento — solo de sus propias constantes. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { VERSION_APP } from "../../constants";
import { Stamp } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Versiones anteriores ya cerradas (números enteros completos): un resumen
// breve por versión mayor, en vez de listar cada sub-versión — ocupa menos
// espacio en la sección "Versiones".
const RESUMEN_VERSIONES_ANTERIORES = [
  {
    version: "5",
    cambios:
      'Enlace del anfitrión cerrado con token secreto. Avisos automáticos por email (Resend) para asignación de invitados, datos completos y pagos completos, y envío de la invitación (con imagen adjunta) a cada familia, todo con vista previa y confirmación explícita — nunca disparado solo. Formulario del colaborador rediseñado para móvil. Cuadrícula de calibración para posicionar fecha/hora/lugar sobre la imagen de la invitación. Zona de Reinicio para limpiar datos de pruebas sin borrar invitados ni colaboradores.',
  },
  {
    version: "4",
    cambios:
      "Migración a una web real: los datos ya no viven en un Artifact sino en una base de datos compartida (Supabase), con web propia (Vite) desplegada automáticamente desde GitHub. El aislamiento entre colaboradores (cada uno solo ve sus invitados asignados) se cumple en el propio servidor, no solo en la pantalla.",
  },
  {
    version: "3",
    cambios:
      "Los campos de edición se movieron a Configuración; portada solo lectura con la fecha en formato largo.",
  },
  {
    version: "2",
    cambios:
      "Cobro automático por edad y precios, invitación generada con plantilla vertical (Familia/Mesa/PAGADO integrado), alergias con selectores dedicados y aviso en mesa, BORRAR TODO en Configuración, y encabezados sin flecha.",
  },
  {
    version: "1",
    cambios:
      "Primera versión estable: tabla ordenable, imagen de cabecera incrustada, enlaces de colaborador vía URL pública, foto de boda por familia, y límite de capacidad respetado en mesas.",
  },
];

// A partir de la 6.0, "cambios" es una lista de párrafos cortos (uno por
// área mejorada) en vez de un único bloque de texto largo — más fácil de
// leer de un vistazo.
const HISTORIAL_VERSIONES = [
  {
    version: "6.1",
    cambios: [
      "Login real (email + contraseña) para el anfitrión y para cada colaborador, en paralelo al enlace mágico de siempre — nadie tuvo que cambiar cómo entraba hasta que quiso.",
      'Cada colaborador crea su propia cuenta desde "Crear cuenta" usando el email con el que ya estaba dado de alta — se enlaza sola con su ficha, sin ningún paso manual de por medio. Si más adelante cambia de email, basta con actualizarlo en Colaboradores y volver a crear cuenta con el nuevo: se re-enlaza sola otra vez.',
      "El enlace-token antiguo deja de funcionar para colaboradores (ahora hace falta el login de verdad); el del anfitrión se mantiene como plan B, sin cambios.",
      'Enlace de colaborador viejo abierto sin haber iniciado sesión: pantalla clara de "No tienes acceso" con enlace a iniciar sesión, en vez de una vista técnica confusa que parecía un fallo de la app.',
      'Corrige que la previsualización "Formularios" del anfitrión llevaba rota desde la retirada del enlace-token: ahora reutiliza los datos que el anfitrión ya tiene cargados en vez de intentar una recarga que exigía sesión real de esa otra persona.',
      "Fallo de seguridad encontrado y cerrado en pruebas en vivo: la función que resuelve el rol al iniciar sesión concedía permiso de ejecución a cualquiera por defecto (aunque sin sesión no llegaba a devolver ningún dato real) — corregido revocando ese permiso explícitamente.",
    ],
  },
  {
    version: "6.0",
    cambios: [
      'Mesas: ahora se dibujan redondas con sillas alrededor (su número sigue a la capacidad), la cantidad de mesas es libre (añadir/quitar, sin el límite fijo de 15), y "Vaciar mesa" desasigna a todos sus invitados de golpe sin borrar a nadie.',
      "Plano de mesas: nueva sección con un lienzo donde cada mesa se arrastra a la posición que quieras (se guarda sola), con botón de impresión preparado para papel A2.",
      "Estado de cuentas: nueva sección con lo recaudado y pendiente de cobro calculados solos a partir de los pagos de invitados, más una lista editable de gastos (incluye también los costes de la propia app, como el dominio o la suscripción) y el balance resultante.",
      'Navegación: las secciones (Mesas, Configuración, Avisos...) dejan de estar apiladas en una página larga y pasan a abrirse como ventanas flotantes movibles y redimensionables, accesibles desde un único desplegable ordenado alfabéticamente. El cambio entre Anfitrión y colaboradores se redujo a una sola barra táctil, pensada para el pulgar en móvil.',
      "Portada: el botón para cambiar la imagen (poco visible sobre algunas fotos) se quita de encima de la portada; ahora se edita desde Configuración, junto con el resto de datos del evento.",
      "Imágenes: la imagen de portada y la de la plantilla de invitación se suben ahora como archivo desde el dispositivo, en vez de pegar una URL — igual que ya funcionaba la foto de boda.",
      "Email del colaborador: se edita en un solo sitio (Colaboradores); se quita el duplicado de Configuración, y en el formulario de datos del invitado aparece ensombrecido (solo lectura) cuando ese invitado es también un colaborador.",
      "Configuración: la ventana pasa a ser solo un desplegable \"SECCIÓN\" — cada parte (Precios, URL web, Email anfitrión, Texto emails, Reinicios, Borrado total...) se abre en su propia ventana independiente, igual que Mesas o Avisos.",
      "Ventanas: cualquiera pasa a primer plano en cuanto se toca, en vez de quedarse algunas ancladas por encima de las demás.",
      "Solidez: BORRAR TODO descarga ahora la misma copia de seguridad automática que ya tenían los reinicios. Y si guardar algo falla (sin conexión, fallo del servidor), la pantalla deja de mostrar el cambio como si se hubiera guardado — se deshace solo en vez de mentir hasta que recargues. Además, si algo revienta al pintar la pantalla, ahora se ve un aviso con botón de recargar en vez de quedarse todo en blanco sin explicación.",
      "Emails, tras la primera prueba real: la tentativa ya no bloquea avisar al anfitrión ni aparece nombrada en el email al colaborador (evita preguntas antes de tiempo); \"He terminado mi trabajo\" se movió a la derecha; y en Colaboradores hay un botón \"Probar\" para confirmar al momento que un email está bien escrito, en vez de descubrirlo días después.",
      "Corrige que los modales de confirmación (REINICIAR, \"¿has terminado?\"...) podían abrirse ocultos detrás de una ventana ya abierta un rato, por quedarse con un z-index fijo mientras las ventanas ya lo tenían dinámico.",
      "Avisos: panel con el total pendiente de datos (solo confirmados) e invitaciones, y el historial de emails enviados ahora se filtra por 3 tipos (Asignados, Datos, Invitación) y se ordena por Fecha, Tipo o Email.",
      "Corrige que BORRAR TODO y los reinicios no llegaban a aplicarse desde el móvil: la descarga automática de la copia de seguridad se disparaba antes de la acción real, y en algunos navegadores móviles eso podía interrumpirla antes de completarse. Ahora la copia se descarga después de que la acción ya haya terminado.",
      "Se probó y se revirtió: confirmar en el momento si Resend acepta un envío. Esperar esa respuesta dentro de la misma función podía agotar el tiempo máximo de una consulta y cancelar el envío entero, no solo la confirmación — enviar_email vuelve a ser \"disparar y no esperar\", que es lo fiable.",
      "Solidez de fondo: avisoPendiente e invitacionEnviada dejan de fijarse a mano en cada función y se recalculan solos según el estado real. Además, cada sesión (la tuya, la de cada colaborador) vuelve a pedir los datos sola cada minuto, para no quedarse con una copia vieja si otra persona cambia algo mientras tanto.",
      "Emails: la confirmación ✓/✗/? vuelve al historial de Avisos, esta vez bien separada del envío — enviar_email() solo guarda dónde mirar la respuesta más tarde, y una comprobación aparte (que nunca espera ni puede bloquear nada) la va resolviendo sola con el refresco de cada minuto.",
      "Solidez de fondo: App.jsx (6.262 líneas) se reparte en ficheros por tipo (lib/, components/, vistas/) — mismo comportamiento, más fácil de mantener. Ahora en marcha: dividir también el interior de VistaAnfitrion, ventana a ventana.",
      "Solidez de fondo: terminado el reparto del interior de VistaAnfitrion — cada ventana (Mesas, Avisos, Configuración...) vive ya en su propio fichero.",
      "Lista de invitados pasa a ser una ventana flotante más (movible, cerrable, accesible desde el desplegable de arriba), igual que el resto — antes era la única sección fija en la página. Sus filtros y la cabecera de columnas se quedan fijos arriba al hacer scroll por la lista, para no perderlos de vista con listas largas.",
      "Corrige que cerrar la ventana de Lista de invitados podía dejar la pantalla en un bucle de renderizado (la ventana se abría y cerraba sola sin parar) por un efecto que se reiniciaba con cada cierre en vez de una sola vez.",
      "Invitación: fecha/hora/lugar y familia/mesa recalibradas sobre la plantilla real (coordenadas exactas, sombreado ajustado a cada línea de texto en vez de al recuadro entero), con los mismos iconos de calendario/reloj/ubicación que usa la propia app en vez de los que traía la plantilla.",
      "Portada: los 3 recuadros de estadísticas (Lista global, Tentativa, Confirmados) sobresalían del ancho de la imagen en pantallas anchas — ahora comparten el mismo ancho máximo y quedan pegados a la franja verde de debajo.",
      "Progreso de recopilación: cada colaborador pasa a ser un solo recuadro compacto (antes 3 barras sueltas), y las barras generales (datos, cobro, canciones) se juntan en un recuadro verde/dorado único con formato icono+barra+porcentaje en una línea.",
      "Corrige que arrastrar una ventana flotante tocando su cuerpo (no la cabecera) podía mover lo que hay detrás en móvil, por un encadenamiento de scroll del navegador.",
      "Limpieza de fondo: unos 80 imports y variables sin usar (sobras del reparto de App.jsx en ventanas separadas) detectados y eliminados.",
    ],
  },
];

export function VentanaVersiones({ onCerrar }) {
  return (
    <VentanaFlotante clave="versiones" titulo="Versiones" onCerrar={onCerrar}>
      <div className="space-y-3">
        {HISTORIAL_VERSIONES.map((v) => (
          <div
            key={v.version}
            className="flex items-start gap-3 p-3 rounded"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
          >
            <Stamp color={v.version === VERSION_APP ? C.ink : C.charcoal}>
              v{v.version}
            </Stamp>
            <div className="space-y-2">
              {(Array.isArray(v.cambios) ? v.cambios : [v.cambios]).map((parrafo, i) => (
                <p key={i} className="text-sm" style={{ color: C.charcoal }}>
                  {parrafo}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      {RESUMEN_VERSIONES_ANTERIORES.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.6 }}>
            Versiones anteriores completas (resumidas):
          </p>
          <div className="space-y-2">
            {RESUMEN_VERSIONES_ANTERIORES.map((v) => (
              <div
                key={v.version}
                className="flex items-start gap-3 p-2 rounded"
                style={{ background: C.paperDark, opacity: 0.8 }}
              >
                <Stamp color={C.charcoal}>v{v.version}</Stamp>
                <p className="text-xs" style={{ color: C.charcoal }}>
                  {v.cambios}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </VentanaFlotante>
  );
}
