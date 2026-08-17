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
import { BarraCompacta } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaProgreso({ data, onCerrar }) {
  const { invitados, colaboradores, ordenFamiliares } = data;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;

  return (
    <VentanaFlotante clave="progreso" titulo="Progreso de recopilación" onCerrar={onCerrar}>
      {/* Las 3 barras generales (datos, cobro, canciones) en un solo
          recuadro verde/dorado -- mismo lenguaje que el resto de la app
          (Portada.jsx: degradado C.ink + borde/texto en dorado). Dentro,
          BarraCompacta (icono + barra + porcentaje en una sola línea,
          igual que los recuadros de colaborador de más abajo) en vez del
          ProgresoBar grande de dos líneas -- ahorra espacio en pantalla.
          `claro` en las 3 porque van sobre fondo oscuro. A petición del
          usuario, 2026-08-17. */}
      <div
        className="rounded p-3 mb-3"
        style={{ background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)", border: `1px solid ${C.gold}` }}
      >
        <BarraCompacta
          icono={ClipboardList}
          completado={invitados.filter((g) => g.confirmado && datosCompletos(g)).length}
          total={confirmadosCount}
          color={C.goldClaro}
          claro
        />
        <BarraCompacta
          icono={Euro}
          completado={invitados.filter((g) => g.confirmado && g.pagado).length}
          total={confirmadosCount}
          color={C.goldClaro}
          claro
        />
        <BarraCompacta
          icono={Music}
          completado={invitados.filter((g) => g.confirmado && g.cancion && g.cancion.trim()).length}
          total={confirmadosCount}
          color={C.goldClaro}
          claro
        />
      </div>
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
      <p className="text-xs mt-3" style={{ color: C.charcoal, opacity: 0.6 }}>
        Canciones — informativo, no bloquea a nadie, solo para saber cuánto falta para el
        DJ. Las alergias se avisan directamente en la mesa (sección Mesas) y tienen su
        propia lista imprimible más abajo.
      </p>
    </VentanaFlotante>
  );
}
