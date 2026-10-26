// La pregunta al cerrar la Lista de invitados con colaboradores por avisar
// (tienen invitados nuevos, ya confirmados). Una sola pieza (norma 7) para
// los dos cierres: la X de la Lista dentro de la app (el móvil) y la Lista
// en su ventana propia del Mac, que se cierra con el botón rojo del sistema
// y por eso pregunta DESPUÉS, ya en la pantalla principal (él, v73.4: ahí
// no salía nunca, porque esa ventana no tiene la X de la app).
import { C, OP } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";

// `invitados`: para decir cuántos nuevos tiene cada uno (v73.5: «nuevo» es
// confirmado y aún sin avisarle a él, ver avisoPendiente en schema.sql).
const nuevosDe = (invitados, c) => invitados.filter((g) => g.colaboradorId === c.id && g.avisoPendiente && g.confirmado).length;

export function ResumenAvisosAsignacion({ colaboradores, invitados = [], enviando, onEnviar, onSeguirEditando, onNoAvisar }) {
  return (
    <ModalFlotante titulo="Resumen de asignaciones" onCerrar={onNoAvisar}>
      <p className="text-sm mb-3" style={{ color: C.charcoal }}>
        Estos colaboradores tienen invitados nuevos asignados. ¿Quieres avisarles ya?
      </p>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: OP.secundario }}>
        En el mismo correo se les recuerda, aparte, a quién de los que ya tenían le faltan datos.
      </p>
      <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
        {colaboradores.map((c) => (
          <li key={c.id}>
            {c.nombre}
            {nuevosDe(invitados, c) > 0 && ` · ${nuevosDe(invitados, c)} ${nuevosDe(invitados, c) === 1 ? "nuevo" : "nuevos"}`}
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
