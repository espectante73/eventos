// La pregunta al cerrar la Lista de invitados con colaboradores por avisar
// (tienen invitados nuevos, ya confirmados). Una sola pieza (norma 7) para
// los dos cierres: la X de la Lista dentro de la app (el móvil) y la Lista
// en su ventana propia del Mac, que se cierra con el botón rojo del sistema
// y por eso pregunta DESPUÉS, ya en la pantalla principal (él, v73.4: ahí
// no salía nunca, porque esa ventana no tiene la X de la app).
import { C } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";

export function ResumenAvisosAsignacion({ colaboradores, enviando, onEnviar, onSeguirEditando, onNoAvisar }) {
  return (
    <ModalFlotante titulo="Resumen de asignaciones" onCerrar={onNoAvisar}>
      <p className="text-sm mb-3" style={{ color: C.charcoal }}>
        Estos colaboradores tienen invitados nuevos asignados. ¿Quieres avisarles ya?
      </p>
      <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
        {colaboradores.map((c) => (
          <li key={c.id}>
            {c.nombre}
            {!c.email && <span style={{ color: C.wax }}> — sin email, no se le podrá avisar</span>}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Boton variante="principal" onClick={onEnviar} disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar avisos"}
        </Boton>
        <Boton variante="secundario" onClick={onSeguirEditando}>
          Seguir editando
        </Boton>
        <Boton variante="peligro" onClick={onNoAvisar}>
          Cancelar (no avisar)
        </Boton>
      </div>
    </ModalFlotante>
  );
}
