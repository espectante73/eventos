// La salvaguarda de una mesa ya enviada (él, v83.1), como último remedio. La
// mesa de una familia con su invitación enviada queda fija; si de verdad hay
// que cambiarla, aquí se cambia y, en el mismo paso, se le manda la invitación
// nueva con el número nuevo y un aviso al principio del correo.
//
// El orden importa: primero lo que puede fallar sin haber tocado nada (quién
// la recibe, la imagen); luego la mesa, ESPERANDO, porque la base da la
// invitación por no enviada al cambiarla; y al final el correo y la marca de
// enviada. Si el correo falla, la mesa ya está cambiada y la familia queda
// pendiente en Invitaciones. Solo el anfitrión. La regla, en lib/mesas.js.
import { useState } from "react";
import { Send } from "lucide-react";
import { C, DEDO, OP, R } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Desplegable, Field } from "../../components/Formulario";
import { LineaAviso } from "../../components/LineaAviso";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { asignarMesaConSuFamilia, claveInvitacion, ocupacion, textoCambioMesa } from "../../lib/mesas";
import { familiasDelEvento } from "../../lib/familiasInvitacion";
import { useMotorInvitaciones } from "../../lib/useMotorInvitaciones";
import { requisitosActivos } from "../../lib/modoPruebas";

export function VentanaCambiarMesa({ data, familia, onCerrar }) {
  const { invitados, mesas, evento, ordenFamiliares, persistInvitados, enviarInvitacionFamilia } = data;
  const motor = useMotorInvitaciones(data);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const [numero, setNumero] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState("");

  // Las mesas donde cabe la familia entera, menos la suya.
  const opciones = [...mesas]
    .sort((a, b) => a.numero - b.numero)
    .filter((m) => m.numero !== familia.mesa && m.capacidad - ocupacion(invitados, m.numero) >= familia.cuantos);
  const destino = Number(numero) || null;
  const clave = claveInvitacion(familia.representante);
  const delEvento = familiasDelEvento(invitados, ordenFamiliares, evento).find((f) => f.clave === clave);
  const solo = (delEvento?.confirmados.length ?? familia.cuantos) === 1;
  const texto = textoCambioMesa(destino ?? "…", solo);

  const cambiarYEnviar = async () => {
    setAviso("");
    setEnviando(true);
    const fallar = (motivo) => {
      setAviso(motivo);
      setEnviando(false);
    };
    // Sin `ordenFamiliares`: esta es la única puerta que puede mover una mesa fija.
    const { invitados: siguiente, aviso: motivo } = asignarMesaConSuFamilia(invitados, familia.representante.id, destino, mesas, { conSinConfirmar: true });
    if (motivo) return fallar(motivo);
    const corregida = familiasDelEvento(siguiente, ordenFamiliares, evento).find((f) => f.clave === clave);
    const destinatario = corregida && motor.destinatarioConEmail(corregida);
    if (!destinatario?.email && requisitosActivos(evento)) return fallar("No se ha cambiado nada: ninguno de esta familia tiene email guardado.");
    const dataUrl = await motor.generarImagenParaFamilia(corregida, false);
    if (!dataUrl) return fallar("No se ha cambiado nada: no se ha podido generar la imagen de la invitación.");
    if (await persistInvitados(siguiente)) return fallar("No se ha cambiado nada: no se pudo guardar la mesa.");
    const enviada = await enviarInvitacionFamilia(
      destinatario.email,
      `Tu invitación — ${evento.nombre || "evento"}`,
      `<p>${texto}</p>${evento.plantillaInvitacionFamilia || ""}`,
      dataUrl.split(",")[1] || ""
    );
    setEnviando(false);
    if (!enviada) {
      setHecho(`La mesa ya es la ${destino}, pero el correo no ha salido. Envíasela desde Invitaciones.`);
      return;
    }
    motor.marcarInvitacionEnviada(clave);
    setHecho(`Ahora está en la mesa ${destino}. Invitación nueva enviada a ${destinatario.email}.`);
  };

  const pedirConfirmacion = () =>
    preguntar({
      titulo: "¿Cambiar la mesa y enviar la invitación nueva?",
      texto: `${familia.nombre}: de la mesa ${familia.mesa} a la ${destino}.`,
      rotulo: "Sí",
      peligro: false,
      alConfirmar: cambiarYEnviar,
    });

  const apagado = { color: C.charcoal, opacity: OP.secundario };
  return (
    <VentanaFlotante clave="cambiarMesa" titulo="Cambiar mesa" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3 text-sm">
        <p style={{ color: C.ink, fontWeight: 600 }}>{familia.nombre}</p>
        {hecho ? (
          <>
            <p style={{ color: C.charcoal }}>{hecho}</p>
            <div className="flex justify-end zurdo:justify-start">
              <Boton variante="principal" onClick={onCerrar} style={{ minHeight: DEDO }}>
                Cerrar
              </Boton>
            </div>
          </>
        ) : (
          <>
            <p style={apagado}>Ya tiene su invitación con la mesa {familia.mesa}. Solo como último remedio: al cambiarla se le envía una invitación nueva con este aviso al principio.</p>
            {opciones.length === 0 ? (
              <LineaAviso className="text-sm">
                {`Ninguna otra mesa tiene ${familia.cuantos === 1 ? "1 sitio libre" : `${familia.cuantos} sitios libres`}: sube los sitios de alguna.`}
              </LineaAviso>
            ) : (
              <>
                <Field label="Mesa nueva">
                  <Desplegable value={numero} onChange={(e) => setNumero(e.target.value)} aria-label="Mesa nueva">
                    <option value="">Elige una mesa</option>
                    {opciones.map((m) => (
                      <option key={m.numero} value={m.numero}>
                        Mesa {m.numero} ({ocupacion(invitados, m.numero)}/{m.capacidad})
                      </option>
                    ))}
                  </Desplegable>
                </Field>
                {destino && <p className="p-2" style={{ color: C.ink, background: C.champanClaro, borderRadius: R.caja }}>«{texto}»</p>}
              </>
            )}
            {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
            <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              <Boton variante="secundario" onClick={onCerrar} disabled={enviando} style={{ minHeight: DEDO }}>
                Cancelar
              </Boton>
              <Boton variante="principal" icono={Send} onClick={pedirConfirmacion} disabled={!destino || enviando} className="zurdo:order-first" style={{ minHeight: DEDO }}>
                {enviando ? "Enviando…" : "Cambiar y enviar"}
              </Boton>
            </div>
          </>
        )}
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
