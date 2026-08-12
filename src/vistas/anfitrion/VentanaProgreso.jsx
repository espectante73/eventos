// Ventana "Progreso de recopilación": barras de progreso generales, y
// tres barras compactas por colaborador (datos / pagos / invitaciones
// enviadas) — icono en vez de texto y todo en la misma línea que la
// barra (a petición del usuario, 2026-08-12: así caben más
// colaboradores de un vistazo, con solo un margen mínimo entre las tres
// porque cada una ya se distingue por su color). Y de canciones
// registradas. Extraída de VistaAnfitrion.jsx en el reparto del
// 2026-08-08 (Fase 4, Ronda 1).
import { ClipboardList, Euro, Mail } from "lucide-react";
import { C } from "../../theme";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { ProgresoBar } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Icono + barra fina en una sola línea, sin etiqueta de texto (el icono
// hace de etiqueta, el color distingue de qué barra se trata) — el
// título HTML sigue llevando el detalle exacto (n/total y %) para quien
// pase el ratón o toque con el dedo.
function BarraCompacta({ icono: Icono, completado, total, color }) {
  const pct = total > 0 ? Math.round((completado / total) * 100) : 0;
  return (
    <div
      className="flex items-center gap-1.5 mb-1"
      title={`${completado}/${total} · ${pct}%`}
    >
      <Icono size={14} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1, background: C.paperDark, borderRadius: 3, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", transition: "width 0.3s ease" }} />
      </div>
      <span
        style={{
          fontSize: 10,
          color: C.charcoal,
          opacity: 0.7,
          fontFamily: "'IBM Plex Mono', monospace",
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export function VentanaProgreso({ data, onCerrar }) {
  const { invitados, colaboradores, ordenFamiliares } = data;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;

  return (
    <VentanaFlotante clave="progreso" titulo="Progreso de recopilación" onCerrar={onCerrar}>
      <ProgresoBar
        label="General (confirmados con datos completos)"
        completado={invitados.filter((g) => g.confirmado && datosCompletos(g)).length}
        total={confirmadosCount}
        color={C.wax}
      />
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {colaboradores.map((c) => {
          const suyos = invitados.filter(
            (g) => resolverColaborador(g, colaboradores)?.id === c.id && g.confirmado
          );
          const completosDatos = suyos.filter((g) => datosCompletos(g)).length;
          const pagados = suyos.filter((g) => g.pagado).length;
          // "Invitación enviada" es un dato por FAMILIA (grupoFamiliar), no
          // por invitado — se cuentan las familias distintas de este
          // colaborador y cuántas de ellas ya tienen la invitación enviada
          // (ver ordenFamiliares, poblado por familia en toda la app).
          const familias = [
            ...new Set(suyos.map((g) => g.grupoFamiliar || g.apellido).filter(Boolean)),
          ];
          const familiasConInvitacion = familias.filter(
            (f) => ordenFamiliares[f]?.invitacionEnviada
          ).length;
          return (
            <div key={c.id}>
              <div
                className="text-sm mb-1"
                style={{ color: C.ink, fontWeight: 600, fontFamily: "'Fraunces', serif" }}
              >
                {c.nombre}
              </div>
              <BarraCompacta icono={ClipboardList} completado={completosDatos} total={suyos.length} color={C.ink} />
              <BarraCompacta icono={Euro} completado={pagados} total={suyos.length} color={C.gold} />
              <BarraCompacta icono={Mail} completado={familiasConInvitacion} total={familias.length} color={C.wax} />
            </div>
          );
        })}
      </div>
      {colaboradores.length === 0 && (
        <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Añade colaboradores para ver su progreso individual.
        </p>
      )}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <ProgresoBar
          label="Cobro (confirmados que ya han pagado)"
          completado={invitados.filter((g) => g.confirmado && g.pagado).length}
          total={confirmadosCount}
          color={C.gold}
        />
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
          Informativo — no bloquea a nadie, solo para saber cuánto falta de la canción
          para el DJ. Las alergias se avisan directamente en la mesa (sección Mesas) y
          tienen su propia lista imprimible más abajo.
        </p>
        <ProgresoBar
          label="Con canción registrada"
          completado={
            invitados.filter((g) => g.confirmado && g.cancion && g.cancion.trim()).length
          }
          total={confirmadosCount}
        />
      </div>
    </VentanaFlotante>
  );
}
