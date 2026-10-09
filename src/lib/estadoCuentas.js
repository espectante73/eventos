// Si cada colaborador tiene ya su cuenta y cuándo entró por última vez
// (v58.7): una línea en su recuadro de "Progreso de recopilación", para
// ver de un vistazo quién está dado de alta y trabajando. Lo da la base
// (anfitrion_estado_cuentas), solo al anfitrión.
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Al abrir la ventana, y cada minuto mientras está abierta: el mismo ritmo
// que el resto de la app (useLedgerData).
const CADA = 60000;

// "hoy", "ayer", "hace 5 d"; corto para caber en una línea del recuadro.
export function textoUltimaEntrada(fecha, ahora = new Date()) {
  if (!fecha) return "sin entrar";
  const dia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dias = Math.round((dia(ahora) - dia(new Date(fecha))) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} d`;
}

// { [colaboradorId]: { tieneCuenta, ultimaEntrada } }; vacío si falla:
// la línea simplemente no sale, el resto de la ventana sigue igual.
export function useEstadoCuentas(token) {
  const [estado, setEstado] = useState({});
  useEffect(() => {
    if (!token) return undefined;
    let vivo = true;
    const leer = async () => {
      const { data, error } = await supabase.rpc("anfitrion_estado_cuentas", { p_token: token });
      if (!vivo || error || !Array.isArray(data)) return;
      setEstado(Object.fromEntries(data.map((f) => [f.colaboradorId, { tieneCuenta: f.tieneCuenta, ultimaEntrada: f.ultimaEntrada }])));
    };
    leer();
    const ciclo = setInterval(leer, CADA);
    return () => {
      vivo = false;
      clearInterval(ciclo);
    };
  }, [token]);
  return estado;
}
