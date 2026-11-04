// «Avisos en este móvil» (él, v79): el colaborador activa los avisos en su
// móvil, como los de una app instalada. Un apartado plegado más de su panel
// (norma 5), con su estado al lado del título. Las reglas, en
// lib/avisosPush.js. Sin «yo» en los textos: «el anfitrión». El anfitrión lo
// tiene en Mi cuenta (v79.3), con su `explicacion`.
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { C, OP } from "../theme";
import { SeccionPlegable } from "./SeccionPlegable";
import { Boton } from "./Boton";
import { LineaAviso } from "./LineaAviso";
import { estadoAvisos, activarAvisos, desactivarAvisos, AVISO_BLOQUEADOS, PASOS_INSTALAR } from "../lib/avisosPush";

const RESUMEN = { activar: "Sin activar", activos: "Activados", instalar: "Instala la app", bloqueados: "Bloqueados" };
const PARA_EL_COLABORADOR = "Llega un aviso cuando tengas invitados nuevos, o cuando el anfitrión avise al equipo.";

// `titulo`: en Mi cuenta (300 px) el largo se cortaba; allí, «Avisos móvil».
export function AvisosMovil({ guardar, quitar, abierta, onAlternar, entorno, explicacion = PARA_EL_COLABORADOR, titulo = "Avisos en este móvil" }) {
  const [estado, setEstado] = useState(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let vivo = true;
    estadoAvisos(entorno).then((e) => vivo && setEstado(e)).catch(() => vivo && setEstado("no"));
    return () => {
      vivo = false;
    };
  }, [entorno]);

  // Este navegador no puede (o aún no se sabe): ni se enseña.
  if (!estado || estado === "no") return null;

  const activar = async () => {
    setOcupado(true);
    setAviso("");
    try {
      const { ok, aviso: motivo } = await activarAvisos(guardar, entorno);
      setAviso(motivo);
      setEstado(ok ? "activos" : await estadoAvisos(entorno));
    } catch {
      setAviso("No se pudieron activar los avisos en este móvil.");
    }
    setOcupado(false);
  };
  const quitarAvisos = async () => {
    setOcupado(true);
    await desactivarAvisos(quitar, entorno).catch(() => {});
    setEstado(await estadoAvisos(entorno));
    setOcupado(false);
  };

  const texto = { color: C.charcoal, opacity: OP.secundario };
  return (
    <SeccionPlegable icono={Bell} titulo={titulo} resumen={RESUMEN[estado]} abierta={abierta} onAlternar={onAlternar}>
      <div className="space-y-2 text-sm">
        {estado === "activar" && (
          <>
            <p style={texto}>{explicacion}</p>
            <Boton variante="principal" icono={Bell} disabled={ocupado} onClick={activar}>
              Activar avisos
            </Boton>
          </>
        )}
        {estado === "activos" && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5" style={{ color: C.ink }}>
              <Check size={16} aria-hidden /> Activados.
            </span>
            <Boton variante="secundario" tamano="pequeno" disabled={ocupado} onClick={quitarAvisos} className="ml-auto zurdo:ml-0 zurdo:mr-auto">
              Quitar
            </Boton>
          </div>
        )}
        {estado === "instalar" && (
          <p style={texto}>En el iPhone, los avisos solo llegan con la app instalada: {PASOS_INSTALAR.iphone} Ábrela desde su icono.</p>
        )}
        {estado === "bloqueados" && <LineaAviso className="text-sm">{AVISO_BLOQUEADOS}</LineaAviso>}
        {aviso && estado !== "bloqueados" && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
      </div>
    </SeccionPlegable>
  );
}
