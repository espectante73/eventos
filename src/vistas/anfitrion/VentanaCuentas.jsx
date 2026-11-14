// Ventana "Estado de cuentas": recaudado/pendiente de cobro (calculados
// solos a partir de los pagos), recaudado por cada colaborador (con
// acuse desglosado enviado por email), los gastos como hoja de cálculo
// (GastosHoja, v76) y balance. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 4).
import { useState } from "react";
import { Mail, Undo2, Calculator, Users, Receipt, Check } from "lucide-react";
import { C, T, OP } from "../../theme";
import { importeEsperadoInvitado, previstoARecoger, resolverColaborador } from "../../lib/invitados";
import { formatearFecha, ordenarPorApellidoNombre, euros, parsePrecio } from "../../lib/formato";
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
// vista previa y en «Recogido».
const conPropina = (importe, propina) =>
  propina > 0 ? `${euros(importe)} + ${euros(propina)} de propina` : euros(importe);

export function VentanaCuentas({ data, onCerrar }) {
  const {
    evento,
    invitados,
    colaboradores,
    gastos,
    confirmarRecogidaColaborador,
    reenviarAcuseColaborador,
    deshacerRecogidaColaborador,
  } = data;
  const lista = useSeccion(data, "cuentas");
  // Las tres partes, plegadas y como mucho UNA abierta: la filosofía del
  // tablón, a petición del usuario (2026-09-19). Antes el resumen estaba
  // siempre a la vista y solo las otras dos se plegaban.
  // null | "resumen" | "colaboradores" | "gastos"
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const alternar = (id) => setSeccionAbierta((actual) => (actual === id ? null : id));
  // Fila en la que se está editando el importe antes de confirmar la
  // recogida — null cuando ninguna está abierta.
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [importeConfirmar, setImporteConfirmar] = useState("");
  // La propina la escribe él al enviar el acuse (v85.9); vacío = no hubo.
  const [propinaConfirmar, setPropinaConfirmar] = useState("");
  const [enviandoId, setEnviandoId] = useState(null);
  // Vista previa del acuse antes de enviarlo -- "Confirmar recogida" y
  // "Probar acuse" ya no mandan nada directamente: generan el PDF,
  // abren este modal para revisarlo, y solo se envía/confirma de verdad
  // al pulsar "Aceptar" ahí dentro. { tipo: "confirmar" | "prueba",
  // colaborador, dataUrl, importe (solo "confirmar"), asunto, html } | null
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
  // Las propinas (v85.9, él: «es parte de la contabilidad»): las de las
  // recogidas ya confirmadas; suman al balance.
  const propinas = colaboradores.reduce((s, c) => s + (Number(c.dineroRecogidoPropina) || 0), 0);
  // Arriba los que faltan por entregar; con el acuse enviado, abajo (él,
  // v86.1). Dentro de cada grupo, el orden de siempre (alfabético).
  const porRecoger = [...colaboradores].sort((a, b) => Boolean(a.dineroRecogidoEn) - Boolean(b.dineroRecogidoEn));
  const balance = recaudado + propinas - totalGastos;
  // Lo que se debería recoger al final (v84.8): confirmados con su edad y
  // los sin confirmar como adultos.
  const previsto = previstoARecoger(invitados, evento).total;

  // Invitados confirmados y ya pagados de un colaborador — es tanto el
  // desglose del acuse como la base del importe total a confirmar.
  const itemsRecaudadosPorColaborador = (c) =>
    ordenarPorApellidoNombre(
      confirmados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id && g.pagado)
    ).map((g) => ({
      apellido: g.apellido,
      nombre: g.nombre,
      importe: importeEsperadoInvitado(g, evento),
    }));

  const importeRecaudadoPorColaborador = (c) =>
    itemsRecaudadosPorColaborador(c).reduce((s, it) => s + it.importe, 0);

  const abrirConfirmar = (c) => {
    setConfirmandoId(c.id);
    setImporteConfirmar(importeRecaudadoPorColaborador(c).toFixed(2));
    setPropinaConfirmar("");
  };

  const nombreArchivoAcuse = (c) =>
    `acuse-${(c.nombre || "colaborador").replace(/\s+/g, "-").toLowerCase()}.pdf`;

  // Ya no confirma/envía directamente -- genera el PDF y abre la vista
  // previa; el envío real solo pasa si se acepta ahí (ver
  // confirmarEnvioAcuse más abajo).
  const abrirPreviewConfirmar = async (c) => {
    const importe = parseFloat(importeConfirmar.replace(",", ".")) || 0;
    const propina = Math.max(0, parsePrecio(propinaConfirmar));
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
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
      asunto: construirAsuntoAcuse(evento),
      html: construirHtmlAcuse({ colaborador: c }),
    });
  };

  const reenviarAcuse = async (c) => {
    setEnviandoId(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: Number(c.dineroRecogidoImporte) || 0,
      propina: Number(c.dineroRecogidoPropina) || 0,
      fechaISO: String(c.dineroRecogidoEn).slice(0, 10),
    });
    await reenviarAcuseColaborador(
      c.email,
      construirAsuntoAcuse(evento),
      construirHtmlAcuse({ colaborador: c }),
      nombreArchivoAcuse(c),
      dataUrl.split(",")[1] || ""
    );
    setEnviandoId(null);
  };

  // "Probar acuse": genera el acuse con los datos reales de AHORA (sus
  // invitados ya pagados) pero SIN confirmar ni registrar ninguna
  // recogida -- no toca dineroRecogidoEn/Importe, así que no hace falta
  // deshacer nada después. Igual que "Confirmar recogida", ya no manda
  // nada directamente: abre la vista previa primero.
  const abrirPreviewProbar = async (c) => {
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: importeRecaudadoPorColaborador(c),
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

  // Único punto real de envío: se llama al aceptar la vista previa, sea
  // "confirmar" (registra la recogida de verdad) o "prueba" (solo manda
  // el email, sin tocar dineroRecogidoEn/Importe) -- el PDF ya generado
  // para la vista previa se reutiliza tal cual, no se vuelve a construir.
  const confirmarEnvioAcuse = async () => {
    if (!previewAcuse) return;
    setEnviandoAcuse(true);
    const base64 = previewAcuse.dataUrl.split(",")[1] || "";
    if (previewAcuse.tipo === "confirmar") {
      const ok = await confirmarRecogidaColaborador(
        previewAcuse.colaborador.id,
        previewAcuse.importe,
        previewAcuse.propina,
        previewAcuse.colaborador.email,
        previewAcuse.asunto,
        previewAcuse.html,
        nombreArchivoAcuse(previewAcuse.colaborador),
        base64
      );
      setEnviandoAcuse(false);
      if (ok) {
        setConfirmandoId(null);
        setPreviewAcuse(null);
      }
    } else {
      await reenviarAcuseColaborador(
        previewAcuse.colaborador.email,
        previewAcuse.asunto,
        previewAcuse.html,
        nombreArchivoAcuse(previewAcuse.colaborador),
        base64
      );
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
          {porRecoger.map((c) => {
            const importeSuyo = importeRecaudadoPorColaborador(c);
            const recogido = Boolean(c.dineroRecogidoEn);
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 p-2 rounded"
                style={{ background: C.blanco, border: `1px solid ${C.line}` }}
              >
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <div style={{ color: C.ink, fontWeight: 600 }}>
                    Recaudado por {c.nombre}: {euros(importeSuyo)}
                  </div>
                  {!c.email && (
                    <div className="text-xs" style={{ color: C.wax }}>
                      Sin email — no se podrá enviar el acuse automáticamente
                    </div>
                  )}
                </div>

                {confirmandoId === c.id ? (
                  // En su propio bloque, a todo el ancho: los campos en una
                  // línea y los botones debajo, nunca junto al nombre.
                  <div className="w-full flex flex-wrap items-center gap-2">
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
                ) : recogido ? (
                  <>
                    <span
                      className="text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                      style={{ background: C.okFondo, color: C.ink }}
                    >
                      <Check size={13} style={{ flexShrink: 0 }} aria-hidden />
                      Recogido {conPropina(Number(c.dineroRecogidoImporte) || 0, Number(c.dineroRecogidoPropina) || 0)} el{" "}
                      {formatearFecha(String(c.dineroRecogidoEn).slice(0, 10))}
                    </span>
                    <Boton variante="secundario" tamano="pequeno" onClick={() => reenviarAcuse(c)} disabled={enviandoId === c.id || !c.email} titulo="Reenviar el acuse por email otra vez">
                      <Mail size={13} /> {enviandoId === c.id ? "Enviando…" : "Reenviar acuse"}
                    </Boton>
                    <Boton
                      tamano="pequeno"
                      icono={Undo2}
                      titulo="Deshacer (si se confirmó por error)"
                      onClick={() =>
                        preguntar({
                          titulo: "¿Deshacer la recogida?",
                          texto: `El dinero de ${c.nombre} volverá a constar como no recogido.`,
                          rotulo: "Sí",
                          alConfirmar: () => deshacerRecogidaColaborador(c.id),
                        })
                      }
                      style={{ color: C.wax }}
                    />
                  </>
                ) : (
                  <>
                    <Boton
                      variante="principal"
                      tamano="pequeno"
                      onClick={() => abrirConfirmar(c)}
                      disabled={importeSuyo === 0}
                    >
                      Confirmar recogida
                    </Boton>
                    <Boton variante="secundario" tamano="pequeno" onClick={() => abrirPreviewProbar(c)} disabled={generandoPreview === c.id || !c.email} titulo="Ver el acuse de prueba antes de enviarlo, sin confirmar ni registrar nada">
                      <Mail size={13} /> {generandoPreview === c.id ? "Generando…" : "Probar acuse"}
                    </Boton>
                  </>
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
            Confirmar la recogida manda por email al propio colaborador un acuse con el
            desglose de sus invitados, el importe total, la fecha y la firma — para que
            lo guarde como comprobante.
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
          (previewAcuse.tipo === "confirmar" ? "Confirmar recogida — " : "Probar acuse — ") +
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
