// Vista del colaborador: formulario de datos de cada invitado asignado,
// fila resumen en la lista, y la vista completa (pendientes/completos,
// aviso al anfitrión al terminar). Movida tal cual desde App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  Mail,
  Music,
  AlertTriangle,
  Bell,
  Cake,
  Heart,
  Image as ImageIcon,
  User,
  ClipboardList,
  Euro,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { MenuFlotante } from "../components/MenuFlotante";
import {
  datosCompletos,
  contarDatosRellenados,
  tieneAlergiaReal,
  TOTAL_DATOS_INVITADO,
  importeEsperadoInvitado,
  resolverColaborador,
} from "../lib/invitados";
import { ordenarPorApellidoNombre } from "../lib/formato";
import { redimensionarImagenArchivo } from "../lib/descargas";
import { C, inputStyle } from "../theme";
import { Seal, Stamp, BarraCompacta, UserSolido } from "../components/Widgets";
import { SectionTitle, Field, TextInput } from "../components/Formulario";
import { ModalFlotante } from "../components/VentanaFlotante";

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
            className="boton-3d boton-verde-solido ml-auto px-4 py-2 rounded-full text-sm font-semibold"
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

export function VistaColaborador({ data, colaboradorId, esAnfitrionOriginal, setRol, anfitrionToken, onCerrarSesion }) {
  const { colaboradores, invitados, persistInvitados, fotosFamiliares, persistFotosFamiliares, evento, ordenFamiliares } = data;
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
  // Solo confirmados: desde el 2026-08-12, colaborador_mis_invitados ya
  // no manda tentativa al navegador del colaborador (ver schema.sql) --
  // este filtro es ahora un no-op de refuerzo, no la barrera real.
  const confirmados = misInvitados.filter((g) => g.confirmado);
  const esPendiente = (g) =>
    g.id === abiertoId ? pendienteAlAbrir : !datosCompletos(g);
  const pendientes = confirmados.filter(esPendiente);
  const completos = confirmados.filter((g) => !esPendiente(g));
  const pagados = confirmados.filter((g) => g.pagado);
  const noPagados = confirmados.filter((g) => !g.pagado);

  // Solo confirmados: los tentativa nunca deben nombrarse al colaborador
  // (mismo criterio que el email de "Tus invitados asignados", ver
  // anfitrion_avisar_colaborador) -- no levantar sospechas sobre la
  // organización antes de tiempo.
  const gruposFamiliaresACargo = [
    ...new Set(confirmados.map((g) => g.grupoFamiliar || g.apellido).filter(Boolean)),
  ].sort();
  const familiasConInvitacion = gruposFamiliaresACargo.filter(
    (f) => ordenFamiliares[f]?.invitacionEnviada
  ).length;

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

  // Bloqueado por el anfitrión durante el Modo Pruebas (ver
  // colaborador_puede_actuar en schema.sql) -- los guardados que intente
  // ya se deshacen solos en pantalla (persistInvitados), pero sin este
  // aviso el mensaje de error genérico ("¿sigue asignado a ti este
  // invitado?") confundiría más de lo que explica.
  const bloqueadoEnPruebas = Boolean(evento.modoPruebasActivo) && colaborador.habilitadoEnPruebas === false;

  return (
    <div className="space-y-8">
      {bloqueadoEnPruebas && (
        <div className="p-3 rounded text-sm font-semibold" style={{ background: "#B00020", color: "#fff" }}>
          🧪 El anfitrión ha activado el Modo Pruebas y te ha dejado fuera por ahora: no podrás
          guardar datos, marcar pagos ni confirmar nada hasta que lo desactive.
        </div>
      )}
      <div className="rounded overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        {/* Cabecera igual que las ventanas de la app (fondo verde, letra
            dorada) -- a petición del usuario. "Apellido, Nombre" en una
            sola línea (colaborador.nombre ya viene así de guardado) en
            vez de "Colaborador" + nombre en dos líneas: gana espacio. */}
        <div className="panel-flotante-cristal flex items-center justify-between px-4 py-3">
          <h3
            className="text-lg"
            style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}
          >
            {colaborador.nombre}
          </h3>
          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="boton-3d flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ color: C.goldClaro }}
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          )}
        </div>

        <div className="p-4" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
              FAMILIAS CONFIRMADAS:{" "}
              {gruposFamiliaresACargo.length > 0
                ? gruposFamiliaresACargo.join(", ")
                : "ninguno"}
            </div>
            {/* Si ya tiene email registrado, no hace falta decir nada aquí
                -- el aviso es solo para cuando falta, a petición del
                usuario (antes se mostraba siempre, con el email delante). */}
            {!colaborador.email && (
              <div className="text-xs mt-1" style={{ color: C.wax }}>
                Sin email de contacto{" "}
                <span className="italic" style={{ opacity: 0.75 }}>
                  (solo lo puede cambiar el anfitrión)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {esAnfitrionOriginal && (
              <MenuFlotante
                anchor="bottom-left"
                opciones={[
                  { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: UserSolido, onClick: () => setRol(anfitrionToken) },
                  ...colaboradores
                    .filter((c) => c.id !== colaboradorId)
                    .map((c) => ({
                      id: `rol-${c.id}`,
                      etiqueta: c.nombre,
                      icono: User,
                      onClick: () => setRol(c.id),
                    })),
                ]}
                render={({ ref, toggle: abrirCerrar }) => (
                  <button
                    ref={ref}
                    onClick={abrirCerrar}
                    className="boton-3d boton-verde-solido flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    title="Estás previsualizando como colaborador — cambia de vista aquí"
                  >
                    Cambiar vista <ChevronDown size={13} style={{ opacity: 0.8 }} />
                  </button>
                )}
              />
            )}
            <Seal count={pendientes.length} />
          </div>
        </div>

        {/* Recuadro más compacto (a petición del usuario): menos margen/
            padding alrededor y letra más pequeña que antes -- mismos
            datos, menos alto ocupado. */}
        {/* 2 filas de 3 recuadros (a petición del usuario): los 5 datos +
            un 6º recuadro con las 3 barras de porcentaje dentro, todos
            del mismo tamaño/estilo -- antes las barras iban aparte,
            debajo, en su propia sección. Textos más cortos (Pendiente,
            Importe total, Cobrado) para que quepan cómodos en un
            recuadro más pequeño. */}
        <div
          className="grid grid-cols-3 gap-1.5 mt-2 pt-2"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 15 }}>
              {noPagados.length}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>No pagados</div>
          </div>
          <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 15 }}>
              {pagados.length}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pagados</div>
          </div>
          <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 15 }}>
              {formatoEuro(importeEsperado)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Importe total</div>
          </div>
          <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 15 }}>
              {formatoEuro(importeCobrado)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Cobrado</div>
          </div>
          <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
            <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 15 }}>
              {formatoEuro(importePendiente)}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pendiente</div>
          </div>
          <div className="h-full rounded p-2 flex flex-col justify-center" style={{ background: C.paperDark }}>
            <BarraCompacta icono={ClipboardList} completado={completos.length} total={confirmados.length} color={C.ink} />
            <BarraCompacta icono={Euro} completado={pagados.length} total={confirmados.length} color={C.gold} />
            <BarraCompacta icono={Mail} completado={familiasConInvitacion} total={gruposFamiliaresACargo.length} color={C.wax} />
          </div>
        </div>

        <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: `1px solid ${C.line}` }}>
          <button
            onClick={() => setMostrarConfirmar(true)}
            className="boton-3d boton-verde-solido px-4 py-2 rounded-full text-sm font-semibold"
          >
            He terminado mi trabajo
          </button>
        </div>
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
          </ul>
          <div className="space-y-2">
            <button
              onClick={confirmarDatosCompletos}
              disabled={enviandoDatos}
              className={
                "w-full px-3 py-2 rounded-full text-sm font-medium" +
                (pendientes.length === 0 && confirmados.length > 0 ? " boton-3d boton-verde-solido" : "")
              }
              style={
                pendientes.length === 0 && confirmados.length > 0
                  ? undefined
                  : { background: C.line, color: C.charcoal }
              }
            >
              {enviandoDatos ? "Enviando…" : "Confirmar datos completos y avisar"}
            </button>
            <button
              onClick={confirmarPagosCompletos}
              disabled={enviandoPagos}
              className={
                "w-full px-3 py-2 rounded-full text-sm font-medium" +
                (noPagados.length === 0 && confirmados.length > 0 ? " boton-3d boton-verde-solido" : "")
              }
              style={
                noPagados.length === 0 && confirmados.length > 0
                  ? undefined
                  : { background: C.line, color: C.charcoal }
              }
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
