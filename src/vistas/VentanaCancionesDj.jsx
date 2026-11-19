// «Canciones para bailar» en la cuenta del DJ (v91.5, él: el DJ entra con su
// usuario y, además de Multimedia, ve la lista). Lo mismo que la página del
// enlace (VistaDj), con la misma pieza (ListaCancionesDj), sin enlace ni
// clave: la base mira el permiso (colaborador_canciones_dj). Él la usa los
// días antes, para prepararlo todo; el día del evento ya trae las listas.
// El anfitrión, con «Cambiar vista», la ve con sus propios datos.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { VentanaFlotante } from "../components/VentanaFlotante";
import { RecuadroCifras } from "../components/Widgets";
import { LineaAviso } from "../components/LineaAviso";
import { ListaCancionesDj } from "../components/ListaCancionesDj";
import { cifrasDelDj, datosDjDesdeLista } from "../lib/dj";

const CADA = 60 * 1000;

export function VentanaCancionesDj({ data, onCerrar }) {
  const [delServidor, setDelServidor] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [hora, setHora] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { data: d, error } = await supabase.rpc("colaborador_canciones_dj");
      if (error || d?.error) {
        setMotivo("No se ha podido cargar la lista. Si sigue sin salir, pide al anfitrión que revise tu permiso «Canciones para bailar».");
        return;
      }
      setMotivo("");
      setDelServidor(d);
      setHora(new Date());
    } catch {
      setMotivo("No se ha podido cargar la lista. Prueba otra vez en un momento.");
    }
  }, []);

  // Al abrirla, cada minuto y al volver a la pestaña, como la del enlace.
  useEffect(() => {
    if (data.esAnfitrion) return undefined;
    cargar();
    const t = setInterval(cargar, CADA);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [data.esAnfitrion, cargar]);

  const datos = data.esAnfitrion ? datosDjDesdeLista(data.invitados, data.evento) : delServidor;

  return (
    <VentanaFlotante clave="cancionesDj" titulo="Canciones para bailar" onCerrar={onCerrar} extra={datos ? <RecuadroCifras cifras={cifrasDelDj(datos)} /> : undefined}>
      {datos ? (
        <ListaCancionesDj datos={datos} escuchar={data.buscarParaEscuchar} hora={data.esAnfitrion ? null : hora} motivo={motivo} />
      ) : (
        motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>
      )}
    </VentanaFlotante>
  );
}
