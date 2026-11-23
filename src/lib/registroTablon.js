// «Comprueba tus datos» (él, v85.1-85.2): en el tablón, dentro de la tarjeta
// «Tu colaborador», lo que su colaborador le apuntó en el formulario, para
// que lo vea y avise si algo está mal. Solo se ve: se corrige a través del
// colaborador, como promete la nota de privacidad. Con su nombre tal como
// está registrado y si dio email para la invitación (v85.2).
//
// Lo manda tablon_quien_soy. Sin esas claves (la base aún sin el SQL de la
// v85.1: el cliente va antes, skill sql-supabase, regla 3), null: no se
// enseña nada. Nunca el año de nacimiento (es la llave de la puerta: se ve
// siempre el mismo que eligió) ni el teléfono. El email, entero solo con su
// enlace personal (v87.2, él: «para que pueda decir si está o no bien
// escrito»; `yo.email`, de tablon_mi_email); por la puerta general, sí o no.
import { cancionesDe } from "./canciones";
import { anioDelEvento } from "./matrimonios";
import { pideEmail } from "./invitados";
import { alergiasUniformes } from "./alergias";

export function registroDelTablon(yo, evento) {
  if (!yo || !("alergias" in yo)) return null;
  const canciones = cancionesDe(yo.cancion);
  return {
    nombre: yo.nombre || "",
    alergias: alergiasUniformes(yo.alergias) || "Sin contestar",
    canciones: canciones.length ? canciones : [yo.sinCancion ? "Prefieres no pedir ninguna" : "Ninguna todavía"],
    boda: lineaBoda(yo.anioBoda, evento),
    conservar: yo.conservarDatos ? "Sí" : "No",
    // Solo a quien se le pide (desde EDAD_EMAIL, con el año con el que entró).
    // null: no se enseña.
    email: "tieneEmail" in yo && pideEmail({ anioNacimiento: yo.anio }, evento) ? yo.email || (yo.tieneEmail ? "Sí" : "No") : null,
    // Lo dio, pero entró por la puerta general: cómo verlo.
    emailOculto: Boolean(yo.tieneEmail && !yo.email),
  };
}

// «1990 · 36º aniversario en 2026» (él: «menos es más», en una línea).
// null si no es matrimonio (la base solo lo manda al esposo y la esposa);
// «Sin año» si lo es y falta, que es justo lo que tiene que ver.
function lineaBoda(anioBoda, evento) {
  if (anioBoda == null) return null;
  const anio = parseInt(anioBoda, 10);
  if (!Number.isFinite(anio) || anio < 1900) return "Sin año";
  const anioEvento = anioDelEvento(evento?.fecha);
  return anioEvento && anioEvento > anio ? `${anio} · ${anioEvento - anio}º aniversario en ${anioEvento}` : String(anio);
}
