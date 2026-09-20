// El sitio donde salen los avisos de lib/avisos.js. Va montado una vez en
// la pestaña (main.jsx) y una vez dentro de CADA ventana emergente
// (usePopupWindow.js), para que el aviso aparezca donde la persona está
// mirando y no en otra ventana que a lo mejor ni se ve.
//
// No pinta nada hasta que hay un aviso: es la misma ventana de
// PreguntaSeguridad, en su forma de "solo aviso" (un botón "Entendido").
import { useEffect, useRef } from "react";
import { usePreguntaSeguridad } from "./PreguntaSeguridad";
import { registrarHostAvisos, partirAviso } from "../lib/avisos";

export function AvisosGlobales() {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const ancla = useRef(null);

  useEffect(() => {
    const doc = ancla.current?.ownerDocument || document;
    return registrarHostAvisos({
      doc,
      mostrar: (mensaje, titulo) => preguntar({ ...partirAviso(mensaje, titulo), soloAviso: true }),
    });
  }, [preguntar]);

  return (
    <>
      <span ref={ancla} style={{ display: "none" }} />
      {ventanaPregunta}
    </>
  );
}
