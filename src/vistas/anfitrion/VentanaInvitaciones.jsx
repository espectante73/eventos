// Ventana "Invitaciones": envío (por bloques: elige un colaborador y revisa
// antes de mandar; o una a una), con la lista de familias listas, su orden
// de nombres y su email; y los ajustes: plantilla, qué se imprime,
// calibración y carpeta de guardado. Desde v90.6, con el modelo de
// Contabilidad: apartados plegados, uno abierto a la vez.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 4).
//
// El motor de "enviar la invitación a UNA familia" (familiasListasParaInvitacion,
// destinatariosConEmail, descargando, abrirPreviewInvitacion, y el propio
// modal de vista previa) sigue en VistaAnfitrion porque la ventana Avisos
// también lo usa — moverlo aquí lo habría duplicado en dos sitios.
// generarImagenParaFamilia y modoCalibracion tampoco son exclusivos de
// esta ventana por el mismo motivo.
import { useState, useEffect, useRef } from "react";
import { Check, Image as ImageIcon, ChevronUp, ChevronDown, ChevronRight, Download, Send, Printer, Grid3x3, FolderOpen, Hourglass } from "lucide-react";
import { C, T, OP } from "../../theme";
import { resolverColaborador, comoColaborador, ENVIO_BLOQUEADO } from "../../lib/invitados";
import { nombreCompleto } from "../../lib/formato";
import { requisitosActivos } from "../../lib/modoPruebas";
import { redimensionarImagenArchivo, guardarArchivoInvitacion, obtenerCarpetaInvitaciones, leerHandleCarpeta } from "../../lib/descargas";
import { guardarImagenEvento, IMAGEN_EVENTO } from "../../lib/imagenesEvento";
import { Desplegable, ElegirSiNo } from "../../components/Formulario";
import { GrupoFamiliarInput, RecuadroCifras } from "../../components/Widgets";
import { IconoMovilQr } from "../../components/IconoMovilQr";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad, BotonQuitar } from "../../components/PreguntaSeguridad";
import { avisoEnPantalla } from "../../lib/avisos";
import { LineaAviso } from "../../components/LineaAviso";
import { colaboradoresSinDj } from "../../lib/equipoColaboradores";

// La columna del nombre en el orden de la invitación: cabe «Apellido, Nombre»
// normal en un móvil; uno muy largo se recorta y se lee entero al pasar.
const ANCHO_NOMBRE = 110;
// Una familia, una línea (norma 6): todas del mismo alto, con dedo.
const ALTO_FILA = 40;
const ALTO_FILA_NOMBRE = 34;
// «Qué se imprime»: rótulo y Sí/No en una línea, en columna.
const ANCHO_ROTULO = 70;
const ANCHO_SI_NO = 140;
// El color de cada motivo de «No listas» (v90.9): el dinero, en el dorado de
// la pastilla del importe; la mesa, rojo lleno con letra blanca (él, v91);
// sin confirmar, rojo suave; «No asiste(n)» ya es una respuesta, en gris.
const COLOR_MOTIVO = {
  pago: { background: C.champanClaro, color: C.champanTinta },
  mesa: { background: C.peligro, color: C.blanco },
  confirmar: { background: C.avisoFondo, color: C.peligro },
  // Con borde: en las filas alternas, un fondo gris se perdería.
  noAsiste: { border: `1px solid ${C.line}`, color: C.charcoal },
};
const IMPRIMIBLES = [
  { campo: "imprimirFecha", etiqueta: "Fecha" },
  { campo: "imprimirHora", etiqueta: "Hora" },
  { campo: "imprimirLugar", etiqueta: "Lugar" },
];

