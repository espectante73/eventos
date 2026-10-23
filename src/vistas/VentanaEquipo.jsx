// La ventana «Equipo» del colaborador (él, v73.1): quiénes son todos los
// colaboradores, para saber a quién consultar. Una fila por persona
// («Apellido, Nombre» y su zona, norma 6), como en la Lista de invitados,
// y la suya marcada «(tú)». Es dinámica: el colaborador la pide al servidor
// al abrirla y cada minuto mientras está abierta (quien deja de ser
// colaborador desaparece; quien entra, aparece). El anfitrión, viendo el
// panel de un colaborador, la saca de sus propios datos.
import { useEffect, useState } from "react";
import { C, OP, T } from "../theme";
import { supabase } from "../supabaseClient";
import { VentanaFlotante } from "../components/VentanaFlotante";
import { Cargando } from "../components/Cargando";
import { LineaAviso } from "../components/LineaAviso";
import { nombreCompleto } from "../lib/formato";
import { ordenarEquipo, equipoDesdeDatos, leerEquipo } from "../lib/equipoColaboradores";

// Los anchos de las dos columnas, una sola vez (norma 6).
const COLUMNAS = "minmax(0, 1fr) 7rem";

export function VentanaEquipo({ data, colaboradorId, onCerrar }) {
  const delAnfitrion = Boolean(data.esAnfitrion);
  const [delServidor, setDelServidor] = useState(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (delAnfitrion) return undefined;
    let vivo = true;
    const leer = async () => {
      const { equipo, aviso: motivo } = await leerEquipo(supabase, colaboradorId);
      if (!vivo) return;
      if (equipo) setDelServidor(equipo);
      setAviso(motivo);
    };
    leer();
    const temporizador = setInterval(leer, 60 * 1000);
    return () => {
      vivo = false;
      clearInterval(temporizador);
    };
  }, [delAnfitrion, colaboradorId]);

  const equipo = delAnfitrion ? equipoDesdeDatos(data.colaboradores, data.invitados, colaboradorId) : delServidor;
  const ordenado = equipo ? ordenarEquipo(equipo) : null;

  return (
    <VentanaFlotante clave="equipo" titulo="Equipo" onCerrar={onCerrar} ancho="min(420px, calc(100vw - 48px))">
      {aviso && <LineaAviso className="text-xs mb-2">{aviso}</LineaAviso>}
      {!ordenado ? (
        !aviso && <Cargando />
      ) : (
        <>
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {ordenado.length} {ordenado.length === 1 ? "colaborador" : "colaboradores"}
          </p>
          <div className="rounded overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.blanco }}>
            <div
              className="grid uppercase"
              style={{ gridTemplateColumns: COLUMNAS, background: C.ink, color: C.goldClaro, fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno, letterSpacing: 1 }}
            >
              <div className="px-3 py-1.5">Colaborador</div>
              <div className="px-3 py-1.5">Zona</div>
            </div>
            {ordenado.map((p, i) => (
              <div
                key={p.id}
                data-equipo={nombreCompleto(p)}
                className="grid text-sm"
                style={{ gridTemplateColumns: COLUMNAS, background: i % 2 === 1 ? C.paperDark : C.blanco }}
              >
                <div className="px-3 py-2 truncate" style={{ color: C.ink, fontWeight: 600 }}>
                  {nombreCompleto(p)}
                  {p.esYo && <span style={{ fontWeight: 400, opacity: OP.secundario }}> (tú)</span>}
                </div>
                <div className="px-3 py-2 truncate" style={{ color: C.charcoal, borderLeft: `1px solid ${C.paper}` }}>
                  {p.zona || "—"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </VentanaFlotante>
  );
}
