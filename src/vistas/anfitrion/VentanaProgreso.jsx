// Ventana "Progreso de recopilación": barras de progreso generales, y
// tres barras por colaborador (datos / pagos / invitaciones enviadas,
// cada una de un color distinto, a petición del usuario 2026-08-12) y
// de canciones registradas. Extraída de VistaAnfitrion.jsx en el
// reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { ProgresoBar } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

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
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
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
              <ProgresoBar label="Datos" completado={completosDatos} total={suyos.length} color={C.ink} />
              <ProgresoBar label="Pagos" completado={pagados} total={suyos.length} color={C.gold} />
              <ProgresoBar
                label="Invitaciones"
                completado={familiasConInvitacion}
                total={familias.length}
                color={C.wax}
              />
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
