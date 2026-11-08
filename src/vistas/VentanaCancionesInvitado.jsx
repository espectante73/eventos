// Las canciones de un invitado que ya ha pagado (él, v82.8): es lo único que
// sigue abierto al colaborador tras el pago. Los invitados cambian de idea o
// añaden canciones más tarde, y la lista del DJ se actualiza sola. No toca
// el pago, así que ni caduca la invitación ni salta «Familia pagada» (por
// eso no se hace quitando y volviendo a poner el pago, que era lo otro). La
// regla, en lib/canciones.js; en la base, colaborador_guardar_canciones.
import { useState } from "react";
import { C, DEDO, OP } from "../theme";
import { VentanaFlotante } from "../components/VentanaFlotante";
import { CampoCancion } from "../components/CampoCancion";
import { Boton } from "../components/Boton";
import { LineaAviso } from "../components/LineaAviso";
import { usePreguntaSeguridad } from "../components/PreguntaSeguridad";
import { nombreCompleto } from "../lib/formato";
import { huecosCanciones, textoDeHuecos, cambiarCanciones } from "../lib/canciones";
import { PREGUNTA_DESCARTAR } from "../lib/cambiosSinGuardar";

export function VentanaCancionesInvitado({ data, invitado, onCerrar }) {
  const { invitados, persistInvitados, buscarParaEscuchar } = data;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const [huecos, setHuecos] = useState(() => huecosCanciones(invitado.cancion));
  const [aviso, setAviso] = useState("");
  const hayCambios = textoDeHuecos(huecos) !== textoDeHuecos(huecosCanciones(invitado.cancion));

  const guardar = () => {
    const { invitados: siguiente, aviso: motivo } = cambiarCanciones(invitados, invitado.id, huecos);
    setAviso(motivo);
    if (motivo) return;
    if (siguiente !== invitados) persistInvitados(siguiente);
    onCerrar();
  };
  // Salir con algo escrito pregunta antes (norma 9), también por la X.
  const salir = () => (hayCambios ? preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: onCerrar, otra: { rotulo: "No" } }) : onCerrar());

  return (
    <VentanaFlotante clave="cancionesInvitado" titulo={`Canciones · ${nombreCompleto(invitado)}`} onCerrar={salir} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Sus demás datos quedan cerrados. Si hay que cambiar algo, díselo al anfitrión.
        </p>
        <div className="flex flex-col gap-2">
          {huecos.map((hueco, i) => (
            <CampoCancion
              key={i}
              numero={i + 1}
              titulo={hueco.titulo}
              artista={hueco.artista}
              buscar={buscarParaEscuchar}
              onCambiar={(nuevo) => setHuecos(huecos.map((h, j) => (j === i ? nuevo : h)))}
            />
          ))}
        </div>
        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
        {/* Al pie, Cancelar y Guardar, iguales (normas 4 y 5); «Guardar», del lado del pulgar. */}
        <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={salir} style={{ minHeight: DEDO }}>
            Cancelar
          </Boton>
          <Boton variante="principal" onClick={guardar} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Guardar
          </Boton>
        </div>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
