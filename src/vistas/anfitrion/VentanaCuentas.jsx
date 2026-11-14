// Ventana "Estado de cuentas": recaudado/pendiente de cobro (calculados
// solos a partir de los pagos), recaudado por cada colaborador (con
// acuse desglosado enviado por email), los gastos como hoja de cálculo
// (GastosHoja, v76) y balance. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 4).
import { useState } from "react";
import { Mail, Undo2, Calculator, Users, Receipt } from "lucide-react";
import { C, T, OP } from "../../theme";
import { importeEsperadoInvitado, previstoARecoger } from "../../lib/invitados";
import { fechaCorta, euros, parsePrecio } from "../../lib/formato";
import { entregasDe, porEntregar, itemsDeEntrega, propinasTotales, ordenarPorEntregas } from "../../lib/entregas";
import { construirAsuntoAcuse, construirHtmlAcuse, parrafosAcuse } from "../../lib/acuseRecogida";
import { generarPdfAcuse } from "../../lib/acuseImagen";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { useSeccion } from "../../lib/useSeccion";
import { Cargando } from "../../components/Cargando";
import { GastosHoja, VentanaConceptos } from "./GastosHoja";
import { totalGastos as sumaGastos } from "../../lib/gastos";

// Lo entregado, con la propina si la hubo (v85.9): la misma frase en la
// vista previa y en cada entrega; `corto`, sin «de», para que la línea de
// una entrega quepa entera en el móvil (norma 6).
const conPropina = (importe, propina, { corto = false } = {}) =>
  propina > 0 ? `${euros(importe)} + ${euros(propina)} ${corto ? "" : "de "}propina` : euros(importe);

