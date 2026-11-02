// «Corregir canción» (él, v79.6): el anfitrión toca una línea de «Canciones
// para bailar» y corrige cómo la escribió esa persona, con los dos huecos
// del formulario (Canción y Artista, en la misma línea: norma 6). Se guarda
// en su ficha, también si ya pagó (la ficha cerrada lo es para el
// colaborador, no para el anfitrión). La regla, en lib/canciones.js.
import { useState } from "react";
import { C, DEDO, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { TextInput } from "../../components/Formulario";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { nombreCompleto } from "../../lib/formato";
import { calcularEdad } from "../../lib/invitados";
import { huecosCanciones, corregirCancion } from "../../lib/canciones";

export function VentanaCorregirCancion({ data, peticion, onCerrar }) {
  const { invitados, evento, persistInvitados } = data;
  const g = invitados.find((x) => x.id === peticion.invitadoId);
  const inicial = huecosCanciones(g?.cancion)[peticion.hueco];
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [artista, setArtista] = useState(inicial.artista);
  const [aviso, setAviso] = useState("");
  const edad = g ? calcularEdad(g.anioNacimiento, evento) : null;

  const guardar = () => {
    const { invitados: siguiente, aviso: motivo } = corregirCancion(invitados, peticion.invitadoId, peticion.hueco, { titulo, artista });
    setAviso(motivo);
    if (motivo) return;
    if (siguiente !== invitados) persistInvitados(siguiente);
    onCerrar();
  };

  return (
    <VentanaFlotante clave="corregirCancion" titulo="Corregir canción" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3">
        {g && (
          <p className="text-sm truncate" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Pedida por {nombreCompleto(g)}
            {edad != null && ` (${edad})`}
          </p>
        )}
        <div className="flex items-center gap-2">
          <TextInput value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Canción" aria-label="Canción" className="flex-1 min-w-0" />
          <TextInput value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Artista" aria-label="Artista" className="flex-1 min-w-0" />
        </div>
        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
        {/* Al pie, Cancelar y Guardar, iguales (normas 4 y 5); «Guardar», del lado del pulgar. */}
        <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={onCerrar} style={{ minHeight: DEDO }}>
            Cancelar
          </Boton>
          <Boton variante="principal" onClick={guardar} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Guardar
          </Boton>
        </div>
      </div>
    </VentanaFlotante>
  );
}
