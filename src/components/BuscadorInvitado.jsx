// Buscador con desplegable para elegir un invitado existente (usado, por
// ejemplo, al relevar a un colaborador). Movido fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
//
// v84.7, para «Nuevo invitado» (buscar a uno ya en la lista y editarlo):
// `estilo`, el de los campos de ese formulario (alto de dedo); `detalle`,
// lo que se añade tras el nombre en cada opción («sin confirmar»);
// `preguntaAlQuitar={null}`, cuando quien lo usa ya pregunta él. El
// desplegable es el `Desplegable` de los formularios: con el nativo, en
// Safari quedaba más bajo que el campo de al lado (v81.4).
import { useState } from "react";
import { inputStyle } from "../theme";
import { ordenarPorApellidoNombre, contiene } from "../lib/formato";
import { TextInput, Desplegable } from "./Formulario";
import { BotonQuitar } from "./PreguntaSeguridad";

const PREGUNTA_QUITAR = (g) => ({ titulo: "¿Quitar la selección?", texto: `${g.apellido}, ${g.nombre}`, rotulo: "Sí" });

export function BuscadorInvitado({ invitados, invitadoId, onSeleccionar, placeholder, estilo, detalle, preguntaAlQuitar }) {
  const [texto, setTexto] = useState("");
  const seleccionado = invitados.find((g) => g.id === invitadoId);

  const resultados = ordenarPorApellidoNombre(invitados).filter((g) => {
    if (!texto.trim()) return true;
    // Sin tildes ni comillas, como el buscador de la Lista (v78.3).
    return contiene(`${g.apellido} ${g.nombre}`, texto);
  });

  if (seleccionado) {
    return (
      <div className="flex items-center gap-1 flex-1" style={{ ...inputStyle, ...estilo, padding: "4px 8px" }}>
        <span className="flex-1 text-sm">
          {seleccionado.apellido}, {seleccionado.nombre}
        </span>
        <BotonQuitar
          titulo="Quitar selección"
          {...(preguntaAlQuitar === null ? { yaPregunta: true } : { pregunta: PREGUNTA_QUITAR(seleccionado) })}
          onClick={() => {
            onSeleccionar("");
            setTexto("");
          }}
        />
      </div>
    );
  }

  return (
    <>
      <TextInput
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder || "Buscar por apellido o nombre..."}
        aria-label="Buscar invitado"
        className="flex-1"
        style={{ minWidth: 160, ...estilo }}
      />
      <Desplegable
        aria-label="Elegir invitado"
        value=""
        onChange={(e) => {
          onSeleccionar(e.target.value);
          setTexto("");
        }}
        style={estilo}
      >
        <option value="">
          {/* Corto: en el móvil, el largo «— Elegir invitado existente —» se cortaba. */}
          {resultados.length === 0 ? "Sin coincidencias" : "Elegir invitado"}
        </option>
        {resultados.map((g) => {
          const extra = detalle?.(g);
          return (
            <option key={g.id} value={g.id}>
              {g.apellido}, {g.nombre}
              {extra ? ` · ${extra}` : ""}
            </option>
          );
        })}
      </Desplegable>
    </>
  );
}
