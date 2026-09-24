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
import { Check, Mail, Image as ImageIcon, ChevronUp, ChevronDown } from "lucide-react";
import { C, inputStyle, T, OP } from "../../theme";
import { resolverColaborador } from "../../lib/invitados";
import { redimensionarImagenArchivo, guardarArchivoInvitacion, obtenerCarpetaInvitaciones, leerHandleCarpeta } from "../../lib/descargas";
import { guardarImagenEvento, IMAGEN_EVENTO, estaDentroDeLaFicha, pesoEnKB } from "../../lib/imagenesEvento";
import { Field } from "../../components/Formulario";
import { GrupoFamiliarInput } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { Boton, estilosBoton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { avisoEnPantalla } from "../../lib/avisos";

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
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
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

  // Igual que la portada: la que ya estaba dentro de la fila se mueve
  // cuando él lo pulse, no sola.
  const plantillaDentro = estaDentroDeLaFicha(evento.imagenInvitacion);
  const moverPlantillaAlAlmacen = async () => {
    setErrorPlantillaInvitacion("");
    setSubiendoPlantillaInvitacion(true);
    try {
      const url = await guardarImagenEvento(evento.imagenInvitacion, IMAGEN_EVENTO.INVITACION);
      persistEvento({ ...evento, imagenInvitacion: url });
    } catch (_) {
      setErrorPlantillaInvitacion("No se ha podido mover la imagen al almacén.");
    } finally {
      setSubiendoPlantillaInvitacion(false);
    }
  };

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
      // Al ALMACÉN, como la portada: en la fila solo la dirección.
      const url = await guardarImagenEvento(dataUrl, IMAGEN_EVENTO.INVITACION);
      persistEvento({ ...evento, imagenInvitacion: url });
    } catch (_) {
      setErrorPlantillaInvitacion("No se ha podido guardar la imagen. Prueba con otra.");
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
      avisoEnPantalla(
        "Probablemente la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto.",
        "No se ha podido generar la imagen"
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
    avisoEnPantalla(
      saltados.length > 0
        ? `No se pudieron enviar (${saltados.length}):\n${saltados.join("\n")}`
        : "Todas se han enviado.",
      `Enviadas ${enviados} ${enviados === 1 ? "invitación" : "invitaciones"}`
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
        {/* Las tres cifras venían de la ventana "Avisos" (retirada el
            2026-09-05): su bloque "Invitaciones a familias" repetía la
            lista que esta ventana ya tenía, así que se descartó entero
            salvo estos contadores, que aquí sí faltaban. */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {
              etiqueta: "Pendientes",
              valor: familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length,
              alerta: true,
            },
            {
              etiqueta: "Enviadas",
              valor: familiasListasParaInvitacion.filter((f) => f.invitacionEnviada).length,
              alerta: false,
            },
            {
              etiqueta: "Sin email",
              valor: familiasListasParaInvitacion.filter(
                (f) => !f.invitacionEnviada && !destinatarioConEmail(f)?.email
              ).length,
              alerta: true,
            },
          ].map((cifra) => (
            <div key={cifra.etiqueta} className="text-center p-2 rounded" style={{ background: C.paperDark }}>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: cifra.alerta && cifra.valor > 0 ? C.wax : C.ink,
                  fontWeight: 700,
                  fontSize: T.destacado,
                }}
              >
                {cifra.valor}
              </div>
              <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
                {cifra.etiqueta}
              </div>
            </div>
          ))}
        </div>

        {/* ⚠️ Este texto decía "un artefacto de Claude no puede enviar
            correos automáticamente". Era verdad cuando la app vivía
            dentro de un artefacto; desde que es una web con Resend los
            manda ella sola, y aquí mismo hay un botón "Enviar por email".
            Llevaba meses mintiendo (visto por el usuario, 2026-09-23). */}
        <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Solo aparecen aquí las familias en las que <strong>todos</strong> sus confirmados
          ya han pagado. De cada una se genera su imagen, con el apellido familiar y los
          nombres. Puedes enviarla por email desde aquí, o descargarla para mandarla tú
          por WhatsApp.
        </p>
        {/* Plegado (norma: todo plegado y una sola cosa abierta). Es un
            ajuste que se toca una vez y luego estorba: lo que se viene a
            hacer aquí es mandar invitaciones, y esa lista queda debajo. */}
        <SeccionPlegable
          icono={ImageIcon}
          titulo="Plantilla de la invitación"
          resumen={evento.imagenInvitacion ? "imagen puesta" : "sin imagen"}
        >
          <Field label="Imagen de la plantilla de invitación (vertical, para móvil)">
            <div className="flex items-center gap-3 flex-wrap">
              {plantillaDentro && (
                <div
                  className="w-full rounded px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap"
                  style={{ background: C.avisoFondo, border: `1px solid ${C.peligro}` }}
                >
                  <span style={{ color: C.charcoal }}>
                    Esta imagen está guardada <b>dentro de la ficha del evento</b> ({pesoEnKB(evento.imagenInvitacion)} KB).
                    Eso se descarga entero cada vez que alguien abre la app.
                  </span>
                  <Boton variante="principal" tamano="pequeno" onClick={moverPlantillaAlAlmacen} disabled={subiendoPlantillaInvitacion}>
                    {subiendoPlantillaInvitacion ? "Moviendo…" : "Moverla al almacén"}
                  </Boton>
                </div>
              )}
              {evento.imagenInvitacion && (
                <img
                  src={evento.imagenInvitacion}
                  alt="Plantilla de invitación"
                  className="rounded object-cover"
                  style={{ width: 40, height: 60, border: `1px solid ${C.line}` }}
                />
              )}
              <label
                className="boton-3d inline-flex items-center justify-center font-medium cursor-pointer"
                style={estilosBoton("secundario", "pequeno")}
              >
                {subiendoPlantillaInvitacion ? "Procesando…" : "Subir archivo desde el dispositivo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSeleccionarArchivoPlantillaInvitacion}
                  disabled={subiendoPlantillaInvitacion}
                  className="sr-only"
                />
              </label>
              {evento.imagenInvitacion && (
                <Boton
                  tamano="pequeno"
                  onClick={() =>
                    preguntar({
                      titulo: "¿Quitar la plantilla?",
                      texto: "Se usará la plantilla incluida en la app.",
                      rotulo: "Sí, quitarla",
                      alConfirmar: () => persistEvento({ ...evento, imagenInvitacion: "" }),
                    })
                  }
                >
                  Quitar y usar la plantilla incluida
                </Boton>
              )}
            </div>
          </Field>
          {errorPlantillaInvitacion && (
            <p className="text-xs mt-1" style={{ color: C.wax }}>
              {errorPlantillaInvitacion}
            </p>
          )}
        </SeccionPlegable>

        {/* Qué se imprime en la imagen -- a petición del usuario,
            2026-08-27: poder quitar fecha/hora/lugar sueltos sin tener que
            vaciar esos campos en Datos del evento (que también los usa la
            portada y el tablón público). Por defecto los 3 activos --
            "!== false" en vez de comprobar solo el booleano, para que una
            fila de evento sin este dato todavía (antes de pegar el SQL)
            se comporte igual que hoy: mostrando los 3. */}
        <div className="mb-4 flex items-center gap-4 flex-wrap text-xs" style={{ color: C.charcoal }}>
          <span style={{ opacity: OP.secundario }}>Imprimir:</span>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={evento.imprimirFecha !== false}
              onChange={(e) => persistEvento({ ...evento, imprimirFecha: e.target.checked })}
            />
            Fecha
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={evento.imprimirHora !== false}
              onChange={(e) => persistEvento({ ...evento, imprimirHora: e.target.checked })}
            />
            Hora
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={evento.imprimirLugar !== false}
              onChange={(e) => persistEvento({ ...evento, imprimirLugar: e.target.checked })}
            />
            Lugar
          </label>
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
            <Boton variante="secundario" tamano="pequeno" onClick={async () => { const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: true }); setNombreCarpetaInvitaciones(carpeta ? carpeta.name : null); }}>
              {nombreCarpetaInvitaciones ? "Cambiar carpeta" : "Elegir carpeta de guardado"}
            </Boton>
            <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {nombreCarpetaInvitaciones
                ? `Guardando en: "${nombreCarpetaInvitaciones}"`
                : "Sin elegir — se descargará a la carpeta de Descargas de siempre."}
            </span>
          </div>
        )}

        <div className="mb-4 p-4 rounded flex flex-wrap items-end gap-2" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
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
            <Boton
              variante="principal"
              onClick={() => setMostrarResumenLoteInvitaciones(true)}
              disabled={familiasPendientesDeEnviar.length === 0}
            >
              Revisar y enviar a {familiasPendientesDeEnviar.length} familia
              {familiasPendientesDeEnviar.length === 1 ? "" : "s"} (sin enviar todavía)
            </Boton>
          )}
        </div>

        <div className="space-y-2">
          {familiasParaMostrarInvitacion.map((familia) => (
            <div
              key={familia.clave}
              className="p-4 rounded text-sm"
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
                  <Boton variante="principal" tamano="pequeno" onClick={() => descargarInvitacion(familia)} disabled={descargando === familia.clave}>
                    <ImageIcon size={13} />
                    {descargando === familia.clave ? "Generando..." : "Descargar"}
                  </Boton>
                  <Boton
                    variante="principal"
                    tamano="pequeno"
                    icono={Mail}
                    onClick={() => abrirPreviewInvitacion(familia)}
                    disabled={descargando === familia.clave}
                  >
                    {descargando === familia.clave ? "Generando..." : "Enviar por email"}
                  </Boton>
                </div>
              </div>
              <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: OP.secundario }}>
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
                        <Boton
                          tamano="pequeno"
                          icono={ChevronUp}
                          titulo="Mover antes"
                          onClick={() => moverNombreFamilia(familia, m.id, -1)}
                          disabled={i === 0}
                        />
                        <Boton
                          tamano="pequeno"
                          icono={ChevronDown}
                          titulo="Mover después"
                          onClick={() => moverNombreFamilia(familia, m.id, 1)}
                          disabled={i === familia.confirmados.length - 1}
                        />
                        <div className="flex-1">
                          {colaboradorVinculado ? (
                            <div
                              className="px-2 py-1 rounded"
                              style={{ background: C.paperDark, color: C.charcoal, opacity: OP.secundario }}
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
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {colaboradorInvitacionSel
                ? "Este colaborador no tiene ninguna familia con el pago y la mesa completos todavía."
                : "Todavía ninguna familia tiene el pago completo y la mesa asignada para todos sus confirmados."}
            </p>
          )}
        </div>
        {ventanaPregunta}
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
                  <div style={{ color: C.charcoal, opacity: OP.secundario }}>
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
            <Boton variante="principal" onClick={confirmarEnvioLoteInvitaciones} disabled={enviandoLoteInvitaciones}>
              {enviandoLoteInvitaciones
                ? "Enviando…"
                : `Confirmar y enviar ${familiasPendientesDeEnviar.length} invitaciones`}
            </Boton>
            <Boton variante="secundario" onClick={() => setMostrarResumenLoteInvitaciones(false)} disabled={enviandoLoteInvitaciones}>
              Cancelar
            </Boton>
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
