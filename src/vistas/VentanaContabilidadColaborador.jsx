// «Contabilidad» en la cuenta del colaborador con el permiso «Ver la
// contabilidad» (v95, él: «es para repasar lo que se me escape a mí, no
// necesita nombres de personas»): la misma ventana del anfitrión, solo
// cifras (VentanaCuentas `soloCifras`), con las mismas cuentas (norma 7).
// Los datos los da la base (colaborador_contabilidad), sin nombres de
// invitados, al abrirla, cada minuto y al volver a la pestaña. El
// anfitrión, con «Cambiar vista», usa los suyos.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { VentanaCuentas } from "./anfitrion/VentanaCuentas";

const CADA = 60 * 1000;
const VACIOS = { evento: {}, invitados: [], colaboradores: [], gastos: [] };

export function VentanaContabilidadColaborador({ data, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [motivo, setMotivo] = useState("");
  const cargar = useCallback(async () => {
    try {
      const { data: d, error } = await supabase.rpc("colaborador_contabilidad");
      if (error || !d || d.error) {
        setMotivo("No se ha podido cargar la contabilidad. Si sigue sin salir, pide al anfitrión que revise tu permiso «Ver la contabilidad».");
        return;
      }
      setMotivo("");
      setDatos({ ...VACIOS, ...d, evento: d.evento || {} });
    } catch {
      setMotivo("No se ha podido cargar la contabilidad. Prueba otra vez en un momento.");
    }
  }, []);

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

  if (data.esAnfitrion) return <VentanaCuentas data={data} soloCifras onCerrar={onCerrar} />;
  // Si ya llegó una vez y falla una recarga, se queda lo de antes.
  return <VentanaCuentas data={datos ?? { ...VACIOS, cargando: true, motivo }} soloCifras onCerrar={onCerrar} />;
}
