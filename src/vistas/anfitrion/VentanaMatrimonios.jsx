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
import { C } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { matrimoniosDeInvitados } from "../../lib/matrimonios";

// Mismo aspecto que la Lista de invitados, a petición del usuario
// (2026-09-03): cabecera verde con la letra dorada en monoespaciada,
// recuadro tenue alternando por columna, y filas cebra. Aquí las
// anchuras son fijas (no hace falta el medidor de la Lista, que existe
// allí porque sus celdas llevan campos de texto y desplegables).
const COLUMNAS = "1.1fr 1.1fr 1.1fr 0.9fr 0.6fr 0.9fr 0.7fr";
const CABECERAS = ["Familia", "Esposo", "Esposa", "Zona", "Boda", "Aniversario", "Confirm."];
// Recuadro tenue alternando por columna: blanco al 7% sobre el verde de
// la cabecera, y verde al 7% sobre el blanco de las filas.
const tintaCabecera = (i) => (i % 2 === 1 ? "rgba(255,255,255,0.07)" : "transparent");
const tintaCelda = (i) => (i % 2 === 1 ? "rgba(31,58,46,0.07)" : "transparent");

export function VentanaMatrimonios({ data, onCerrar }) {
  const { invitados, evento } = data;
  const matrimonios = matrimoniosDeInvitados(invitados, evento.fecha);
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

  const celda = (i, extra) => ({
    background: tintaCelda(i),
    padding: "6px 8px",
    minWidth: 0,
    ...extra,
  });

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
          {/* El aviso de los años de boda que faltan era un bloque rojo
              aparte; como cifra encaja mejor con el resto y no repite lo
              que ya se ve solo en la columna vacía. */}
          {sinAnioBoda > 0 && cifra("Sin año de boda", sinAnioBoda)}
        </div>
      }
    >
      <p className="text-sm mb-3" style={{ color: C.charcoal, opacity: 0.8 }}>
        O (esposo), A (esposa). El aniversario que cumplen en el año del evento.
      </p>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 720 }}>
          <div
            className="grid text-xs font-bold uppercase text-center"
            style={{
              gridTemplateColumns: COLUMNAS,
              background: C.ink,
              color: C.goldClaro,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.03em",
              borderRadius: "6px 6px 0 0",
            }}
          >
            {CABECERAS.map((titulo, i) => (
              <span key={titulo} style={{ background: tintaCabecera(i), padding: "6px 8px" }}>
                {titulo}
              </span>
            ))}
          </div>

          {matrimonios.map((m, i) => (
            <div
              key={m.clave}
              className="grid text-sm items-center"
              style={{
                gridTemplateColumns: COLUMNAS,
                background: i % 2 ? C.paperDark : "#fff",
                color: C.charcoal,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span className="truncate" style={celda(0, { fontWeight: 600 })}>
                {m.familia || "—"}
              </span>
              <span className="truncate" style={celda(1)}>
                {m.esposo.nombre}
              </span>
              <span className="truncate" style={celda(2)}>
                {m.esposa.nombre}
              </span>
              <span className="truncate" style={celda(3)}>
                {m.zona || "—"}
              </span>
              <span style={celda(4, { fontFamily: "'IBM Plex Mono', monospace", textAlign: "center" })}>
                {m.anioBoda || "—"}
              </span>
              {/* Sin año de boda no se pinta NADA: que el dato falta ya
                  se ve en la columna de al lado -- a petición del
                  usuario, que la versión anterior avisaba dos veces. */}
              <span style={celda(5, { fontFamily: "'IBM Plex Mono', monospace", textAlign: "center" })}>
                {m.aniversario === null ? "" : `${m.aniversario} años`}
              </span>
              <span style={celda(6, { textAlign: "center" })}>{m.confirmados ? "Sí" : "—"}</span>
            </div>
          ))}

          {matrimonios.length === 0 && (
            <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6, background: "#fff" }}>
              Todavía no hay ningún matrimonio marcado. En la Lista de invitados, entra en "Editar" y marca a cada
              cónyuge con O (esposo) o A (esposa).
            </p>
          )}
        </div>
      </div>
    </VentanaFlotante>
  );
}
