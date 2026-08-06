import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  X,
  Plus,
  Mail,
  Music,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Bell,
  Trash2,
  Cake,
  Heart,
  DollarSign,
  Image as ImageIcon,
  Copy,
  Pencil,
  Repeat,
  Printer,
  MoreVertical,
} from "lucide-react";
import { useLedgerData } from "./useLedgerData";
import { supabase } from "./supabaseClient";

const VERSION_APP = "6.0";

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
      "Avisos: panel con el total pendiente de datos (solo confirmados) e invitaciones, y el historial de emails enviados se puede filtrar por tipo (colaboradores / familias).",
    ],
  },
];

const C = {
  paper: "#EFE9DE",
  paperDark: "#E4DCC9",
  ink: "#1F3A2E",
  wax: "#8C2F39",
  gold: "#B08D57",
  charcoal: "#2B2620",
  line: "#C9BFA9",
};

// UUID real (no Math.random()): las columnas de la base de datos son de tipo
// uuid, y además esto es lo que hace que el enlace de cada colaborador sea
// realmente imposible de adivinar (no hay contraseña, el id ES la "llave").
const uid = () => crypto.randomUUID();

function datosCompletos(g) {
  // Únicos datos obligatorios: año de nacimiento y alergias (aunque la
  // respuesta sea "No", tiene que estar contestada explícitamente). Todo lo
  // demás (boda, foto, email, canción) es opcional — puede ser soltero/a,
  // menor de edad, o simplemente no querer compartir más datos.
  return Boolean(g.anioNacimiento) && Boolean(g.alergias);
}

// Los 6 campos de texto que rellena el colaborador, más la foto familiar
// (que vive aparte, en fotosFamiliares) = 7 en total. El pago no cuenta
// aquí — tiene su propia insignia ("Pagado"/"Pendiente de pago") aparte.
const CAMPOS_DATOS_INVITADO = [
  "anioNacimiento",
  "anioBoda",
  "email",
  "cancion",
  "alergias",
  "observaciones",
];
const TOTAL_DATOS_INVITADO = CAMPOS_DATOS_INVITADO.length + 1;

function contarDatosRellenados(g, foto) {
  const rellenos = CAMPOS_DATOS_INVITADO.filter((c) => (g[c] || "").trim() !== "").length;
  return rellenos + (foto ? 1 : 0);
}

function tieneAlergiaReal(g) {
  // "No" es una respuesta explícita de que no hay alergia — no cuenta como alergia.
  return Boolean(g.alergias && g.alergias.trim() && g.alergias.trim() !== "No");
}

function getRolFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("rol");
  } catch (_) {
    return null;
  }
}

function buildLink(rolValue, urlPublica) {
  try {
    const base = urlPublica && urlPublica.trim() ? urlPublica.trim() : window.location.href;
    const url = new URL(base);
    url.searchParams.set("rol", rolValue);
    return url.toString();
  } catch (_) {
    return "";
  }
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-");
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  const mesIndice = parseInt(mes, 10) - 1;
  if (mesIndice < 0 || mesIndice > 11 || isNaN(parseInt(dia, 10))) return fechaISO;
  return `${parseInt(dia, 10)} ${MESES_ES[mesIndice]} ${anio}`;
}

function ordenarPorApellidoNombre(lista) {
  return lista
    .slice()
    .sort(
      (a, b) =>
        (a.apellido || "").localeCompare(b.apellido || "") ||
        (a.nombre || "").localeCompare(b.nombre || "")
    );
}

function calcularEdad(anioNacimiento, evento) {
  const anio = parseInt(anioNacimiento, 10);
  if (!anio || isNaN(anio)) return null;
  const anioReferencia =
    evento && evento.fecha ? new Date(evento.fecha).getFullYear() : new Date().getFullYear();
  const edad = anioReferencia - anio;
  return edad > 0 && edad < 130 ? edad : null;
}

function edadPromedio(invitados, evento) {
  const edades = invitados
    .map((g) => calcularEdad(g.anioNacimiento, evento))
    .filter((e) => e !== null);
  if (edades.length === 0) return null;
  return Math.round(edades.reduce((a, b) => a + b, 0) / edades.length);
}

function parsePrecio(valor) {
  if (!valor) return 0;
  const limpio = String(valor)
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

// Importe que le corresponde a un invitado según su edad (calculada a partir del
// año de nacimiento y la fecha del evento) y el rango/precios fijados en Configuración.
// Por debajo de "desde" no paga (bebés); entre "desde" y "hasta" paga precio niño;
// de "hasta" en adelante paga precio adulto.
function importeEsperadoInvitado(g, evento) {
  const edad = calcularEdad(g.anioNacimiento, evento);
  const desde = parseInt(evento?.edadNinoDesde, 10);
  const hasta = parseInt(evento?.edadNinoHasta, 10);
  const precioAdulto = parsePrecio(evento?.precioAdulto);
  const precioNino = parsePrecio(evento?.precioNino);
  if (edad === null) return precioAdulto;
  if (!isNaN(desde) && edad < desde) return 0;
  if (!isNaN(hasta) && edad < hasta) return precioNino;
  return precioAdulto;
}

// La asignación de colaborador es siempre manual y exclusiva del Anfitrión.
function resolverColaborador(g, colaboradores) {
  if (!g.colaboradorId) return null;
  return colaboradores.find((c) => c.id === g.colaboradorId) || null;
}

function parseImport(texto, colaboradores) {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = (line.includes("\t") ? line.split("\t") : line.split(","))
        .map((p) => p.trim());
      const grupoFamiliarRaw = parts[0] || "";
      const apellido = parts[1] || "";
      const nombre = parts[2] || "";
      const colaboradorNombre = parts[3] || "";
      const zona = parts[4] || "";
      const grupoFamiliar = grupoFamiliarRaw || apellido;
      const colaboradorMatch = colaboradorNombre
        ? colaboradores.find(
            (c) => c.nombre.trim().toLowerCase() === colaboradorNombre.trim().toLowerCase()
          )
        : null;
      return {
        apellido,
        nombre,
        zona,
        grupoFamiliar,
        colaboradorId: colaboradorMatch ? colaboradorMatch.id : null,
      };
    })
    .filter((r) => r.nombre && r.apellido && r.apellido.toLowerCase() !== "apellido");
}

function Seal({ count, size = 22 }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        background: C.wax,
        color: C.paper,
        width: size,
        height: size,
        fontSize: size > 22 ? 13 : 12,
        fontFamily: "'IBM Plex Mono', monospace",
        boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
      }}
    >
      {count}
    </span>
  );
}

