// «Comprueba tus datos» (él, v85.1-85.2): plegado en el recuadro verde del
// tablón, justo debajo de la ronda «Datos» (él: «datos aparece dos veces»;
// antes iba en la tarjeta de su colaborador). Lo que su colaborador le apuntó en el
// formulario, una línea cada cosa (norma 6), para que lo vea y avise si
// algo está mal. Solo se ve. Las reglas de qué se enseña, en
// lib/registroTablon.js; aparte de VistaTablon para poder dibujarlo en
// una prueba.
import { C } from "../theme";
import { SeccionPlegable } from "../components/SeccionPlegable";
import { registroDelTablon } from "../lib/registroTablon";

function Linea({ rotulo, children }) {
  return (
    <p className="truncate">
      <b>{rotulo}:</b> {children}
    </p>
  );
}

export function RegistroTablon({ yo, evento, abierta, onAlternar }) {
  const registro = registroDelTablon(yo, evento);
  if (!registro) return null;
  return (
    // Sobre el verde: el rótulo en su dorado de siempre y los datos en
    // blanco, como las rondas de encima.
    <div>
      <SeccionPlegable sencilla titulo="Comprueba tus datos" abierta={abierta} onAlternar={onAlternar}>
        <div className="space-y-1 text-sm pb-1" style={{ color: C.blanco }}>
          {/* Su frase (él, v85.2). Si es su propio colaborador, se corrige él. */}
          <p className="pb-1">
            {yo.colaboradorEsYo
              ? "Comprueba que tus datos están bien registrados; si ves algún error, corrígelo en tu formulario."
              : "Comprueba que estos datos que nos has dado están bien registrados; si ves algún error, dile a tu colaborador que los corrija."}
          </p>
          {registro.nombre && <Linea rotulo="Nombre">{registro.nombre}</Linea>}
          <Linea rotulo="Alergias">{registro.alergias}</Linea>
          <div>
            <b>Canciones:</b>
            {registro.canciones.map((c) => (
              <p key={c} className="truncate pl-3">
                {c}
              </p>
            ))}
          </div>
          {registro.boda && <Linea rotulo="Boda">{registro.boda}</Linea>}
          {registro.email && <Linea rotulo="Email para la invitación">{registro.email}</Linea>}
          <Linea rotulo="Guardar tus datos tras el evento">{registro.conservar}</Linea>
        </div>
      </SeccionPlegable>
    </div>
  );
}
