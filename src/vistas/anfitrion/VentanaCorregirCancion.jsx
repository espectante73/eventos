// «Corregir canción» (él, v79.6): el anfitrión toca una línea de «Canciones
// para bailar» y corrige cómo la escribió esa persona, con los dos huecos
// del formulario (Canción y Artista, en la misma línea: norma 6). Se guarda
// en su ficha, también si ya pagó (la ficha cerrada lo es para el
// colaborador, no para el anfitrión). La regla, en lib/canciones.js.
//
// `peticion`: { invitadoId, hueco } corrige esa línea; { clave } (desde
// «Repasar canciones», v80.1), todas las peticiones de esa canción.
import { useState } from "react";
import { C, DEDO, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { CampoCancion } from "../../components/CampoCancion";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { nombreCompleto } from "../../lib/formato";
import { calcularEdad } from "../../lib/invitados";
import { huecosCanciones, cancionesPedidas, corregirCancion, corregirCancionEnTodas } from "../../lib/canciones";

export function VentanaCorregirCancion({ data, peticion, onCerrar }) {
  const { invitados, evento, persistInvitados } = data;
  const enTodas = Boolean(peticion.clave);
  const pedidas = enTodas ? cancionesPedidas(invitados, () => null).filter((f) => f.clave === peticion.clave) : [peticion];
  const { invitadoId, hueco } = pedidas[0] || {};
  const g = invitados.find((x) => x.id === invitadoId);
  const inicial = huecosCanciones(g?.cancion)[hueco ?? 0];
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [artista, setArtista] = useState(inicial.artista);
  const [aviso, setAviso] = useState("");
  // Quién la pidió, con su edad: para consultarle si se cambia o no se
  // encuentra (él, v80.3: desde «Repasar» solo salía cuántas veces).
  const quien = (id) => {
    const p = invitados.find((x) => x.id === id);
    if (!p) return "";
    const edad = calcularEdad(p.anioNacimiento, evento);
    return `${nombreCompleto(p)}${edad != null ? ` (${edad})` : ""}`;
  };

  const guardar = () => {
    const { invitados: siguiente, aviso: motivo } = enTodas
      ? corregirCancionEnTodas(invitados, peticion.clave, { titulo, artista })
      : corregirCancion(invitados, invitadoId, hueco, { titulo, artista });
    setAviso(motivo);
    if (motivo) return;
    if (siguiente !== invitados) persistInvitados(siguiente);
    onCerrar();
  };

  return (
    <VentanaFlotante clave="corregirCancion" titulo="Corregir canción" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3">
        <div className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {pedidas.length === 1 ? (
            <p className="truncate">Pedida por {quien(invitadoId)}</p>
          ) : (
            <>
              <p>Pedida {pedidas.length} veces, se corrige en todas:</p>
              {pedidas.map((f) => (
                <p key={`${f.invitadoId}-${f.hueco}`} className="truncate">
                  · {quien(f.invitadoId)}
                </p>
              ))}
            </>
          )}
        </div>
        {/* Con su ▶ (v81.1): escucharla antes de guardar; «Usar así» la
            deja como en Deezer. */}
        <CampoCancion
          titulo={titulo}
          artista={artista}
          buscar={data.buscarParaEscuchar}
          onCambiar={(c) => {
            setTitulo(c.titulo);
            setArtista(c.artista);
          }}
        />
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