export function VentanaCuentas({ data, onCerrar }) {
  const {
    evento,
    invitados,
    colaboradores,
    gastos,
    confirmarEntregaColaborador,
    reenviarAcuseColaborador,
    deshacerEntregaColaborador,
  } = data;
  const lista = useSeccion(data, "cuentas");
  // Las tres partes, plegadas y como mucho UNA abierta: la filosofía del
  // tablón, a petición del usuario (2026-09-19). Antes el resumen estaba
  // siempre a la vista y solo las otras dos se plegaban.
  // null | "resumen" | "colaboradores" | "gastos"
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const alternar = (id) => setSeccionAbierta((actual) => (actual === id ? null : id));
  // El colaborador cuya entrega se está confirmando (importe y propina)
  // — null cuando ninguno.
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [importeConfirmar, setImporteConfirmar] = useState("");
  // La propina la escribe él al enviar el acuse (v85.9); vacío = no hubo.
  const [propinaConfirmar, setPropinaConfirmar] = useState("");
  // La entrega cuyo acuse se está reenviando.
  const [enviandoId, setEnviandoId] = useState(null);
  // Vista previa del acuse antes de enviarlo: «Confirmar entrega» y «Probar
  // acuse» no mandan nada directamente; solo se envía al aceptar ahí.
  // { tipo: "confirmar" | "prueba", colaborador, dataUrl, importe, propina,
  // invitadosIds (solo "confirmar"), asunto, html } | null
  const [previewAcuse, setPreviewAcuse] = useState(null);
  const [generandoPreview, setGenerandoPreview] = useState(null); // id del colaborador mientras se genera
  const [enviandoAcuse, setEnviandoAcuse] = useState(false);

  // La lista de conceptos de los gastos, en su ventanita (v76).
  const [verConceptos, setVerConceptos] = useState(false);

  const confirmados = invitados.filter((g) => g.confirmado);
  const recaudado = confirmados
    .filter((g) => g.pagado)
    .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const pendienteCobro = confirmados
    .filter((g) => !g.pagado)
    .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  // Todo gasto apuntado está pagado (él, v76: «si hago el asiento, es que
  // está pagado»): el balance resta todos.
  const totalGastos = sumaGastos(gastos);
  // Las propinas (v85.9, él: «es parte de la contabilidad»), las de todas
  // las entregas (v87); suman al balance.
  const propinas = propinasTotales(colaboradores);
  const balance = recaudado + propinas - totalGastos;
  // Lo que se debería recoger al final (v84.8): confirmados con su edad y
  // los sin confirmar como adultos.
  const previsto = previstoARecoger(invitados, evento).total;
  // Arriba los que tienen algo por entregar; abajo, los que lo han entregado
  // todo (v86.1, v87). Dentro de cada grupo, alfabético.
  const ordenados = ordenarPorEntregas(colaboradores, invitados, evento);

  // Lo cobrado por un colaborador y aún no entregado (lib/entregas.js): el
  // desglose del acuse de la entrega nueva y su importe.
  const pendienteDe = (c) => porEntregar(c, invitados, evento, colaboradores);
  const recaudadoPor = (c) =>
    confirmados.filter((g) => g.colaboradorId === c.id && g.pagado).reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);

  const abrirConfirmar = (c) => {
    setConfirmandoId(c.id);
    setImporteConfirmar(pendienteDe(c).total.toFixed(2));
    setPropinaConfirmar("");
  };

  // Con el número de entrega: dos acuses del mismo colaborador no se pisan.
  const nombreArchivoAcuse = (c, numero) =>
    `acuse-${(c.nombre || "colaborador").replace(/\s+/g, "-").toLowerCase()}-${numero}.pdf`;

  // Genera el PDF y abre la vista previa; el envío real solo pasa si se
  // acepta ahí (confirmarEnvioAcuse, más abajo).
  const abrirPreviewConfirmar = async (c) => {
    const { items } = pendienteDe(c);
    const importe = parseFloat(importeConfirmar.replace(",", ".")) || 0;
    const propina = Math.max(0, parsePrecio(propinaConfirmar));
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items,
      total: importe,
      propina,
      fechaISO: new Date().toISOString().slice(0, 10),
    });
    setGenerandoPreview(null);
    setPreviewAcuse({
      tipo: "confirmar",
      colaborador: c,
      dataUrl,
      importe,
      propina,
      invitadosIds: items.map((it) => it.id),
      asunto: construirAsuntoAcuse(evento),
      html: construirHtmlAcuse({ colaborador: c }),
    });
  };

  // El acuse de una entrega ya hecha, otra vez: sus invitados, su importe,
  // su propina y su fecha.
  const reenviarAcuse = async (c, entrega, numero) => {
    setEnviandoId(entrega.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsDeEntrega(entrega, invitados, evento),
      total: Number(entrega.importe) || 0,
      propina: Number(entrega.propina) || 0,
      fechaISO: String(entrega.fecha).slice(0, 10),
    });
    await reenviarAcuseColaborador(
      c.email,
      construirAsuntoAcuse(evento),
      construirHtmlAcuse({ colaborador: c }),
      nombreArchivoAcuse(c, numero),
      dataUrl.split(",")[1] || ""
    );
    setEnviandoId(null);
  };

  // «Probar acuse»: el de lo que tiene por entregar AHORA, sin apuntar
  // ninguna entrega; también con su vista previa.
  const abrirPreviewProbar = async (c) => {
    const { items, total } = pendienteDe(c);
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items,
      total,
      fechaISO: new Date().toISOString().slice(0, 10),
    });
    setGenerandoPreview(null);
    setPreviewAcuse({
      tipo: "prueba",
      colaborador: c,
      dataUrl,
      asunto: "[PRUEBA] " + construirAsuntoAcuse(evento),
      html: construirHtmlAcuse({ colaborador: c }),
    });
  };

  // Único punto real de envío: al aceptar la vista previa, sea «confirmar»
  // (apunta la entrega) o «prueba» (solo manda el email). El PDF de la
  // vista previa se reutiliza tal cual.
  const confirmarEnvioAcuse = async () => {
    if (!previewAcuse) return;
    setEnviandoAcuse(true);
    const base64 = previewAcuse.dataUrl.split(",")[1] || "";
    const c = previewAcuse.colaborador;
    const numero = entregasDe(c).length + 1;
    if (previewAcuse.tipo === "confirmar") {
      const ok = await confirmarEntregaColaborador(
        c.id,
        previewAcuse.invitadosIds,
        previewAcuse.importe,
        previewAcuse.propina,
        c.email,
        previewAcuse.asunto,
        previewAcuse.html,
        nombreArchivoAcuse(c, numero),
        base64
      );
      setEnviandoAcuse(false);
      if (ok) {
        setConfirmandoId(null);
        setPreviewAcuse(null);
      }
    } else {
      await reenviarAcuseColaborador(c.email, previewAcuse.asunto, previewAcuse.html, nombreArchivoAcuse(c, numero), base64);
      setEnviandoAcuse(false);
      setPreviewAcuse(null);
    }
  };

  return (
    <>
    <VentanaFlotante clave="cuentas" titulo="Contabilidad" onCerrar={onCerrar}>
      {/* Los gastos llegan al abrir la ventana (v72.3): sin ellos, el
          balance y la lista mentirían. */}
      {!lista ? (
        <Cargando />
      ) : (
      <div className="space-y-2">
      <SeccionPlegable
        icono={Calculator}
        titulo="Resumen"
        resumen={`Balance ${euros(balance)}`}
        abierta={seccionAbierta === "resumen"}
        onAlternar={() => alternar("resumen")}
      >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {/* La cantidad final (v84.8), a todo el ancho y ARRIBA (él, v84.9);
            debajo, las otras. Sin texto de explicación al pie: él lo quitó
            por lioso (v84.8). */}
        <div className="p-2 rounded text-center col-span-2 sm:col-span-4" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {euros(previsto)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Previsto a recoger
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {euros(recaudado)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Recaudado
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {euros(propinas)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Propinas
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.charcoal }}>
            {euros(pendienteCobro)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Pendiente de cobro
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.wax }}>
            {euros(totalGastos)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Total gastos
          </div>
        </div>
        {/* El balance, a todo el ancho y abajo (v85.9): con las propinas
            son cuatro casillas, dos y dos en el móvil. */}
        <div
          className="p-2 rounded text-center col-span-2 sm:col-span-4"
          style={{ background: balance >= 0 ? C.okFondo : C.cuidadoFondo, border: `1px solid ${C.line}` }}
        >
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {euros(balance)}
          </div>
          <div className="text-xs uppercase" style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}>
            Balance (recaudado + propinas − gastos)
          </div>
        </div>
      </div>
      </SeccionPlegable>

      <SeccionPlegable
        icono={Users}
        titulo="Recaudado por colaborador"
        resumen={`${colaboradores.length} colaborador${colaboradores.length !== 1 ? "es" : ""}`}
        abierta={seccionAbierta === "colaboradores"}
        onAlternar={() => alternar("colaboradores")}
      >
        <div className="space-y-2 mt-2">
          {ordenados.map((c) => {
            const pendiente = pendienteDe(c);
            const entregas = entregasDe(c);
            return (
              <div key={c.id} className="p-2 rounded space-y-1" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
                <div style={{ color: C.ink, fontWeight: 600 }}>
                  Recaudado por {c.nombre}: {euros(recaudadoPor(c))}
                </div>
                {!c.email && (
                  <div className="text-xs" style={{ color: C.wax }}>
                    Sin email — no se podrá enviar el acuse automáticamente
                  </div>
                )}

                {/* Lo cobrado y aún no entregado (v87): su entrega nueva. */}
                {pendiente.items.length > 0 &&
                  (confirmandoId === c.id ? (
                    // Los campos en una línea y los botones debajo.
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Cada campo con su «€» y su rótulo, juntos (norma 6). */}
                      <span className="inline-flex items-center gap-1">
                        <TextInput
                          value={importeConfirmar}
                          onChange={(e) => setImporteConfirmar(e.target.value)}
                          aria-label="Importe entregado"
                          style={{ width: 80, textAlign: "right" }}
                        />
                        <span className="text-xs" style={{ color: C.charcoal }}>€</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs" style={{ color: C.charcoal }}>+ propina</span>
                        <TextInput
                          value={propinaConfirmar}
                          onChange={(e) => setPropinaConfirmar(e.target.value)}
                          aria-label="Propina"
                          inputMode="decimal"
                          placeholder="0"
                          style={{ width: 56, textAlign: "right" }}
                        />
                        <span className="text-xs" style={{ color: C.charcoal }}>€</span>
                      </span>
                      <Boton variante="principal" tamano="pequeno" onClick={() => abrirPreviewConfirmar(c)} disabled={generandoPreview === c.id}>
                        {generandoPreview === c.id ? "Generando…" : "Revisar y confirmar"}
                      </Boton>
                      <Boton variante="secundario" tamano="pequeno" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </Boton>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2" data-por-entregar>
                      <span className="text-sm" style={{ color: C.wax, fontWeight: 600 }}>
                        Por entregar: {euros(pendiente.total)} ({pendiente.items.length} invitado{pendiente.items.length !== 1 ? "s" : ""})
                      </span>
                      <Boton variante="principal" tamano="pequeno" onClick={() => abrirConfirmar(c)}>
                        Confirmar entrega
                      </Boton>
                      <Boton variante="secundario" tamano="pequeno" onClick={() => abrirPreviewProbar(c)} disabled={generandoPreview === c.id || !c.email} titulo="Ver el acuse de prueba antes de enviarlo, sin apuntar ninguna entrega">
                        <Mail size={13} /> {generandoPreview === c.id ? "Generando…" : "Probar acuse"}
                      </Boton>
                    </div>
                  ))}

                {/* Sus entregas, plegadas: una línea cada una, con su acuse
                    para reenviar. Deshacer, solo la última (la base igual). */}
                {entregas.length > 0 && (
                  <SeccionPlegable sencilla titulo={`Entregas (${entregas.length})`}>
                    <div className="space-y-1 pb-1">
                      {entregas.map((e, i) => {
                        const numero = i + 1;
                        const ultima = i === entregas.length - 1;
                        return (
                          <div key={e.id} className="flex items-center gap-2" data-entrega>
                            {/* El verde ya dice «hecha»: sin visto, cabe entera. */}
                            <span
                              className="flex-1 min-w-0 truncate text-xs px-2 py-1 rounded"
                              style={{ background: C.okFondo, color: C.ink }}
                            >
                              {fechaCorta(String(e.fecha).slice(0, 10))} · {conPropina(Number(e.importe) || 0, Number(e.propina) || 0, { corto: true })}
                            </span>
                            <Boton
                              variante="secundario"
                              tamano="pequeno"
                              icono={Mail}
                              titulo={enviandoId === e.id ? "Enviando…" : "Reenviar el acuse de esta entrega"}
                              onClick={() => reenviarAcuse(c, e, numero)}
                              disabled={enviandoId === e.id || !c.email}
                            />
                            {ultima && (
                              <Boton
                                tamano="pequeno"
                                icono={Undo2}
                                titulo="Deshacer esta entrega (si se confirmó por error)"
                                onClick={() =>
                                  preguntar({
                                    titulo: "¿Deshacer la entrega?",
                                    texto: `Sus invitados volverán a «Por entregar» de ${c.nombre}.`,
                                    rotulo: "Sí",
                                    alConfirmar: () => deshacerEntregaColaborador(c.id, e.id),
                                  })
                                }
                                style={{ color: C.wax }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SeccionPlegable>
                )}
              </div>
            );
          })}
          {colaboradores.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Todavía no hay colaboradores.
            </p>
          )}
          <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Cada entrega manda por email al propio colaborador un acuse con los
            invitados de esa entrega, el importe, la fecha y la firma — para que lo
            guarde como comprobante.
          </p>
        </div>
      </SeccionPlegable>

      <SeccionPlegable
        icono={Receipt}
        titulo="Gastos"
        resumen={`${gastos.length} · ${euros(totalGastos)}`}
        abierta={seccionAbierta === "gastos"}
        onAlternar={() => alternar("gastos")}
      >
      <GastosHoja data={data} onConceptos={() => setVerConceptos(true)} />
      </SeccionPlegable>
      </div>
      )}
      {ventanaPregunta}
    </VentanaFlotante>

    {verConceptos && <VentanaConceptos data={data} onCerrar={() => setVerConceptos(false)} />}

    {previewAcuse && (
      <ModalFlotante
        titulo={
          (previewAcuse.tipo === "confirmar" ? "Confirmar entrega — " : "Probar acuse — ") +
          previewAcuse.colaborador.nombre
        }
        onCerrar={() => setPreviewAcuse(null)}
      >
        <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
          Destinatario
        </p>
        <p className="text-sm mb-3" style={{ color: previewAcuse.colaborador.email ? C.ink : C.wax }}>
          {previewAcuse.colaborador.email || "Sin email — no se podrá enviar"}
        </p>
        {previewAcuse.tipo === "confirmar" && (
          <>
            <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
              Importe a confirmar
            </p>
            <p className="text-sm mb-3" style={{ color: C.ink }}>{conPropina(previewAcuse.importe, previewAcuse.propina)}</p>
          </>
        )}
        {/* El email tal cual llega (v86): su asunto y su texto, de la misma
            pieza que lo envía (parrafosAcuse). */}
        <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
          Texto del email
        </p>
        <div data-texto-email className="text-sm mb-3 p-2 rounded space-y-2" style={{ background: C.blanco, border: `1px solid ${C.line}`, color: C.ink }}>
          <p style={{ fontWeight: 600 }}>{previewAcuse.asunto}</p>
          {parrafosAcuse({ colaborador: previewAcuse.colaborador }).map((parrafo) => (
            <p key={parrafo}>{parrafo}</p>
          ))}
        </div>
        <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
          Acuse (PDF) — revisa que todo esté bien antes de continuar
        </p>
        <iframe
          src={previewAcuse.dataUrl}
          title="Vista previa del acuse"
          className="rounded mb-3"
          style={{ width: "100%", height: 420, border: `1px solid ${C.line}` }}
        />
        <div className="flex flex-wrap gap-2">
          <Boton variante="principal" onClick={confirmarEnvioAcuse} disabled={enviandoAcuse || !previewAcuse.colaborador.email}>
            {enviandoAcuse
              ? "Enviando…"
              : previewAcuse.tipo === "confirmar"
              ? "Aceptar y confirmar"
              : "Aceptar y enviar"}
          </Boton>
          <Boton variante="secundario" onClick={() => setPreviewAcuse(null)}>
            Cancelar
          </Boton>
        </div>
      </ModalFlotante>
    )}
    </>
  );
}
