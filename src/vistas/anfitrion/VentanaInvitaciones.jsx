// Ventana "Invitaciones": plantilla de imagen, modo calibración, carpeta
// de guardado, envío por bloques (elige un colaborador y revisa antes de
// mandar) y la lista de familias listas con su orden de nombres y email.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 4).
//
// El motor de "enviar la invitación a UNA familia" (familiasListasParaInvitacion,
// destinatarioConEmail, descargando, abrirPreviewInvitacion, y el propio
// modal de vista previa) sigue en VistaAnfitrion porque la ventana Avisos
// también lo usa — moverlo aquí lo habría duplicado en dos sitios.
// generarImagenParaFamilia y modoCalibracion tampoco son exclusivos de
// esta ventana por el mismo motivo.
import { useState, useEffect } from "react";
import { Check, Mail, Image as ImageIcon } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { resolverColaborador } from "../../lib/invitados";
import { redimensionarImagenArchivo, guardarArchivoInvitacion, obtenerCarpetaInvitaciones, leerHandleCarpeta } from "../../lib/descargas";
import { Field } from "../../components/Formulario";
import { GrupoFamiliarInput } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";

export function VentanaInvitaciones({
  data,
  familiasListasParaInvitacion,
  destinatarioConEmail,
  descargando,
  setDescargando,
  abrirPreviewInvitacion,
  generarImagenParaFamilia,
  modoCalibracion,
  setModoCalibracion,
  marcarInvitacionEnviada,
  onCerrar,
}) {
  const { evento, colaboradores, invitados, persistEvento, persistInvitados, enviarInvitacionFamilia } = data;

  const [nombreCarpetaInvitaciones, setNombreCarpetaInvitaciones] = useState(null);
  const [subiendoPlantillaInvitacion, setSubiendoPlantillaInvitacion] = useState(false);
  const [errorPlantillaInvitacion, setErrorPlantillaInvitacion] = useState("");

  useEffect(() => {
    if (!window.showDirectoryPicker) return;
    leerHandleCarpeta()
      .then((handle) => setNombreCarpetaInvitaciones(handle ? handle.name : null))
      .catch(() => {});
  }, []);

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

  const asignarEmailInvitado = (id, email) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, email } : g)));
  };

  const moverNombreFamilia = (familia, invitadoId, direccion) => {
    const ids = familia.confirmados.map((m) => m.id);
    const idx = ids.indexOf(invitadoId);
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= ids.length) return;
    const nuevosIds = [...ids];
    [nuevosIds[idx], nuevosIds[nuevoIdx]] = [nuevosIds[nuevoIdx], nuevosIds[idx]];
    data.persistOrdenFamiliares({
      ...data.ordenFamiliares,
      [familia.clave]: { ...data.ordenFamiliares[familia.clave], orden: nuevosIds },
    });
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
      const destinatario = destinatarioConEmail(familia);
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

  return (
    <>
      <VentanaFlotante
        clave="invitaciones"
        titulo={`Invitaciones${
          familiasListasParaInvitacion.length > 0 ? ` (${familiasListasParaInvitacion.length})` : ""
        }`}
        onCerrar={onCerrar}
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
                {(() => {
                  const idDestinatario = destinatarioConEmail(familia)?.id;
                  return familia.confirmados.map((m, i) => {
                    // Si esta persona es también colaborador, su email se
                    // edita solo en Colaboradores (igual que en su propio
                    // formulario de datos) — aquí se muestra de solo
                    // lectura, no un campo editable que parecería vacío.
                    const colaboradorVinculado = colaboradores.find(
                      (c) => c.invitadoId === m.id
                    );
                    return (
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
                          {colaboradorVinculado ? (
                            <div
                              className="px-2 py-1 rounded"
                              style={{ background: C.paperDark, color: C.charcoal, opacity: 0.7 }}
                              title="Se edita en Colaboradores, no aquí"
                            >
                              {colaboradorVinculado.email || "sin registrar"}
                            </div>
                          ) : (
                            <GrupoFamiliarInput
                              value={m.email || ""}
                              onCommit={(v) => asignarEmailInvitado(m.id, v)}
                            />
                          )}
                        </div>
                        {m.id === idDestinatario && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                            style={{ background: C.paperDark, color: C.charcoal }}
                          >
                            destinatario
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
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
              const destinatario = destinatarioConEmail(familia);
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
    </>
  );
}
