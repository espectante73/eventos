// Dos apartados de la ficha de un invitado que salen igual en la del
// colaborador y en «Nuevo invitado» de la Lista (él, v87.1): una sola pieza
// para los dos (norma 7).
//
// - Las alergias: «No», «Gluten», «Lactosa» y «Otras» (con su campo, hasta 15
//   letras). Se guardan en un solo texto («Gluten, Lactosa»; «No» es la
//   respuesta de que no tiene). Lo marcado vive aquí y nace de `valor` al
//   montar (trampa 2.4): para empezar con otro invitado, la pantalla le
//   cambia la `key`.
// - «Autorizo expresamente a que guarden mis datos»: la promete la nota de
//   privacidad (trampa 2.6), con su frase palabra por palabra. ⚠️ Nace
//   DESMARCADA: un permiso que viene dado de fábrica no es un permiso.
import { useState } from "react";
import { C, OP } from "../theme";
import { TextInput } from "./Formulario";

export const MAX_OTRAS_ALERGIAS = 15;

export function parsearAlergias(texto) {
  const partes = (texto || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    no: partes.includes("No"),
    gluten: partes.includes("Gluten"),
    lactosa: partes.includes("Lactosa"),
    otras: partes.find((p) => p !== "No" && p !== "Gluten" && p !== "Lactosa") || "",
  };
}

export function textoAlergias(sel) {
  if (sel.no) return "No";
  const partes = [];
  if (sel.gluten) partes.push("Gluten");
  if (sel.lactosa) partes.push("Lactosa");
  if (sel.otras.trim()) partes.push(sel.otras.trim());
  return partes.join(", ");
}

export function ElegirAlergias({ valor, onCambiar }) {
  const [sel, setSel] = useState(() => parsearAlergias(valor));
  // «Otras»: su campo solo sale marcada (un plegado dentro de otro).
  const [conOtras, setConOtras] = useState(() => Boolean(parsearAlergias(valor).otras));
  const cambiar = (next) => {
    setSel(next);
    onCambiar(textoAlergias(next));
  };
  const marcarNo = () => {
    setConOtras(false);
    cambiar({ no: true, gluten: false, lactosa: false, otras: "" });
  };
  const alternar = (clave) => cambiar({ ...sel, no: false, [clave]: !sel[clave] });
  const cambiarOtras = (texto) => cambiar({ ...sel, no: false, otras: texto.slice(0, MAX_OTRAS_ALERGIAS) });
  const alternarOtras = () => {
    if (conOtras) {
      cambiarOtras("");
      setConOtras(false);
      return;
    }
    cambiar({ ...sel, no: false });
    setConOtras(true);
  };
  const casilla = (rotulo, marcada, onChange) => (
    <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
      <input type="checkbox" checked={marcada} onChange={onChange} />
      {rotulo}
    </label>
  );
  return (
    <div data-campo="alergias" className="flex flex-wrap items-center gap-3">
      {casilla("No", sel.no, marcarNo)}
      {casilla("Gluten", sel.gluten, () => alternar("gluten"))}
      {casilla("Lactosa", sel.lactosa, () => alternar("lactosa"))}
      {casilla("Otras", conOtras, alternarOtras)}
      {conOtras && (
        <TextInput
          aria-label="Otra alergia"
          value={sel.otras}
          onChange={(e) => cambiarOtras(e.target.value)}
          placeholder={`Otra (máx. ${MAX_OTRAS_ALERGIAS})`}
          maxLength={MAX_OTRAS_ALERGIAS}
          style={{ maxWidth: 140 }}
          autoFocus
        />
      )}
    </div>
  );
}

export function CasillaConservarDatos({ marcada, onCambiar }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: C.ink }}>
      <input type="checkbox" checked={Boolean(marcada)} onChange={(e) => onCambiar(e.target.checked)} className="flex-shrink-0 mt-0.5" />
      <span>
        Autorizo expresamente a que guarden mis datos
        <span className="block text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Para otra ocasión. Si no se marca, se borran a los 3 meses del evento.
        </span>
      </span>
    </label>
  );
}
