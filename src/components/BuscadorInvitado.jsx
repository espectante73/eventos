// Buscador con desplegable para elegir un invitado existente (usado, por
// ejemplo, al relevar a un colaborador). Movido fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState } from "react";
import { X } from "lucide-react";
import { C, inputStyle } from "../theme";
import { ordenarPorApellidoNombre } from "../lib/formato";
import { TextInput } from "./Formulario";

export function BuscadorInvitado({ invitados, invitadoId, onSeleccionar, placeholder }) {
  const [texto, setTexto] = useState("");
  const seleccionado = invitados.find((g) => g.id === invitadoId);

  const resultados = ordenarPorApellidoNombre(invitados).filter((g) => {
    if (!texto.trim()) return true;
    const t = texto.trim().toLowerCase();
    return `${g.apellido} ${g.nombre}`.toLowerCase().includes(t);
  });

  if (seleccionado) {
    return (
      <div className="flex items-center gap-1 flex-1" style={{ ...inputStyle, padding: "4px 8px" }}>
        <span className="flex-1 text-sm">
          {seleccionado.apellido}, {seleccionado.nombre}
        </span>
        <button
          onClick={() => {
            onSeleccionar("");
            setTexto("");
          }}
          title="Quitar selección"
        >
          <X size={13} style={{ color: C.wax }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <TextInput
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder || "Buscar por apellido o nombre..."}
        className="flex-1"
        style={{ minWidth: 160 }}
      />
      <select
        value=""
        onChange={(e) => {
          onSeleccionar(e.target.value);
          setTexto("");
        }}
        className="flex-1"
        style={{ ...inputStyle, minWidth: 160 }}
      >
        <option value="">
          {resultados.length === 0 ? "Sin coincidencias" : "— Elegir invitado existente —"}
        </option>
        {resultados.map((g) => (
          <option key={g.id} value={g.id}>
            {g.apellido}, {g.nombre}
          </option>
        ))}
      </select>
    </>
  );
}
