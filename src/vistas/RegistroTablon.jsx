// «Comprueba tus datos» (él, v85.1-85.2): plegado en el recuadro verde del
// tablón, justo debajo de la ronda «Datos» (él: «datos aparece dos veces»;
// antes iba en la tarjeta de su colaborador). Lo que su colaborador le apuntó en el
// formulario, una línea cada cosa (norma 6), para que lo vea y avise si
// algo está mal. Las reglas de qué se enseña, en lib/registroTablon.js;
// aparte de VistaTablon para poder dibujarlo en una prueba.
//
// Sus canciones las cambia él mismo AQUÍ (v92.3, él: «donde están todos los
// datos que ha dado… ahí buscará sus canciones»; en una tarjeta aparte, la
// v92.1, no las encontraba): `canciones` = { cerradas, onGuardar } solo con
// su enlace personal (y `buscar`, su ▶ de escucha previa, v92.5); sin él,
// null, y todo se ve sin tocar. «Cambiar» en el
// dorado lleno de los botones sobre verde, para que destaque (él: «no queda
// nada resaltado»). Guardar, en lib/cancionesTablon.js.
//
// Lo escrito no se recopia de `yo.cancion` al refrescarse el tablón (trampa
// 2.4): se toma al pulsar «Cambiar», y si se pliega a medias, sigue ahí.
import { useState } from "react";
import { C, DEDO, OP, R } from "../theme";
import { SeccionPlegable } from "../components/SeccionPlegable";
import { CampoCancion } from "../components/CampoCancion";
import { Boton } from "../components/Boton";
import { usePreguntaSeguridad } from "../components/PreguntaSeguridad";
import { registroDelTablon } from "../lib/registroTablon";
import { huecosCanciones, textoLimpioDeHuecos } from "../lib/canciones";
import { PREGUNTA_DESCARTAR } from "../lib/cambiosSinGuardar";

function Linea({ rotulo, children }) {
  return (
    <p className="truncate">
      <b>{rotulo}:</b> {children}
    </p>
  );
}

export function RegistroTablon({ yo, evento, canciones, abierta, onAlternar }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Mientras las cambia: de qué partió y lo que lleva escrito (null: no las
  // está cambiando).
  const [base, setBase] = useState("");
  const [huecos, setHuecos] = useState(null);
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const registro = registroDelTablon(yo, evento);
  if (!registro) return null;

  const puedeCambiar = Boolean(canciones) && !canciones.cerradas;
  const editando = puedeCambiar && huecos !== null;
  const hayCambios = editando && textoLimpioDeHuecos(huecos) !== textoLimpioDeHuecos(huecosCanciones(base));

  const empezar = () => {
    setBase(yo.cancion || "");
    setHuecos(huecosCanciones(yo.cancion));
    setAviso("");
  };
  const terminar = () => {
    setHuecos(null);
    setAviso("");
  };
  const cancelar = () => {
    if (hayCambios) preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: terminar, otra: { rotulo: "No" } });
    else terminar();
  };
  const guardar = async () => {
    setGuardando(true);
    const motivo = await canciones.onGuardar(huecos);
    setGuardando(false);
    if (motivo) setAviso(motivo);
    else terminar();
  };

  return (
    // Sobre el verde: el rótulo en su dorado de siempre y los datos en
    // blanco, como las rondas de encima.
    <div>
      <SeccionPlegable sencilla titulo="Comprueba tus datos" abierta={abierta} onAlternar={onAlternar}>
        <div className="space-y-1 text-sm pb-1" style={{ color: C.blanco }}>
          {/* Su frase, más corta (él, v85.4: el título ya dice «Comprueba»).
              Si es su propio colaborador, se corrige él. */}
          <p className="pb-1">
            {yo.colaboradorEsYo ? "Si ves algún error, corrígelo en tu formulario." : "Si ves algún error, dile a tu colaborador que lo corrija."}
            {puedeCambiar && " Tus canciones las cambias tú."}
          </p>
          {registro.nombre && <Linea rotulo="Nombre">{registro.nombre}</Linea>}
          <Linea rotulo="Alergias">{registro.alergias}</Linea>
          <div>
            {/* «Cambiar», del lado del pulgar (norma 1.4): la fila se
                estira y el botón se arrima a su lado. */}
            <div className="flex items-center gap-2">
              <b>Canciones:</b>
              {puedeCambiar && !editando && (
                <div className="flex-1 flex justify-end zurdo:justify-start">
                  <Boton tamano="pequeno" variante="principal" oscuro onClick={empezar} titulo="Cambiar tus canciones">
                    Cambiar
                  </Boton>
                </div>
              )}
            </div>
            {editando ? (
              <div className="space-y-2 pt-1 pb-1">
                <p className="text-xs" style={{ opacity: OP.secundario }}>
                  Hasta 3. Las pondrá el DJ en la fiesta.
                </p>
                {/* Sobre papel, como en el formulario del colaborador: el ▶
                    y lo que encuentra (v92.5) están hechos para fondo claro;
                    sobre el verde no se leerían. */}
                <div className="flex flex-col gap-2 p-2" style={{ color: C.charcoal, background: C.paper, borderRadius: R.caja }}>
                  {huecos.map((hueco, i) => (
                    <CampoCancion
                      key={i}
                      numero={i + 1}
                      titulo={hueco.titulo}
                      artista={hueco.artista}
                      buscar={canciones.buscar}
                      onCambiar={(nuevo) => setHuecos(huecos.map((h, j) => (j === i ? nuevo : h)))}
                    />
                  ))}
                </div>
                {aviso && (
                  <p role="alert" style={{ color: C.goldClaro, fontWeight: 600 }}>
                    {aviso}
                  </p>
                )}
                {/* Cancelar y Guardar, iguales (normas 4 y 5); «Guardar», del lado del pulgar. */}
                <div className="grid grid-cols-2 gap-2">
                  <Boton variante="secundario" oscuro onClick={cancelar} style={{ minHeight: DEDO }}>
                    Cancelar
                  </Boton>
                  <Boton variante="principal" oscuro onClick={guardar} disabled={!hayCambios || guardando} className="zurdo:order-first" style={{ minHeight: DEDO }}>
                    {guardando ? "Guardando…" : "Guardar"}
                  </Boton>
                </div>
              </div>
            ) : (
              <>
                {registro.canciones.map((c) => (
                  <p key={c} className="truncate pl-3">
                    {c}
                  </p>
                ))}
                {canciones?.cerradas && (
                  <p className="text-xs pl-3" style={{ opacity: OP.secundario }}>
                    Ya están cerradas.
                  </p>
                )}
              </>
            )}
          </div>
          {registro.boda && <Linea rotulo="Boda">{registro.boda}</Linea>}
          {/* El email entero se parte donde haga falta: recortado no se
              vería si está mal escrito (v87.2). */}
          {registro.email && (
            <p style={{ overflowWrap: "anywhere" }}>
              <b>Email para la invitación:</b> {registro.email}
            </p>
          )}
          {registro.email && registro.emailOculto && (
            <p className="text-xs pl-3" style={{ opacity: OP.secundario }}>
              Para verlo, entra con tu enlace personal.
            </p>
          )}
          <Linea rotulo="Guardar tus datos tras el evento">{registro.conservar}</Linea>
        </div>
      </SeccionPlegable>
      {ventanaPregunta}
    </div>
  );
}
