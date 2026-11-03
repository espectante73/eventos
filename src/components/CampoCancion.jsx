// Una canción en un formulario: «Canción» y «Artista» en la misma línea
// (norma 6) y, con `buscar`, su ▶ para escucharla en Deezer y, debajo, las
// que se llaman parecido con «Usar así» (v81.1). Una sola pieza para la
// ficha del invitado y «Corregir canción» (norma 7).
import { TextInput } from "./Formulario";
import { useEscucharCancion } from "./EscucharCancion";

export function CampoCancion({ titulo, artista, onCambiar, buscar, numero }) {
  const { boton, panel } = useEscucharCancion({
    consulta: { titulo, artista },
    buscar: buscar || (async () => ({ error: "sin buscador" })),
    onUsar: (c) => onCambiar({ titulo: c.titulo, artista: c.artista }),
  });
  const sufijo = numero ? ` ${numero}` : "";
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <TextInput value={titulo} onChange={(e) => onCambiar({ titulo: e.target.value, artista })} placeholder="Canción" aria-label={`Canción${sufijo}`} className="flex-1 min-w-0" />
        <TextInput value={artista} onChange={(e) => onCambiar({ titulo, artista: e.target.value })} placeholder="Artista" aria-label={`Artista${sufijo}`} className="flex-1 min-w-0" />
        {buscar && (titulo.trim() || artista.trim()) && boton}
      </div>
      {buscar && panel}
    </div>
  );
}
