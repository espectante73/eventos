// Ventana "Mesas": lista de mesas redondas, añadir/eliminar, cambiar
// capacidad, vaciar, y auto-asignación preliminar (respetando el grupo
// familiar) con su aviso de familias que se quedaron sin mesa. Extraída
// de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 3).
//
// `ocupacionMesa` no vive aquí: se sigue definiendo en VistaAnfitrion
// porque el Plano de mesas y la tabla principal de invitados también la
// usan. `panelFlotante`/`setPanelFlotante` tampoco son de aquí en
// exclusiva -son el mismo interruptor compartido con los paneles
// "tabla"/"canciones"/"alergias"-, así que llegan como props en vez de
// definirse dentro.
import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { C } from "../../theme";
import { tieneAlergiaReal } from "../../lib/invitados";
import { MesaRedonda } from "../../components/Mesas";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";

export function VentanaMesas({ data, ocupacionMesa, panelFlotante, setPanelFlotante, onCerrar }) {
  const { mesas, invitados, persistMesas, persistInvitados } = data;
  const [avisosMesas, setAvisosMesas] = useState([]);

  const cambiarCapacidadMesa = (numero, capacidad) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, capacidad: Number(capacidad) || 0 } : m))
    );
  };

  const anadirMesa = () => {
    const siguiente = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    persistMesas([...mesas, { numero: siguiente, capacidad: 10 }]);
  };

  const eliminarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length > 0) {
      const confirmar = window.confirm(
        `La mesa ${numero} tiene ${afectados.length} invitado(s) asignado(s). Al eliminarla, ` +
          `vuelven a quedar sin mesa (no se borra a nadie). ¿Continuar?`
      );
      if (!confirmar) return;
      persistInvitados(
        invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g))
      );
    }
    persistMesas(mesas.filter((m) => m.numero !== numero));
  };

  const vaciarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length === 0) return;
    const confirmar = window.confirm(
      `Vaciar la mesa ${numero}: ${afectados.length} invitado(s) volverán a quedar sin mesa ` +
        `(no se borra a nadie). ¿Continuar?`
    );
    if (!confirmar) return;
    persistInvitados(invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g)));
  };

  // Auto-asignación de mesas: nunca reparte un grupo familiar entre varias
  // mesas por su cuenta. Si parte del grupo ya está sentada a mano, intenta
  // completar el resto en esa misma mesa; si no cabe entero (ahí o en
  // cualquier otra), no toca nada y genera un aviso para que el Anfitrión lo
  // resuelva a mano (subiendo capacidad, moviendo gente, etc.).
  const autoAsignarMesas = () => {
    const nuevos = invitados.map((g) => ({ ...g }));
    const ocupacion = {};
    mesas.forEach((m) => {
      ocupacion[m.numero] = nuevos.filter((g) => g.mesa === m.numero && g.confirmado).length;
    });

    const gruposMap = {};
    nuevos.forEach((g) => {
      if (g.confirmado) {
        const key = (g.grupoFamiliar || g.apellido || g.id).trim().toLowerCase();
        (gruposMap[key] = gruposMap[key] || []).push(g);
      }
    });

    const avisos = [];

    // Los grupos con más gente sin sentar van primero, para que no se queden
    // sin hueco por culpa de familias pequeñas que se adelantaron.
    const gruposOrdenados = Object.values(gruposMap).sort(
      (a, b) => b.filter((g) => !g.mesa).length - a.filter((g) => !g.mesa).length
    );

    gruposOrdenados.forEach((grupo) => {
      const sinMesa = grupo.filter((g) => !g.mesa);
      if (sinMesa.length === 0) return;

      const nombreGrupo = grupo[0].grupoFamiliar || grupo[0].apellido || "(sin nombre)";
      const mesasYaUsadas = [...new Set(grupo.filter((g) => g.mesa).map((g) => g.mesa))];

      if (mesasYaUsadas.length > 1) {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ya está repartida a mano entre las mesas ${mesasYaUsadas.join(
            ", "
          )} — revísalo si no era intencional`,
        });
        return;
      }

      const mesaObjetivo =
        mesasYaUsadas.length === 1 ? mesas.find((m) => m.numero === mesasYaUsadas[0]) : null;

      if (mesaObjetivo) {
        const hueco = mesaObjetivo.capacidad - (ocupacion[mesaObjetivo.numero] || 0);
        if (hueco >= sinMesa.length) {
          sinMesa.forEach((g) => {
            g.mesa = mesaObjetivo.numero;
          });
          ocupacion[mesaObjetivo.numero] = (ocupacion[mesaObjetivo.numero] || 0) + sinMesa.length;
        } else {
          avisos.push({
            grupo: nombreGrupo,
            motivo: `no caben ${sinMesa.length} persona${
              sinMesa.length !== 1 ? "s" : ""
            } más en la Mesa ${mesaObjetivo.numero} (solo ${Math.max(
              hueco,
              0
            )} libres) — se han dejado sin mesa`,
          });
        }
        return;
      }

      const mesaElegida = mesas.find(
        (m) => m.capacidad - (ocupacion[m.numero] || 0) >= sinMesa.length
      );
      if (mesaElegida) {
        sinMesa.forEach((g) => {
          g.mesa = mesaElegida.numero;
        });
        ocupacion[mesaElegida.numero] = (ocupacion[mesaElegida.numero] || 0) + sinMesa.length;
      } else {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ninguna mesa tiene ${sinMesa.length} hueco${
            sinMesa.length !== 1 ? "s" : ""
          } libres juntos — se han dejado sin mesa`,
        });
      }
    });

    persistInvitados(nuevos);
    setAvisosMesas(avisos);
    setPanelFlotante(avisos.length > 0 ? "avisosMesas" : null);
  };

  return (
    <>
      <VentanaFlotante clave="mesas" titulo="Mesas" onCerrar={onCerrar}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            Define primero cuántos comensales caben en cada mesa. Luego puedes generar una
            distribución preliminar (respetando el grupo familiar) y ajustarla a mano.
          </p>
          <div className="flex items-center gap-2 ml-3">
            {avisosMesas.length > 0 && (
              <button
                onClick={() => setPanelFlotante("avisosMesas")}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                style={{ background: C.wax, color: "#fff" }}
                title="Ver familias que se quedaron sin mesa"
              >
                <AlertTriangle size={12} /> {avisosMesas.length} aviso{avisosMesas.length !== 1 && "s"}
              </button>
            )}
            <button
              onClick={autoAsignarMesas}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ background: C.ink, color: C.paper }}
            >
              Auto-asignar (preliminar)
            </button>
            <button
              onClick={anadirMesa}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ border: `1px solid ${C.ink}`, color: C.ink }}
            >
              <Plus size={14} /> Añadir mesa
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {mesas.map((m) => {
            const ocupados = ocupacionMesa(m.numero);
            const lleno = ocupados >= m.capacidad && m.capacidad > 0;
            const tieneAlergias = invitados.some(
              (g) => g.mesa === m.numero && g.confirmado && tieneAlergiaReal(g)
            );
            return (
              <MesaRedonda
                key={m.numero}
                m={m}
                ocupados={ocupados}
                lleno={lleno}
                tieneAlergias={tieneAlergias}
                onCambiarCapacidad={(v) => cambiarCapacidadMesa(m.numero, v)}
                onEliminar={() => eliminarMesa(m.numero)}
                onVaciar={() => vaciarMesa(m.numero)}
              />
            );
          })}
          {mesas.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay mesas — pulsa "Añadir mesa" para crear la primera.
            </p>
          )}
        </div>
      </VentanaFlotante>

      {panelFlotante === "avisosMesas" && (
        <ModalFlotante
          titulo="⚠ Familias sin mesa completa"
          colorTitulo={C.wax}
          onCerrar={() => setPanelFlotante(null)}
        >
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
            La auto-asignación nunca reparte un grupo familiar entre mesas por su cuenta.
            Estas familias se han quedado (total o parcialmente) sin mesa — sube la capacidad
            de alguna mesa, mueve gente a mano, o vuelve a pulsar "Auto-asignar" tras
            ajustarlo. Cuando ya no queden avisos, la distribución está completa.
          </p>
          <div className="space-y-2">
            {avisosMesas.map((a, i) => (
              <div
                key={i}
                className="p-2 rounded text-sm"
                style={{ background: "#FBEAEA", border: `1px solid ${C.wax}`, color: C.charcoal }}
              >
                <strong style={{ color: C.wax }}>Familia {a.grupo}</strong>: {a.motivo}
              </div>
            ))}
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
