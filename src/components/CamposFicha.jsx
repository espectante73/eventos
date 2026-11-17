// Dos apartados de la ficha de un invitado que salen igual en la del
// colaborador y en «Nuevo invitado» de la Lista (él, v87.1): una sola pieza
// para los dos (norma 7).
//
// - Las alergias: «No», «Gluten», «Lactosa» y «Otras» (con su campo). Cómo
//   se guardan, en lib/alergias.js. Lo marcado vive aquí y nace de `valor` al
//   montar (trampa 2.4): para empezar con otro invitado, la pantalla le
//   cambia la `key`.
// - «Autorizo expresamente a que guarden mis datos»: la promete la nota de
//   privacidad (trampa 2.6), con su frase palabra por palabra. ⚠️ Nace
//   DESMARCADA: un permiso que viene dado de fábrica no es un permiso.
import { useState } from "react";
import { C, OP } from "../theme";
import { TextInput } from "./Formulario";
import { MAX_OTRAS_ALERGIAS, parsearAlergias, textoAlergias } from "../lib/alergias";

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
          placeholder="Otras alergias"
          maxLength={MAX_OTRAS_ALERGIAS}
          style={{ flex: "1 1 140px", minWidth: 0 }}
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
