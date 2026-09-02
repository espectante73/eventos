// Ventana "Matrimonios" (2026-09-03).
//
// Para qué: cada matrimonio invitado ya tiene su foto de boda, y está
// previsto hacerles una foto nueva el día del evento -- de ahí que haga
// falta saber cuántos son, quiénes, de qué zona y, sobre todo, cuántos
// años cumplen ESE DÍA (no hoy), que es el número que va en el sello de
// cada imagen. Ver la idea "Las bodas de todos".
//
// No guarda nada: se lee entera de la Lista de invitados. La marca O/A
// de cada persona y el año de boda se ponen allí (y el año de boda lo
// suele rellenar el propio colaborador en su formulario).
import { AlertTriangle } from "lucide-react";
import { C } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { matrimoniosDeInvitados, anioDelEvento } from "../../lib/matrimonios";

const COLUMNAS = "1.1fr 1.2fr 1.2fr 0.9fr 0.7fr 0.9fr";

export function VentanaMatrimonios({ data, onCerrar }) {
  const { invitados, evento } = data;
  const matrimonios = matrimoniosDeInvitados(invitados, evento.fecha);
  const anioEvento = anioDelEvento(evento.fecha);
  const sinAnioBoda = matrimonios.filter((m) => m.aniversario === null).length;
  const confirmados = matrimonios.filter((m) => m.confirmados).length;

  const cifra = (etiqueta, valor) => (
    <div key={etiqueta} className="text-center">
      <div
        className="text-[10px] uppercase"
        style={{ color: C.goldClaro, opacity: 0.75, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {etiqueta}
      </div>
      <div
        className="text-sm font-bold rounded px-2 mt-0.5 inline-block"
        style={{ background: "rgba(239,233,222,0.92)", color: C.ink, fontFamily: "'Fraunces', serif" }}
      >
        {valor}
      </div>
    </div>
  );

  return (
    <VentanaFlotante
      clave="matrimonios"
      titulo="Matrimonios"
      onCerrar={onCerrar}
      ancho={880}
      extra={
        <div className="flex items-center gap-3 rounded px-2 py-1" style={{ border: `1px solid ${C.gold}` }}>
          {cifra("Matrimonios", matrimonios.length)}
          {cifra("Los dos confirmados", confirmados)}
        </div>
      }
    >
      <p className="text-sm mb-3" style={{ color: C.charcoal, opacity: 0.8 }}>
        Sale de la Lista de invitados: un <strong>O</strong> (esposo) y una <strong>A</strong> (esposa) dentro de la misma
        familia forman un matrimonio. Los años del aniversario son los que cumplen{" "}
        {anioEvento ? `en ${anioEvento}, el año del evento` : "el año del evento"}.
      </p>

      {sinAnioBoda > 0 && (
        <p
          className="text-sm mb-3 px-3 py-2 rounded flex items-start gap-2"
          style={{ background: C.avisoFondo, color: C.peligro }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {sinAnioBoda === 1 ? "A un matrimonio le falta" : `A ${sinAnioBoda} matrimonios les falta`} el año de boda, así
            que no se les puede calcular el aniversario. Lo rellena el colaborador en el formulario del invitado, o se
            puede poner a mano desde Datos Colab.
          </span>
        </p>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: 700 }}>
          <div
            className="grid px-2 py-1.5 text-xs font-bold uppercase rounded-t"
            style={{
              gridTemplateColumns: COLUMNAS,
              background: C.ink,
              color: C.goldClaro,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.03em",
            }}
          >
            <span>Familia</span>
            <span>Esposo</span>
            <span>Esposa</span>
            <span>Zona</span>
            <span>Boda</span>
            <span>Aniversario</span>
          </div>

          {matrimonios.map((m, i) => (
            <div
              key={m.clave}
              className="grid px-2 py-1.5 text-sm items-center"
              style={{
                gridTemplateColumns: COLUMNAS,
                background: i % 2 ? C.paperDark : "#fff",
                color: C.charcoal,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span className="truncate" style={{ fontWeight: 600 }}>
                {m.familia || "—"}
              </span>
              <span className="truncate">{m.esposo.nombre}</span>
              <span className="truncate">{m.esposa.nombre}</span>
              <span className="truncate">{m.zona || "—"}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.anioBoda || "—"}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {m.aniversario === null ? (
                  <span style={{ color: C.peligro }}>falta el año</span>
                ) : (
                  `${m.aniversario} años`
                )}
                {!m.confirmados && (
                  <span className="ml-2 text-xs" style={{ opacity: 0.7 }} title="Falta confirmar a uno de los dos">
                    sin confirmar
                  </span>
                )}
              </span>
            </div>
          ))}

          {matrimonios.length === 0 && (
            <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay ningún matrimonio marcado. En la Lista de invitados, entra en "Editar" y marca a cada
              cónyuge con O (esposo) o A (esposa).
            </p>
          )}
        </div>
      </div>
    </VentanaFlotante>
  );
}