export function VentanaInvitaciones({
  data,
  familiasListasParaInvitacion,
  // Las que aún no tienen invitación, con su motivo (v90.8).
  familiasNoListas = [],
  destinatariosConEmail,
  enviarATodos,
  descargando,
  setDescargando,
  abrirPreviewInvitacion,
  generarImagenParaFamilia,
  modoCalibracion,
  setModoCalibracion,
  marcarInvitacionEnviada,
  // Hasta «Acomodación terminada», no se envía (v90.7, lib/invitados.js).
  envioBloqueado = false,
  onCerrar,
}) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const { evento, colaboradores, invitados, persistEvento, persistInvitados } = data;

  const [nombreCarpetaInvitaciones, setNombreCarpetaInvitaciones] = useState(null);
  const [subiendoPlantillaInvitacion, setSubiendoPlantillaInvitacion] = useState(false);
  const [errorPlantillaInvitacion, setErrorPlantillaInvitacion] = useState("");
  const inputPlantillaRef = useRef(null);

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
    if (dataUrl === undefined) return; // ya se ha avisado
    if (!dataUrl) {
      avisoEnPantalla(
        "Probablemente la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto.",
        "No se ha podido generar la imagen"
      );
      return;
    }
    const nombreArchivo = `${evento.nombre || "evento"}_${familia.clave}.png`.replace(/[\\/:*?"<>|]/g, "-");
    const carpeta = await guardarArchivoInvitacion(dataUrl, nombreArchivo);
    // Lo que pasa fuera de la pantalla avisa al terminar, y dónde está (norma 9).
    avisoEnPantalla(carpeta ? `Está en la carpeta «${carpeta}».` : "Está en la carpeta de Descargas.", `Invitación de la familia ${familia.apellido} guardada`);
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
      // A todos los de la familia con email (v83.2). En Modo Pruebas el
      // correo va al anfitrión: no se salta a nadie.
      const correos = destinatariosConEmail(familia);
      if (!correos.length && requisitosActivos(evento)) {
        saltados.push(`${familia.apellido} (sin email)`);
        continue;
      }
      const dataUrl = await generarImagenParaFamilia(familia);
      if (!dataUrl) {
        saltados.push(`${familia.apellido} (no se pudo generar la imagen)`);
        continue;
      }
      const base64 = dataUrl.split(",")[1] || "";
      const { enviados: salidos, fallidos } = await enviarATodos(correos, evento.plantillaInvitacionFamilia || "", base64);
      if (salidos.length) {
        enviados++;
        marcarInvitacionEnviada(familia.clave);
        if (fallidos.length) saltados.push(`${familia.apellido} (no ha llegado a ${fallidos.join(", ")})`);
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

  // Una sola cosa abierta (norma 5): un apartado, y dentro de «Enviar»,
  // una familia.
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const alternar = (id) => setSeccionAbierta((s) => (s === id ? null : id));
  const [familiaAbierta, setFamiliaAbierta] = useState(null);

  const sinEmail = (familia) => destinatariosConEmail(familia).filter(Boolean).length === 0;
  const faltan = familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length;
  const enviadas = familiasListasParaInvitacion.length - faltan;
  const sinEmailPendientes = familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada && sinEmail(f)).length;
  const queSeImprime = IMPRIMIBLES.filter((x) => evento[x.campo] !== false).map((x) => x.etiqueta);

  return (
    <>
      <VentanaFlotante
        clave="invitaciones"
        titulo="Invitaciones"
        onCerrar={onCerrar}
        // Arriba, las cifras (venían de la ventana "Avisos", retirada el
        // 2026-09-05), con el recuadro de la Lista y de Mesas (v90.6).
        extra={
          <RecuadroCifras
            cifras={[
              // Faltan + Enviadas + No listas = las familias de la Lista (él,
              // v90.8: «no me cuadran los números»). Las cuatro, aunque en el
              // móvil la última se vea deslizando (él lo eligió así).
              { label: "Faltan", value: faltan, alerta: faltan > 0, titulo: "Familias listas y sin invitación enviada" },
              { label: "Enviadas", value: enviadas },
              { label: "Sin email", value: sinEmailPendientes, alerta: sinEmailPendientes > 0, titulo: "Familias sin enviar que no tienen ningún email" },
              { label: "No listas", value: familiasNoListas.length, titulo: "Familias sin confirmados, o con alguno sin pagar o sin mesa" },
            ]}
          />
        }
      >
        {/* Remodelada en v90.6 (él: «no sigue los principios básicos de la
            app»), con el modelo de Contabilidad: todo plegado, un apartado
            abierto a la vez y su resumen a la vista. */}
        <div className="space-y-2">
          <SeccionPlegable
            icono={IconoMovilQr}
            titulo="Enviar"
            resumen={
              familiasListasParaInvitacion.length === 0
                ? "ninguna lista"
                : faltan === 0
                  ? "todas enviadas"
                  : [envioBloqueado && "bloqueado", `${faltan} sin enviar`, sinEmailPendientes > 0 && `${sinEmailPendientes} sin email`].filter(Boolean).join(" · ")
            }
            abierta={seccionAbierta === "enviar"}
            onAlternar={() => alternar("enviar")}
          >
            {envioBloqueado && (
              <LineaAviso className="text-sm mt-2">
                {ENVIO_BLOQUEADO} Se puede descargar para revisar, pero no enviar.
              </LineaAviso>
            )}
            {/* Envío por bloques: se elige un colaborador y solo se ven y
                envían las familias de sus invitados, con un resumen antes de
                mandar nada, para no arriesgarse a un envío masivo por error. */}
            <div className="flex items-center gap-2 mt-2 mb-2 zurdo:flex-row-reverse">
              <Desplegable
                aria-label="Colaborador"
                value={colaboradorInvitacionSel}
                onChange={(e) => setColaboradorInvitacionSel(e.target.value)}
              >
                <option value="">Todos</option>
                {colaboradoresSinDj(colaboradores, invitados).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Desplegable>
              {colaboradorInvitacionSel && (
                <Boton
                  variante="principal"
                  icono={Send}
                  onClick={() => setMostrarResumenLoteInvitaciones(true)}
                  disabled={envioBloqueado || familiasPendientesDeEnviar.length === 0}
                  titulo={envioBloqueado ? ENVIO_BLOQUEADO : "Solo las que aún no tienen la invitación; antes se revisa"}
                >
                  Enviar a {familiasPendientesDeEnviar.length}
                </Boton>
              )}
            </div>
            {familiasParaMostrarInvitacion.length > 0 ? (
              <div className="rounded overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                {familiasParaMostrarInvitacion.map((familia, i) => {
                  const abierta = familiaAbierta === familia.clave;
                  const fondo = i % 2 ? C.paperDark : C.blanco;
                  const generando = descargando === familia.clave;
                  return (
                    <div key={familia.clave} style={{ background: fondo }}>
                      {/* Una línea por familia, todas del mismo alto (norma 6). */}
                      <div className="flex items-center gap-2 px-2 text-sm" style={{ height: ALTO_FILA }}>
                        <button
                          type="button"
                          onClick={() => setFamiliaAbierta(abierta ? null : familia.clave)}
                          aria-expanded={abierta}
                          className="flex items-center gap-1 flex-1 min-w-0 text-left"
                          style={{ color: C.ink, minHeight: ALTO_FILA }}
                          title="Orden de los nombres y emails"
                        >
                          {abierta ? <ChevronDown size={16} className="flex-shrink-0" /> : <ChevronRight size={16} className="flex-shrink-0" />}
                          <span className="truncate" style={{ fontWeight: 600 }}>
                            {familia.apellido}
                          </span>
                          <span className="whitespace-nowrap flex-shrink-0" style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno }}>
                            · {familia.confirmados.length}
                          </span>
                        </button>
                        {familia.invitacionEnviada ? (
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded flex-shrink-0"
                            style={{ background: C.ink, color: C.goldClaro }}
                            title={familia.invitacionEnviadaEn ? new Date(familia.invitacionEnviadaEn).toLocaleString("es-ES") : undefined}
                          >
                            <Check size={12} /> Enviada
                          </span>
                        ) : (
                          sinEmail(familia) && (
                            <span className="text-xs flex-shrink-0" style={{ color: C.wax }}>
                              Sin email
                            </span>
                          )
                        )}
                        <Boton tamano="pequeno" icono={Download} titulo="Descargar la invitación" onClick={() => descargarInvitacion(familia)} disabled={generando} />
                        <Boton
                          tamano="pequeno"
                          variante="principal"
                          icono={Send}
                          titulo={envioBloqueado ? ENVIO_BLOQUEADO : familia.invitacionEnviada ? "Enviar otra vez por email" : "Enviar por email"}
                          onClick={() => abrirPreviewInvitacion(familia)}
                          disabled={generando || envioBloqueado}
                        />
                      </div>
                      {abierta && (
                        <div className="px-2 pb-2">
                          {familia.confirmados.map((m, k) => {
                            // Si esta persona es también colaborador, su email se
                            // edita solo en Colaboradores (igual que en su propio
                            // formulario de datos): aquí se ve, sin poder cambiarlo.
                            const colaboradorVinculado = comoColaborador(m, colaboradores);
                            return (
                              <div key={m.id} className="flex items-center gap-2 text-xs" style={{ height: ALTO_FILA_NOMBRE, borderTop: `1px solid ${C.line}` }}>
                                {/* «Apellido, Nombre» (norma 15), con ancho fijo: las
                                    flechas caen en la misma columna en todas (norma 6). */}
                                <span className="truncate flex-shrink-0" style={{ color: C.ink, width: ANCHO_NOMBRE }} title={nombreCompleto(m)}>
                                  {nombreCompleto(m)}
                                </span>
                                <Boton tamano="pequeno" icono={ChevronUp} titulo="Mover antes" onClick={() => moverNombreFamilia(familia, m.id, -1)} disabled={k === 0} />
                                <Boton
                                  tamano="pequeno"
                                  icono={ChevronDown}
                                  titulo="Mover después"
                                  onClick={() => moverNombreFamilia(familia, m.id, 1)}
                                  disabled={k === familia.confirmados.length - 1}
                                />
                                <div className="flex-1 min-w-0">
                                  {colaboradorVinculado ? (
                                    <span
                                      className="block truncate"
                                      style={{ color: colaboradorVinculado.email ? C.charcoal : C.wax, opacity: colaboradorVinculado.email ? OP.secundario : 1 }}
                                      title="Se cambia en Colaboradores"
                                    >
                                      {colaboradorVinculado.email || "sin email"}
                                    </span>
                                  ) : (
                                    // El email, en su ficha: el mismo de la Lista (él, v90.6:
                                    // «deja poder corregir aquí»).
                                    <GrupoFamiliarInput
                                      aria-label={`Email de ${nombreCompleto(m)}`}
                                      type="email"
                                      inputMode="email"
                                      placeholder="sin email"
                                      value={m.email || ""}
                                      onCommit={(v) => asignarEmailInvitado(m.id, v)}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-xs pt-1" style={{ color: C.charcoal, opacity: OP.secundario }}>
                            Las flechas cambian el orden de los nombres en la invitación. El email se guarda en la ficha de cada uno.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                {colaboradorInvitacionSel
                  ? "Este colaborador no tiene ninguna familia con el pago y la mesa completos todavía."
                  : "Todavía ninguna familia tiene el pago completo y la mesa asignada para todos sus confirmados."}
              </p>
            )}
          </SeccionPlegable>

          {/* Las que aún no (v90.8): una línea por familia y por qué. */}
          <SeccionPlegable
            icono={Hourglass}
            titulo="No listas"
            resumen={familiasNoListas.length === 0 ? "ninguna" : `${familiasNoListas.length} ${familiasNoListas.length === 1 ? "familia" : "familias"}`}
            abierta={seccionAbierta === "noListas"}
            onAlternar={() => alternar("noListas")}
          >
            {familiasNoListas.length > 0 ? (
              <div className="rounded overflow-hidden mt-2" style={{ border: `1px solid ${C.line}` }}>
                {familiasNoListas.map((familia, i) => (
                  <div key={familia.clave} className="flex items-center gap-2 px-2 text-sm" style={{ height: ALTO_FILA, background: i % 2 ? C.paperDark : C.blanco }}>
                    <span className="truncate flex-1 min-w-0" style={{ color: C.ink, fontWeight: 600 }}>
                      {familia.apellido}
                      <span className="whitespace-nowrap" style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno, fontWeight: 400 }}>
                        {" "}· {familia.miembros}
                      </span>
                    </span>
                    {familia.motivos.map((m) => (
                      <span key={m.tipo} data-motivo={m.tipo} className="text-xs px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0" style={COLOR_MOTIVO[m.tipo]}>
                        {m.texto}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
                Todas las familias tienen ya su invitación lista.
              </p>
            )}
          </SeccionPlegable>

          {/* Un ajuste que se toca una vez y luego estorba. */}
          <SeccionPlegable
            icono={ImageIcon}
            titulo="Plantilla"
            resumen={evento.imagenInvitacion ? "imagen puesta" : "la incluida"}
            abierta={seccionAbierta === "plantilla"}
            onAlternar={() => alternar("plantilla")}
          >
            <div className="flex items-center gap-3 mt-2 zurdo:flex-row-reverse">
              {evento.imagenInvitacion && (
                <img
                  src={evento.imagenInvitacion}
                  alt="Plantilla de invitación"
                  className="rounded object-cover"
                  style={{ width: 48, height: 72, border: `1px solid ${C.line}` }}
                />
              )}
              {/* Antes de elegir el archivo, la pregunta del sello: la app
                  no lo dibuja (CLAUDE.md 1.11), así que una plantilla sin
                  él saca invitaciones sin "PAGADO". */}
              <Boton
                disabled={subiendoPlantillaInvitacion}
                onClick={() =>
                  preguntar({
                    titulo: "¿Lleva el sello PAGADO?",
                    texto: "La plantilla DEBE traer dibujado el sello PAGADO, rojo y arriba a la izquierda. La app no lo añade.",
                    rotulo: "Sí",
                    peligro: false,
                    alConfirmar: () => inputPlantillaRef.current?.click(),
                  })
                }
              >
                {subiendoPlantillaInvitacion ? "Procesando…" : evento.imagenInvitacion ? "Cambiar imagen" : "Subir imagen"}
              </Boton>
              <input ref={inputPlantillaRef} type="file" accept="image/*" onChange={onSeleccionarArchivoPlantillaInvitacion} className="sr-only" />
              {evento.imagenInvitacion && (
                <BotonQuitar
                  titulo="Quitar la plantilla"
                  pregunta={{ titulo: "¿Quitar la plantilla?", texto: "Se usará la plantilla incluida en la app.", rotulo: "Sí" }}
                  onClick={() => persistEvento({ ...evento, imagenInvitacion: "" })}
                />
              )}
            </div>
            {errorPlantillaInvitacion && <LineaAviso className="text-xs mt-2">{errorPlantillaInvitacion}</LineaAviso>}
            <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Vertical, para móvil, y con el sello PAGADO ya dibujado.
            </p>
          </SeccionPlegable>

          {/* Qué se imprime en la imagen (él, 2026-08-27): quitar fecha, hora
              o lugar sin vaciarlos en Datos del evento, que también los usan
              la portada y el tablón. "!== false": sin el dato, los tres. */}
          <SeccionPlegable
            icono={Printer}
            titulo="Qué se imprime"
            resumen={queSeImprime.length ? queSeImprime.join(" · ") : "solo los nombres"}
            abierta={seccionAbierta === "imprimir"}
            onAlternar={() => alternar("imprimir")}
          >
            <div className="space-y-2 mt-2">
              {IMPRIMIBLES.map((x) => (
                <div key={x.campo} className="flex items-center gap-3 text-sm">
                  <span style={{ width: ANCHO_ROTULO, color: C.ink }}>{x.etiqueta}</span>
                  <div style={{ width: ANCHO_SI_NO }}>
                    <ElegirSiNo
                      etiqueta={`Imprimir ${x.etiqueta.toLowerCase()}`}
                      valor={evento[x.campo] !== false}
                      onCambiar={(si) => persistEvento({ ...evento, [x.campo]: si })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SeccionPlegable>

          <SeccionPlegable
            icono={Grid3x3}
            titulo="Calibración"
            resumen={modoCalibracion ? "encendida" : "apagada"}
            abierta={seccionAbierta === "calibracion"}
            onAlternar={() => alternar("calibracion")}
          >
            <div className="flex items-center gap-3 text-sm mt-2">
              <span style={{ color: C.ink }}>Cuadrícula</span>
              <div style={{ width: ANCHO_SI_NO }}>
                <ElegirSiNo etiqueta="Cuadrícula de calibración" valor={modoCalibracion} onCambiar={setModoCalibracion} />
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Dibuja sobre la invitación una cuadrícula con sus coordenadas (cada 5 % del ancho y del alto), para ajustar dónde va el texto. Se descarga o se previsualiza una, y al terminar se apaga.
            </p>
          </SeccionPlegable>

          {/* Solo donde el navegador deja elegir carpeta (el Mac). */}
          {window.showDirectoryPicker && (
            <SeccionPlegable
              icono={FolderOpen}
              titulo="Carpeta"
              resumen={nombreCarpetaInvitaciones ? `«${nombreCarpetaInvitaciones}»` : "Descargas"}
              abierta={seccionAbierta === "carpeta"}
              onAlternar={() => alternar("carpeta")}
            >
              <div className="flex items-center gap-3 mt-2 zurdo:flex-row-reverse">
                <Boton
                  onClick={async () => {
                    const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: true });
                    setNombreCarpetaInvitaciones(carpeta ? carpeta.name : null);
                  }}
                >
                  {nombreCarpetaInvitaciones ? "Cambiar carpeta" : "Elegir carpeta"}
                </Boton>
              </div>
              <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
                {nombreCarpetaInvitaciones
                  ? `Las invitaciones descargadas se guardan en «${nombreCarpetaInvitaciones}».`
                  : "Sin elegir, se guardan en la carpeta de Descargas de siempre."}
              </p>
            </SeccionPlegable>
          )}
        </div>

        {/* La ayuda, al pie y plegada (norma 5). El primer párrafo, escrito
            por él palabra por palabra. La invitación va solo por email: no
            añadir otras vías. */}
        <details className="text-xs mt-3" style={{ color: C.charcoal }}>
          <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
            Cómo funciona
          </summary>
          <p className="mt-2" style={{ opacity: OP.secundario }}>
            Cuando han pagado, genera la invitación familiar con su mesa ya asignada. Se envía al email de la familia registrado en la app.
          </p>
          <p className="mt-2" style={{ opacity: OP.secundario }}>
            «Enviar a…» manda, de las familias de ese colaborador, solo las que aún no tienen la invitación, y antes enseña la lista para revisarla. Las ya enviadas se pueden mandar otra vez, una a una.
          </p>
        </details>
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
              const correos = destinatariosConEmail(familia).filter(Boolean);
              return (
                <li key={familia.clave} className="pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                    Familia {familia.apellido}
                  </div>
                  <div style={{ color: C.charcoal, opacity: OP.secundario }}>
                    {familia.confirmados.map(nombreCompleto).join(" · ")} —{" "}
                    {familia.confirmados.length} confirmado
                    {familia.confirmados.length === 1 ? "" : "s"}, todos con pago hecho
                  </div>
                  {correos.length ? (
                    <div className="text-xs" style={{ color: C.ink }}>
                      Se enviará a: {correos.join(", ")}
                    </div>
                  ) : (
                    <LineaAviso className="text-xs">
                      Sin email — esta familia se saltará
                    </LineaAviso>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Boton variante="principal" onClick={confirmarEnvioLoteInvitaciones} disabled={enviandoLoteInvitaciones || envioBloqueado}>
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
