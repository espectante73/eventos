// Ventana "Progreso de recopilación": barras de progreso generales, y un
// recuadro compacto POR COLABORADOR (no uno por métrica) con sus 3 barras
// dentro (datos / pagos / invitaciones enviadas) -- mismo recuadro que ya
// usa el propio formulario del colaborador para su resumen (el 6º
// recuadro de VistaColaborador.jsx: rounded, fondo C.paperDark, las 3
// BarraCompacta apiladas dentro), alineados 3 por fila -- a petición del
// usuario (2026-08-17; primer intento puso 3 recuadros por colaborador,
// uno por métrica, que no era la idea). Y de canciones registradas.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 1).
import { ClipboardList, Euro, Mail, Music } from "lucide-react";
import { C } from "../../theme";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { ProgresoBar, BarraCompacta } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaProgreso({ data, onCerrar }) {
  const { invitados, colaboradores, ordenFamiliares } = data;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;

  return (
    <VentanaFlotante clave="progreso" titulo="Progreso de recopilación" onCerrar={onCerrar}>
      {/* Las dos barras generales van juntas arriba (antes la de Cobro
          estaba separada, después del grid de colaboradores) y con
          icono en vez de texto -- los mismos ClipboardList/Euro que ya
          se usan en los recuadros de colaborador de más abajo, más
          intuitivo que repetir la misma idea en dos formatos distintos
          (a petición del usuario, 2026-08-17). */}
      <ProgresoBar
        label="Confirmados con datos completos"
        icono={ClipboardList}
        completado={invitados.filter((g) => g.confirmado && datosCompletos(g)).length}
        total={confirmadosCount}
        color={C.ink}
      />
      <ProgresoBar
        label="Confirmados que ya han pagado"
        icono={Euro}
        completado={invitados.filter((g) => g.confirmado && g.pagado).length}
        total={confirmadosCount}
        color={C.gold}
      />
      <div className="grid grid-cols-3 gap-1.5 pt-1" style={{ borderTop: `1px solid ${C.line}` }}>
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
            <div key={c.id} className="rounded p-2" style={{ background: C.paperDark }}>
              <div
                className="text-xs mb-1 truncate"
                style={{ color: C.ink, fontWeight: 600, fontFamily: "'Fraunces', serif" }}
                title={c.nombre}
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
        <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
          Informativo — no bloquea a nadie, solo para saber cuánto falta de la canción
          para el DJ. Las alergias se avisan directamente en la mesa (sección Mesas) y
          tienen su propia lista imprimible más abajo.
        </p>
        <ProgresoBar
          label="Con canción registrada"
          icono={Music}
          completado={
            invitados.filter((g) => g.confirmado && g.cancion && g.cancion.trim()).length
          }
          total={confirmadosCount}
          color={C.wax}
        />
      </div>
    </VentanaFlotante>
  );
}
