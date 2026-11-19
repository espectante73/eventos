// La ruta de «Añadir a mi calendario» (v92.6): /api/calendario. Lee el
// evento como cualquiera (evento_publico, lo mismo que la portada: fecha,
// hora y lugar) y devuelve el archivo de calendario o, en Android, lleva a
// Google Calendar. Qué se apunta y por qué, en src/lib/calendario.js.
// Separado de api/calendario.js (la ruta) para poder probarlo sin red.
import { crearRpc } from "./_rpc.js";
import { eventoDelCalendario, icsDelEvento, enlaceGoogleCalendar } from "../src/lib/calendario.js";

const AVISO = "Todavía no hay fecha confirmada: cuando la haya, podrás añadirlo a tu calendario.";

export function crearManejador({ fetch, env, ahora = () => Date.now() }) {
  const rpc = crearRpc({ fetch, env });
  return async function manejador(req, res) {
    let evento = null;
    try {
      evento = await rpc("evento_publico", {});
    } catch {
      evento = null;
    }
    const cal = eventoDelCalendario(evento);
    res.setHeader("Cache-Control", "no-store");
    if (!cal) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(404).send(AVISO);
    }
    if (/android/i.test(String(req.headers?.["user-agent"] || ""))) {
      res.setHeader("Location", enlaceGoogleCalendar(cal));
      return res.status(302).send("");
    }
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="evento.ics"');
    return res.status(200).send(icsDelEvento(cal, ahora()));
  };
}