function Stamp({ children, color = C.ink }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs tracking-widest uppercase font-semibold"
      style={{
        color,
        border: `1.5px solid ${color}`,
        borderRadius: 3,
        transform: "rotate(-2deg)",
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

// Ventana flotante genérica: independiente de qué secciones estén plegadas,
// para que Imprimir/Canciones/Alergias y los avisos de mesas funcionen siempre.
function ModalFlotante({ titulo, onCerrar, children, acciones, colorTitulo }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  // Un modal de verdad (con fondo oscurecido) tiene que quedar SIEMPRE por
  // delante de cualquier VentanaFlotante que ya estuviera abierta — si no,
  // en cuanto una ventana llevaba un rato usándose (z-index ya subido),
  // el modal se abría oculto detrás de ella. Se pide el mismo contador
  // compartido, así queda garantizado por encima de todo lo anterior.
  const [zIndex] = useState(() => ++contadorZIndexVentanas);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(31,25,15,0.55)", zIndex }}
      onClick={onCerrar}
    >
      <div
        className="rounded-lg w-full flex flex-col"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          maxWidth: 720,
          maxHeight: "88vh",
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <h3
            className="text-lg"
            style={{ fontFamily: "'Fraunces', serif", color: colorTitulo || C.ink, fontWeight: 700 }}
          >
            {titulo}
          </h3>
          <button onClick={onCerrar} title="Cerrar">
            <X size={18} style={{ color: C.charcoal }} />
          </button>
        </div>
        <div className="p-4" style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
        {acciones && (
          <div
            className="flex items-center gap-2 px-4 py-3 flex-wrap"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {acciones}
          </div>
        )}
      </div>
    </div>
  );
}

// Orden fijo de apertura en cascada — cada sección siempre aparece en el
// mismo sitio relativo, en vez de saltar de posición según el orden en que
// se abran.
// Orden alfabético (por la etiqueta visible, no por la clave interna) —
// así el desplegable es predecible según crece: siempre se sabe dónde
// buscar algo sin tener que recordar un grupo temático.
// Contador compartido por todas las VentanaFlotante para decidir cuál va
// por delante: cada vez que se toca o se abre una, sube y se lo queda ella.
let contadorZIndexVentanas = 50;

const ORDEN_VENTANAS = [
  "avisos",
  "colaboradores",
  "configuracion",
  "copiaSeguridad",
  "cuentas",
  "invitaciones",
  "mesas",
  "plano",
  "progreso",
  "versiones",
];

const ETIQUETAS_VENTANAS = {
  progreso: "Progreso de recopilación",
  colaboradores: "Colaboradores",
  mesas: "Mesas",
  plano: "Plano de mesas",
  invitaciones: "Invitaciones",
  cuentas: "Estado de cuentas",
  copiaSeguridad: "Copia de seguridad",
  configuracion: "Configuración",
  avisos: "Avisos",
  versiones: "Versiones",
};

// Cada parte de Configuración es su propia ventana flotante independiente
// (igual que Mesas, Avisos...), abierta desde el desplegable "SECCIÓN" en
// la cabecera de la ventana "Configuración" — que en sí misma no muestra
// nada más que ese desplegable.
const SECCIONES_CONFIGURACION = [
  { id: "config-datos-evento", etiqueta: "Datos del evento" },
  { id: "config-precios", etiqueta: "Precios" },
  { id: "config-url-web", etiqueta: "URL web" },
  { id: "config-email-anfitrion", etiqueta: "Email anfitrión" },
  { id: "config-plantillas-email", etiqueta: "Texto emails" },
  { id: "config-zona-reinicio", etiqueta: "Reinicios" },
  { id: "config-zona-peligro", etiqueta: "Borrado total" },
];

// Ventana flotante independiente y no bloqueante: a diferencia de
// ModalFlotante, no oscurece el resto de la pantalla ni impide que haya
// varias abiertas a la vez — pensada para las secciones de administración
// que se abren desde el desplegable de navegación (Mesas, Invitaciones,
// Configuración...), donde puede interesar ver más de una a la vez.
function VentanaFlotante({ clave, titulo, onCerrar, children, acciones, extra }) {
  const idx = Math.min(Math.max(ORDEN_VENTANAS.indexOf(clave), 0), 4);
  const posInicial = { top: 16 + idx * 20, left: 16 + idx * 20 };
  const [pos, setPos] = useState(posInicial);
  // null = todavía sin redimensionar a mano: usa el tamaño por defecto.
  const [tam, setTam] = useState(null);
  // El z-index no depende de qué ventana sea, sino de cuál se tocó la
  // última — así la recién abierta (o la que se acaba de pulsar) queda
  // siempre por delante, en vez de que unas pocas queden ancladas arriba.
  const [zIndex, setZIndex] = useState(() => ++contadorZIndexVentanas);
  const traerAlFrente = () => setZIndex(++contadorZIndexVentanas);
  const ventanaRef = useRef(null);
  // Offset entre el punto donde se agarra la cabecera y la esquina de la
  // ventana — así no "salta" al primer píxel del ratón al empezar a arrastrar.
  const arrastre = useRef(null);
  const redimension = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  useEffect(() => {
    const coords = (e) => (e.touches ? e.touches[0] : e);
    const mover = (e) => {
      const { clientX, clientY } = coords(e);
      if (arrastre.current) {
        setPos({
          left: Math.max(0, clientX - arrastre.current.dx),
          top: Math.max(0, clientY - arrastre.current.dy),
        });
      }
      if (redimension.current) {
        setTam({
          width: Math.max(280, redimension.current.anchoInicial + (clientX - redimension.current.x)),
          height: Math.max(200, redimension.current.altoInicial + (clientY - redimension.current.y)),
        });
      }
    };
    const soltar = () => {
      arrastre.current = null;
      redimension.current = null;
    };
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    window.addEventListener("touchmove", mover);
    window.addEventListener("touchend", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", soltar);
    };
  }, []);

  const iniciarArrastre = (e) => {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    arrastre.current = { dx: clientX - pos.left, dy: clientY - pos.top };
  };

  const iniciarRedimension = (e) => {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    const rect = ventanaRef.current.getBoundingClientRect();
    redimension.current = { x: clientX, y: clientY, anchoInicial: rect.width, altoInicial: rect.height };
  };

  return (
    <div
      ref={ventanaRef}
      className="fixed rounded-lg flex flex-col"
      onMouseDownCapture={traerAlFrente}
      onTouchStartCapture={traerAlFrente}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        width: tam ? tam.width : "min(620px, calc(100vw - 2rem))",
        height: tam ? tam.height : undefined,
        maxHeight: tam ? undefined : "80vh",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        top: pos.top,
        left: pos.left,
        zIndex,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-move select-none"
        style={{ borderBottom: `1px solid ${C.line}`, touchAction: "none" }}
        onMouseDown={iniciarArrastre}
        onTouchStart={iniciarArrastre}
      >
        <h3
          className="text-lg"
          style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
        >
          {titulo}
        </h3>
        <div
          className="flex items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {extra}
          <button onClick={onCerrar} title="Cerrar">
            <X size={18} style={{ color: C.charcoal }} />
          </button>
        </div>
      </div>
      <div className="p-4" style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
      {acciones && (
        <div
          className="flex items-center gap-2 px-4 py-3 flex-wrap"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          {acciones}
        </div>
      )}
      <div
        onMouseDown={iniciarRedimension}
        onTouchStart={iniciarRedimension}
        className="absolute"
        style={{ width: 18, height: 18, right: 2, bottom: 2, cursor: "nwse-resize", touchAction: "none" }}
        title="Arrastra para cambiar el tamaño"
      >
        <svg width="18" height="18" viewBox="0 0 16 16">
          <path d="M14 2 L2 14 M14 7 L7 14 M14 12 L12 14" stroke={C.line} strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children, onToggle, abierto, compacto }) {
  const plegable = typeof onToggle === "function";
  const contenido = (
    <>
      {Icon && <Icon size={18} strokeWidth={2} />}
      {children}
    </>
  );
  const estilo = {
    fontFamily: "'Fraunces', serif",
    color: C.ink,
    fontWeight: 600,
    ...(compacto ? {} : { borderBottom: `1.5px solid ${C.line}` }),
  };
  if (plegable) {
    return (
      <button
        onClick={onToggle}
        className={
          compacto
            ? "flex items-center gap-2 text-xl text-left"
            : "flex items-center gap-2 text-xl mb-4 pb-2 w-full text-left"
        }
        style={estilo}
      >
        {contenido}
      </button>
    );
  }
  return (
    <h2 className="flex items-center gap-2 text-xl mb-4 pb-2" style={estilo}>
      {contenido}
    </h2>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span
        className="uppercase tracking-wide text-xs"
        style={{
          color: C.gold,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 4,
  padding: "6px 9px",
  color: C.charcoal,
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

// ---------- Cover / Event details ----------

function Portada({ evento, editable, abierto, toggle }) {
  const [form, setForm] = useState(evento);
  useEffect(() => setForm(evento), [evento]);

  return (
    <div
      className="rounded-lg overflow-hidden mb-8"
      style={{ border: `1px solid ${C.line}`, background: "#FBF7EC", position: "relative" }}
    >
      <div
        className="h-40 flex items-center justify-center relative"
        style={{
          background: form.imagen
            ? `center/cover no-repeat url(${form.imagen})`
            : `linear-gradient(135deg, #24402F 0%, #5C6B3F 45%, #B08D57 100%)`,
        }}
      >
        <span
          className="absolute top-2 left-2 text-xs px-2 py-1 rounded"
          style={{ background: "rgba(255,255,255,0.7)", color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          v{VERSION_APP}
        </span>
        {!form.imagen && (
          <ImageIcon color={C.paper} size={30} strokeWidth={1.3} />
        )}
        {!form.ocultarTituloEnImagen && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(31,25,15,0.55), rgba(31,25,15,0))",
                pointerEvents: "none",
              }}
            />
            <h1
              className="absolute bottom-3 left-4 right-4 text-2xl md:text-3xl"
              style={{
                fontFamily: "'Fraunces', serif",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {form.nombre || (editable ? "Nombre del evento" : "Evento sin nombre")}
            </h1>
          </>
        )}
      </div>

      <div className="p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <InfoItem icon={Calendar} label="Fecha" value={formatearFecha(form.fecha) || "—"} />
          <InfoItem icon={Clock} label="Hora" value={form.hora || "—"} />
          <InfoItem icon={MapPin} label="Lugar" value={form.lugar || "—"} />
        </div>
        <div>
          <InfoItem icon={MapPin} label="Dirección" value={form.direccion || "—"} />
        </div>
      </div>

      {editable && toggle && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) toggle(e.target.value);
          }}
          className="absolute px-3 py-1.5 rounded text-sm font-medium"
          style={{
            bottom: 8,
            right: 8,
            background: C.ink,
            color: C.paper,
            border: `1px solid ${C.ink}`,
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
          title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
        >
          <option value="">Abrir sección…</option>
          {ORDEN_VENTANAS.map((clave) => (
            <option key={clave} value={clave}>
              {abierto[clave] ? "✓ " : ""}
              {ETIQUETAS_VENTANAS[clave]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} style={{ color: C.gold }} className="mt-0.5" />
      <div>
        <div
          className="text-xs uppercase"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {label}
        </div>
        <div style={{ color: C.charcoal, fontFamily: "'Inter', sans-serif" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Mesa redonda con sillas alrededor (número de sillas = capacidad, con un
// máximo visual para no amontonarlas si la capacidad es muy alta). El
// tamaño del círculo es fijo; solo cambia cuántas sillas se dibujan.
function MesaRedonda({ m, ocupados, lleno, tieneAlergias, onCambiarCapacidad, onEliminar, onVaciar }) {
  const sillas = Math.max(0, Math.min(m.capacidad, 16));
  const diametro = 84;
  const lienzo = diametro + 26;
  const radioSillas = diametro / 2 + 9;
  const centro = lienzo / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: lienzo, height: lienzo }}>
        {Array.from({ length: sillas }).map((_, i) => {
          const angulo = (2 * Math.PI * i) / sillas - Math.PI / 2;
          const cx = centro + radioSillas * Math.cos(angulo);
          const cy = centro + radioSillas * Math.sin(angulo);
          return (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                width: 10,
                height: 7,
                left: cx - 5,
                top: cy - 3.5,
                background: C.paperDark,
                border: `1px solid ${C.line}`,
                transform: `rotate(${(angulo * 180) / Math.PI + 90}deg)`,
              }}
            />
          );
        })}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: diametro,
            height: diametro,
            left: (lienzo - diametro) / 2,
            top: (lienzo - diametro) / 2,
            background: lleno || tieneAlergias ? "#F0D3C8" : "#E3E9AE",
            border: `2px solid ${tieneAlergias || lleno ? C.wax : C.line}`,
          }}
        >
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: C.ink }}>
            {m.numero}
          </span>
        </div>
        {onEliminar && (
          <button
            onClick={onEliminar}
            className="absolute rounded-full flex items-center justify-center"
            style={{ width: 18, height: 18, top: -2, right: -2, background: C.wax, color: "#fff" }}
            title="Quitar esta mesa"
          >
            <X size={11} />
          </button>
        )}
      </div>
      <input
        type="number"
        min={0}
        value={m.capacidad}
        onChange={(e) => onCambiarCapacidad(e.target.value)}
        style={{ ...inputStyle, width: 56, textAlign: "center", padding: "2px 4px" }}
      />
      <div className="text-xs" style={{ color: lleno ? C.wax : C.charcoal, opacity: 0.75 }}>
        {ocupados}/{m.capacidad}
      </div>
      {tieneAlergias && (
        <div className="text-xs" style={{ color: C.wax, fontWeight: 700 }}>
          ⚠ alergias
        </div>
      )}
      {onVaciar && ocupados > 0 && (
        <button
          onClick={onVaciar}
          className="text-xs underline"
          style={{ color: C.wax }}
          title="Desasignar a todos los invitados de esta mesa (no se borra a nadie)"
        >
          Vaciar mesa
        </button>
      )}
    </div>
  );
}

// Mesa arrastrable dentro del lienzo del plano — la posición se guarda como
// porcentaje (0-100) del ancho/alto del lienzo, no en píxeles, para que
// siga siendo válida aunque se cambie el tamaño de la ventana o se imprima
// en otro formato.
function MesaPlano({ m, ocupados, canvasRef, onMover }) {
  const arrastrando = useRef(false);
  // Posición visual mientras se arrastra — no llama a guardar hasta soltar,
  // para no disparar una petición a la base de datos en cada píxel de
  // movimiento del ratón (eso fue justo el fallo: si una fallaba, el aviso
  // se repetía sin parar porque el ratón seguía generando eventos).
  const [posVisual, setPosVisual] = useState({ x: m.posX, y: m.posY });
  const posFinal = useRef({ x: m.posX, y: m.posY });

  useEffect(() => {
    if (!arrastrando.current) setPosVisual({ x: m.posX, y: m.posY });
  }, [m.posX, m.posY]);

  useEffect(() => {
    const coords = (e) => (e.touches ? e.touches[0] : e);
    const mover = (e) => {
      if (!arrastrando.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const { clientX, clientY } = coords(e);
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
      posFinal.current = { x, y };
      setPosVisual({ x, y });
    };
    const soltar = () => {
      if (!arrastrando.current) return;
      arrastrando.current = false;
      onMover(m.numero, posFinal.current.x, posFinal.current.y);
    };
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    window.addEventListener("touchmove", mover);
    window.addEventListener("touchend", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", soltar);
    };
  }, [m.numero, canvasRef, onMover]);

  const diametro = 44;
  const sillas = Math.max(0, Math.min(m.capacidad, 16));
  const radioSillas = diametro / 2 + 6;
  const lienzoMesa = diametro + 16;
  const centro = lienzoMesa / 2;

  return (
    <div
      onMouseDown={() => (arrastrando.current = true)}
      onTouchStart={() => (arrastrando.current = true)}
      className="absolute select-none"
      style={{
        width: lienzoMesa,
        height: lienzoMesa,
        left: `${posVisual.x}%`,
        top: `${posVisual.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: "grab",
        touchAction: "none",
      }}
      title={`Mesa ${m.numero} — ${ocupados}/${m.capacidad}`}
    >
      {/* Sillas alrededor — su número sigue a la capacidad, igual que en
          la sección Mesas, para que el plano refleje lo mismo. */}
      {Array.from({ length: sillas }).map((_, i) => {
        const angulo = (2 * Math.PI * i) / sillas - Math.PI / 2;
        const cx = centro + radioSillas * Math.cos(angulo);
        const cy = centro + radioSillas * Math.sin(angulo);
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: 6,
              height: 4,
              left: cx - 3,
              top: cy - 2,
              background: C.paperDark,
              border: `1px solid ${C.line}`,
              transform: `rotate(${(angulo * 180) / Math.PI + 90}deg)`,
            }}
          />
        );
      })}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: diametro,
          height: diametro,
          left: (lienzoMesa - diametro) / 2,
          top: (lienzoMesa - diametro) / 2,
          background: "#E3E9AE",
          border: `2px solid ${C.line}`,
        }}
      >
        <div className="text-center leading-tight">
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 13, color: C.ink }}>
            {m.numero}
          </div>
          <div style={{ fontSize: 8, color: C.charcoal }}>
            {ocupados}/{m.capacidad}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Anfitrión view ----------

function BuscadorInvitado({ invitados, invitadoId, onSeleccionar, placeholder }) {
  const [texto, setTexto] = useState("");
  const seleccionado = invitados.find((g) => g.id === invitadoId);

  const resultados = ordenarPorApellidoNombre(invitados).filter((g) => {
    if (!texto.trim()) return true;
    const t = texto.trim().toLowerCase();
    return `${g.apellido} ${g.nombre}`.toLowerCase().includes(t);
  });

  if (seleccionado) {
    return (
      <div className="flex items-center gap-1 flex-1" style={{ ...inputStyle, padding: "4px 8px" }}>
        <span className="flex-1 text-sm">
          {seleccionado.apellido}, {seleccionado.nombre}
        </span>
        <button
          onClick={() => {
            onSeleccionar("");
            setTexto("");
          }}
          title="Quitar selección"
        >
          <X size={13} style={{ color: C.wax }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <TextInput
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder || "Buscar por apellido o nombre..."}
        className="flex-1"
        style={{ minWidth: 160 }}
      />
      <select
        value=""
        onChange={(e) => {
          onSeleccionar(e.target.value);
          setTexto("");
        }}
        className="flex-1"
        style={{ ...inputStyle, minWidth: 160 }}
      >
        <option value="">
          {resultados.length === 0 ? "Sin coincidencias" : "— Elegir invitado existente —"}
        </option>
        {resultados.map((g) => (
          <option key={g.id} value={g.id}>
            {g.apellido}, {g.nombre}
          </option>
        ))}
      </select>
    </>
  );
}

function ColaboradorCard({ c, pendientes, invitados, colaboradores, evento, onEliminar, onRelevar, onAsignarColaborador, onCambiarEmail, onAvisar, onProbarEmail }) {
  const [copiado, setCopiado] = useState(false);
  const [relevando, setRelevando] = useState(false);
  const [mostrarAsignados, setMostrarAsignados] = useState(false);
  const [mostrarLink, setMostrarLink] = useState(false);
  const [releveInvitadoId, setReleveInvitadoId] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(""); // "" | "ok" | "error"

  const probarEmail = async () => {
    setProbando(true);
    setResultadoPrueba("");
    const ok = await onProbarEmail(c.id);
    setProbando(false);
    setResultadoPrueba(ok ? "ok" : "error");
  };

  const asignados = invitados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id);
  // Los invitados en tentativa nunca se nombran en el email al colaborador
  // (ver anfitrion_avisar_colaborador) — así que tampoco cuentan aquí como
  // "pendiente de avisar", o el botón "Avisar ahora" mandaría un email
  // vacío de contenido.
  const pendientesAviso = asignados.filter((g) => g.avisoPendiente && g.confirmado);
  const enlacePersonal = buildLink(c.id, evento?.urlPublica);

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(enlacePersonal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (_) {
      // El portapapeles puede estar bloqueado en este entorno: mostramos el
      // enlace en un campo de texto para que se seleccione y copie a mano.
    }
    setMostrarLink(true);
  };

  const confirmarRelevo = () => {
    if (!releveInvitadoId) return;
    onRelevar(c.id, { invitadoId: releveInvitadoId, nombreNuevo: "" });
    setRelevando(false);
    setReleveInvitadoId("");
  };

  const idsColaboradoresYaAsignados = new Set(
    colaboradores.map((col) => col.invitadoId).filter(Boolean)
  );
  const candidatosRelevo = invitados.filter((g) => !idsColaboradoresYaAsignados.has(g.id));

  if (relevando) {
    return (
      <div className="p-3 rounded space-y-2" style={{ background: "#fff", border: `1px solid ${C.wax}` }}>
        <div className="text-xs" style={{ color: C.charcoal, opacity: 0.8 }}>
          Elegir quién releva a <strong>{c.nombre}</strong>. Los datos ya recopilados de sus
          invitados no se pierden; solo cambia quién sigue a cargo.
        </div>
        <div className="flex gap-2">
          <BuscadorInvitado
            invitados={candidatosRelevo}
            invitadoId={releveInvitadoId}
            onSeleccionar={setReleveInvitadoId}
            placeholder="Buscar invitado que relevará..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={confirmarRelevo}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ background: C.wax, color: C.paper }}
          >
            Confirmar relevo
          </button>
          <button
            onClick={() => setRelevando(false)}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded"
      style={{ background: "#fff", border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMostrarAsignados((v) => !v)}
          className="text-left flex-1"
        >
          <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {c.nombre}
          </div>
          <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            {asignados.length} asignado{asignados.length !== 1 && "s"}{" "}
            {mostrarAsignados ? "▲" : "▼"}
          </div>
        </button>
        <div className="flex items-center gap-3">
          <Seal count={pendientes} size={26} />
          <button onClick={copiarEnlace} title="Copiar enlace de este colaborador">
            {copiado ? (
              <Check size={20} style={{ color: C.ink }} />
            ) : (
              <Copy size={20} style={{ color: C.gold }} />
            )}
          </button>
          <button onClick={() => setRelevando(true)} title="Relevar (sustituir) colaborador">
            <Repeat size={20} style={{ color: C.ink }} />
          </button>
          <button onClick={() => onEliminar(c.id)} title="Eliminar colaborador">
            <Trash2 size={20} style={{ color: C.wax }} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Mail size={13} style={{ color: C.gold }} />
        <div className="flex-1">
          <GrupoFamiliarInput
            value={c.email || ""}
            onCommit={(v) => {
              onCambiarEmail(c.id, v);
              setResultadoPrueba("");
            }}
          />
        </div>
        {!c.email && (
          <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.5 }}>
            sin email (no recibirá avisos)
          </span>
        )}
        {c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && (
          <button
            onClick={probarEmail}
            disabled={probando}
            className="text-xs px-2 py-1 rounded whitespace-nowrap"
            style={{ border: `1px solid ${C.gold}`, color: C.gold }}
            title="Envía un email de prueba a esta dirección para confirmar que llega"
          >
            {probando ? "Enviando…" : "Probar"}
          </button>
        )}
      </div>
      {c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No parece un email válido — revísalo antes de que este colaborador se quede sin
          avisos sin que nadie lo note.
        </p>
      )}
      {resultadoPrueba === "ok" && (
        <p className="text-xs mt-1" style={{ color: C.ink }}>
          ✓ Email de prueba enviado — confirma con el colaborador que le ha llegado.
        </p>
      )}
      {resultadoPrueba === "error" && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No se pudo enviar el email de prueba. Mira "Avisos enviados" o los logs de Resend.
        </p>
      )}

      {pendientesAviso.length > 0 && (
        <div
          className="flex items-center justify-between gap-2 mt-2 px-2 py-1 rounded"
          style={{ background: "#FBEAEC" }}
        >
          <span className="text-xs" style={{ color: C.wax }}>
            ⚠ {pendientesAviso.length} pendiente{pendientesAviso.length === 1 ? "" : "s"} de avisar
          </span>
          <button
            onClick={() => onAvisar(c.id)}
            disabled={!c.email}
            className="text-xs px-2 py-1 rounded font-medium"
            style={{
              background: c.email ? C.wax : C.line,
              color: c.email ? "#fff" : C.charcoal,
            }}
          >
            Avisar ahora
          </button>
        </div>
      )}

      {mostrarLink && (
        <div className="mt-2" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
          {!evento?.urlPublica && (
            <p className="text-xs mb-1" style={{ color: C.wax }}>
              ⚠ Falta la URL pública en "Configuración" — este enlace probablemente no
              funcionará para tu colaborador todavía.
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={enlacePersonal}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              style={{ ...inputStyle, flex: 1, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.6 }}>
              {copiado ? "¡copiado!" : "toca y Cmd/Ctrl+C"}
            </span>
          </div>
        </div>
      )}

      {mostrarAsignados && (
        <div className="mt-3 space-y-1.5" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
          {asignados.length === 0 && (
            <p className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Nadie asignado todavía.
            </p>
          )}
          {ordenarPorApellidoNombre(asignados).map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 text-xs">
              <span style={{ color: C.charcoal }}>
                {g.apellido}, {g.nombre}{" "}
                <span style={{ opacity: 0.5 }}>
                  ({g.confirmado ? (datosCompletos(g) ? "completo" : "confirmado") : "tentativa"})
                </span>
              </span>
              <select
                value={g.colaboradorId || ""}
                onChange={(e) => onAsignarColaborador(g.id, e.target.value)}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 11 }}
              >
                <option value="">Sin asignar</option>
                {colaboradores.map((otro) => (
                  <option key={otro.id} value={otro.id}>
                    {otro.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function descargarCSV(nombreArchivo, cabeceras, filas) {
  const escapar = (v) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [cabeceras, ...filas].map((fila) => fila.map(escapar).join(";"));
  const csv = "﻿" + lineas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copia de seguridad en JSON de lo que se va a poner a cero, descargada al
// dispositivo justo antes de ejecutar cualquier reinicio en bloque — para
// poder recuperar los datos a mano si hiciera falta.
function descargarJSON(nombreArchivo, datos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Redimensiona una foto subida desde el dispositivo a un JPEG razonable antes
// de guardarla como data URL, para no disparar el tamaño de lo almacenado.
function redimensionarImagenArchivo(file, maxDim = 1600, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const escala = maxDim / Math.max(width, height);
          width = Math.round(width * escala);
          height = Math.round(height * escala);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", calidad));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = lector.result;
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
    lector.readAsDataURL(file);
  });
}

// "Ana, Pedro y Luis" — coma entre todos salvo el último, que lleva "y".
function listaConY(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
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

// Rejilla temporal (cada 5% del ancho/alto) con la fracción escrita en cada
// línea — sirve para leer directamente en la imagen las coordenadas que hay
// que darle a RECUADRO/RECUADRO_DATOS, en vez de estimarlas a ojo desde una
// captura. Solo se activa con el modo calibración; nunca en una invitación
// real enviada a un invitado.
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

function generarInvitacionImagen(evento, apellidoFamilia, nombresMiembros, mesaTexto, mostrarCuadricula = false) {
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
        lineas: partirLineas(ctx, `${apellidoFamilia}; ${listaConY(nombresMiembros)}`, anchoDisponible),
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

// ---------- Carpeta de guardado de invitaciones (persistente) ----------
// La API de acceso al sistema de archivos (showDirectoryPicker) solo existe
// en navegadores basados en Chromium (Chrome, Edge...) — en Safari/Firefox
// se usa automáticamente el método de descarga normal, sin carpeta fija.
const IDB_NOMBRE = "eventos-app";
const IDB_ALMACEN = "handles";
const IDB_CLAVE_CARPETA = "carpetaInvitaciones";

function abrirIDB() {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(IDB_NOMBRE, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(IDB_ALMACEN);
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

async function guardarHandleCarpeta(handle) {
  const db = await abrirIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_ALMACEN, "readwrite");
    tx.objectStore(IDB_ALMACEN).put(handle, IDB_CLAVE_CARPETA);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function leerHandleCarpeta() {
  const db = await abrirIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_ALMACEN, "readonly");
    const peticion = tx.objectStore(IDB_ALMACEN).get(IDB_CLAVE_CARPETA);
    peticion.onsuccess = () => resolve(peticion.result || null);
    peticion.onerror = () => reject(peticion.error);
  });
}

// Pide la carpeta al usuario (una vez) y la recuerda para la próxima vez —
// "forzarElegir" se usa desde el botón "Cambiar carpeta" para elegir otra.
async function obtenerCarpetaInvitaciones({ forzarElegir }) {
  if (!window.showDirectoryPicker) return null;

  if (!forzarElegir) {
    try {
      const handleGuardado = await leerHandleCarpeta();
      if (handleGuardado) {
        const permiso = await handleGuardado.queryPermission({ mode: "readwrite" });
        if (permiso === "granted") return handleGuardado;
        if (permiso === "prompt") {
          const concedido = await handleGuardado.requestPermission({ mode: "readwrite" });
          if (concedido === "granted") return handleGuardado;
        }
      }
    } catch (_) {
      // Sigue abajo y pide una carpeta nueva si algo falla.
    }
  }

  try {
    const handleNuevo = await window.showDirectoryPicker();
    await guardarHandleCarpeta(handleNuevo);
    return handleNuevo;
  } catch (_) {
    return null; // El usuario cerró el selector sin elegir nada.
  }
}

function descargarDataUrlClasico(dataUrl, nombreArchivo) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Guarda directamente en la carpeta elegida si el navegador lo permite;
// si no (Safari/Firefox, o el usuario nunca eligió carpeta), cae al método
// clásico de descarga (va a la carpeta de Descargas de siempre).
async function guardarArchivoInvitacion(dataUrl, nombreArchivo) {
  const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: false });
  if (!carpeta) {
    descargarDataUrlClasico(dataUrl, nombreArchivo);
    return;
  }
  try {
    const respuesta = await fetch(dataUrl);
    const blob = await respuesta.blob();
    const fileHandle = await carpeta.getFileHandle(nombreArchivo, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (_) {
    descargarDataUrlClasico(dataUrl, nombreArchivo);
  }
}

function ProgresoBar({ label, completado, total, color }) {
  const pct = total > 0 ? Math.round((completado / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div
        className="flex justify-between text-xs mb-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.charcoal }}
      >
        <span>{label}</span>
        <span>
          {completado}/{total} · {pct}%
        </span>
      </div>
      <div style={{ background: C.paperDark, borderRadius: 4, height: 10, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            background: color || C.ink,
            height: "100%",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function EncabezadoOrdenable({ columna, orden, onClick, children }) {
  const activo = orden.columna === columna;
  return (
    <button
      onClick={() => onClick(columna)}
      className="flex items-center justify-center gap-1 w-full"
      style={{ borderRight: `1px solid ${C.line}`, color: activo ? C.ink : C.gold }}
    >
      {children}
      <span style={{ fontSize: 10 }}>
        {activo ? (orden.direccion === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );
}

function GrupoFamiliarInput({ value, onCommit }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
    />
  );
}

function VistaAnfitrion({ data }) {
  const { evento, colaboradores, invitados, mesas, fotosFamiliares, persistEvento, persistColaboradores, persistInvitados, persistMesas, persistFotosFamiliares, avisarColaborador, probarEmailColaborador, avisosEnviados, ordenFamiliares, persistOrdenFamiliares, enviarInvitacionFamilia, resetearAvisos, resetearPorInvitados, gastos, persistGastos } = data;

  const [nuevoColab, setNuevoColab] = useState({ invitadoId: "" });
  const [nuevoInvitado, setNuevoInvitado] = useState({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  const [textoImport, setTextoImport] = useState("");
  const [mostrarImport, setMostrarImport] = useState(false);
  const [mostrarAnadir, setMostrarAnadir] = useState(false);
  const [orden, setOrden] = useState({ columna: "invitado", direccion: "asc" });

  // "avisoPendiente" vive en el servidor (columna en invitados), no solo
  // en memoria — así no se pierde el rastro si cancelas o cierras la
  // pestaña. Al cerrar la tabla, si queda alguien pendiente, se pregunta.
  const [mostrarResumenAsignacion, setMostrarResumenAsignacion] = useState(false);
  const [enviandoAvisosAsignacion, setEnviandoAvisosAsignacion] = useState(false);
  // El aviso pendiente vive por invitado (avisoPendiente en invitados), no
  // por colaborador — así se sabe exactamente cuáles son los nuevos. Los
  // que siguen en tentativa no cuentan: no se nombran en el email al
  // colaborador (ver anfitrion_avisar_colaborador), así que preguntar aquí
  // "¿avisar ya?" por un tentativa mandaría un aviso sin contenido.
  const invitadosPendientesDe = (colaboradorId) =>
    invitados.filter((g) => g.colaboradorId === colaboradorId && g.avisoPendiente && g.confirmado);
  const colaboradoresPendientes = colaboradores.filter(
    (c) => invitadosPendientesDe(c.id).length > 0
  );
  // Total de confirmados con datos pendientes de avisar, sin desglosar por
  // colaborador — para el panel resumen de Avisos. La tentativa nunca cuenta
  // aquí (mismo motivo que arriba).
  const datosConfirmadosPendientes = invitados.filter(
    (g) => g.avisoPendiente && g.confirmado
  ).length;
  const [filtroTipoAviso, setFiltroTipoAviso] = useState("todos"); // "todos" | "colaborador" | "familia"

  // Antes de mandar un aviso individual ("Avisar ahora"), se enseña el
  // mensaje exacto que se va a enviar y se pide confirmar — con opción de
  // ir directo a editar la plantilla si algo no convence.
  const [avisoPreview, setAvisoPreview] = useState(null); // { id, nombre } | null
  const [enviandoAvisoPreview, setEnviandoAvisoPreview] = useState(false);

  const confirmarEnvioAvisoPreview = async () => {
    if (!avisoPreview) return;
    setEnviandoAvisoPreview(true);
    await avisarColaborador(avisoPreview.id);
    setEnviandoAvisoPreview(false);
    setAvisoPreview(null);
  };

  const irAEditarAsignacion = () => {
    if (avisoPreview) {
      setFiltros((f) => ({ ...f, colaboradorId: avisoPreview.id }));
    }
    setAvisoPreview(null);
    setAbierto((a) => ({ ...a, invitados: true, avisos: false }));
  };

  const cambiarOrden = (columna) => {
    setOrden((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };
  const [filtros, setFiltros] = useState({
    texto: "",
    grupoFamiliar: "",
    zona: "",
    colaboradorId: "",
    mesa: "",
    confirmado: "",
    datos: "",
    pagado: "",
  });

  const idsYaColaboradores = new Set(colaboradores.map((c) => c.invitadoId).filter(Boolean));
  const invitadosDisponiblesParaColaborador = invitados.filter((g) => !idsYaColaboradores.has(g.id));

  const agregarColaborador = () => {
    if (!nuevoColab.invitadoId) return;

    const inv = invitados.find((g) => g.id === nuevoColab.invitadoId);
    if (!inv) return;
    const nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();

    persistColaboradores([
      ...colaboradores,
      { id: uid(), nombre: nombreFinal, invitadoId: nuevoColab.invitadoId, email: "" },
    ]);
    setNuevoColab({ invitadoId: "" });
  };

  const eliminarColaborador = (id) => {
    persistColaboradores(colaboradores.filter((c) => c.id !== id));
  };

  const cambiarEmailColaborador = (id, email) => {
    persistColaboradores(colaboradores.map((c) => (c.id === id ? { ...c, email } : c)));
  };

  // ---------- Estado de cuentas (gastos) ----------
  // "importe" se guarda tal cual se escribe (texto), igual que precioAdulto/
  // precioNino del evento — se convierte a número solo al sumar
  // (parsePrecio), nunca en cada pulsación. Convertirlo a número al momento
  // borraba la coma decimal a medio escribir (9,18 acababa siendo 918).
  // La lista de gastos empieza plegada: al abrir la sección solo se ven los
  // 4 recuadros (recaudado/pendiente/gastos/balance).
  const [mostrarListaGastos, setMostrarListaGastos] = useState(false);

  const agregarGasto = () => {
    persistGastos([
      ...gastos,
      { id: uid(), concepto: "", categoria: "", importe: "", pagado: false },
    ]);
  };

  const cambiarGasto = (id, campo, valor) => {
    persistGastos(gastos.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)));
  };

  const eliminarGasto = (id) => {
    persistGastos(gastos.filter((g) => g.id !== id));
  };

  // Relevo: un nuevo colaborador toma el relevo del anterior. Los invitados ya
  // asignados (y sus datos ya recopilados) pasan al nuevo sin perder nada.
  const relevarColaborador = (idAnterior, { invitadoId, nombreNuevo }) => {
    const anterior = colaboradores.find((c) => c.id === idAnterior);
    if (!anterior) return;

    let invitadoIdFinal = invitadoId;
    let nombreFinal = nombreNuevo;
    let invitadosSiguientes = invitados;

    if (invitadoIdFinal) {
      const inv = invitados.find((g) => g.id === invitadoIdFinal);
      if (inv) nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();
    } else if (nombreFinal) {
      const [apellido = "", nombre = ""] = nombreFinal.split(",").map((s) => s.trim());
      const nuevoInvitadoObj = {
        id: uid(),
        nombre,
        apellido,
        zona: "",
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: apellido || nombre,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      };
      invitadoIdFinal = nuevoInvitadoObj.id;
      invitadosSiguientes = [...invitados, nuevoInvitadoObj];
    } else {
      return;
    }

    const nuevoId = uid();
    persistColaboradores(
      colaboradores
        .filter((c) => c.id !== idAnterior)
        .concat({ id: nuevoId, nombre: nombreFinal, invitadoId: invitadoIdFinal, email: "" })
    );
    persistInvitados(
      invitadosSiguientes.map((g) =>
        g.colaboradorId === idAnterior ? { ...g, colaboradorId: nuevoId } : g
      )
    );
  };

  const agregarInvitado = () => {
    if (
      !nuevoInvitado.nombre.trim() ||
      !nuevoInvitado.apellido.trim() ||
      !nuevoInvitado.grupoFamiliar.trim()
    )
      return;
    persistInvitados([
      ...invitados,
      {
        id: uid(),
        nombre: nuevoInvitado.nombre.trim(),
        apellido: nuevoInvitado.apellido.trim(),
        zona: nuevoInvitado.zona.trim(),
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: nuevoInvitado.grupoFamiliar.trim(),
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      },
    ]);
    setNuevoInvitado({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  };

  const asignarColaborador = (id, colaboradorId) => {
    const nuevoId = colaboradorId || null;
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, colaboradorId: nuevoId } : g))
    );
  };

  const intentarCerrarInvitados = () => {
    if (abierto.invitados && colaboradoresPendientes.length > 0) {
      setMostrarResumenAsignacion(true);
      return;
    }
    toggle("invitados");
  };

  const enviarAvisosAsignacion = async () => {
    setEnviandoAvisosAsignacion(true);
    for (const c of colaboradoresPendientes) {
      await avisarColaborador(c.id);
    }
    setEnviandoAvisosAsignacion(false);
    setMostrarResumenAsignacion(false);
    toggle("invitados");
  };

  const cancelarAvisosAsignacion = () => {
    setMostrarResumenAsignacion(false);
    toggle("invitados");
  };

  const asignarGrupoFamiliar = (id, grupoFamiliar) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, grupoFamiliar } : g)));
  };

  const asignarApellido = (id, apellido) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, apellido } : g)));
  };

  const asignarNombre = (id, nombre) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, nombre } : g)));
  };

  const asignarZona = (id, zona) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, zona } : g)));
  };

  const asignarEmailInvitado = (id, email) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, email } : g)));
  };

  const ocupacionMesa = (numero) =>
    invitados.filter((g) => g.mesa === numero && g.confirmado).length;

  const asignarMesa = (id, mesaValue) => {
    const numero = mesaValue ? Number(mesaValue) : null;
    if (numero) {
      const mesa = mesas.find((m) => m.numero === numero);
      const invitadoActual = invitados.find((g) => g.id === id);
      const yaEnEstaMesa = invitadoActual && invitadoActual.mesa === numero;
      if (mesa && !yaEnEstaMesa && ocupacionMesa(numero) >= mesa.capacidad) {
        window.alert(`La mesa ${numero} ya está completa (${mesa.capacidad}/${mesa.capacidad}).`);
        return;
      }
    }
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, mesa: numero } : g))
    );
  };

  const cambiarCapacidadMesa = (numero, capacidad) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, capacidad: Number(capacidad) || 0 } : m))
    );
  };

  const anadirMesa = () => {
    const siguiente = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    persistMesas([...mesas, { numero: siguiente, capacidad: 10 }]);
  };

  const eliminarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length > 0) {
      const confirmar = window.confirm(
        `La mesa ${numero} tiene ${afectados.length} invitado(s) asignado(s). Al eliminarla, ` +
          `vuelven a quedar sin mesa (no se borra a nadie). ¿Continuar?`
      );
      if (!confirmar) return;
      persistInvitados(
        invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g))
      );
    }
    persistMesas(mesas.filter((m) => m.numero !== numero));
  };

  const vaciarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length === 0) return;
    const confirmar = window.confirm(
      `Vaciar la mesa ${numero}: ${afectados.length} invitado(s) volverán a quedar sin mesa ` +
        `(no se borra a nadie). ¿Continuar?`
    );
    if (!confirmar) return;
    persistInvitados(invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g)));
  };

  // Posición por defecto en rejilla para las mesas que todavía no se han
  // arrastrado a mano en el plano (posX/posY a null).
  const posicionPorDefecto = (indice, total) => {
    const columnas = Math.max(1, Math.ceil(Math.sqrt(total)));
    const filas = Math.max(1, Math.ceil(total / columnas));
    const col = indice % columnas;
    const fila = Math.floor(indice / columnas);
    return {
      posX: ((col + 0.5) / columnas) * 100,
      posY: ((fila + 0.5) / filas) * 100,
    };
  };

  const moverMesaPlano = (numero, posX, posY) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, posX, posY } : m))
    );
  };

  // Auto-asignación de mesas: nunca reparte un grupo familiar entre varias
  // mesas por su cuenta. Si parte del grupo ya está sentada a mano, intenta
  // completar el resto en esa misma mesa; si no cabe entero (ahí o en
  // cualquier otra), no toca nada y genera un aviso para que el Anfitrión lo
  // resuelva a mano (subiendo capacidad, moviendo gente, etc.).
  const autoAsignarMesas = () => {
    const nuevos = invitados.map((g) => ({ ...g }));
    const ocupacion = {};
    mesas.forEach((m) => {
      ocupacion[m.numero] = nuevos.filter((g) => g.mesa === m.numero && g.confirmado).length;
    });

    const gruposMap = {};
    nuevos.forEach((g) => {
      if (g.confirmado) {
        const key = (g.grupoFamiliar || g.apellido || g.id).trim().toLowerCase();
        (gruposMap[key] = gruposMap[key] || []).push(g);
      }
    });

    const avisos = [];

    // Los grupos con más gente sin sentar van primero, para que no se queden
    // sin hueco por culpa de familias pequeñas que se adelantaron.
    const gruposOrdenados = Object.values(gruposMap).sort(
      (a, b) => b.filter((g) => !g.mesa).length - a.filter((g) => !g.mesa).length
    );

    gruposOrdenados.forEach((grupo) => {
      const sinMesa = grupo.filter((g) => !g.mesa);
      if (sinMesa.length === 0) return;

      const nombreGrupo = grupo[0].grupoFamiliar || grupo[0].apellido || "(sin nombre)";
      const mesasYaUsadas = [...new Set(grupo.filter((g) => g.mesa).map((g) => g.mesa))];

      if (mesasYaUsadas.length > 1) {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ya está repartida a mano entre las mesas ${mesasYaUsadas.join(
            ", "
          )} — revísalo si no era intencional`,
        });
        return;
      }

      const mesaObjetivo =
        mesasYaUsadas.length === 1 ? mesas.find((m) => m.numero === mesasYaUsadas[0]) : null;

      if (mesaObjetivo) {
        const hueco = mesaObjetivo.capacidad - (ocupacion[mesaObjetivo.numero] || 0);
        if (hueco >= sinMesa.length) {
          sinMesa.forEach((g) => {
            g.mesa = mesaObjetivo.numero;
          });
          ocupacion[mesaObjetivo.numero] = (ocupacion[mesaObjetivo.numero] || 0) + sinMesa.length;
        } else {
          avisos.push({
            grupo: nombreGrupo,
            motivo: `no caben ${sinMesa.length} persona${
              sinMesa.length !== 1 ? "s" : ""
            } más en la Mesa ${mesaObjetivo.numero} (solo ${Math.max(
              hueco,
              0
            )} libres) — se han dejado sin mesa`,
          });
        }
        return;
      }

      const mesaElegida = mesas.find(
        (m) => m.capacidad - (ocupacion[m.numero] || 0) >= sinMesa.length
      );
      if (mesaElegida) {
        sinMesa.forEach((g) => {
          g.mesa = mesaElegida.numero;
        });
        ocupacion[mesaElegida.numero] = (ocupacion[mesaElegida.numero] || 0) + sinMesa.length;
      } else {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ninguna mesa tiene ${sinMesa.length} hueco${
            sinMesa.length !== 1 ? "s" : ""
          } libres juntos — se han dejado sin mesa`,
        });
      }
    });

    persistInvitados(nuevos);
    setAvisosMesas(avisos);
    setPanelFlotante(avisos.length > 0 ? "avisosMesas" : null);
  };

  const importarInvitados = () => {
    const filas = parseImport(textoImport, colaboradores);
    if (filas.length === 0) return;
    const nuevos = filas.map((r) => ({
      id: uid(),
      nombre: r.nombre,
      apellido: r.apellido,
      zona: r.zona,
      confirmado: false,
      colaboradorId: r.colaboradorId,
      grupoFamiliar: r.grupoFamiliar,
      mesa: null,
      anioNacimiento: "",
      anioBoda: "",
      email: "",
      cancion: "",
      alergias: "",
        observaciones: "",
        pagado: false,
    }));
    persistInvitados([...invitados, ...nuevos]);
    setTextoImport("");
  };

  const toggleConfirmar = (id) => {
    persistInvitados(
      invitados.map((g) =>
        g.id === id ? { ...g, confirmado: !g.confirmado } : g
      )
    );
  };

  const eliminarInvitado = (id) => {
    persistInvitados(invitados.filter((g) => g.id !== id));
  };

  const borrarTodoElContenido = () => {
    const aviso = "¡ADVERTENCIA SE BORRARÁ TODO EL CONTENIDO DE LA APLICACIÓN!";
    const primera = window.confirm(`${aviso}\n\nEvento, colaboradores, invitados, mesas y fotos — todo. Esta acción no se puede deshacer.\n\n¿Quieres continuar?`);
    if (!primera) return;
    const segunda = window.confirm(`${aviso}\n\nÚltima confirmación: se borrará TODO de verdad. ¿Confirmas definitivamente?`);
    if (!segunda) return;
    // Misma red de seguridad que ya tienen los reinicios: nunca se ejecuta
    // el borrado más destructivo de la app sin dejar antes una copia
    // completa descargada al dispositivo.
    descargarJSON(`backup-antes-de-borrar-todo-${Date.now()}.json`, JSON.parse(exportarTodo()));
    persistEvento({
      nombre: "",
      fecha: "",
      hora: "",
      precio: "",
      imagen: "/cabecera-defecto.jpg",
      imagenInvitacion: "/invitacion-defecto.jpg",
      lugar: "",
      direccion: "",
      precioAdulto: "",
      precioNino: "",
      edadNinoDesde: "2",
      edadNinoHasta: "12",
      urlPublica: "",
      ocultarTituloEnImagen: true,
      emailAnfitrion: "",
      plantillaAsignacion:
        "Hola,<br><br>Tienes invitados nuevos asignados.<br>Entra en tu enlace cuando puedas para revisarlos y completar sus datos." +
        '<p style="color:#B00020;font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">' +
        "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
        "</p>",
      plantillaDatosCompletados:
        "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
      plantillaPagoRegistrado:
        "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
      plantillaInvitacionFamilia:
        "Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!",
    });
    persistColaboradores([]);
    persistInvitados([]);
    persistMesas([]);
    persistFotosFamiliares({});
  };

  // ---------- Zona de reinicio (por secciones, sin tocar a los invitados) ----------
  // ---------- Reinicio "por invitados": colaborador -> alcance -> categoría ----------
  const CATEGORIAS_RESET = {
    datos: {
      titulo: "Datos del invitado",
      familiar: false,
      descripcion: "Vacía año nacimiento, año de boda, email, canción, alergias y observaciones.",
    },
    pago: {
      titulo: "Pago",
      familiar: false,
      descripcion: 'Vuelve a "no pagado".',
    },
    mesa: {
      titulo: "Mesa",
      familiar: false,
      descripcion: 'Quita la mesa asignada (vuelve a "sin mesa").',
    },
    asignacion: {
      titulo: "Asignación de colaborador",
      familiar: false,
      descripcion:
        'Quita la asignación de colaborador (vuelve a "sin asignar"). Ni el invitado ni el colaborador se borran.',
    },
    foto: {
      titulo: "Foto familiar",
      familiar: true,
      descripcion: "Borra la foto guardada de la familia.",
    },
    invitacion: {
      titulo: "Invitación",
      familiar: true,
      descripcion: 'Pone a cero el aviso de "invitación enviada" de la familia.',
    },
  };
  // Cualquier reinicio que toque invitados limpia también su aviso
  // pendiente — si la asignación o el dato era de prueba, el aviso que
  // generó también lo era (se aplica siempre en el propio RPC).

  const [rColaborador, setRColaborador] = useState(""); // "" = todos los colaboradores
  const [rAlcance, setRAlcance] = useState("todos"); // "todos" | "familia" | "invitado"
  const [rFamiliaClave, setRFamiliaClave] = useState("");
  const [rInvitadoId, setRInvitadoId] = useState("");
  const [rCategoria, setRCategoria] = useState("");
  const [rPalabra, setRPalabra] = useState("");
  const [rEjecutando, setREjecutando] = useState(false);
  const [rMostrarConfirmar, setRMostrarConfirmar] = useState(false);

  const invitadosParaReset = rColaborador
    ? invitados.filter((g) => g.colaboradorId === rColaborador)
    : invitados;

  const familiasParaReset = (() => {
    const vistos = new Map();
    invitadosParaReset.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      if (!vistos.has(clave)) vistos.set(clave, g.apellido || clave);
    });
    return Array.from(vistos.entries()).map(([clave, etiqueta]) => ({ clave, etiqueta }));
  })();

  const invitadoIdsParaReset = (() => {
    if (rAlcance === "invitado") return rInvitadoId ? [rInvitadoId] : [];
    if (rAlcance === "familia") {
      if (!rFamiliaClave) return [];
      return invitadosParaReset
        .filter((g) => (g.grupoFamiliar || g.apellido || g.id) === rFamiliaClave)
        .map((g) => g.id);
    }
    return invitadosParaReset.map((g) => g.id);
  })();

  const confirmarResetPorInvitados = async () => {
    if (rPalabra.trim().toUpperCase() !== "REINICIAR") return;
    if (invitadoIdsParaReset.length === 0 || !rCategoria) return;
    setREjecutando(true);
    descargarJSON(
      `backup-antes-de-reiniciar-${rCategoria}-${Date.now()}.json`,
      JSON.parse(exportarTodo())
    );
    await resetearPorInvitados(invitadoIdsParaReset, rCategoria);
    setREjecutando(false);
    setRMostrarConfirmar(false);
    setRPalabra("");
    setRCategoria("");
  };

  // ---------- Reinicio de avisos (historial global, sin vínculo a invitado/colaborador) ----------
  const [reinicioAvisosPendiente, setReinicioAvisosPendiente] = useState(false);
  const [palabraAvisos, setPalabraAvisos] = useState("");
  const [reiniciandoAvisos, setReiniciandoAvisos] = useState(false);

  const confirmarReinicioAvisos = async () => {
    if (palabraAvisos.trim().toUpperCase() !== "AVISOS") return;
    setReiniciandoAvisos(true);
    descargarJSON(`backup-antes-de-reiniciar-avisos-${Date.now()}.json`, JSON.parse(exportarTodo()));
    await resetearAvisos();
    setReiniciandoAvisos(false);
    setReinicioAvisosPendiente(false);
    setPalabraAvisos("");
  };

  const exportarTodo = () => {
    const datos = {
      version: 1,
      evento,
      mesas,
      fotosFamiliares,
      colaboradores: colaboradores.map((c) => ({
        nombre: c.nombre,
        email: c.email || "",
      })),
      invitados: ordenarPorApellidoNombre(invitados).map((g) => {
        const col = resolverColaborador(g, colaboradores);
        return {
          grupoFamiliar: g.grupoFamiliar || g.apellido || "",
          apellido: g.apellido || "",
          nombre: g.nombre || "",
          zona: g.zona || "",
          confirmado: Boolean(g.confirmado),
          colaboradorNombre: col ? col.nombre : "",
          mesa: g.mesa || null,
          anioNacimiento: g.anioNacimiento || "",
          anioBoda: g.anioBoda || "",
          email: g.email || "",
          cancion: g.cancion || "",
          alergias: g.alergias || "",
          observaciones: g.observaciones || "",
          pagado: Boolean(g.pagado),
        };
      }),
    };
    return JSON.stringify(datos, null, 2);
  };

  const restaurarTodo = () => {
    let datos;
    try {
      datos = JSON.parse(textoRestaurar);
    } catch (_) {
      // No es JSON: puede ser el formato antiguo de "solo invitados" (separado
      // por tabulaciones). Lo intentamos como alternativa antes de rendirnos.
      const filas = parseImport(textoRestaurar, colaboradores);
      if (filas.length === 0) {
        window.alert(
          "No he podido leer ese texto. Pega el contenido que generó \"Exportar todo\" (o, si es una copia antigua de solo invitados, en el formato Grupo familiar, Apellido, Nombre, Colaborador, Zona)."
        );
        return;
      }
      const ok = window.confirm(
        `Esto es un formato antiguo: solo recuperaré los ${filas.length} invitados (nombre, apellido, zona, grupo familiar y colaborador si coincide el nombre). El evento, las mesas y los datos de colaborador/año/email/etc. de cada invitado NO se restauran con este formato. ¿Continuar?`
      );
      if (!ok) return;
      const nuevos = filas.map((r) => ({
        id: uid(),
        nombre: r.nombre,
        apellido: r.apellido,
        zona: r.zona,
        confirmado: false,
        colaboradorId: r.colaboradorId,
        grupoFamiliar: r.grupoFamiliar,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      }));
      persistInvitados([...invitados, ...nuevos]);
      setTextoRestaurar("");
      setMostrarRestaurar(false);
      return;
    }

    // 1) Invitados primero, con ids nuevos (los antiguos ya no sirven).
    const nuevosInvitados = (datos.invitados || []).map((r) => ({
      id: uid(),
      nombre: r.nombre || "",
      apellido: r.apellido || "",
      zona: r.zona || "",
      confirmado: Boolean(r.confirmado),
      colaboradorId: null,
      grupoFamiliar: r.grupoFamiliar || r.apellido || "",
      mesa: r.mesa || null,
      anioNacimiento: r.anioNacimiento || "",
      anioBoda: r.anioBoda || "",
      email: r.email || "",
      cancion: r.cancion || "",
      alergias: r.alergias || "",
      observaciones: r.observaciones || "",
      pagado: Boolean(r.pagado),
      _colaboradorNombreTmp: r.colaboradorNombre || "",
    }));

    // 2) Colaboradores, enlazados al invitado que coincide en apellido y nombre.
    const nuevosColaboradores = (datos.colaboradores || []).map((c) => {
      const [ap, no] = (c.nombre || "").split(",").map((s) => s.trim());
      const match = nuevosInvitados.find((g) => g.apellido === ap && g.nombre === no);
      return {
        id: uid(),
        nombre: c.nombre || "",
        invitadoId: match ? match.id : null,
        email: c.email || "",
      };
    });

    // 3) Resolver el colaborador asignado a cada invitado, y limpiar el campo temporal.
    const invitadosFinal = nuevosInvitados.map((g) => {
      const { _colaboradorNombreTmp, ...resto } = g;
      if (_colaboradorNombreTmp) {
        const col = nuevosColaboradores.find((c) => c.nombre === _colaboradorNombreTmp);
        resto.colaboradorId = col ? col.id : null;
      }
      return resto;
    });

    const eventoRestaurado = datos.evento || evento;
    if (!eventoRestaurado.imagen) eventoRestaurado.imagen = "/cabecera-defecto.jpg";
    if (!eventoRestaurado.imagenInvitacion) eventoRestaurado.imagenInvitacion = "/invitacion-defecto.jpg";
    persistEvento(eventoRestaurado);
    if (datos.mesas) persistMesas(datos.mesas);
    if (datos.fotosFamiliares) persistFotosFamiliares(datos.fotosFamiliares);
    persistColaboradores(nuevosColaboradores);
    persistInvitados(invitadosFinal);
    setTextoRestaurar("");
    setMostrarRestaurar(false);
  };

  const total = invitados.length;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;
  const tentativaCount = total - confirmadosCount;

  const [abierto, setAbierto] = useState({
    copiaSeguridad: false,
    progreso: false,
    colaboradores: false,
    mesas: false,
    plano: false,
    invitados: false,
    configuracion: false,
    invitaciones: false,
    cuentas: false,
    versiones: false,
    avisos: false,
  });
  const toggle = (clave) => setAbierto((a) => ({ ...a, [clave]: !a[clave] }));
  const [mostrarPeligro, setMostrarPeligro] = useState(false);
  // null | "tabla" | "canciones" | "alergias" | "avisosMesas" — controla la
  // ventana flotante; independiente de qué secciones estén plegadas.
  const [panelFlotante, setPanelFlotante] = useState(null);
  const [avisosMesas, setAvisosMesas] = useState([]);
  const lienzoPlanoRef = useRef(null);

  const imprimirPanelActivo = () => {
    setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        // Bloqueado por el navegador: el usuario puede usar Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  const exportarPanelActivoCSV = () => {
    if (panelFlotante === "tabla") {
      const filas = invitadosOrdenados.map((g) => {
        const col = resolverColaborador(g, colaboradores);
        return [
          `${g.apellido}, ${g.nombre}`,
          g.grupoFamiliar || g.apellido || "",
          g.zona || "",
          col ? col.nombre : "",
          g.mesa ?? "",
          g.confirmado ? "Sí" : "Tentativa",
          g.confirmado ? (g.pagado ? "Sí" : "No") : "",
        ];
      });
      descargarCSV(
        `invitados-${evento.nombre || "evento"}.csv`,
        ["Invitado", "Grupo familiar", "Zona", "Colaborador", "Mesa", "Confirmado", "Pagado"],
        filas
      );
    } else if (panelFlotante === "canciones") {
      const filas = ordenarPorApellidoNombre(
        invitados.filter((g) => g.cancion && g.cancion.trim())
      ).map((g) => [`${g.apellido}, ${g.nombre}`, calcularEdad(g.anioNacimiento, evento) ?? "", g.cancion]);
      descargarCSV(`canciones-${evento.nombre || "evento"}.csv`, ["Invitado", "Edad", "Canción"], filas);
    } else if (panelFlotante === "alergias") {
      const filas = ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g) => [
        `${g.apellido}, ${g.nombre}`,
        g.mesa ?? "",
        g.alergias,
      ]);
      descargarCSV(`alergias-${evento.nombre || "evento"}.csv`, ["Invitado", "Mesa", "Alergia"], filas);
    }
  };

  // Si el anfitrión reordenó los nombres a mano (p.ej. esposo primero),
  // se respeta ese orden; los que falten en él (recién confirmados) van
  // al final, en su orden normal.
  const ordenarConfirmados = (confirmados, ordenIds) => {
    if (!ordenIds || ordenIds.length === 0) return confirmados;
    const porId = Object.fromEntries(confirmados.map((m) => [m.id, m]));
    const ordenados = ordenIds.map((id) => porId[id]).filter(Boolean);
    const idsOrdenados = new Set(ordenIds);
    const resto = confirmados.filter((m) => !idsOrdenados.has(m.id));
    return [...ordenados, ...resto];
  };

  const familiasListasParaInvitacion = (() => {
    const grupos = {};
    invitados.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      (grupos[clave] = grupos[clave] || []).push(g);
    });
    return Object.entries(grupos)
      .map(([clave, miembros]) => {
        const confirmados = ordenarConfirmados(
          miembros.filter((m) => m.confirmado),
          ordenFamiliares[clave]?.orden
        );
        const apellido = miembros[0].apellido || clave;
        return {
          clave,
          apellido,
          confirmados,
          invitacionEnviada: Boolean(ordenFamiliares[clave]?.invitacionEnviada),
          invitacionEnviadaEn: ordenFamiliares[clave]?.invitacionEnviadaEn || null,
          listaParaInvitacion:
            confirmados.length > 0 &&
            confirmados.every((m) => m.pagado) &&
            confirmados.every((m) => m.mesa),
        };
      })
      .filter((f) => f.listaParaInvitacion);
  })();

  const moverNombreFamilia = (familia, invitadoId, direccion) => {
    const ids = familia.confirmados.map((m) => m.id);
    const idx = ids.indexOf(invitadoId);
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= ids.length) return;
    const nuevosIds = [...ids];
    [nuevosIds[idx], nuevosIds[nuevoIdx]] = [nuevosIds[nuevoIdx], nuevosIds[idx]];
    persistOrdenFamiliares({
      ...ordenFamiliares,
      [familia.clave]: { ...ordenFamiliares[familia.clave], orden: nuevosIds },
    });
  };

  const marcarInvitacionEnviada = (clave) => {
    persistOrdenFamiliares({
      ...ordenFamiliares,
      [clave]: {
        ...ordenFamiliares[clave],
        invitacionEnviada: true,
        invitacionEnviadaEn: new Date().toISOString(),
      },
    });
  };

  const [descargando, setDescargando] = useState(null);
  const [nombreCarpetaInvitaciones, setNombreCarpetaInvitaciones] = useState(null);
  const [subiendoPlantillaInvitacion, setSubiendoPlantillaInvitacion] = useState(false);
  const [errorPlantillaInvitacion, setErrorPlantillaInvitacion] = useState("");

  const onSeleccionarArchivoPlantillaInvitacion = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorPlantillaInvitacion("");
    setSubiendoPlantillaInvitacion(true);
    try {
      // Plantilla más grande que una foto normal (maxDim mayor): es el
      // fondo completo de la invitación, necesita quedar nítido.
      const dataUrl = await redimensionarImagenArchivo(file, 2000, 0.88);
      persistEvento({ ...evento, imagenInvitacion: dataUrl });
    } catch (_) {
      setErrorPlantillaInvitacion("No se ha podido procesar la imagen. Prueba con otra.");
    } finally {
      setSubiendoPlantillaInvitacion(false);
    }
  };

  const [subiendoImagenPortada, setSubiendoImagenPortada] = useState(false);
  const [errorImagenPortada, setErrorImagenPortada] = useState("");

  const onSeleccionarArchivoImagenPortada = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorImagenPortada("");
    setSubiendoImagenPortada(true);
    try {
      const dataUrl = await redimensionarImagenArchivo(file);
      persistEvento({ ...evento, imagen: dataUrl });
    } catch (_) {
      setErrorImagenPortada("No se ha podido procesar la imagen. Prueba con otra.");
    } finally {
      setSubiendoImagenPortada(false);
    }
  };

  useEffect(() => {
    if (!window.showDirectoryPicker) return;
    leerHandleCarpeta()
      .then((handle) => setNombreCarpetaInvitaciones(handle ? handle.name : null))
      .catch(() => {});
  }, []);

  const [modoCalibracion, setModoCalibracion] = useState(false);

  const generarImagenParaFamilia = async (familia, mostrarCuadricula = modoCalibracion) => {
    // Fraunces tiene que estar realmente cargada antes de dibujar en el
    // canvas — si no, el navegador la ignora en silencio y usa una por
    // defecto sin avisar.
    try {
      await document.fonts.load("bold 40px 'Fraunces'");
    } catch (_) {
      // Si falla la carga, se sigue igualmente con la fuente de reserva.
    }
    const nombres = familia.confirmados.map((m) => m.nombre);
    const cantidad = familia.confirmados.length;
    const mesas = [...new Set(familia.confirmados.map((m) => m.mesa).filter(Boolean))];
    const mesaTexto =
      mesas.length === 1
        ? `Mesa ${mesas[0]} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : mesas.length > 1
        ? `Mesas ${mesas.join(", ")} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : `${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`;
    return generarInvitacionImagen(evento, familia.apellido, nombres, mesaTexto, mostrarCuadricula);
  };

  const descargarInvitacion = async (familia) => {
    setDescargando(familia.clave);
    const dataUrl = await generarImagenParaFamilia(familia);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    const nombreArchivo = `${evento.nombre || "evento"}_${familia.clave}.png`.replace(/[\\/:*?"<>|]/g, "-");
    await guardarArchivoInvitacion(dataUrl, nombreArchivo);
  };

  const [previewInvitacion, setPreviewInvitacion] = useState(null); // { familia, dataUrl, destinatario } | null
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  const abrirPreviewInvitacion = async (familia) => {
    const destinatario = familia.confirmados[0];
    if (!destinatario?.email) {
      window.alert(
        `No se puede enviar todavía: ${destinatario?.nombre || "la primera persona del orden"} ` +
          `no tiene email guardado. Rellénalo (aquí mismo, en la lista de nombres) o cambia el orden de la familia.`
      );
      return;
    }
    setDescargando(familia.clave);
    const dataUrl = await generarImagenParaFamilia(familia);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    setPreviewInvitacion({ familia, dataUrl, destinatario });
  };

  const confirmarEnvioInvitacion = async () => {
    if (!previewInvitacion) return;
    setEnviandoInvitacion(true);
    const base64 = previewInvitacion.dataUrl.split(",")[1] || "";
    const ok = await enviarInvitacionFamilia(
      previewInvitacion.destinatario.email,
      `Tu invitación — ${evento.nombre || "evento"}`,
      evento.plantillaInvitacionFamilia || "",
      base64
    );
    setEnviandoInvitacion(false);
    if (ok) {
      marcarInvitacionEnviada(previewInvitacion.familia.clave);
      window.alert(`Invitación enviada a ${previewInvitacion.destinatario.email}.`);
      setPreviewInvitacion(null);
    }
  };

  // Envío por bloques: se elige un colaborador y solo se ven/envían las
  // familias de sus invitados asignados, con un resumen de confirmación
  // antes de mandar nada — para no arriesgarse a un envío masivo por error.
  const [colaboradorInvitacionSel, setColaboradorInvitacionSel] = useState("");
  const [mostrarResumenLoteInvitaciones, setMostrarResumenLoteInvitaciones] = useState(false);
  const [enviandoLoteInvitaciones, setEnviandoLoteInvitaciones] = useState(false);

  const familiasParaMostrarInvitacion = colaboradorInvitacionSel
    ? familiasListasParaInvitacion.filter((f) =>
        f.confirmados.some(
          (m) => resolverColaborador(m, colaboradores)?.id === colaboradorInvitacionSel
        )
      )
    : familiasListasParaInvitacion;

  // El envío por bloque solo manda a las que todavía no se les envió nada
  // (para no repetir sin querer) — las ya enviadas se pueden reenviar a
  // mano, una a una, con el botón individual de cada tarjeta.
  const familiasPendientesDeEnviar = familiasParaMostrarInvitacion.filter(
    (f) => !f.invitacionEnviada
  );

  const confirmarEnvioLoteInvitaciones = async () => {
    setEnviandoLoteInvitaciones(true);
    let enviados = 0;
    const saltados = [];
    for (const familia of familiasPendientesDeEnviar) {
      const destinatario = familia.confirmados[0];
      if (!destinatario?.email) {
        saltados.push(`${familia.apellido} (sin email)`);
        continue;
      }
      const dataUrl = await generarImagenParaFamilia(familia);
      if (!dataUrl) {
        saltados.push(`${familia.apellido} (no se pudo generar la imagen)`);
        continue;
      }
      const base64 = dataUrl.split(",")[1] || "";
      const ok = await enviarInvitacionFamilia(
        destinatario.email,
        `Tu invitación — ${evento.nombre || "evento"}`,
        evento.plantillaInvitacionFamilia || "",
        base64
      );
      if (ok) {
        enviados++;
        marcarInvitacionEnviada(familia.clave);
      } else {
        saltados.push(`${familia.apellido} (error al enviar)`);
      }
    }
    setEnviandoLoteInvitaciones(false);
    setMostrarResumenLoteInvitaciones(false);
    window.alert(
      `Enviadas ${enviados} invitaciones.` +
        (saltados.length > 0
          ? `\n\nNo se pudieron enviar (${saltados.length}):\n${saltados.join("\n")}`
          : "")
    );
  };

  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false);
  const [textoRestaurar, setTextoRestaurar] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);

  const zonasUnicas = [...new Set(invitados.map((g) => g.zona).filter(Boolean))].sort();
  const gruposFamiliaresUnicos = [
    ...new Set(invitados.map((g) => g.grupoFamiliar).filter(Boolean)),
  ].sort();

  const invitadosOrdenados = invitados
    .filter((g) => {
      if (filtros.texto) {
        const t = filtros.texto.toLowerCase();
        const texto = `${g.nombre} ${g.apellido} ${g.grupoFamiliar || ""}`.toLowerCase();
        if (!texto.includes(t)) return false;
      }
      if (filtros.grupoFamiliar && g.grupoFamiliar !== filtros.grupoFamiliar) return false;
      if (filtros.zona && g.zona !== filtros.zona) return false;
      if (filtros.colaboradorId) {
        const col = resolverColaborador(g, colaboradores);
        if (!col || col.id !== filtros.colaboradorId) return false;
      }
      if (filtros.mesa && String(g.mesa || "") !== filtros.mesa) return false;
      if (filtros.confirmado === "confirmado" && !g.confirmado) return false;
      if (filtros.confirmado === "tentativa" && g.confirmado) return false;
      if (filtros.datos === "completo" && !(g.confirmado && datosCompletos(g))) return false;
      if (filtros.datos === "pendiente" && (!g.confirmado || datosCompletos(g))) return false;
      if (filtros.pagado === "pagado" && !g.pagado) return false;
      if (filtros.pagado === "pendiente" && g.pagado) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dir = orden.direccion === "asc" ? 1 : -1;
      const valor = (g) => {
        switch (orden.columna) {
          case "grupoFamiliar":
            return (g.grupoFamiliar || g.apellido || "").toLowerCase();
          case "zona":
            return (g.zona || "").toLowerCase();
          case "colaborador":
            return (resolverColaborador(g, colaboradores)?.nombre || "").toLowerCase();
          case "mesa":
            return g.mesa ? Number(g.mesa) : 9999;
          case "confirmado":
            return g.confirmado ? 1 : 0;
          case "datos":
            return g.confirmado && datosCompletos(g) ? 2 : g.confirmado ? 1 : 0;
          case "pagado":
            return g.pagado ? 1 : 0;
          default:
            return `${(g.apellido || "").toLowerCase()} ${(g.nombre || "").toLowerCase()}`;
        }
      };
      const va = valor(a);
      const vb = valor(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

  return (
    <div className="space-y-8">
      <Portada evento={evento} editable abierto={abierto} toggle={toggle} />

      {/* Resumen */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Lista global", value: total },
          { label: "Tentativa", value: tentativaCount },
          { label: "Confirmados", value: confirmadosCount },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 rounded text-center"
            style={{ background: "#fff", border: `1px solid ${C.line}` }}
          >
            <div
              className="text-2xl"
              style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
            >
              {s.value}
            </div>
            <div
              className="text-xs uppercase"
              style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* Progreso de recopilación */}
      {abierto.progreso && (
        <VentanaFlotante
          clave="progreso"
          titulo="Progreso de recopilación"
          onCerrar={() => toggle("progreso")}
        >
            <ProgresoBar
              label="General (confirmados con datos completos)"
              completado={invitados.filter((g) => g.confirmado && datosCompletos(g)).length}
              total={confirmadosCount}
              color={C.wax}
            />
            <div className="grid sm:grid-cols-2 gap-x-6">
              {colaboradores.map((c) => {
                const suyos = invitados.filter(
                  (g) => resolverColaborador(g, colaboradores)?.id === c.id && g.confirmado
                );
                const completos = suyos.filter((g) => datosCompletos(g)).length;
                return (
                  <ProgresoBar
                    key={c.id}
                    label={c.nombre}
                    completado={completos}
                    total={suyos.length}
                  />
                );
              })}
            </div>
            {colaboradores.length === 0 && (
              <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                Añade colaboradores para ver su progreso individual.
              </p>
            )}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <ProgresoBar
                label="Cobro (confirmados que ya han pagado)"
                completado={invitados.filter((g) => g.confirmado && g.pagado).length}
                total={confirmadosCount}
                color={C.gold}
              />
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
                Informativo — no bloquea a nadie, solo para saber cuánto falta de la canción
                para el DJ. Las alergias se avisan directamente en la mesa (sección Mesas) y
                tienen su propia lista imprimible más abajo.
              </p>
              <ProgresoBar
                label="Con canción registrada"
                completado={
                  invitados.filter((g) => g.confirmado && g.cancion && g.cancion.trim()).length
                }
                total={confirmadosCount}
              />
            </div>
        </VentanaFlotante>
      )}

      {/* Colaboradores */}
      {abierto.colaboradores && (
        <VentanaFlotante clave="colaboradores" titulo="Colaboradores" onCerrar={() => toggle("colaboradores")}>
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Los colaboradores son también invitados del evento: búscalo por apellido o
              nombre entre los ya añadidos a la lista. Si aún no está en la lista, añádelo
              primero abajo en "Lista de invitados".
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <BuscadorInvitado
                invitados={invitadosDisponiblesParaColaborador}
                invitadoId={nuevoColab.invitadoId}
                onSeleccionar={(id) => setNuevoColab({ ...nuevoColab, invitadoId: id })}
                placeholder="Buscar invitado para hacerlo colaborador..."
              />
              <button
                onClick={agregarColaborador}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.ink, color: C.paper }}
              >
                <Plus size={14} /> Añadir
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {colaboradores.map((c) => {
                const pendientes = invitados.filter(
                  (g) =>
                    resolverColaborador(g, colaboradores)?.id === c.id &&
                    g.confirmado &&
                    !datosCompletos(g)
                ).length;
                return (
                  <ColaboradorCard
                    key={c.id}
                    c={c}
                    pendientes={pendientes}
                    invitados={invitados}
                    colaboradores={colaboradores}
                    evento={evento}
                    onEliminar={eliminarColaborador}
                    onRelevar={relevarColaborador}
                    onAsignarColaborador={asignarColaborador}
                    onCambiarEmail={cambiarEmailColaborador}
                    onAvisar={(id) => setAvisoPreview({ id, nombre: c.nombre })}
                    onProbarEmail={probarEmailColaborador}
                  />
                );
              })}
              {colaboradores.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Aún no hay colaboradores.
                </p>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Mesas */}
      {abierto.mesas && (
        <VentanaFlotante clave="mesas" titulo="Mesas" onCerrar={() => toggle("mesas")}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            Define primero cuántos comensales caben en cada mesa. Luego puedes generar una
            distribución preliminar (respetando el grupo familiar) y ajustarla a mano.
          </p>
          <div className="flex items-center gap-2 ml-3">
            {avisosMesas.length > 0 && (
              <button
                onClick={() => setPanelFlotante("avisosMesas")}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                style={{ background: C.wax, color: "#fff" }}
                title="Ver familias que se quedaron sin mesa"
              >
                <AlertTriangle size={12} /> {avisosMesas.length} aviso{avisosMesas.length !== 1 && "s"}
              </button>
            )}
            <button
              onClick={autoAsignarMesas}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ background: C.ink, color: C.paper }}
            >
              Auto-asignar (preliminar)
            </button>
            <button
              onClick={anadirMesa}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ border: `1px solid ${C.ink}`, color: C.ink }}
            >
              <Plus size={14} /> Añadir mesa
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {mesas.map((m) => {
            const ocupados = ocupacionMesa(m.numero);
            const lleno = ocupados >= m.capacidad && m.capacidad > 0;
            const tieneAlergias = invitados.some(
              (g) => g.mesa === m.numero && g.confirmado && tieneAlergiaReal(g)
            );
            return (
              <MesaRedonda
                key={m.numero}
                m={m}
                ocupados={ocupados}
                lleno={lleno}
                tieneAlergias={tieneAlergias}
                onCambiarCapacidad={(v) => cambiarCapacidadMesa(m.numero, v)}
                onEliminar={() => eliminarMesa(m.numero)}
                onVaciar={() => vaciarMesa(m.numero)}
              />
            );
          })}
          {mesas.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay mesas — pulsa "Añadir mesa" para crear la primera.
            </p>
          )}
        </div>
        </VentanaFlotante>
      )}

      {/* Plano de mesas */}
      {abierto.plano && (
        <VentanaFlotante clave="plano" titulo="Plano de mesas" onCerrar={() => toggle("plano")}>
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
            Arrastra cada mesa a la posición que quieras para representar cómo queda en el local.
            La posición se guarda sola. Para imprimirlo en A2, pulsa "Imprimir" y elige el tamaño
            de papel A2 en el diálogo de impresión de tu navegador.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => {
                setTimeout(() => {
                  try {
                    window.print();
                  } catch (_) {
                    // Bloqueado por el navegador: Cmd/Ctrl+P a mano.
                  }
                }, 60);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Printer size={14} /> Imprimir (A2)
            </button>
          </div>
          <div id="zona-imprimible-plano">
            <div
              ref={lienzoPlanoRef}
              className="relative w-full rounded"
              style={{
                aspectRatio: "594 / 420",
                background: "#F7F4EA",
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "5% 5%",
                border: `1px solid ${C.line}`,
              }}
            >
              {mesas.map((m, i) => {
                const ocupados = ocupacionMesa(m.numero);
                const posDefecto = posicionPorDefecto(i, mesas.length);
                const posX = m.posX ?? posDefecto.posX;
                const posY = m.posY ?? posDefecto.posY;
                return (
                  <MesaPlano
                    key={m.numero}
                    m={{ ...m, posX, posY }}
                    ocupados={ocupados}
                    canvasRef={lienzoPlanoRef}
                    onMover={moverMesaPlano}
                  />
                );
              })}
            </div>
          </div>
          {mesas.length === 0 && (
            <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay mesas — créalas primero en "Mesas".
            </p>
          )}
        </VentanaFlotante>
      )}

      {/* Invitados */}
      <section>
        <div
          className="mb-1 pb-2 flex items-center justify-between"
          style={{ borderBottom: `1.5px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={intentarCerrarInvitados}
              className="flex items-center gap-2 text-xl"
              style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}
            >
              <Tag size={18} strokeWidth={2} />
              Lista de invitados
            </button>
            {invitados.length > 0 && (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setPanelFlotante("tabla")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.gold, color: "#fff" }}
                  title="Ver / imprimir / exportar la lista de invitados"
                >
                  <Printer size={12} /> Imprimir
                </button>
                <button
                  onClick={() => setPanelFlotante("canciones")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.gold, color: "#fff" }}
                  title="Ver / imprimir / exportar solo la lista de canciones (para el DJ/grupo musical)"
                >
                  <Music size={12} /> Canciones
                </button>
                <button
                  onClick={() => setPanelFlotante("alergias")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.wax, color: "#fff" }}
                  title="Ver / imprimir / exportar solo la lista de alergias, con su mesa (para cocina/catering)"
                >
                  <AlertTriangle size={12} /> Alergias
                </button>
              </div>
            )}
          </div>
        </div>

        {abierto.invitados && (
        <>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setMostrarAnadir((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: mostrarAnadir ? C.paper : C.gold,
              background: mostrarAnadir ? C.gold : "transparent",
            }}
          >
            <Plus size={14} /> Añadir invitado individual
          </button>
          <button
            onClick={() => setModoEdicion((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: modoEdicion ? C.paper : C.gold,
              background: modoEdicion ? C.gold : "transparent",
            }}
            title="Activa este modo para poder corregir el grupo familiar de un invitado"
          >
            <Pencil size={14} /> {modoEdicion ? "Terminar edición" : "Editar datos"}
          </button>
          <button
            onClick={() => setMostrarImport((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: mostrarImport ? C.paper : C.gold,
              background: mostrarImport ? C.gold : "transparent",
            }}
          >
            <Copy size={14} /> Importar desde hoja de cálculo
          </button>
        </div>

        {mostrarAnadir && (
        <div className="flex flex-wrap gap-2 mb-3">
          <TextInput
            placeholder="Grupo familiar"
            value={nuevoInvitado.grupoFamiliar}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, grupoFamiliar: e.target.value })
            }
          />
          <TextInput
            placeholder="Apellido familiar"
            value={nuevoInvitado.apellido}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, apellido: e.target.value })
            }
          />
          <TextInput
            placeholder="Nombre"
            value={nuevoInvitado.nombre}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, nombre: e.target.value })
            }
          />
          <TextInput
            placeholder="Zona"
            value={nuevoInvitado.zona}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, zona: e.target.value })
            }
          />
          <button
            onClick={agregarInvitado}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            <Plus size={14} /> Añadir
          </button>
        </div>
        )}

        {mostrarImport && (
          <div
            className="p-3 rounded mb-4"
            style={{ background: "#fff", border: `1px dashed ${C.gold}` }}
          >
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Pega tus filas en el orden Grupo familiar, Apellido, Nombre, Colaborador, Zona —
              directamente copiadas de tu hoja de cálculo (una fila por línea). Si el nombre
              del colaborador coincide con uno ya creado abajo, se enlaza automáticamente.
            </p>
            <textarea
              value={textoImport}
              onChange={(e) => setTextoImport(e.target.value)}
              placeholder={"Luis01\tLuis\tJavi\tBENITO\tIcod\nLuis02\tLuis\tDani\tDANIEL\tOrotava"}
              rows={4}
              className="w-full mb-2"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button
              onClick={importarInvitados}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Plus size={14} /> Importar filas
            </button>
          </div>
        )}

        <div
          className="rounded overflow-x-auto"
          style={{ border: `1px solid ${C.line}`, background: "#fff" }}
        >
          <div
            className="px-3 py-2 text-xs"
            style={{
              borderBottom: `1px solid ${C.line}`,
              color: C.charcoal,
              fontFamily: "'IBM Plex Mono', monospace",
              background: C.paperDark,
            }}
          >
            Edad media de los asistentes:{" "}
            <strong style={{ color: C.ink }}>
              {edadPromedio(invitadosOrdenados, evento) ?? "— (faltan años de nacimiento)"}
              {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
            </strong>
          </div>
          <div style={{ minWidth: 780 }}>
            <div
              className="grid text-xs uppercase px-3 py-2 text-center"
              style={{
                gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                color: C.gold,
                fontFamily: "'IBM Plex Mono', monospace",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <EncabezadoOrdenable columna="invitado" orden={orden} onClick={cambiarOrden}>
                Invitado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="grupoFamiliar" orden={orden} onClick={cambiarOrden}>
                Grupo familiar
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="zona" orden={orden} onClick={cambiarOrden}>
                Zona
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="colaborador" orden={orden} onClick={cambiarOrden}>
                Colaborador
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="mesa" orden={orden} onClick={cambiarOrden}>
                Mesa
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="confirmado" orden={orden} onClick={cambiarOrden}>
                Confirmado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="datos" orden={orden} onClick={cambiarOrden}>
                Datos
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="pagado" orden={orden} onClick={cambiarOrden}>
                Pagado
              </EncabezadoOrdenable>
              <span></span>
            </div>
            <div
              className="grid px-3 py-1.5"
              style={{
                gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                background: C.paperDark,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <TextInput
                value={filtros.texto}
                onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                placeholder="Buscar..."
                style={{ padding: "2px 5px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              />
              <select
                value={filtros.grupoFamiliar}
                onChange={(e) => setFiltros({ ...filtros, grupoFamiliar: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                {gruposFamiliaresUnicos.map((gf) => (
                  <option key={gf} value={gf}>
                    {gf}
                  </option>
                ))}
              </select>
              <select
                value={filtros.zona}
                onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todas</option>
                {zonasUnicas.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <select
                value={filtros.colaboradorId}
                onChange={(e) => setFiltros({ ...filtros, colaboradorId: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <select
                value={filtros.mesa}
                onChange={(e) => setFiltros({ ...filtros, mesa: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todas</option>
                {mesas.map((m) => (
                  <option key={m.numero} value={String(m.numero)}>
                    {m.numero}
                  </option>
                ))}
              </select>
              <select
                value={filtros.confirmado}
                onChange={(e) => setFiltros({ ...filtros, confirmado: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="confirmado">Confirmado</option>
                <option value="tentativa">Tentativa</option>
              </select>
              <select
                value={filtros.datos}
                onChange={(e) => setFiltros({ ...filtros, datos: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="completo">Completos</option>
                <option value="pendiente">Por recopilar</option>
              </select>
              <select
                value={filtros.pagado}
                onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
              <span />
            </div>
            {invitadosOrdenados.map((g, i) => {
              const col = resolverColaborador(g, colaboradores);
              return (
                <div
                  key={g.id}
                  className="grid items-center px-3 py-2 text-sm"
                  style={{
                    gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                    background: i % 2 ? C.paperDark : "#fff",
                    fontFamily: "'Inter', sans-serif",
                    color: C.charcoal,
                  }}
                >
                  <span>
                    {modoEdicion ? (
                      <span className="flex gap-1">
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.apellido ?? ""}
                            onCommit={(v) => asignarApellido(g.id, v)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.nombre ?? ""}
                            onCommit={(v) => asignarNombre(g.id, v)}
                          />
                        </div>
                      </span>
                    ) : (
                      <>
                        {g.apellido}, {g.nombre}
                        {colaboradores.some((c) => c.invitadoId === g.id) && (
                          <span
                            className="ml-1 text-xs"
                            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                            title="También es colaborador"
                          >
                            ★
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.grupoFamiliar ?? g.apellido ?? ""}
                        onCommit={(v) => asignarGrupoFamiliar(g.id, v)}
                      />
                    ) : (
                      g.grupoFamiliar || g.apellido || "—"
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.zona ?? ""}
                        onCommit={(v) => asignarZona(g.id, v)}
                      />
                    ) : (
                      g.zona || "—"
                    )}
                  </span>
                  <span className="text-xs flex items-center gap-1">
                    <select
                      value={g.colaboradorId || ""}
                      onChange={(e) => asignarColaborador(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin asignar</option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {g.colaboradorId &&
                      !colaboradores.find((c) => c.id === g.colaboradorId)?.email && (
                        <span
                          title="Este colaborador no tiene email guardado — no recibirá el aviso de esta asignación"
                          style={{ color: C.wax, flexShrink: 0 }}
                        >
                          ⚠
                        </span>
                      )}
                  </span>
                  <span className="text-xs">
                    <select
                      value={g.mesa || ""}
                      onChange={(e) => asignarMesa(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin mesa</option>
                      {mesas.map((m) => {
                        const ocupados = ocupacionMesa(m.numero);
                        const llena = ocupados >= m.capacidad && g.mesa !== m.numero;
                        return (
                          <option key={m.numero} value={m.numero} disabled={llena}>
                            Mesa {m.numero} ({ocupados}/{m.capacidad}){llena ? " — llena" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </span>
                  <span>
                    <button
                      onClick={() => toggleConfirmar(g.id)}
                      className="flex items-center gap-1"
                    >
                      {g.confirmado ? (
                        <Stamp color={C.ink}>Confirmado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                        >
                          Tentativa
                        </span>
                      )}
                    </button>
                  </span>
                  <span>
                    {g.confirmado ? (
                      datosCompletos(g) ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.ink }}>
                          <Check size={13} /> completos
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.wax }}>
                          <Bell size={13} /> por recopilar
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <span>
                    {g.confirmado ? (
                      g.pagado ? (
                        <Stamp color={C.ink}>Pagado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                          title="Se confirma desde la vista del colaborador"
                        >
                          Pendiente
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <button onClick={() => eliminarInvitado(g.id)}>
                    <Trash2 size={14} style={{ color: C.wax }} />
                  </button>
                </div>
              );
            })}
            {invitados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Aún no hay invitados en la lista.
              </p>
            )}
            {invitados.length > 0 && invitadosOrdenados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Ningún invitado coincide con los filtros aplicados.
              </p>
            )}
          </div>
        </div>
      </>
      )}
      </section>

      {/* Invitaciones */}
      {abierto.invitaciones && (
        <VentanaFlotante
          clave="invitaciones"
          titulo={`Invitaciones${
            familiasListasParaInvitacion.length > 0 ? ` (${familiasListasParaInvitacion.length})` : ""
          }`}
          onCerrar={() => toggle("invitaciones")}
        >
            <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
              Solo aparecen aquí las familias en las que <strong>todos</strong> sus confirmados
              ya han pagado. Genera la imagen (con el apellido familiar y los nombres de los
              integrantes) y descárgala para enviarla tú mismo por WhatsApp o email — un
              artefacto de Claude no puede enviar correos automáticamente.
            </p>
            <div className="mb-4 p-3 rounded" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
              <Field label="Imagen de la plantilla de invitación (vertical, para móvil)">
                <div className="flex items-center gap-3 flex-wrap">
                  {evento.imagenInvitacion && (
                    <img
                      src={evento.imagenInvitacion}
                      alt="Plantilla de invitación"
                      className="rounded object-cover"
                      style={{ width: 40, height: 60, border: `1px solid ${C.line}` }}
                    />
                  )}
                  <label
                    className="text-xs px-2 py-1 rounded cursor-pointer"
                    style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                  >
                    {subiendoPlantillaInvitacion ? "Procesando…" : "Subir archivo desde el dispositivo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSeleccionarArchivoPlantillaInvitacion}
                      disabled={subiendoPlantillaInvitacion}
                      style={{ display: "none" }}
                    />
                  </label>
                  {evento.imagenInvitacion && (
                    <button
                      type="button"
                      onClick={() => persistEvento({ ...evento, imagenInvitacion: "" })}
                      className="text-xs"
                      style={{ color: C.wax }}
                    >
                      Quitar y usar la plantilla incluida
                    </button>
                  )}
                </div>
              </Field>
              {errorPlantillaInvitacion && (
                <p className="text-xs mt-1" style={{ color: C.wax }}>
                  {errorPlantillaInvitacion}
                </p>
              )}
            </div>

            <label
              className="mb-4 flex items-center gap-2 text-xs p-2 rounded cursor-pointer"
              style={{ background: modoCalibracion ? "#FDECF3" : C.paperDark, border: `1px dashed ${C.line}` }}
            >
              <input
                type="checkbox"
                checked={modoCalibracion}
                onChange={(e) => setModoCalibracion(e.target.checked)}
              />
              <span>
                Modo calibración: dibuja una cuadrícula con las coordenadas (cada 5% del ancho/alto) sobre
                la imagen — actívalo, descarga o previsualiza una invitación, y pásame esos números para ajustar
                mejor la posición del texto. Desactívalo cuando termines.
              </span>
            </label>

            {window.showDirectoryPicker && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: true });
                    setNombreCarpetaInvitaciones(carpeta ? carpeta.name : null);
                  }}
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                >
                  {nombreCarpetaInvitaciones ? "Cambiar carpeta" : "Elegir carpeta de guardado"}
                </button>
                <span className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  {nombreCarpetaInvitaciones
                    ? `Guardando en: "${nombreCarpetaInvitaciones}"`
                    : "Sin elegir — se descargará a la carpeta de Descargas de siempre."}
                </span>
              </div>
            )}

            <div className="mb-4 p-3 rounded flex flex-wrap items-end gap-2" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
              <Field label="Envío por bloques: elige un colaborador">
                <select
                  value={colaboradorInvitacionSel}
                  onChange={(e) => setColaboradorInvitacionSel(e.target.value)}
                  style={{ ...inputStyle, minWidth: 220 }}
                >
                  <option value="">Ver todas las familias (sin agrupar)</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              {colaboradorInvitacionSel && (
                <button
                  onClick={() => setMostrarResumenLoteInvitaciones(true)}
                  disabled={familiasPendientesDeEnviar.length === 0}
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{
                    background: familiasPendientesDeEnviar.length === 0 ? C.line : C.wax,
                    color: familiasPendientesDeEnviar.length === 0 ? C.charcoal : "#fff",
                  }}
                >
                  Revisar y enviar a {familiasPendientesDeEnviar.length} familia
                  {familiasPendientesDeEnviar.length === 1 ? "" : "s"} (sin enviar todavía)
                </button>
              )}
            </div>

            <div className="space-y-2">
              {familiasParaMostrarInvitacion.map((familia) => (
                <div
                  key={familia.clave}
                  className="p-3 rounded text-sm"
                  style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                        Familia {familia.apellido}
                      </span>
                      {familia.invitacionEnviada && (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                          style={{ background: C.ink, color: C.paper }}
                          title={
                            familia.invitacionEnviadaEn
                              ? new Date(familia.invitacionEnviadaEn).toLocaleString("es-ES")
                              : ""
                          }
                        >
                          <Check size={11} /> Invitación enviada
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => descargarInvitacion(familia)}
                        disabled={descargando === familia.clave}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                        style={{ background: C.ink, color: C.paper, opacity: descargando === familia.clave ? 0.6 : 1 }}
                      >
                        <ImageIcon size={13} />
                        {descargando === familia.clave ? "Generando..." : "Descargar"}
                      </button>
                      <button
                        onClick={() => abrirPreviewInvitacion(familia)}
                        disabled={descargando === familia.clave}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                        style={{ background: C.gold, color: "#fff", opacity: descargando === familia.clave ? 0.6 : 1 }}
                      >
                        <Mail size={13} />
                        {descargando === familia.clave ? "Generando..." : "Enviar por email"}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.7 }}>
                    Orden de los nombres en la invitación (usa las flechas para cambiarlo, p.ej.
                    para poner al esposo primero — a esa persona se le enviará el email) y su
                    email de contacto:
                  </p>
                  <div className="space-y-1">
                    {familia.confirmados.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                        style={{ background: "#fff", border: `1px solid ${C.line}` }}
                      >
                        <span style={{ color: C.ink, minWidth: 90 }}>{m.nombre}</span>
                        <button
                          onClick={() => moverNombreFamilia(familia, m.id, -1)}
                          disabled={i === 0}
                          style={{ color: i === 0 ? C.line : C.gold }}
                          title="Mover antes"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moverNombreFamilia(familia, m.id, 1)}
                          disabled={i === familia.confirmados.length - 1}
                          style={{ color: i === familia.confirmados.length - 1 ? C.line : C.gold }}
                          title="Mover después"
                        >
                          ▼
                        </button>
                        <div className="flex-1">
                          <GrupoFamiliarInput
                            value={m.email || ""}
                            onCommit={(v) => asignarEmailInvitado(m.id, v)}
                          />
                        </div>
                        {i === 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                            style={{ background: C.paperDark, color: C.charcoal }}
                          >
                            destinatario
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {familiasParaMostrarInvitacion.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  {colaboradorInvitacionSel
                    ? "Este colaborador no tiene ninguna familia con el pago y la mesa completos todavía."
                    : "Todavía ninguna familia tiene el pago completo y la mesa asignada para todos sus confirmados."}
                </p>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Estado de cuentas */}
      {abierto.cuentas && (
        <VentanaFlotante clave="cuentas" titulo="Estado de cuentas" onCerrar={() => toggle("cuentas")}>
          {(() => {
            const confirmados = invitados.filter((g) => g.confirmado);
            const recaudado = confirmados
              .filter((g) => g.pagado)
              .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
            const pendienteCobro = confirmados
              .filter((g) => !g.pagado)
              .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
            const totalGastos = gastos.reduce((s, g) => s + parsePrecio(g.importe), 0);
            const gastosPagados = gastos
              .filter((g) => g.pagado)
              .reduce((s, g) => s + parsePrecio(g.importe), 0);
            const balance = recaudado - gastosPagados;
            const formato = (n) =>
              n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <>
                <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                  "Lo que entra" se calcula solo (pagos de invitados confirmados). "Lo que sale"
                  son los gastos que añadas abajo — incluye también los costes de la propia app
                  (dominio, suscripciones...), no solo proveedores de la boda.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
                      {formato(recaudado)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Recaudado
                    </div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.charcoal }}>
                      {formato(pendienteCobro)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Pendiente de cobro
                    </div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.wax }}>
                      {formato(totalGastos)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Total gastos
                    </div>
                  </div>
                  <div
                    className="p-2 rounded text-center"
                    style={{ background: balance >= 0 ? "#E3E9AE" : "#F0D3C8", border: `1px solid ${C.line}` }}
                  >
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
                      {formato(balance)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Balance (recaudado − gastos pagados)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMostrarListaGastos((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: C.ink }}
                >
                  {mostrarListaGastos ? "▾" : "▸"} Gastos ({gastos.length})
                </button>
                {mostrarListaGastos && (
                <>
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={agregarGasto}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                    style={{ background: C.ink, color: C.paper }}
                  >
                    <Plus size={14} /> Añadir gasto
                  </button>
                </div>
                <div className="space-y-2">
                  {gastos.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center gap-2 p-2 rounded"
                      style={{ background: "#fff", border: `1px solid ${C.line}` }}
                    >
                      <TextInput
                        value={g.concepto}
                        onChange={(e) => cambiarGasto(g.id, "concepto", e.target.value)}
                        placeholder="Concepto (ej. Suscripción Claude Code)"
                        className="flex-1"
                        style={{ minWidth: 160 }}
                      />
                      <TextInput
                        value={g.categoria}
                        onChange={(e) => cambiarGasto(g.id, "categoria", e.target.value)}
                        placeholder="Categoría"
                        style={{ width: 120 }}
                      />
                      <TextInput
                        value={g.importe}
                        onChange={(e) => cambiarGasto(g.id, "importe", e.target.value)}
                        placeholder="Importe"
                        style={{ width: 90, textAlign: "right" }}
                      />
                      <label className="flex items-center gap-1 text-xs" style={{ color: C.charcoal }}>
                        <input
                          type="checkbox"
                          checked={g.pagado}
                          onChange={(e) => cambiarGasto(g.id, "pagado", e.target.checked)}
                        />
                        Pagado
                      </label>
                      <button onClick={() => eliminarGasto(g.id)} title="Quitar este gasto">
                        <X size={15} style={{ color: C.wax }} />
                      </button>
                    </div>
                  ))}
                  {gastos.length === 0 && (
                    <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                      Todavía no hay gastos registrados.
                    </p>
                  )}
                </div>
                </>
                )}
              </>
            );
          })()}
        </VentanaFlotante>
      )}

      {/* Copia de seguridad */}
      {abierto.copiaSeguridad && (
        <VentanaFlotante
          clave="copiaSeguridad"
          titulo="Copia de seguridad"
          onCerrar={() => toggle("copiaSeguridad")}
        >
            <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
              Antes de pedir más cambios y volver a publicar el artefacto, exporta todo (evento,
              colaboradores, mesas e invitados) y guárdalo en una nota. Tras publicar la nueva
              versión, pega ese mismo texto aquí para recuperarlo todo de una vez.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setMostrarExportar((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                <Copy size={14} /> Exportar todo
              </button>
              <button
                onClick={() => setMostrarRestaurar((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.ink}`, color: C.ink }}
              >
                <Repeat size={14} /> Restaurar todo
              </button>
            </div>

            {mostrarExportar && (
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  Toca dentro del cuadro, Cmd/Ctrl+A y Cmd/Ctrl+C para copiarlo todo.
                </p>
                <textarea
                  readOnly
                  value={exportarTodo()}
                  onFocus={(e) => e.target.select()}
                  rows={8}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </div>
            )}

            {mostrarRestaurar && (
              <div>
                <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  Pega aquí el texto que generó "Exportar todo" en una versión anterior.
                </p>
                <textarea
                  value={textoRestaurar}
                  onChange={(e) => setTextoRestaurar(e.target.value)}
                  rows={8}
                  className="w-full mb-2"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
                <button
                  onClick={restaurarTodo}
                  className="px-3 py-1.5 rounded text-sm font-medium"
                  style={{ background: C.ink, color: C.paper }}
                >
                  Restaurar
                </button>
              </div>
            )}
        </VentanaFlotante>
      )}

      {/* Configuración: solo el lanzador — cada parte se abre como ventana propia */}
      {abierto.configuracion && (
        <VentanaFlotante
          clave="configuracion"
          titulo="Configuración"
          onCerrar={() => toggle("configuracion")}
          extra={
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggle(e.target.value);
              }}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                background: C.ink,
                color: C.paper,
                border: `1px solid ${C.ink}`,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
              title="Abre esa parte de Configuración en su propia ventana"
            >
              <option value="">SECCIÓN</option>
              {SECCIONES_CONFIGURACION.map((s) => (
                <option key={s.id} value={s.id}>
                  {abierto[s.id] ? "✓ " : ""}
                  {s.etiqueta}
                </option>
              ))}
            </select>
          }
        >
        </VentanaFlotante>
      )}

      {abierto["config-datos-evento"] && (
        <VentanaFlotante
          clave="config-datos-evento"
          titulo="Datos del evento"
          onCerrar={() => toggle("config-datos-evento")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Datos del evento (esto es lo que se ve en la portada).
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4" style={{ maxWidth: 500 }}>
                <div style={{ gridColumn: "span 2 / span 2" }}>
                  <Field label="Nombre del evento">
                    <TextInput
                      value={evento.nombre}
                      onChange={(e) => persistEvento({ ...evento, nombre: e.target.value })}
                      placeholder="Boda de..."
                      className="w-full"
                    />
                  </Field>
                </div>
                <Field label="Fecha">
                  <TextInput
                    type="date"
                    value={evento.fecha}
                    onChange={(e) => persistEvento({ ...evento, fecha: e.target.value })}
                  />
                </Field>
                <Field label="Hora">
                  <TextInput
                    type="time"
                    value={evento.hora}
                    onChange={(e) => persistEvento({ ...evento, hora: e.target.value })}
                  />
                </Field>
                <Field label="Lugar">
                  <TextInput
                    value={evento.lugar}
                    onChange={(e) => persistEvento({ ...evento, lugar: e.target.value })}
                    placeholder="Finca El Rincón"
                  />
                </Field>
                <Field label="Dirección">
                  <TextInput
                    value={evento.direccion}
                    onChange={(e) => persistEvento({ ...evento, direccion: e.target.value })}
                    placeholder="Calle, número, municipio"
                  />
                </Field>
                <div style={{ gridColumn: "span 2 / span 2" }}>
                  <Field label="Imagen de portada">
                    <div className="flex items-center gap-2 flex-wrap">
                      {evento.imagen && (
                        <img
                          src={evento.imagen}
                          alt="Portada"
                          className="rounded object-cover"
                          style={{ width: 60, height: 40, border: `1px solid ${C.line}` }}
                        />
                      )}
                      <label
                        className="text-xs px-2 py-1 rounded cursor-pointer"
                        style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                      >
                        {subiendoImagenPortada ? "Procesando…" : "Subir imagen desde el dispositivo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onSeleccionarArchivoImagenPortada}
                          disabled={subiendoImagenPortada}
                          style={{ display: "none" }}
                        />
                      </label>
                      {evento.imagen !== "/cabecera-defecto.jpg" && (
                        <button
                          type="button"
                          onClick={() => persistEvento({ ...evento, imagen: "/cabecera-defecto.jpg" })}
                          className="text-xs"
                          style={{ color: C.wax }}
                        >
                          Quitar y usar la imagen incluida
                        </button>
                      )}
                    </div>
                    {errorImagenPortada && (
                      <p className="text-xs mt-1" style={{ color: C.wax }}>
                        {errorImagenPortada}
                      </p>
                    )}
                  </Field>
                  <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.charcoal }}>
                    <input
                      type="checkbox"
                      checked={evento.ocultarTituloEnImagen}
                      onChange={(e) => persistEvento({ ...evento, ocultarTituloEnImagen: e.target.checked })}
                    />
                    La imagen ya incluye el título (ocultar el texto superpuesto)
                  </label>
                </div>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-precios"] && (
        <VentanaFlotante
          clave="config-precios"
          titulo="Precios"
          onCerrar={() => toggle("config-precios")}
        >
              <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                Precios de referencia para calcular el cobro de cada familia (número de adultos
                y niños según los datos que recopile cada colaborador).
              </p>
              <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 400 }}>
                <Field label="Precio adulto">
                  <TextInput
                    value={evento.precioAdulto}
                    onChange={(e) => persistEvento({ ...evento, precioAdulto: e.target.value })}
                    placeholder="€ 45"
                  />
                </Field>
                <Field label="Precio niño">
                  <TextInput
                    value={evento.precioNino}
                    onChange={(e) => persistEvento({ ...evento, precioNino: e.target.value })}
                    placeholder="€ 20"
                  />
                </Field>
                <Field label="Edad niño desde">
                  <TextInput
                    value={evento.edadNinoDesde}
                    onChange={(e) => persistEvento({ ...evento, edadNinoDesde: e.target.value })}
                    placeholder="2"
                  />
                  <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Menores de esta edad no pagan entrada
                  </span>
                </Field>
                <Field label="Edad niño hasta">
                  <TextInput
                    value={evento.edadNinoHasta}
                    onChange={(e) => persistEvento({ ...evento, edadNinoHasta: e.target.value })}
                    placeholder="12"
                  />
                  <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Desde esta edad (incluida) pagan precio adulto
                  </span>
                </Field>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-url-web"] && (
        <VentanaFlotante
          clave="config-url-web"
          titulo="URL web"
          onCerrar={() => toggle("config-url-web")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                <strong>Importante:</strong> pega aquí la URL de tu web ya publicada (la del
                dominio que te dé Vercel, o el tuyo propio si le pones uno). Sin este dato, los
                enlaces que copies para cada colaborador no apuntarán al sitio correcto.
              </p>
              <Field label="URL de la web">
                <TextInput
                  value={evento.urlPublica}
                  onChange={(e) => persistEvento({ ...evento, urlPublica: e.target.value })}
                  placeholder="https://tu-boda.vercel.app"
                  className="w-full"
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-email-anfitrion"] && (
        <VentanaFlotante
          clave="config-email-anfitrion"
          titulo="Email anfitrión"
          onCerrar={() => toggle("config-email-anfitrion")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Tu email, para recibir avisos automáticos cuando un colaborador complete todos
                los datos o todos los pagos de sus invitados asignados.
              </p>
              <Field label="Tu email (anfitrión)">
                <TextInput
                  value={evento.emailAnfitrion || ""}
                  onChange={(e) => persistEvento({ ...evento, emailAnfitrion: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full"
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-plantillas-email"] && (
        <VentanaFlotante
          clave="config-plantillas-email"
          titulo="Texto emails"
          onCerrar={() => toggle("config-plantillas-email")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code>{" "}
                donde quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML
                sencillo (<code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>).
              </p>
              <Field label="Aviso al colaborador: tiene invitados nuevos o cambiados asignados">
                <textarea
                  value={evento.plantillaAsignacion || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaAsignacion: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Aviso al anfitrión: un colaborador completó todos los datos">
                <textarea
                  value={evento.plantillaDatosCompletados || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaDatosCompletados: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Aviso al anfitrión: un colaborador completó todos sus pagos">
                <textarea
                  value={evento.plantillaPagoRegistrado || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaPagoRegistrado: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Email a la familia: envío de la invitación">
                <textarea
                  value={evento.plantillaInvitacionFamilia || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaInvitacionFamilia: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-zona-reinicio"] && (
        <VentanaFlotante
          clave="config-zona-reinicio"
          titulo="Reinicios"
          onCerrar={() => toggle("config-zona-reinicio")}
        >
              <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                Zona de reinicio: pone a cero campos concretos de los invitados de un colaborador
                (útil tras pruebas, o para reutilizar la app en otro evento). Los invitados y los
                colaboradores <strong>nunca</strong> se borran aquí — solo los campos que elijas.
                Se descarga automáticamente una copia de seguridad de todo el evento antes de
                ejecutar nada, y hay que escribir "REINICIAR" para confirmar.
              </p>
              <div className="flex flex-wrap items-end gap-2 mb-2">
                <Field label="Colaborador">
                  <select
                    value={rColaborador}
                    onChange={(e) => {
                      setRColaborador(e.target.value);
                      setRAlcance("todos");
                      setRFamiliaClave("");
                      setRInvitadoId("");
                    }}
                    style={{ ...inputStyle, minWidth: 200 }}
                  >
                    <option value="">Todos los colaboradores</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Alcance">
                  <select
                    value={rAlcance}
                    onChange={(e) => {
                      setRAlcance(e.target.value);
                      setRFamiliaClave("");
                      setRInvitadoId("");
                    }}
                    style={{ ...inputStyle, minWidth: 180 }}
                  >
                    <option value="todos">Todos sus invitados</option>
                    <option value="familia">Una familia en concreto</option>
                    <option value="invitado">Un invitado en concreto</option>
                  </select>
                </Field>
                {rAlcance === "familia" && (
                  <Field label="Familia">
                    <select
                      value={rFamiliaClave}
                      onChange={(e) => setRFamiliaClave(e.target.value)}
                      style={{ ...inputStyle, minWidth: 200 }}
                    >
                      <option value="">Elige una familia…</option>
                      {familiasParaReset.map((f) => (
                        <option key={f.clave} value={f.clave}>
                          {f.etiqueta}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {rAlcance === "invitado" && (
                  <Field label="Invitado">
                    <select
                      value={rInvitadoId}
                      onChange={(e) => setRInvitadoId(e.target.value)}
                      style={{ ...inputStyle, minWidth: 220 }}
                    >
                      <option value="">Elige un invitado…</option>
                      {ordenarPorApellidoNombre(invitadosParaReset).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.apellido}, {g.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.entries(CATEGORIAS_RESET)
                  .filter(([, cfg]) => !cfg.familiar || rAlcance !== "invitado")
                  .map(([clave, cfg]) => (
                    <button
                      key={clave}
                      onClick={() => {
                        setRCategoria(clave);
                        setRMostrarConfirmar(true);
                        setRPalabra("");
                      }}
                      disabled={invitadoIdsParaReset.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                      style={{
                        border: `1px solid ${C.wax}`,
                        color: invitadoIdsParaReset.length === 0 ? C.line : C.wax,
                      }}
                    >
                      <Repeat size={14} /> {cfg.titulo}
                    </button>
                  ))}
              </div>
              <p className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                {rAlcance === "invitado"
                  ? rInvitadoId
                    ? "Afecta a 1 invitado."
                    : "Elige un invitado arriba."
                  : rAlcance === "familia"
                  ? rFamiliaClave
                    ? `Afecta a ${invitadoIdsParaReset.length} invitado(s) de esa familia.`
                    : "Elige una familia arriba."
                  : `Afecta a ${invitadoIdsParaReset.length} invitado(s).`}
              </p>
              <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.line}` }}>
                <button
                  onClick={() => setReinicioAvisosPendiente(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                  style={{ border: `1px solid ${C.wax}`, color: C.wax }}
                >
                  <Repeat size={14} /> Reiniciar avisos (historial de emails)
                </button>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-zona-peligro"] && (
        <VentanaFlotante
          clave="config-zona-peligro"
          titulo="Borrado total"
          onCerrar={() => toggle("config-zona-peligro")}
        >
              <p className="text-xs mb-2" style={{ color: C.wax, fontWeight: 700 }}>
                ⚠ Zona de peligro: esto borra evento, colaboradores, invitados, mesas y fotos —
                todo el contenido de la aplicación. No se puede deshacer.
              </p>
              <button
                onClick={borrarTodoElContenido}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.wax, color: "#fff" }}
              >
                <Trash2 size={14} /> BORRAR TODO
              </button>
        </VentanaFlotante>
      )}

        {rMostrarConfirmar && rCategoria && (
          <ModalFlotante
            titulo={CATEGORIAS_RESET[rCategoria].titulo}
            onCerrar={() => {
              setRMostrarConfirmar(false);
              setRPalabra("");
            }}
          >
            <p className="text-sm mb-3" style={{ color: C.charcoal }}>
              {CATEGORIAS_RESET[rCategoria].descripcion} Afecta a {invitadoIdsParaReset.length}{" "}
              invitado(s)
              {rColaborador
                ? ` de ${colaboradores.find((c) => c.id === rColaborador)?.nombre || "ese colaborador"}`
                : " (todos los colaboradores)"}
              {rAlcance === "familia" && rFamiliaClave ? `, familia "${rFamiliaClave}"` : ""}
              {rAlcance === "invitado" && rInvitadoId
                ? `, solo ${invitados.find((g) => g.id === rInvitadoId)?.nombre || "ese invitado"}`
                : ""}
              .
            </p>
            <p className="text-xs mb-3" style={{ color: C.wax }}>
              Se descargará antes una copia de seguridad completa del evento. Esta acción no se
              puede deshacer desde la app.
            </p>
            <Field label='Escribe "REINICIAR" para confirmar'>
              <TextInput
                value={rPalabra}
                onChange={(e) => setRPalabra(e.target.value)}
                placeholder="REINICIAR"
                className="w-full"
              />
            </Field>
            <div className="flex gap-2 mt-3">
              <button
                onClick={confirmarResetPorInvitados}
                disabled={rEjecutando || rPalabra.trim().toUpperCase() !== "REINICIAR"}
                className="px-3 py-2 rounded text-sm font-medium"
                style={{
                  background: rPalabra.trim().toUpperCase() === "REINICIAR" ? C.wax : C.line,
                  color: "#fff",
                }}
              >
                {rEjecutando ? "Reiniciando…" : "Confirmar reinicio"}
              </button>
              <button
                onClick={() => {
                  setRMostrarConfirmar(false);
                  setRPalabra("");
                }}
                disabled={rEjecutando}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
              >
                Cancelar
              </button>
            </div>
          </ModalFlotante>
        )}

        {reinicioAvisosPendiente && (
          <ModalFlotante
            titulo="Reiniciar avisos"
            onCerrar={() => {
              setReinicioAvisosPendiente(false);
              setPalabraAvisos("");
            }}
          >
            <p className="text-sm mb-3" style={{ color: C.charcoal }}>
              Vacía el historial de emails enviados (el panel de "Avisos"). No reenvía ni deshace
              ningún email ya enviado de verdad.
            </p>
            <p className="text-xs mb-3" style={{ color: C.wax }}>
              Se descargará antes una copia de seguridad completa del evento. Esta acción no se
              puede deshacer desde la app.
            </p>
            <Field label='Escribe "AVISOS" para confirmar'>
              <TextInput
                value={palabraAvisos}
                onChange={(e) => setPalabraAvisos(e.target.value)}
                placeholder="AVISOS"
                className="w-full"
              />
            </Field>
            <div className="flex gap-2 mt-3">
              <button
                onClick={confirmarReinicioAvisos}
                disabled={reiniciandoAvisos || palabraAvisos.trim().toUpperCase() !== "AVISOS"}
                className="px-3 py-2 rounded text-sm font-medium"
                style={{
                  background: palabraAvisos.trim().toUpperCase() === "AVISOS" ? C.wax : C.line,
                  color: "#fff",
                }}
              >
                {reiniciandoAvisos ? "Reiniciando…" : "Confirmar reinicio"}
              </button>
              <button
                onClick={() => {
                  setReinicioAvisosPendiente(false);
                  setPalabraAvisos("");
                }}
                disabled={reiniciandoAvisos}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
              >
                Cancelar
              </button>
            </div>
          </ModalFlotante>
        )}

      {/* Avisos */}
      {abierto.avisos && (
        <VentanaFlotante
          clave="avisos"
          titulo={`Avisos${colaboradoresPendientes.length > 0 ? ` (${colaboradoresPendientes.length})` : ""}`}
          onCerrar={() => toggle("avisos")}
        >
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: datosConfirmadosPendientes > 0 ? C.wax : C.ink,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {datosConfirmadosPendientes}
                </div>
                <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  Datos pendientes (confirmados)
                </div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color:
                      familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length > 0
                        ? C.wax
                        : C.ink,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
                </div>
                <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  Invitaciones pendientes
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Pendientes de avisar
              </p>
              {colaboradoresPendientes.length === 0 ? (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Ninguno — todos los colaboradores están al día.
                </p>
              ) : (
                <div className="space-y-2">
                  {colaboradoresPendientes.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                      style={{ background: "#FBEAEC" }}
                    >
                      <span className="text-sm" style={{ color: C.ink }}>
                        {c.nombre}
                        {!c.email && (
                          <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                        )}
                      </span>
                      <button
                        onClick={() => setAvisoPreview({ id: c.id, nombre: c.nombre })}
                        disabled={!c.email}
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          background: c.email ? C.wax : C.line,
                          color: c.email ? "#fff" : C.charcoal,
                        }}
                      >
                        Avisar ahora
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Emails enviados
              </p>
              <div className="flex gap-2 mb-2">
                {[
                  { clave: "todos", etiqueta: "Todos" },
                  { clave: "colaborador", etiqueta: "Datos (colaboradores)" },
                  { clave: "familia", etiqueta: "Invitaciones" },
                ].map((op) => (
                  <button
                    key={op.clave}
                    onClick={() => setFiltroTipoAviso(op.clave)}
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: filtroTipoAviso === op.clave ? C.ink : "transparent",
                      color: filtroTipoAviso === op.clave ? C.paper : C.charcoal,
                      border: `1px solid ${filtroTipoAviso === op.clave ? C.ink : C.line}`,
                    }}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
              {(() => {
                const emailsFiltrados = avisosEnviados.filter(
                  (a) => filtroTipoAviso === "todos" || a.tipo === filtroTipoAviso
                );
                return emailsFiltrados.length === 0 ? (
                  <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                    {avisosEnviados.length === 0
                      ? "Todavía no se ha enviado ningún aviso."
                      : "Ninguno de este tipo todavía."}
                  </p>
                ) : (
                  <div className="space-y-1" style={{ maxHeight: 320, overflowY: "auto" }}>
                    {emailsFiltrados.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 text-xs py-1"
                      style={{ borderBottom: `1px solid ${C.line}` }}
                    >
                      <span style={{ color: C.ink }}>{a.asunto}</span>
                      <span style={{ color: C.charcoal, opacity: 0.7 }}>{a.destinatario}</span>
                      <span style={{ color: C.charcoal, opacity: 0.5 }} className="whitespace-nowrap">
                        {new Date(a.creadoEn).toLocaleString("es-ES")}
                      </span>
                    </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: `2px solid ${C.line}` }}>
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Invitaciones a familias
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                    {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pendientes</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
                    {familiasListasParaInvitacion.filter((f) => f.invitacionEnviada).length}
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Enviadas</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                    {
                      familiasListasParaInvitacion.filter(
                        (f) => !f.invitacionEnviada && !f.confirmados[0]?.email
                      ).length
                    }
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Sin email</div>
                </div>
              </div>
              {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length === 0 ? (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Ninguna familia lista con la invitación pendiente de enviar.
                </p>
              ) : (
                <div className="space-y-2">
                  {familiasListasParaInvitacion
                    .filter((f) => !f.invitacionEnviada)
                    .map((f) => (
                      <div
                        key={f.clave}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                        style={{ background: "#FBEAEC" }}
                      >
                        <span className="text-sm" style={{ color: C.ink }}>
                          Familia {f.apellido}
                          {!f.confirmados[0]?.email && (
                            <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                          )}
                        </span>
                        <button
                          onClick={() => abrirPreviewInvitacion(f)}
                          disabled={!f.confirmados[0]?.email || descargando === f.clave}
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{
                            background: f.confirmados[0]?.email ? C.wax : C.line,
                            color: f.confirmados[0]?.email ? "#fff" : C.charcoal,
                          }}
                        >
                          {descargando === f.clave ? "Generando…" : "Enviar ahora"}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Versiones */}
      {abierto.versiones && (
        <VentanaFlotante clave="versiones" titulo="Versiones" onCerrar={() => toggle("versiones")}>
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
      )}

      {avisoPreview && (
        <ModalFlotante
          titulo={`Avisar a ${avisoPreview.nombre}`}
          onCerrar={() => setAvisoPreview(null)}
        >
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Colaborador
          </p>
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {avisoPreview.nombre}
            {" — "}
            {colaboradores.find((c) => c.id === avisoPreview.id)?.email || "sin email"}
          </p>
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitados asignados ({invitados.filter((g) => g.colaboradorId === avisoPreview.id).length}
            {" "}en total)
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {invitados
              .filter((g) => g.colaboradorId === avisoPreview.id)
              .map((g) => (
                <li key={g.id}>
                  {g.apellido}, {g.nombre}
                  {g.avisoPendiente && g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.wax, color: "#fff" }}
                    >
                      nuevo — se incluye en el email
                    </span>
                  )}
                  {g.avisoPendiente && !g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.line, color: C.charcoal }}
                    >
                      tentativa — no se avisa todavía
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mensaje que se enviará
          </p>
          <div
            className="p-3 rounded text-sm mb-4"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
            dangerouslySetInnerHTML={{
              __html: (evento.plantillaAsignacion || "").replace(
                "{colaborador}",
                avisoPreview.nombre
              ),
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioAvisoPreview}
              disabled={enviandoAvisoPreview}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisoPreview ? "Enviando…" : "Aceptar y enviar"}
            </button>
            <button
              onClick={() => setAvisoPreview(null)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
            <button
              onClick={irAEditarAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.gold}`, color: C.gold }}
            >
              Editar asignación
            </button>
          </div>
        </ModalFlotante>
      )}

      {previewInvitacion && (
        <ModalFlotante
          titulo={`Enviar invitación — Familia ${previewInvitacion.familia.apellido}`}
          onCerrar={() => setPreviewInvitacion(null)}
        >
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Destinatario
          </p>
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {previewInvitacion.destinatario.nombre} — {previewInvitacion.destinatario.email}
          </p>
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitación
          </p>
          <img
            src={previewInvitacion.dataUrl}
            alt="Vista previa de la invitación"
            className="rounded mb-3"
            style={{ maxWidth: "100%", border: `1px solid ${C.line}` }}
          />
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mensaje del email
          </p>
          <div
            className="p-3 rounded text-sm mb-4"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
            dangerouslySetInnerHTML={{ __html: evento.plantillaInvitacionFamilia || "" }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioInvitacion}
              disabled={enviandoInvitacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoInvitacion ? "Enviando…" : "Aceptar y enviar"}
            </button>
            <button
              onClick={() => setPreviewInvitacion(null)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}

      {mostrarResumenLoteInvitaciones && (
        <ModalFlotante
          titulo={`Enviar invitaciones — ${
            colaboradores.find((c) => c.id === colaboradorInvitacionSel)?.nombre || ""
          }`}
          onCerrar={() => setMostrarResumenLoteInvitaciones(false)}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Revisa antes de enviar — se manda un email por familia, cada una con su propia
            invitación adjunta:
          </p>
          <ul className="text-sm space-y-2 mb-4">
            {familiasPendientesDeEnviar.map((familia) => {
              const destinatario = familia.confirmados[0];
              return (
                <li key={familia.clave} className="pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                    Familia {familia.apellido}
                  </div>
                  <div style={{ color: C.charcoal, opacity: 0.8 }}>
                    {familia.confirmados.map((m) => m.nombre).join(", ")} —{" "}
                    {familia.confirmados.length} confirmado
                    {familia.confirmados.length === 1 ? "" : "s"}, todos con pago hecho
                  </div>
                  {destinatario?.email ? (
                    <div className="text-xs" style={{ color: C.ink }}>
                      Se enviará a: {destinatario.nombre} — {destinatario.email}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: C.wax }}>
                      ⚠ Sin email — esta familia se saltará
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioLoteInvitaciones}
              disabled={enviandoLoteInvitaciones}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoLoteInvitaciones
                ? "Enviando…"
                : `Confirmar y enviar ${familiasPendientesDeEnviar.length} invitaciones`}
            </button>
            <button
              onClick={() => setMostrarResumenLoteInvitaciones(false)}
              disabled={enviandoLoteInvitaciones}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}

      {mostrarResumenAsignacion && (
        <ModalFlotante
          titulo="Resumen de asignaciones"
          onCerrar={() => setMostrarResumenAsignacion(false)}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Estos colaboradores tienen invitados nuevos asignados. ¿Quieres avisarles ya?
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {colaboradoresPendientes.map((c) => (
              <li key={c.id}>
                {c.nombre}
                {!c.email && (
                  <span style={{ color: C.wax }}> — sin email, no se le podrá avisar</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={enviarAvisosAsignacion}
              disabled={enviandoAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisosAsignacion ? "Enviando…" : "Enviar avisos"}
            </button>
            <button
              onClick={() => setMostrarResumenAsignacion(false)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Seguir editando
            </button>
            <button
              onClick={cancelarAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.wax}`, color: C.wax }}
            >
              Cancelar (no avisar)
            </button>
          </div>
        </ModalFlotante>
      )}

      {panelFlotante && panelFlotante !== "avisosMesas" && (
        <ModalFlotante
          titulo={
            panelFlotante === "tabla"
              ? "Lista de invitados"
              : panelFlotante === "canciones"
              ? `Canciones para bailar — ${evento.nombre || "Evento"}`
              : `⚠ Alergias — ${evento.nombre || "Evento"}`
          }
          colorTitulo={panelFlotante === "alergias" ? C.wax : C.ink}
          onCerrar={() => setPanelFlotante(null)}
          acciones={
            <>
              <button
                onClick={imprimirPanelActivo}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.ink, color: C.paper }}
              >
                <Printer size={14} /> Imprimir
              </button>
              <button
                onClick={exportarPanelActivoCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                <Copy size={14} /> Exportar CSV
              </button>
              <span className="text-xs ml-auto" style={{ color: C.charcoal, opacity: 0.6 }}>
                Si no se abre el diálogo de impresión, usa Cmd/Ctrl+P.
              </span>
            </>
          }
        >
          <div id="zona-imprimible">
            {panelFlotante === "tabla" && (
              <>
                <div
                  className="text-xs mb-2"
                  style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Edad media de los asistentes:{" "}
                  <strong style={{ color: C.ink }}>
                    {edadPromedio(invitadosOrdenados, evento) ?? "— (faltan años de nacimiento)"}
                    {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
                  </strong>
                </div>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Grupo familiar</span>
                  <span>Zona</span>
                  <span>Colaborador</span>
                  <span>Mesa</span>
                  <span>Confirmado</span>
                  <span>Pagado</span>
                </div>
                {invitadosOrdenados.map((g, i) => {
                  const col = resolverColaborador(g, colaboradores);
                  return (
                    <div
                      key={g.id}
                      className="grid px-2 py-1.5 text-sm"
                      style={{
                        gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{g.grupoFamiliar || g.apellido || "—"}</span>
                      <span>{g.zona || "—"}</span>
                      <span>{col ? col.nombre : "—"}</span>
                      <span>{g.mesa ?? "—"}</span>
                      <span>{g.confirmado ? "Sí" : "Tentativa"}</span>
                      <span>{g.confirmado ? (g.pagado ? "Sí" : "No") : "—"}</span>
                    </div>
                  );
                })}
                {invitadosOrdenados.length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Ningún invitado coincide con los filtros aplicados.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "canciones" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Edad</span>
                  <span>Canción</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter((g) => g.cancion && g.cancion.trim())).map(
                  (g, i) => (
                    <div
                      key={g.id}
                      className="grid px-2 py-2 text-sm"
                      style={{
                        gridTemplateColumns: "1.5fr 0.6fr 2fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{calcularEdad(g.anioNacimiento, evento) ?? "—"}</span>
                      <span>{g.cancion}</span>
                    </div>
                  )
                )}
                {invitados.filter((g) => g.cancion && g.cancion.trim()).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado una canción.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "alergias" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.wax,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Mesa</span>
                  <span>Alergia</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g, i) => (
                  <div
                    key={g.id}
                    className="grid px-2 py-2 text-sm"
                    style={{
                      gridTemplateColumns: "1.5fr 0.6fr 2fr",
                      background: i % 2 ? "#FBEAEA" : "#fff",
                      color: C.charcoal,
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      {g.apellido}, {g.nombre}
                    </span>
                    <span>{g.mesa ?? "—"}</span>
                    <span style={{ color: C.wax }}>{g.alergias}</span>
                  </div>
                ))}
                {invitados.filter(tieneAlergiaReal).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado alergias.
                  </p>
                )}
              </>
            )}
          </div>
        </ModalFlotante>
      )}

      {panelFlotante === "avisosMesas" && (
        <ModalFlotante
          titulo="⚠ Familias sin mesa completa"
          colorTitulo={C.wax}
          onCerrar={() => setPanelFlotante(null)}
        >
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
            La auto-asignación nunca reparte un grupo familiar entre mesas por su cuenta.
            Estas familias se han quedado (total o parcialmente) sin mesa — sube la capacidad
            de alguna mesa, mueve gente a mano, o vuelve a pulsar "Auto-asignar" tras
            ajustarlo. Cuando ya no queden avisos, la distribución está completa.
          </p>
          <div className="space-y-2">
            {avisosMesas.map((a, i) => (
              <div
                key={i}
                className="p-2 rounded text-sm"
                style={{ background: "#FBEAEA", border: `1px solid ${C.wax}`, color: C.charcoal }}
              >
                <strong style={{ color: C.wax }}>Familia {a.grupo}</strong>: {a.motivo}
              </div>
            ))}
          </div>
        </ModalFlotante>
      )}
    </div>
  );
}

// ---------- Colaborador view ----------

const ETIQUETAS_CAMPOS_INVITADO = {
  anioNacimiento: "Año de nacimiento",
  anioBoda: "Año de boda",
  email: "Email",
  cancion: "Canción",
  alergias: "Alergias",
  observaciones: "Observaciones",
};

function FormularioDatos({
  invitado,
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  importe,
  onCerrar,
  colaboradorVinculado,
}) {
  const [form, setForm] = useState(invitado);
  const [foto, setFoto] = useState(fotoFamiliar || "");
  // Ninguna casilla marcada por defecto: si no se ha tocado nada, "alergias"
  // se queda vacío de verdad (no cuenta como respondido en "datos X de 7"
  // hasta que el colaborador marque algo, aunque sea "No" explícitamente).
  const parsearAlergias = (texto) => {
    const partes = (texto || "").split(",").map((s) => s.trim()).filter(Boolean);
    return {
      no: partes.includes("No"),
      gluten: partes.includes("Gluten"),
      lactosa: partes.includes("Lactosa"),
      otras: partes.find((p) => p !== "No" && p !== "Gluten" && p !== "Lactosa") || "",
    };
  };
  const [alergiaSel, setAlergiaSel] = useState(() => parsearAlergias(invitado.alergias));
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [aviso, setAviso] = useState("");
  const avisoTimeout = useRef(null);
  useEffect(() => setForm(invitado), [invitado.id]);
  useEffect(() => setFoto(fotoFamiliar || ""), [fotoFamiliar, invitado.id]);
  useEffect(() => setAlergiaSel(parsearAlergias(invitado.alergias)), [invitado.id]);
  useEffect(() => () => clearTimeout(avisoTimeout.current), []);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    clearTimeout(avisoTimeout.current);
    avisoTimeout.current = setTimeout(() => setAviso(""), 3000);
  };

  // Cada campo se guarda solo al salir de él (igual que el resto de la
  // app) — sin botón "Guardar". El aviso dice exactamente qué campo(s)
  // cambiaron, o "Sin cambios" si el valor era el mismo de antes.
  const revisarYGuardar = (formActualizado) => {
    const cambiados = Object.keys(ETIQUETAS_CAMPOS_INVITADO).filter(
      (campo) => (formActualizado[campo] || "") !== (invitado[campo] || "")
    );
    if (cambiados.length === 0) {
      mostrarAviso("Sin cambios.");
      return;
    }
    onGuardar(formActualizado);
    mostrarAviso(`Guardado: ${cambiados.map((c) => ETIQUETAS_CAMPOS_INVITADO[c]).join(", ")}.`);
  };

  const guardarFoto = (nuevaFoto) => {
    if ((nuevaFoto || "") === (fotoFamiliar || "")) {
      mostrarAviso("Sin cambios.");
      return;
    }
    if (onCambiarFotoFamiliar) onCambiarFotoFamiliar(invitado.grupoFamiliar, nuevaFoto);
    mostrarAviso(nuevaFoto ? "Guardado: foto familiar." : "Foto familiar eliminada.");
  };

  const onSeleccionarArchivoFoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const dataUrl = await redimensionarImagenArchivo(file);
      setFoto(dataUrl);
      guardarFoto(dataUrl);
    } catch (_) {
      setErrorFoto("No se ha podido procesar la imagen. Prueba con otra o pega un enlace.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const reconstruirAlergias = (sel) => {
    if (sel.no) return "No";
    const partes = [];
    if (sel.gluten) partes.push("Gluten");
    if (sel.lactosa) partes.push("Lactosa");
    if (sel.otras.trim()) partes.push(sel.otras.trim());
    return partes.join(", ");
  };

  const marcarNo = () => {
    const next = { no: true, gluten: false, lactosa: false, otras: "" };
    setAlergiaSel(next);
    const actualizado = { ...form, alergias: reconstruirAlergias(next) };
    setForm(actualizado);
    revisarYGuardar(actualizado);
  };
  const alternarAlergia = (clave) => {
    const next = { ...alergiaSel, no: false, [clave]: !alergiaSel[clave] };
    setAlergiaSel(next);
    const actualizado = { ...form, alergias: reconstruirAlergias(next) };
    setForm(actualizado);
    revisarYGuardar(actualizado);
  };
  const cambiarOtras = (valor) => {
    const texto = valor.slice(0, 15);
    const next = { ...alergiaSel, no: false, otras: texto };
    setAlergiaSel(next);
    setForm({ ...form, alergias: reconstruirAlergias(next) });
  };

  return (
    <div
      className="p-3 rounded space-y-3"
      style={{ background: "#fff", border: `1px solid ${C.line}` }}
    >
      <p className="text-xs font-bold" style={{ color: C.wax }}>
        * campos obligatorios (año nacimiento y alergias)
      </p>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {form.apellido}, {form.nombre}
          </span>
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            datos {contarDatosRellenados(form, foto)} de {TOTAL_DATOS_INVITADO}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ border: `1px solid ${C.line}`, color: C.charcoal, opacity: 0.8 }}
            title="Importe calculado según edad y los precios de Configuración"
          >
            € {importe.toFixed(2)}
          </span>
          <button
            onClick={onCerrar}
            className="ml-auto px-4 py-2 rounded text-sm font-semibold"
            style={{ background: C.ink, color: C.paper }}
          >
            Cerrar
          </button>
        </div>
        <div className="text-xs mt-1" style={{ color: C.charcoal, opacity: 0.6 }}>
          Familia {invitado.grupoFamiliar || form.apellido} · {form.zona || "sin zona"}
        </div>
      </div>
      {aviso && (
        <span
          className="inline-block text-xs px-2 py-0.5 rounded"
          style={{ background: C.ink, color: C.paper }}
        >
          {aviso}
        </span>
      )}
      <Field label="Email">
        {colaboradorVinculado ? (
          <div>
            <div
              className="w-full px-2 py-1.5 rounded text-sm"
              style={{ background: C.paperDark, color: C.charcoal, opacity: 0.7 }}
            >
              {colaboradorVinculado.email || "sin registrar"}
            </div>
            <span className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Se edita en Colaboradores, no aquí.
            </span>
          </div>
        ) : (
          <TextInput
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => revisarYGuardar(form)}
            placeholder="correo@ejemplo.com"
            className="w-full"
          />
        )}
      </Field>
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <Field label="Año nac. *">
            <TextInput
              value={form.anioNacimiento}
              onChange={(e) => setForm({ ...form, anioNacimiento: e.target.value })}
              onBlur={() => revisarYGuardar(form)}
              placeholder="1988"
              maxLength={4}
              style={{ width: 90 }}
            />
          </Field>
          <Field label="Año boda">
            <TextInput
              value={form.anioBoda}
              onChange={(e) => setForm({ ...form, anioBoda: e.target.value })}
              onBlur={() => revisarYGuardar(form)}
              placeholder="2015"
              maxLength={4}
              style={{ width: 90 }}
            />
          </Field>
          <Field label="Foto boda">
            <div className="flex items-center gap-2 flex-wrap">
              {foto && (
                <img
                  src={foto}
                  alt="Foto de familia"
                  className="rounded object-cover"
                  style={{ width: 32, height: 32, border: `1px solid ${C.line}` }}
                />
              )}
              <label
                className="text-xs px-2 py-1 rounded cursor-pointer"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                {subiendoFoto ? "Procesando…" : "Subir foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSeleccionarArchivoFoto}
                  disabled={subiendoFoto}
                  style={{ display: "none" }}
                />
              </label>
              {foto && (
                <button
                  type="button"
                  onClick={() => {
                    setFoto("");
                    guardarFoto("");
                  }}
                  className="text-xs"
                  style={{ color: C.wax }}
                >
                  Quitar
                </button>
              )}
            </div>
            {errorFoto && (
              <p className="text-xs" style={{ color: C.wax }}>
                {errorFoto}
              </p>
            )}
          </Field>
        </div>
      </div>
      <Field label="Canción">
        <TextInput
          value={form.cancion}
          onChange={(e) => setForm({ ...form, cancion: e.target.value })}
          onBlur={() => revisarYGuardar(form)}
          placeholder="Título — Artista"
          className="w-full"
        />
      </Field>
      <Field label="Observaciones">
        <TextInput
          value={form.observaciones || ""}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          onBlur={() => revisarYGuardar(form)}
          placeholder="Cualquier detalle adicional"
          className="w-full"
        />
      </Field>
      <div>
        <span
          className="text-xs uppercase block mb-1"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Alergias *
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm" style={{ color: C.charcoal }}>
            <input type="checkbox" checked={alergiaSel.no} onChange={marcarNo} />
            No
          </label>
          <label className="flex items-center gap-1 text-sm" style={{ color: C.charcoal }}>
            <input
              type="checkbox"
              checked={alergiaSel.gluten}
              onChange={() => alternarAlergia("gluten")}
            />
            Gluten
          </label>
          <label className="flex items-center gap-1 text-sm" style={{ color: C.charcoal }}>
            <input
              type="checkbox"
              checked={alergiaSel.lactosa}
              onChange={() => alternarAlergia("lactosa")}
            />
            Lactosa
          </label>
          <TextInput
            value={alergiaSel.otras}
            onChange={(e) => cambiarOtras(e.target.value)}
            onBlur={() => revisarYGuardar(form)}
            placeholder="Otra (máx. 15)"
            maxLength={15}
            style={{ maxWidth: 140 }}
          />
        </div>
      </div>
    </div>
  );
}

function FilaInvitadoColaborador({
  g,
  abierto,
  onToggleAbierto,
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  onMarcarPagado,
  evento,
  fotosFamiliares,
  colaboradorVinculado,
}) {
  const importe = importeEsperadoInvitado(g, evento);

  // Confirmación siempre (marcar Y quitar): con todas las filas cerradas muy
  // juntas, el pulgar puede tocar el botón de pago de un invitado equivocado
  // por error — así hay una última comprobación antes de que cuente.
  const confirmarPago = () => {
    const nombreCompleto = `${g.nombre} ${g.apellido}`.trim();
    if (!g.pagado && !datosCompletos(g)) {
      window.alert(
        `No se puede marcar a ${nombreCompleto} como pagado todavía: faltan sus datos obligatorios (año de nacimiento y alergias).`
      );
      return;
    }
    const mensaje = g.pagado
      ? `¿Quitar el pago de ${nombreCompleto}?`
      : `¿Marcar a ${nombreCompleto} como pagado?`;
    if (window.confirm(mensaje)) {
      onMarcarPagado(g.id, !g.pagado);
    }
  };

  return (
    <div className="rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex flex-wrap items-center gap-3 p-3 text-sm">
        {!abierto && (
          <button onClick={confirmarPago} className="flex items-center gap-1">
            {g.pagado ? (
              <Stamp color={C.ink}>Pagado</Stamp>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
              >
                Pendiente de pago
              </span>
            )}
          </button>
        )}
        {datosCompletos(g) ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: C.ink, opacity: 0.7 }}>
            <Check size={12} /> datos {contarDatosRellenados(g, fotoFamiliar)} de {TOTAL_DATOS_INVITADO}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs" style={{ color: C.wax }}>
            <Bell size={12} /> datos {contarDatosRellenados(g, fotoFamiliar)} de {TOTAL_DATOS_INVITADO}
          </span>
        )}
        <button
          onClick={onToggleAbierto}
          className="flex items-center gap-2 ml-auto"
          style={{ color: C.ink }}
        >
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
            {g.apellido}, {g.nombre}
          </span>
          <span className="text-xs" style={{ color: C.gold }}>
            {abierto ? "▾" : "▸"}
          </span>
        </button>
      </div>
      {abierto && (
        <div className="p-3 pt-0">
          <FormularioDatos
            invitado={g}
            onGuardar={onGuardar}
            fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
            onCambiarFotoFamiliar={onCambiarFotoFamiliar}
            importe={importe}
            onCerrar={onToggleAbierto}
            colaboradorVinculado={colaboradorVinculado}
          />
        </div>
      )}
    </div>
  );
}

function VistaColaborador({ data, colaboradorId }) {
  const { colaboradores, invitados, persistInvitados, fotosFamiliares, persistFotosFamiliares, evento } = data;
  const colaborador = colaboradores.find((c) => c.id === colaboradorId);
  const [abiertoId, setAbiertoId] = useState(null);
  // Mientras un invitado está abierto, se queda fijo en la sección donde
  // estaba al abrirlo (pendiente o completo), aunque sus datos cambien
  // mientras tanto — si no, al rellenar el año de nacimiento saltaría de
  // lista a mitad de edición, cerrando/recreando el formulario de golpe.
  const [pendienteAlAbrir, setPendienteAlAbrir] = useState(null);

  const misInvitados = invitados.filter(
    (g) => resolverColaborador(g, colaboradores)?.id === colaboradorId
  );
  const confirmados = misInvitados.filter((g) => g.confirmado);
  const tentativos = misInvitados.filter((g) => !g.confirmado);
  const esPendiente = (g) =>
    g.id === abiertoId ? pendienteAlAbrir : !datosCompletos(g);
  const pendientes = confirmados.filter(esPendiente);
  const completos = confirmados.filter((g) => !esPendiente(g));
  const pagados = confirmados.filter((g) => g.pagado);
  const noPagados = confirmados.filter((g) => !g.pagado);

  const gruposFamiliaresACargo = [
    ...new Set(misInvitados.map((g) => g.grupoFamiliar || g.apellido).filter(Boolean)),
  ].sort();

  const importeEsperado = confirmados.reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const importeCobrado = pagados.reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const importePendiente = importeEsperado - importeCobrado;

  const guardar = (form) => {
    persistInvitados(invitados.map((g) => (g.id === form.id ? form : g)));
  };

  const cambiarFotoFamiliar = (grupoFamiliar, url) => {
    const clave = grupoFamiliar || "";
    if (!clave) return;
    persistFotosFamiliares({ ...fotosFamiliares, [clave]: url });
  };

  const marcarPagado = (id, pagado) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, pagado } : g)));
  };

  const toggleAbierto = (g) =>
    setAbiertoId((actual) => {
      if (actual === g.id) return null;
      setPendienteAlAbrir(!datosCompletos(g));
      return g.id;
    });

  // El aviso al anfitrión ya no se dispara solo (eso mandaba demasiados
  // emails durante el trabajo normal) — el colaborador lo confirma él
  // mismo cuando de verdad ha terminado, y el servidor vuelve a comprobar
  // que sea cierto antes de enviar nada.
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [enviandoDatos, setEnviandoDatos] = useState(false);
  const [enviandoPagos, setEnviandoPagos] = useState(false);

  const confirmarDatosCompletos = async () => {
    setEnviandoDatos(true);
    const { data, error } = await supabase.rpc("colaborador_confirmar_datos_completos", {
      p_colaborador_id: colaboradorId,
    });
    setEnviandoDatos(false);
    if (error) {
      window.alert("No se pudo avisar al anfitrión. Inténtalo de nuevo.");
      return;
    }
    window.alert(
      data
        ? "Aviso enviado al anfitrión: datos completos."
        : "Todavía faltan invitados confirmados por completar sus datos."
    );
  };

  const confirmarPagosCompletos = async () => {
    setEnviandoPagos(true);
    const { data, error } = await supabase.rpc("colaborador_confirmar_pagos_completos", {
      p_colaborador_id: colaboradorId,
    });
    setEnviandoPagos(false);
    if (error) {
      window.alert("No se pudo avisar al anfitrión. Inténtalo de nuevo.");
      return;
    }
    window.alert(
      data
        ? "Aviso enviado al anfitrión: pagos completos."
        : "Todavía faltan invitados confirmados por pagar."
    );
  };

  if (!colaborador) return null;

  const formatoEuro = (n) => `€ ${n.toFixed(2)}`;

  return (
    <div className="space-y-8">
      <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div
              className="uppercase tracking-wide"
              style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 22 }}
            >
              Colaborador
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 20 }}>
              {colaborador.nombre}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
              Familias asignadas:{" "}
              {gruposFamiliaresACargo.length > 0
                ? gruposFamiliaresACargo.map((g) => `Familia ${g}`).join(", ")
                : "ninguno"}
            </div>
            <div className="text-xs mt-1" style={{ color: C.charcoal, opacity: 0.7 }}>
              Tu email de contacto:{" "}
              {colaborador.email ? (
                <span style={{ color: C.ink }}>{colaborador.email}</span>
              ) : (
                <span style={{ color: C.wax }}>sin registrar — pídeselo al anfitrión</span>
              )}
              <span className="italic ml-1" style={{ opacity: 0.6 }}>
                (solo lo puede cambiar el anfitrión)
              </span>
            </div>
          </div>
          <Seal count={pendientes.length} />
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
              {noPagados.length}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>No pagados</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
              {pagados.length}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pagados</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
              {formatoEuro(importeEsperado)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Importe total esperado</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
              {formatoEuro(importeCobrado)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Ya cobrado</div>
          </div>
          <div className="text-center">
            <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
              {formatoEuro(importePendiente)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Diferencia pendiente</div>
          </div>
        </div>

        <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: `1px solid ${C.line}` }}>
          <button
            onClick={() => setMostrarConfirmar(true)}
            className="px-4 py-2 rounded text-sm font-semibold"
            style={{ background: C.ink, color: C.paper }}
          >
            He terminado mi trabajo
          </button>
        </div>
      </div>

      {mostrarConfirmar && (
        <ModalFlotante titulo="¿Has terminado tu trabajo?" onCerrar={() => setMostrarConfirmar(false)}>
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Revisa el resumen antes de avisar al anfitrión — solo se envía el aviso si de verdad
            está todo completo. Solo cuentan tus invitados ya confirmados.
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            <li>Invitados confirmados: {confirmados.length}</li>
            <li>Con datos completos: {completos.length} de {confirmados.length}</li>
            <li>Con el pago hecho: {pagados.length} de {confirmados.length}</li>
            {tentativos.length > 0 && (
              <li style={{ color: C.charcoal, opacity: 0.7 }}>
                ℹ️ {tentativos.length} en tentativa (sin confirmar) — no cuentan para este aviso.
                Si se confirman más adelante, podrás avisar de nuevo entonces.
              </li>
            )}
          </ul>
          <div className="space-y-2">
            <button
              onClick={confirmarDatosCompletos}
              disabled={enviandoDatos}
              className="w-full px-3 py-2 rounded text-sm font-medium"
              style={{
                background: pendientes.length === 0 && confirmados.length > 0 ? C.ink : C.line,
                color: pendientes.length === 0 && confirmados.length > 0 ? C.paper : C.charcoal,
              }}
            >
              {enviandoDatos ? "Enviando…" : "Confirmar datos completos y avisar"}
            </button>
            <button
              onClick={confirmarPagosCompletos}
              disabled={enviandoPagos}
              className="w-full px-3 py-2 rounded text-sm font-medium"
              style={{
                background: noPagados.length === 0 && confirmados.length > 0 ? C.ink : C.line,
                color: noPagados.length === 0 && confirmados.length > 0 ? C.paper : C.charcoal,
              }}
            >
              {enviandoPagos ? "Enviando…" : "Confirmar pagos completos y avisar"}
            </button>
          </div>
        </ModalFlotante>
      )}

      <section>
        <SectionTitle icon={Bell}>
          Nuevos invitados por completar {pendientes.length > 0 && `(${pendientes.length})`}
        </SectionTitle>
        <div className="space-y-2">
          {ordenarPorApellidoNombre(pendientes).map((g) => (
            <FilaInvitadoColaborador
              key={g.id}
              g={g}
              abierto={abiertoId === g.id}
              onToggleAbierto={() => toggleAbierto(g)}
              onGuardar={guardar}
              fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
              onCambiarFotoFamiliar={cambiarFotoFamiliar}
              onMarcarPagado={marcarPagado}
              evento={evento}
              fotosFamiliares={fotosFamiliares}
              colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
            />
          ))}
          {pendientes.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              No hay avisos pendientes.
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionTitle icon={Check}>Datos completos</SectionTitle>
        <div className="space-y-2">
          {ordenarPorApellidoNombre(completos).map((g) => (
            <FilaInvitadoColaborador
              key={g.id}
              g={g}
              abierto={abiertoId === g.id}
              onToggleAbierto={() => toggleAbierto(g)}
              onGuardar={guardar}
              fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
              onCambiarFotoFamiliar={cambiarFotoFamiliar}
              onMarcarPagado={marcarPagado}
              evento={evento}
              fotosFamiliares={fotosFamiliares}
              colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
            />
          ))}
          {completos.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía ningún invitado con datos completos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------- Red de seguridad ante errores inesperados ----------

// Un Error Boundary tiene que ser una clase (React todavía no ofrece el
// equivalente con hooks) — es el único mecanismo que puede capturar un
// error de renderizado en cualquier parte del árbol y mostrar algo en vez
// de dejar la pantalla completamente en blanco sin explicación.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error inesperado capturado por ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div
          className="max-w-md w-full p-6 rounded-lg text-center"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}
        >
          <h1
            className="text-xl mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}
          >
            Algo ha fallado
          </h1>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: 0.8 }}>
            Ha ocurrido un error inesperado y esta pantalla no se puede seguir mostrando.
            Tus datos están a salvo en la base de datos — nada de esto los afecta. Prueba a
            recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            Recargar la página
          </button>
        </div>
      </div>
    );
  }
}

// ---------- App ----------

export default function App() {
  const urlRol = getRolFromUrl();
  // Se comprueba UNA sola vez si el código del enlace original de la URL
  // es el secreto del anfitrión — independiente de lo que `rol` valga
  // después (que cambia sin tocar la URL cuando el anfitrión previsualiza
  // la vista de un colaborador desde las pestañas de abajo).
  const [esAnfitrionOriginal, setEsAnfitrionOriginal] = useState(null);
  const [rol, setRol] = useState(urlRol || null);
  const data = useLedgerData(rol);

  // Aviso de nueva versión desplegada: al ser una web de una sola página,
  // el navegador se queda con el JS ya cargado aunque Vercel despliegue
  // código nuevo — sin esto, hay que acordarse de recargar a mano cada vez.
  // Se compara el archivo .js que carga esta pestaña con el que carga
  // /index.html ahora mismo (sin caché); si difieren, hay una versión nueva.
  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);
  useEffect(() => {
    const scriptActual = document.querySelector("script[type='module']")?.getAttribute("src");
    if (!scriptActual) return;
    const comprobar = async () => {
      try {
        const res = await fetch("/", { cache: "no-store" });
        const html = await res.text();
        const match = html.match(/<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/);
        if (match && match[1] !== scriptActual) setHayNuevaVersion(true);
      } catch (_) {
        // Sin conexión o fallo de red: no pasa nada, se reintenta luego.
      }
    };
    // Antes solo se comprobaba cada 3 minutos, así que nada más publicar un
    // cambio en Vercel tocaba esperar sin saber si ya había llegado. Ahora
    // se comprueba también nada más cargar la página, y cada minuto.
    comprobar();
    const intervalo = setInterval(comprobar, 60 * 1000);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") comprobar();
    };
    document.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!urlRol) {
        setEsAnfitrionOriginal(false);
        return;
      }
      const { data: esValido } = await supabase.rpc("anfitrion_verificar_token", {
        p_token: urlRol,
      });
      if (!cancelado) setEsAnfitrionOriginal(esValido === true);
    })();
    return () => {
      cancelado = true;
    };
  }, [urlRol]);

  if (!data.loaded || esAnfitrionOriginal === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Fraunces', serif" }}
      >
        Abriendo el libro de invitados…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: C.paper,
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(31,58,46,0.05) 28px)",
      }}
    >
      {hayNuevaVersion && (
        <div
          className="fixed flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: C.ink, color: C.paper, top: 12, right: 12, zIndex: 60, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}
        >
          Versión nueva
          <button
            onClick={() => window.location.reload()}
            className="px-2 py-0.5 rounded font-medium"
            style={{ background: C.paper, color: C.ink }}
          >
            Actualizar
          </button>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {esAnfitrionOriginal ? (
          (() => {
            const pendientesPorColaborador = (id) =>
              data.invitados.filter(
                (g) =>
                  resolverColaborador(g, data.colaboradores)?.id === id &&
                  g.confirmado &&
                  !datosCompletos(g)
              ).length;
            const totalPendientes = data.colaboradores.reduce(
              (s, c) => s + pendientesPorColaborador(c.id),
              0
            );
            // Barra única (no una fila de botones): pensada para el pulgar en
            // móvil grande (iPhone 14 Pro Max de referencia) — bastante alta
            // para tocar bien, y un <select> nativo abre el selector grande
            // del sistema en vez de un menú propio que hay que construir.
            return (
              <select
                value={rol || ""}
                onChange={(e) => setRol(e.target.value)}
                className="w-full mb-6 px-4 rounded font-medium"
                style={{
                  height: 48,
                  fontSize: 16,
                  background: C.ink,
                  color: C.paper,
                  border: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value={urlRol}>
                  Anfitrión{totalPendientes > 0 ? ` (${totalPendientes} pendientes)` : ""}
                </option>
                {data.colaboradores.map((c) => {
                  const pendientes = pendientesPorColaborador(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {pendientes > 0 ? ` (${pendientes} pendientes)` : ""}
                    </option>
                  );
                })}
              </select>
            );
          })()
        ) : urlRol ? (
          <div
            className="text-xs uppercase mb-6 inline-block px-2 py-1 rounded"
            style={{
              color: C.gold,
              border: `1px solid ${C.line}`,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            Vista fija de enlace ·{" "}
            {data.colaboradores.find((c) => c.id === rol)?.nombre || "rol no encontrado"}
          </div>
        ) : null}

        {data.esAnfitrion ? (
          <VistaAnfitrion data={data} />
        ) : data.colaboradores.some((c) => c.id === rol) ? (
          <VistaColaborador data={data} colaboradorId={rol} />
        ) : (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.7 }}>
            Este enlace no es válido o ha caducado. Pide al anfitrión un enlace actualizado.
          </p>
        )}
      </div>
    </div>
  );
}
