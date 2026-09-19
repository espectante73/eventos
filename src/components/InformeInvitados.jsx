// Panel "Revisión" de la Lista de invitados (2026-09-04).
//
// Plegado por defecto: cuando no hay nada raro, es una línea verde que
// dice que todo cuadra. Al abrirlo, cada hallazgo trae sus nombres, y
// tocar un nombre lo BUSCA en la propia lista -- el informe señala, la
// lista es donde se corrige (ver CLAUDE.md, "La Lista de invitados es
// la raíz").
import { useState } from "react";
import { ChevronDown, AlertTriangle, CircleCheck, Clock } from "lucide-react";
import { C } from "../theme";
import { Boton } from "./Boton";
import { BotonQuitar } from "./PreguntaSeguridad";

// `excepciones`: los casos aceptados a propósito (lib/revisionInvitados.js).
// `onExcepcion(persona, hallazgo)` / `onQuitarExcepcion(persona, clave)`.
export function InformeInvitados({ hallazgos, excepciones = [], onBuscar, onCerrar, onExcepcion, onQuitarExcepcion }) {
  // Nace ABIERTO: se llega hasta aquí desde "Acciones" → Revisión, así
  // que quien lo abre quiere verlo ya, no volver a desplegarlo.
  const [abierto, setAbierto] = useState(true);
  const errores = hallazgos.filter((h) => h.tipo === "error");
  const pendientes = hallazgos.filter((h) => h.tipo === "pendiente");
  const todoBien = hallazgos.length === 0;

  const resumen = todoBien
    ? "Todo cuadra"
    : [
        errores.length ? `${errores.length} ${errores.length === 1 ? "incoherencia" : "incoherencias"}` : null,
        pendientes.length ? `${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <div
      className="rounded mb-3"
      style={{ border: `1px solid ${errores.length ? C.peligro : C.line}`, background: "#fff" }}
    >
      {/* Arriba, siempre a la vista: plegar (el título) y SALIR ("Cerrar").
          Antes el título solo plegaba -- al tocarlo otra vez volvía a
          abrirse -- y el único "Cerrar" estaba al final de todos los
          avisos: el usuario no encontraba cómo salir (2026-09-19). Cerrar
          devuelve la lista a como estaba antes de abrir la Revisión.
          "Cerrar" del lado del pulgar, en espejo con la mano izquierda. */}
      <div className="flex items-center gap-2 pr-2 zurdo:flex-row-reverse zurdo:pr-0 zurdo:pl-2">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="boton-3d flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-sm"
        style={{ color: C.charcoal }}
      >
        {todoBien ? (
          <CircleCheck size={16} style={{ color: C.ink, flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={16} style={{ color: errores.length ? C.peligro : C.gold, flexShrink: 0 }} />
        )}
        <span style={{ fontWeight: 600 }}>Revisión</span>
        <span style={{ opacity: 0.75 }}>{resumen}</span>
        <ChevronDown
          size={16}
          className="ml-auto"
          style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .15s ease", flexShrink: 0 }}
        />
      </button>
      <Boton tamano="pequeno" onClick={onCerrar} titulo="Salir de la Revisión y volver a la lista como estaba">
        Cerrar
      </Boton>
      </div>

      {abierto && todoBien && (
        <p className="px-3 pb-3 text-sm" style={{ color: C.charcoal, opacity: 0.7 }}>
          No hay incoherencias ni nada pendiente en la lista.
        </p>
      )}

      {abierto && !todoBien && (
        <div className="px-3 pb-3 space-y-2">
          {[...errores, ...pendientes].map((h) => (
            <div
              key={h.clave}
              className="rounded px-3 py-2"
              style={{
                background: h.tipo === "error" ? C.avisoFondo : C.paperDark,
                border: `1px solid ${h.tipo === "error" ? C.peligro : C.line}`,
              }}
            >
              <div className="flex items-center gap-2 text-sm">
                {h.tipo === "error" ? (
                  <AlertTriangle size={14} style={{ color: C.peligro, flexShrink: 0 }} />
                ) : (
                  <Clock size={14} style={{ color: C.charcoal, opacity: 0.6, flexShrink: 0 }} />
                )}
                <span style={{ fontWeight: 600, color: h.tipo === "error" ? C.peligro : C.charcoal }}>
                  {h.titulo}
                </span>
                <span
                  className="rounded px-1.5"
                  style={{
                    background: h.tipo === "error" ? C.peligro : C.ink,
                    color: "#fff",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  {h.personas.length}
                </span>
              </div>
              {h.ayuda && (
                <p className="text-xs mt-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  {h.ayuda}
                </p>
              )}
              {/* Los nombres, para ir uno a uno. Se cortan a 12: con más
                  de eso no es un repaso, es la lista entera -- y para
                  eso están los filtros de la propia tabla. */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {h.personas.slice(0, 12).map((g) => (
                  // `etiqueta`: el hallazgo no es una persona sino, p. ej., un
                  // colaborador con su cifra ("Ana: 14"). A esos no se les
                  // puede dar por buena una excepción: no son un invitado.
                  <span key={g.id} className="inline-flex items-center gap-1">
                    <Boton variante="secundario" tamano="pequeno" onClick={() => onBuscar(g)} titulo={g.etiqueta ? "Verlo en la lista" : "Buscarlo en la lista"}>
                      {g.etiqueta || `${g.apellido}, ${g.nombre}`}
                    </Boton>
                    {!g.etiqueta && onExcepcion && (
                      <Boton tamano="pequeno" onClick={() => onExcepcion(g, h)} titulo="Es un caso consciente: dejar de avisar de él">
                        Excepción
                      </Boton>
                    )}
                  </span>
                ))}
                {h.personas.length > 12 && (
                  <span className="text-xs self-center" style={{ color: C.charcoal, opacity: 0.6 }}>
                    y {h.personas.length - 12} más
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Las excepciones aceptadas, al pie y plegadas (norma de la app):
          para ver qué se ha dado por bueno y poder deshacerlo. */}
      {abierto && excepciones.length > 0 && (
        <details className="px-3 pb-3 text-xs" style={{ color: C.charcoal }}>
          <summary className="cursor-pointer select-none" style={{ opacity: 0.8 }}>
            Excepciones permitidas ({excepciones.length})
          </summary>
          <div className="mt-2 space-y-1.5">
            {excepciones.map(({ clave, titulo, persona }) => (
              <div key={`${persona.id}-${clave}`} className="flex items-center gap-2">
                <span className="flex-1 min-w-0">
                  <b>
                    {persona.apellido}, {persona.nombre}
                  </b>{" "}
                  · {titulo}
                </span>
                <BotonQuitar
                  titulo="Quitar esta excepción"
                  pregunta={{
                    titulo: "¿Quitar la excepción?",
                    texto: `La Revisión volverá a avisar de ${persona.nombre} ${persona.apellido}: «${titulo}».`,
                    rotulo: "Sí, quitarla",
                  }}
                  onClick={() => onQuitarExcepcion(persona, clave)}
                />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
