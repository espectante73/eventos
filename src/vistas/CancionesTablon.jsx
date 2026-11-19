// «Tus canciones para bailar» en el tablón (él, v92.1): cada invitado
// cambia las suyas, solo con su enlace personal, hasta que el anfitrión
// marca «Canciones cerradas»; entonces solo se ven. Plegada, como lo demás
// del tablón. Los mismos 3 huecos que usa el colaborador (CampoCancion) y
// el mismo pie, «Cancelar» y «Guardar» (norma 5). Guardar, en
// lib/cancionesTablon.js; aparte de VistaTablon para poder dibujarla en una
// prueba.
//
// Lo escrito no se recopia de `cancion` al refrescarse el tablón (trampa
// 2.4): se toma al abrirla, y si se pliega a medias, sigue ahí al volver.
import { useState } from "react";
import { C, DEDO, OP } from "../theme";
import { SeccionPlegable } from "../components/SeccionPlegable";
import { CampoCancion } from "../components/CampoCancion";
import { Boton } from "../components/Boton";
import { LineaAviso } from "../components/LineaAviso";
import { usePreguntaSeguridad } from "../components/PreguntaSeguridad";
import { huecosCanciones, textoLimpioDeHuecos, cancionesDe, MAX_CANCIONES } from "../lib/canciones";
import { MOTIVOS_CANCIONES_TABLON } from "../lib/cancionesTablon";
import { PREGUNTA_DESCARTAR } from "../lib/cambiosSinGuardar";

export function CancionesTablon({ cancion, cerradas, abierta, onAlternar, onGuardar }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // De qué se partió al abrirla, y lo que lleva escrito.
  const [base, setBase] = useState(cancion || "");
  const [huecos, setHuecos] = useState(() => huecosCanciones(cancion));
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const hayCambios = textoLimpioDeHuecos(huecos) !== textoLimpioDeHuecos(huecosCanciones(base));
  const actuales = cancionesDe(cancion);

  const empezar = () => {
    setBase(cancion || "");
    setHuecos(huecosCanciones(cancion));
    setAviso("");
  };
  const alternar = () => {
    if (!abierta && !hayCambios) empezar();
    onAlternar();
  };
  const cancelar = () => {
    const cerrar = () => {
      empezar();
      onAlternar();
    };
    if (hayCambios) preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: cerrar, otra: { rotulo: "No" } });
    else cerrar();
  };
  const guardar = async () => {
    setGuardando(true);
    const motivo = await onGuardar(huecos);
    setGuardando(false);
    setAviso(motivo);
    if (motivo) return;
    setBase(textoLimpioDeHuecos(huecos));
    onAlternar();
  };

  return (
    <div className="mb-4">
      <SeccionPlegable
        sencilla
        titulo="Tus canciones para bailar"
        resumen={`${actuales.length} de ${MAX_CANCIONES}${cerradas ? " · cerradas" : ""}`}
        abierta={abierta}
        onAlternar={alternar}
      >
        {cerradas ? (
          <div className="space-y-1 text-sm pb-2" style={{ color: C.charcoal }}>
            {actuales.length ? (
              actuales.map((c) => (
                <p key={c} className="truncate">
                  {c}
                </p>
              ))
            ) : (
              <p style={{ opacity: OP.secundario }}>Ninguna.</p>
            )}
            <LineaAviso className="text-sm pt-1">{MOTIVOS_CANCIONES_TABLON.cerradas}</LineaAviso>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Hasta 3. Las pondrá el DJ en la fiesta.
            </p>
            <div className="flex flex-col gap-2">
              {huecos.map((hueco, i) => (
                <CampoCancion
                  key={i}
                  numero={i + 1}
                  titulo={hueco.titulo}
                  artista={hueco.artista}
                  onCambiar={(nuevo) => setHuecos(huecos.map((h, j) => (j === i ? nuevo : h)))}
                />
              ))}
            </div>
            {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
            {/* Cancelar y Guardar, iguales (normas 4 y 5); «Guardar», del lado del pulgar. */}
            <div className="grid grid-cols-2 gap-2">
              <Boton variante="secundario" onClick={cancelar} style={{ minHeight: DEDO }}>
                Cancelar
              </Boton>
              <Boton variante="principal" onClick={guardar} disabled={!hayCambios || guardando} className="zurdo:order-first" style={{ minHeight: DEDO }}>
                {guardando ? "Guardando…" : "Guardar"}
              </Boton>
            </div>
          </div>
        )}
      </SeccionPlegable>
      {ventanaPregunta}
    </div>
  );
}
