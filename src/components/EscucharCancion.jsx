// La escucha previa (él, v81.1): ▶ junto a una canción suena 30 s de Deezer.
// Si no aparece, está mal escrita. Suena una sola a la vez en toda la app.
//
// - useEscucharCancion (la ficha del invitado, «Corregir canción»): da el
//   botón, para la línea de la canción, y lo de debajo: hasta 3 que se
//   llaman parecido, cada una con su ▶ y, con `onUsar`, «Usar así» para
//   dejarla escrita como en Deezer.
// - EscucharCancion (las listas): solo el botón; suena la primera. Si no
//   la encuentra, el botón lo dice.
//
// ⚠️ El sonido, en la ventana donde está el botón (realmDe): la Lista es
// otra ventana del sistema, y el navegador solo deja sonar a la que se
// tocó. Y se arranca DENTRO del toque, con un silencio, antes de esperar
// al buscador: el iPhone no deja empezar a sonar después (CLAUDE.md 2.1).
import { useEffect, useRef, useState } from "react";
import { Play, Square, VolumeX, Loader2 } from "lucide-react";
import { C, OP, R } from "../theme";
import { Boton } from "./Boton";
import { LineaAviso } from "./LineaAviso";
import { realmDe } from "../lib/realm";
import { textoCancion } from "../lib/canciones";
import { minutosYSegundos } from "../lib/repasoCanciones";

// El ▶ y el ■ rellenos, en dorado como las estrellas (él, v81.2: «ponle
// color»); en rojo, la que no está en Deezer.
const relleno = (Icono) => {
  const ConRelleno = (props) => <Icono {...props} fill="currentColor" />;
  return ConRelleno;
};
const PlayRelleno = relleno(Play);
const PararRelleno = relleno(Square);

// Un WAV vacío: abre el sonido dentro del toque.
const SILENCIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// La que suena ahora, en toda la app: al empezar otra, se para.
let pararLaQueSuena = null;

export function useEscucharCancion({ consulta, buscar, onUsar }) {
  // parado · buscando · sonando · nada · error
  const [estado, setEstado] = useState("parado");
  const [resultado, setResultado] = useState(null);
  const [cual, setCual] = useState(0);
  const audio = useRef(null);
  const clave = `${consulta.titulo}|${consulta.artista}|${consulta.deezer || ""}`;

  const parar = () => {
    audio.current?.pause();
    setEstado((e) => (e === "sonando" ? "parado" : e));
  };
  useEffect(() => () => audio.current?.pause(), []);
  // Escrita de otra forma: lo de antes ya no vale.
  useEffect(() => {
    audio.current?.pause();
    setResultado(null);
    setEstado("parado");
  }, [clave]);

  const sonar = (candidato, i) => {
    if (pararLaQueSuena && pararLaQueSuena !== parar) pararLaQueSuena();
    pararLaQueSuena = parar;
    audio.current.src = candidato.muestra;
    audio.current.onended = () => setEstado("parado");
    audio.current.play()?.catch?.(() => setEstado("error"));
    setCual(i);
    setEstado("sonando");
  };

  const pulsar = async (e, i = 0) => {
    if (estado === "sonando" && cual === i) {
      parar();
      return;
    }
    // Dentro del toque y en su ventana: así el móvil deja sonar luego.
    const { win } = realmDe(e.currentTarget);
    if (!audio.current || audio.current.ownerDocument !== win.document) audio.current = new win.Audio();
    audio.current.src = SILENCIO;
    audio.current.play()?.catch?.(() => {});
    if (resultado?.candidatos?.[i]) {
      sonar(resultado.candidatos[i], i);
      return;
    }
    setEstado("buscando");
    const r = await buscar(consulta);
    if (r.error) {
      setEstado("error");
      setResultado({ error: r.error });
      return;
    }
    setResultado(r);
    if (r.candidatos?.length) sonar(r.candidatos[0], 0);
    else setEstado("nada");
  };

  const icono = estado === "buscando" ? Loader2 : estado === "sonando" ? PararRelleno : estado === "nada" ? VolumeX : PlayRelleno;
  const titulo =
    estado === "sonando" ? "Parar" : estado === "nada" ? "No la encuentro en Deezer: revisa cómo está escrita" : estado === "error" ? "No se pudo escuchar" : "Escuchar 30 segundos";
  const boton = (
    <Boton
      variante="secundario"
      tamano="pequeno"
      icono={icono}
      titulo={titulo}
      disabled={estado === "buscando"}
      onClick={(e) => pulsar(e, cual)}
      style={estado === "nada" ? { color: C.peligro, borderColor: C.peligro } : { color: C.gold, borderColor: C.gold }}
    />
  );
  const escrita = textoCancion(String(consulta.titulo || "").trim(), String(consulta.artista || "").trim()).toLowerCase();
  return { boton, panel: panel() };

  function panel() {
    if (estado === "nada") return <LineaAviso className="text-sm">No la encuentro en Deezer: revisa cómo está escrita.</LineaAviso>;
    if (estado === "error") return <LineaAviso className="text-sm">No se pudo escuchar: {resultado?.error || "prueba otra vez"}.</LineaAviso>;
    if (!resultado?.candidatos?.length) return null;
    return (
      <div className="text-sm" style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" }}>
        {resultado.soloTitulo && (
          <p className="px-2 pt-1 text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Con ese cantante no está; estas se llaman igual:
          </p>
        )}
        {resultado.candidatos.map((c, i) => (
          <div key={c.deezer || i} className="flex items-center gap-2 px-2 py-1" style={{ background: i % 2 ? C.paperDark : C.blanco }}>
            <Boton
              variante="secundario"
              tamano="pequeno"
              icono={estado === "sonando" && cual === i ? PararRelleno : PlayRelleno}
              titulo={estado === "sonando" && cual === i ? "Parar" : "Escuchar 30 segundos"}
              onClick={(e) => pulsar(e, i)}
              style={{ color: C.gold, borderColor: C.gold }}
            />
            <span className="flex-1 min-w-0 truncate" title={textoCancion(c.titulo, c.artista)}>
              {textoCancion(c.titulo, c.artista)}
              <span style={{ color: C.charcoal, opacity: OP.secundario }}> · {minutosYSegundos(c.duracion)}</span>
            </span>
            {onUsar && textoCancion(c.titulo, c.artista).toLowerCase() !== escrita && (
              <Boton variante="principal" tamano="pequeno" onClick={() => onUsar(c)}>
                Usar así
              </Boton>
            )}
          </div>
        ))}
      </div>
    );
  }
}

// En una lista: solo el botón.
export function EscucharCancion(props) {
  return useEscucharCancion(props).boton;
}
