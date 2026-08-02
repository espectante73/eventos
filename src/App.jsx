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

const VERSION_APP = "4.0";

// Versiones anteriores ya cerradas (números enteros completos): un resumen
// breve por versión mayor, en vez de listar cada sub-versión — ocupa menos
// espacio en la sección "Versiones".
const RESUMEN_VERSIONES_ANTERIORES = [
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

const HISTORIAL_VERSIONES = [
  {
    version: "4.0",
    cambios:
      "Migración a una web real: los datos ya no viven en este Artifact sino en una base de datos compartida (Supabase), con web propia (Vite) desplegada automáticamente desde GitHub. El aislamiento entre colaboradores (cada uno solo ve sus invitados asignados) ahora se cumple en el propio servidor, no solo en la pantalla.",
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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(31,25,15,0.55)", zIndex: 50 }}
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

function Portada({ evento, editable, onChange }) {
  const [form, setForm] = useState(evento);
  const [mostrarImagenInput, setMostrarImagenInput] = useState(false);
  useEffect(() => setForm(evento), [evento]);

  const commit = () => onChange(form);

  return (
    <div
      className="rounded-lg overflow-hidden mb-8"
      style={{ border: `1px solid ${C.line}`, background: "#FBF7EC" }}
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
        {editable && (
          <button
            onClick={() => setMostrarImagenInput((v) => !v)}
            className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded z-10"
            style={{ background: "rgba(255,255,255,0.85)", color: C.ink }}
            title="Cambiar imagen del evento"
          >
            <ImageIcon size={13} /> Imagen {mostrarImagenInput ? "▾" : "▸"}
          </button>
        )}
        {editable && mostrarImagenInput && (
          <div
            className="absolute top-10 right-2 p-2 rounded z-10"
            style={{ background: "#fff", border: `1px solid ${C.line}`, width: 260, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
          >
            <Field label="Imagen (URL)">
              <TextInput
                value={form.imagen}
                onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                onBlur={commit}
                placeholder="https://..."
                className="w-full"
              />
            </Field>
            <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.charcoal }}>
              <input
                type="checkbox"
                checked={form.ocultarTituloEnImagen}
                onChange={(e) => {
                  const next = { ...form, ocultarTituloEnImagen: e.target.checked };
                  setForm(next);
                  onChange(next);
                }}
              />
              La imagen ya incluye el título (ocultar el texto superpuesto)
            </label>
          </div>
        )}
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

function ColaboradorCard({ c, pendientes, invitados, colaboradores, evento, onEliminar, onRelevar, onAsignarColaborador, onCambiarEmail }) {
  const [copiado, setCopiado] = useState(false);
  const [relevando, setRelevando] = useState(false);
  const [mostrarAsignados, setMostrarAsignados] = useState(false);
  const [mostrarLink, setMostrarLink] = useState(false);
  const [releveInvitadoId, setReleveInvitadoId] = useState("");

  const asignados = invitados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id);
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
            onCommit={(v) => onCambiarEmail(c.id, v)}
          />
        </div>
        {!c.email && (
          <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.5 }}>
            sin email (no recibirá avisos)
          </span>
        )}
      </div>

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

function envolverTexto(ctx, texto, x, y, maxWidth, lineHeight) {
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
  const inicioY = y - ((lineas.length - 1) * lineHeight) / 2;
  lineas.forEach((l, i) => ctx.fillText(l, x, inicioY + i * lineHeight));
}

function generarInvitacionImagen(evento, apellidoFamilia, nombresMiembros, mesaTexto) {
  return new Promise((resolve) => {
    // Recuadro recalibrado con precisión sobre la plantilla real, con margen
    // interior comprobado (izquierda, derecha, arriba, abajo como fracción
    // del ancho/alto de la imagen)
    const RECUADRO = { left: 0.505, right: 0.96, top: 0.83, bottom: 0.915 };

    const dibujarTextoYResolver = (canvas, ctx) => {
      const W = canvas.width;
      const H = canvas.height;
      const xIzq = RECUADRO.left * W + (RECUADRO.right - RECUADRO.left) * W * 0.04;
      const anchoDisponible = (RECUADRO.right - RECUADRO.left) * W * 0.92;
      const yTop = RECUADRO.top * H;
      const altoRecuadro = (RECUADRO.bottom - RECUADRO.top) * H;

      // Fondo sólido (mismo tono crema del recuadro) para tapar el texto
      // de ejemplo de la plantilla antes de escribir el de verdad encima.
      ctx.fillStyle = "#DEC8B0";
      ctx.fillRect(RECUADRO.left * W, yTop, (RECUADRO.right - RECUADRO.left) * W, altoRecuadro);

      ctx.textAlign = "left";
      ctx.fillStyle = "#1F3A2E";

      ctx.font = `bold ${Math.round(W * 0.033)}px Georgia, serif`;
      envolverTexto(
        ctx,
        `Familia ${apellidoFamilia}: ${nombresMiembros.join(", ")}`,
        xIzq,
        yTop + altoRecuadro * 0.32,
        anchoDisponible,
        Math.round(W * 0.037)
      );

      if (mesaTexto) {
        ctx.font = `bold ${Math.round(W * 0.037)}px Georgia, serif`;
        envolverTexto(
          ctx,
          mesaTexto,
          xIzq,
          yTop + altoRecuadro * 0.8,
          anchoDisponible,
          Math.round(W * 0.041)
        );
      }

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
  const { evento, colaboradores, invitados, mesas, fotosFamiliares, persistEvento, persistColaboradores, persistInvitados, persistMesas, persistFotosFamiliares } = data;

  const [nuevoColab, setNuevoColab] = useState({ invitadoId: "" });
  const [nuevoInvitado, setNuevoInvitado] = useState({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  const [textoImport, setTextoImport] = useState("");
  const [mostrarImport, setMostrarImport] = useState(false);
  const [mostrarAnadir, setMostrarAnadir] = useState(false);
  const [orden, setOrden] = useState({ columna: "invitado", direccion: "asc" });

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
    persistInvitados(
      invitados.map((g) =>
        g.id === id ? { ...g, colaboradorId: colaboradorId || null } : g
      )
    );
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
        "Hola,<br><br>Se te ha asignado <b>{invitado}</b> como invitado.<br>Entra en tu enlace cuando puedas para completar sus datos.",
      plantillaDatosCompletados:
        "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
      plantillaPagoRegistrado:
        "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
    });
    persistColaboradores([]);
    persistInvitados([]);
    persistMesas(Array.from({ length: 15 }, (_, i) => ({ numero: i + 1, capacidad: 10 })));
    persistFotosFamiliares({});
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
    invitados: false,
    configuracion: false,
    invitaciones: false,
    versiones: false,
  });
  const toggle = (clave) => setAbierto((a) => ({ ...a, [clave]: !a[clave] }));
  const [mostrarPeligro, setMostrarPeligro] = useState(false);
  // null | "tabla" | "canciones" | "alergias" | "avisosMesas" — controla la
  // ventana flotante; independiente de qué secciones estén plegadas.
  const [panelFlotante, setPanelFlotante] = useState(null);
  const [avisosMesas, setAvisosMesas] = useState([]);

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

  const familiasListasParaInvitacion = (() => {
    const grupos = {};
    invitados.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      (grupos[clave] = grupos[clave] || []).push(g);
    });
    return Object.entries(grupos)
      .map(([clave, miembros]) => {
        const confirmados = miembros.filter((m) => m.confirmado);
        const apellido = miembros[0].apellido || clave;
        return {
          clave,
          apellido,
          confirmados,
          listaParaInvitacion: confirmados.length > 0 && confirmados.every((m) => m.pagado),
        };
      })
      .filter((f) => f.listaParaInvitacion);
  })();

  const [descargando, setDescargando] = useState(null);

  const descargarInvitacion = async (familia) => {
    setDescargando(familia.clave);
    const nombres = familia.confirmados.map((m) => m.nombre);
    const cantidad = familia.confirmados.length;
    const mesas = [...new Set(familia.confirmados.map((m) => m.mesa).filter(Boolean))];
    const mesaTexto =
      mesas.length === 1
        ? `Mesa ${mesas[0]} · ${cantidad} ${cantidad === 1 ? "persona" : "personas"}`
        : mesas.length > 1
        ? `Mesas ${mesas.join(", ")} · ${cantidad} ${cantidad === 1 ? "persona" : "personas"}`
        : `${cantidad} ${cantidad === 1 ? "persona" : "personas"}`;
    const dataUrl = await generarInvitacionImagen(evento, familia.apellido, nombres, mesaTexto);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `invitacion-${familia.apellido.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      <Portada evento={evento} editable onChange={persistEvento} />

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
      <section>
        <SectionTitle icon={Bell} onToggle={() => toggle("progreso")} abierto={abierto.progreso}>
          Progreso de recopilación
        </SectionTitle>
        {abierto.progreso && (
          <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
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
          </div>
        )}
      </section>

      {/* Colaboradores */}
      <section>
        <SectionTitle icon={Users} onToggle={() => toggle("colaboradores")} abierto={abierto.colaboradores}>
          Colaboradores
        </SectionTitle>
        {abierto.colaboradores && (
          <>
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
                  />
                );
              })}
              {colaboradores.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Aún no hay colaboradores.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Mesas */}
      <section>
        <SectionTitle icon={Users} onToggle={() => toggle("mesas")} abierto={abierto.mesas}>
          Mesas (1–15)
        </SectionTitle>
        {abierto.mesas && (
        <>
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
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {mesas.map((m) => {
            const ocupados = ocupacionMesa(m.numero);
            const lleno = ocupados >= m.capacidad && m.capacidad > 0;
            const tieneAlergias = invitados.some(
              (g) => g.mesa === m.numero && g.confirmado && tieneAlergiaReal(g)
            );
            return (
              <div
                key={m.numero}
                className="p-2 rounded text-center"
                style={{
                  background: "#fff",
                  border: `2px solid ${tieneAlergias ? C.wax : lleno ? C.wax : C.line}`,
                }}
              >
                <div
                  className="text-xs uppercase flex items-center justify-center gap-1"
                  style={{
                    color: lleno || tieneAlergias ? C.wax : C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: lleno || tieneAlergias ? 700 : 400,
                  }}
                >
                  {tieneAlergias && <AlertTriangle size={11} />}
                  Mesa {m.numero}
                </div>
                <input
                  type="number"
                  min={0}
                  value={m.capacidad}
                  onChange={(e) => cambiarCapacidadMesa(m.numero, e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "100%",
                    textAlign: "center",
                    padding: "3px 5px",
                    marginTop: 4,
                  }}
                />
                <div
                  className="text-xs mt-1"
                  style={{ color: lleno ? C.wax : C.charcoal, opacity: 0.75 }}
                >
                  {ocupados}/{m.capacidad}
                </div>
                {tieneAlergias && (
                  <div className="text-xs mt-1" style={{ color: C.wax, fontWeight: 700 }}>
                    ⚠ alergias
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
        )}
      </section>

      {/* Invitados */}
      <section>
        <div
          className="mb-1 pb-2 flex items-center justify-between"
          style={{ borderBottom: `1.5px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggle("invitados")}
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
      <section>
        <SectionTitle
          icon={ImageIcon}
          onToggle={() => toggle("invitaciones")}
          abierto={abierto.invitaciones}
        >
          Invitaciones {familiasListasParaInvitacion.length > 0 && `(${familiasListasParaInvitacion.length})`}
        </SectionTitle>
        {abierto.invitaciones && (
          <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
              Solo aparecen aquí las familias en las que <strong>todos</strong> sus confirmados
              ya han pagado. Genera la imagen (con el apellido familiar y los nombres de los
              integrantes) y descárgala para enviarla tú mismo por WhatsApp o email — un
              artefacto de Claude no puede enviar correos automáticamente.
            </p>
            <div className="mb-4 p-3 rounded" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
              <Field label="Imagen de la plantilla de invitación (vertical, para móvil)">
                <TextInput
                  value={evento.imagenInvitacion || ""}
                  onChange={(e) => persistEvento({ ...evento, imagenInvitacion: e.target.value })}
                  placeholder="https://... (déjalo vacío para usar la plantilla incluida)"
                  className="w-full"
                />
              </Field>
            </div>
            <div className="space-y-2">
              {familiasListasParaInvitacion.map((familia) => (
                <div
                  key={familia.clave}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded text-sm"
                  style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
                >
                  <div>
                    <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                      Familia {familia.apellido}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                      {familia.confirmados.map((m) => m.nombre).join(", ")}
                    </span>
                  </div>
                  <button
                    onClick={() => descargarInvitacion(familia)}
                    disabled={descargando === familia.clave}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: C.ink, color: C.paper, opacity: descargando === familia.clave ? 0.6 : 1 }}
                  >
                    <ImageIcon size={13} />
                    {descargando === familia.clave ? "Generando..." : "Descargar invitación"}
                  </button>
                </div>
              ))}
              {familiasListasParaInvitacion.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Todavía ninguna familia tiene el pago completo.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Copia de seguridad */}
      <section>
        <SectionTitle
          icon={Copy}
          onToggle={() => toggle("copiaSeguridad")}
          abierto={abierto.copiaSeguridad}
        >
          Copia de seguridad
        </SectionTitle>
        {abierto.copiaSeguridad && (
          <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
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
          </div>
        )}
      </section>

      {/* Configuración */}
      <section>
        <SectionTitle
          icon={DollarSign}
          onToggle={() => toggle("configuracion")}
          abierto={abierto.configuracion}
        >
          Configuración
        </SectionTitle>
        {abierto.configuracion && (
          <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
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
            </div>
            <p className="text-xs mb-3 pt-3" style={{ color: C.charcoal, opacity: 0.75, borderTop: `1px solid ${C.line}` }}>
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

            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
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
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Tu email, para recibir avisos automáticos cuando un colaborador complete los
                datos de un invitado o registre un pago.
              </p>
              <Field label="Tu email (anfitrión)">
                <TextInput
                  value={evento.emailAnfitrion || ""}
                  onChange={(e) => persistEvento({ ...evento, emailAnfitrion: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full"
                />
              </Field>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code> y{" "}
                <code>{"{invitado}"}</code> donde quieras que aparezcan esos nombres — se
                rellenan solos al enviar. Admite HTML sencillo (<code>&lt;b&gt;</code>,{" "}
                <code>&lt;br&gt;</code>).
              </p>
              <Field label="Aviso al colaborador: se le asigna un invitado nuevo">
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
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: `2px solid ${C.wax}` }}>
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
            </div>
          </div>
        )}
      </section>

      {/* Versiones */}
      <section>
        <SectionTitle
          icon={Clock}
          onToggle={() => toggle("versiones")}
          abierto={abierto.versiones}
        >
          Versiones
        </SectionTitle>
        {abierto.versiones && (
          <div className="p-4 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
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
                  <p className="text-sm" style={{ color: C.charcoal }}>
                    {v.cambios}
                  </p>
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
          </div>
        )}
      </section>

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
        <TextInput
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onBlur={() => revisarYGuardar(form)}
          placeholder="correo@ejemplo.com"
          className="w-full"
        />
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
}) {
  const importe = importeEsperadoInvitado(g, evento);

  // Confirmación siempre (marcar Y quitar): con todas las filas cerradas muy
  // juntas, el pulgar puede tocar el botón de pago de un invitado equivocado
  // por error — así hay una última comprobación antes de que cuente.
  const confirmarPago = () => {
    const nombreCompleto = `${g.nombre} ${g.apellido}`.trim();
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
      </div>

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {esAnfitrionOriginal ? (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setRol(urlRol)}
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{
                background: data.esAnfitrion ? C.ink : "transparent",
                color: data.esAnfitrion ? C.paper : C.ink,
                border: `1px solid ${C.ink}`,
              }}
            >
              Anfitrión
            </button>
            {data.colaboradores.map((c) => {
              const pendientes = data.invitados.filter(
                (g) =>
                  resolverColaborador(g, data.colaboradores)?.id === c.id &&
                  g.confirmado &&
                  !datosCompletos(g)
              ).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setRol(c.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium"
                  style={{
                    background: rol === c.id ? C.ink : "transparent",
                    color: rol === c.id ? C.paper : C.ink,
                    border: `1px solid ${C.ink}`,
                  }}
                >
                  {c.nombre}
                  {pendientes > 0 && <Seal count={pendientes} />}
                </button>
              );
            })}
          </div>
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
