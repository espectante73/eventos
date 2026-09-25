// Ventana "Cronograma": cronograma/logística del día. Reemplaza por
// completo a la subida manual de imagen (versión anterior) -- a
// petición del usuario, 2026-08-27: en vez de editar una foto en otra
// aplicación cada vez que cambia un horario, aquí se editan los 9
// bloques y la app dibuja sola la imagen a partir de esos datos (ver
// lib/cronograma.js), siempre al día.
//
// Tercer ajuste, mismo día: en vez de escribir la hora exacta de cada
// bloque (y tener que recalcular a mano todas las siguientes si cambia
// una), cada bloque solo dice cuántos MINUTOS dura -- la hora de inicio
// de cada uno se calcula sola sumando los minutos anteriores a la hora
// de inicio del cronograma entero ("cronogramaHoraInicio"). La propia
// imagen de abajo (que ya se regenera sola) es la que enseña las horas
// resultantes de cada bloque, sin tener que ir mirando bloque a bloque.
//
// 2026-08-29: pasa a ser una ventana de verdad del sistema operativo
// (igual que Novedades/Logística, ver lib/usePopupWindow.js), no ya una
// VentanaFlotante dentro de Configuración -- a petición del usuario.
// Por eso recibe `ventana` (el propio objeto window de esa ventana
// emergente): "Imprimir" usa `ventana.print()`, nunca `window.print()`
// a secas -- el código sigue ejecutándose en el realm de la pestaña
// principal aunque se vea dentro de la ventana emergente (mismo motivo
// ya documentado para el portapapeles de Novedades).
import { useState, useEffect } from "react";
import { Printer, Plus, UserCog } from "lucide-react";
import { C, inputStyle, OP } from "../../theme";
import {
  generarImagenCronograma,
  calcularHorasAbsolutas,
  personasAsignables,
  estaAsignada,
  alternarPersonaAsignada,
} from "../../lib/cronograma";
import { resolverColaborador } from "../../lib/invitados";
import { Boton } from "../../components/Boton";
import { BotonQuitar } from "../../components/PreguntaSeguridad";
import { SeccionPlegable } from "../../components/SeccionPlegable";

// Todas las horas del día en pasos de 5 minutos, en un único <select> --
// a petición del usuario ("un único reloj, no dos relojes distintos").
// Un <select> normal, nunca un <input type="time">: ese tipo de campo
// es justo el que Safari trataba como una fecha de verdad y le
// superponía su propio menú (Crear evento, etc.) -- solo hace falta
// para la hora de INICIO del cronograma entero (el único dato que sigue
// siendo una hora absoluta elegida a mano).
const TODAS_LAS_HORAS = Array.from({ length: 24 * 12 }, (_, i) => {
  const h = Math.floor(i / 12);
  const m = (i % 12) * 5;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

// Duraciones elegibles, de cinco en cinco. Antes era un campo numérico
// donde había que teclear los minutos a mano: en el móvil eso es un
// teclado y una errata esperando -- y el usuario ya elegía la hora de
// inicio de una lista, así que la duración chirriaba siendo distinta
// (petición del 2026-09-16). Hasta 5 horas: el bloque más largo real
// es el baile, 135 minutos, y así sobra sitio de todos modos.
const DURACIONES = Array.from({ length: 60 }, (_, i) => (i + 1) * 5);

// "45 min", "1 h", "2 h 15 min" -- una lista de 300 números sueltos no
// se lee; leída en horas y minutos, sí.
function nombreDuracion(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function VentanaConfigCronograma({ data, ventana }) {
  const { evento, persistEvento, colaboradores, invitados } = data;
  const bloques = Array.isArray(evento.cronogramaBloques) ? evento.cronogramaBloques : [];
  // "Recepción" -- siempre el primer bloque del día -- la cubren los
  // propios colaboradores, cada uno recibiendo a sus invitados ya
  // asignados (dato que ya existe: quién tiene algún confirmado a su
  // cargo). Automático a propósito, a petición del usuario: no hace
  // falta "asignar" nada ahí, ya se sabe solo.
  const colaboradoresConConfirmados = colaboradores.filter((c) =>
    invitados.some((g) => g.confirmado && resolverColaborador(g, colaboradores)?.id === c.id)
  );
  // Invitados con algún rol de trabajo (acomodador, etc.) -- el otro
  // grupo asignable, además de los colaboradores, a los bloques que NO
  // son la Recepción.
  const invitadosConRol = invitados.filter((g) => Array.isArray(g.rolesTrabajo) && g.rolesTrabajo.length > 0);
  const responsablesRol = evento.rolesTrabajoResponsables || {};
  const horaInicio = evento.cronogramaHoraInicio || "18:00";
  const [imagen, setImagen] = useState("");
  const [seleccionado, setSeleccionado] = useState(0);
  // "Quién lo atiende" plegado por defecto -- a petición del usuario,
  // 2026-08-29. Se repliega solo al cambiar de bloque, para que cada
  // bloque nuevo empiece siempre plegado (no arrastra el "abierto" del
  // bloque anterior).
  const [atiendeAbierto, setAtiendeAbierto] = useState(false);
  // Confirmación de "quitar" en dos toques, dentro de la propia ventana:
  // esta ventana es una ventana de verdad del sistema y window.confirm()
  // apuntaría a la pestaña equivocada (ver la cabecera de este archivo).
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  useEffect(() => {
    setAtiendeAbierto(false);
    setConfirmandoQuitar(false);
  }, [seleccionado]);

  // Se regenera sola cada vez que cambia algún dato -- no hace falta
  // ningún botón de "actualizar imagen".
  useEffect(() => {
    if (bloques.length === 0) return;
    setImagen(generarImagenCronograma(horaInicio, bloques));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se compara por JSON.stringify más abajo para no recalcular en cada tecla de campos que no son estos
  }, [horaInicio, JSON.stringify(bloques)]);

  const cambiarBloque = (indice, campo, valor) => {
    const siguiente = bloques.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b));
    persistEvento({ ...evento, cronogramaBloques: siguiente });
  };

  // "asignados": ids de colaboradores que atienden este bloque -- puede
  // haber varios a la vez (a petición del usuario: "diferentes bloques
  // tendrán diferentes personas asignadas, algunos incluirán una sola y
  // otros varias"). Por ahora solo colaboradores -- cuando exista el
  // "rol de trabajo" de invitados (acomodador, etc.), este mismo array
  // también podrá incluirlos, sin cambiar la forma del dato.
  // Añadir y quitar bloques (2026-09-14). Antes los nueve bloques venían
  // fijos del esquema y cambiarlos exigía tocar el código -- justo lo que
  // el usuario pidió evitar. El bloque nuevo entra DETRÁS del que está
  // seleccionado (no al final): al montar un cronograma se piensa
  // "después de la cena va X", no "al final de todo va X".
  const anadirBloque = () => {
    const nuevo = { texto: "Bloque nuevo", duracionMin: 15 };
    const posicion = bloques.length ? seleccionado + 1 : 0;
    const siguiente = [...bloques.slice(0, posicion), nuevo, ...bloques.slice(posicion)];
    persistEvento({ ...evento, cronogramaBloques: siguiente });
    setSeleccionado(posicion);
    setConfirmandoQuitar(false);
  };

  // Nunca se queda sin ninguno: con la lista vacía no habría nada que
  // editar ni que dibujar en la imagen.
  const quitarBloque = () => {
    if (bloques.length <= 1) return;
    const siguiente = bloques.filter((_, i) => i !== seleccionado);
    persistEvento({ ...evento, cronogramaBloques: siguiente });
    setSeleccionado((i) => Math.max(0, Math.min(i, siguiente.length - 1)));
    setConfirmandoQuitar(false);
  };

    const imprimir = () => {
    setTimeout(() => {
      try {
        // ventana.print(), NUNCA window.print() a secas -- ver el
        // comentario de cabecera de este archivo.
        ventana?.print();
      } catch (_) {
        // Bloqueado por el navegador: se puede usar Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  const bloqueActual = bloques[seleccionado];
  const horasAbsolutas = calcularHorasAbsolutas(horaInicio, bloques);
  // Sin elegir todavía vale INTERNO: es el caso normal, y así al
  // desplegar "¿Quién lo atiende?" se ve la lista. Antes, en un bloque
  // recién creado, debajo de los dos botones no aparecía nada (él,
  // 2026-09-24: "en esta sección no aparece la lista").
  const tipoAtiende = bloqueActual?.tipoAtiende || "interno";
  // Una sola fila por persona: el que es colaborador Y acomodador salía
  // dos veces (ver lib/cronograma.js).
  const personas = personasAsignables(colaboradores, invitadosConRol, responsablesRol);

  // Resumen de una línea para el desplegable plegado -- a petición del
  // usuario, 2026-08-29: no hace falta ver el detalle de "quién lo
  // atiende" hasta que se despliega a propósito.
  const resumenAtiende = (() => {
    if (!bloqueActual) return "";
    if (seleccionado === 0) return "Automático (colaboradores)";
    if (tipoAtiende === "interno") {
      const n = Array.isArray(bloqueActual.asignados) ? bloqueActual.asignados.length : 0;
      return n > 0 ? `Interno (${n})` : "Interno -- nadie elegido todavía";
    }
    if (tipoAtiende === "externo") {
      return bloqueActual.tipoExterno === "contratado"
        ? "Externo: contratado"
        : bloqueActual.tipoExterno === "local"
        ? "Externo: del local"
        : "Externo -- falta elegir cuál";
    }
    return "";
  })();

  // Botón de opción simple (Interno/Externo, Del local/Contratado) --
  // resaltado si es la opción activa.
  const BotonOpcion = ({ activo, onClick, children }) => (
    <button
      onClick={onClick}
      className="boton-3d px-3 py-1.5 rounded text-sm"
      style={{
        border: `1px solid ${activo ? C.ink : C.line}`,
        background: activo ? C.ink : "transparent",
        color: activo ? C.paper : C.charcoal,
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col" style={{ height: "100%", background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <div className="panel-flotante-cristal px-4 py-3" style={{ flexShrink: 0 }}>
        <h3 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
          Cronograma
        </h3>
      </div>
      <div className="p-4" style={{ flex: 1, overflowY: "auto" }}>
      {/* Compacto a propósito -- a petición del usuario, 2026-08-29: la
          ventana tenía mucho texto de sobra y el nombre de cada bloque
          salía DUPLICADO (una vez en el <select>, otra en el campo de
          renombrar justo debajo) empujando la imagen muy abajo. Ahora:
          sin párrafo explicativo, "Inicio" en una sola línea, y el
          nombre del bloque aparece una sola vez (en el <select>, que ya
          sirve para elegir Y para leer cuál es) con los minutos justo al
          lado en la misma fila -- renombrar un bloque ya no se hace
          desde aquí. */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Inicio del cronograma
        </span>
        <select
          value={horaInicio}
          onChange={(e) => persistEvento({ ...evento, cronogramaHoraInicio: e.target.value })}
          style={{ ...inputStyle, width: 90 }}
        >
          {TODAS_LAS_HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <select
          value={seleccionado}
          onChange={(e) => setSeleccionado(Number(e.target.value))}
          style={{ ...inputStyle, height: 42, width: "100%" }}
        >
          {bloques.map((b, i) => (
            <option key={i} value={i}>
              {b.texto || `Bloque ${i + 1}`} · {horasAbsolutas[i]}
            </option>
          ))}
        </select>
        <Boton variante="principal" onClick={anadirBloque} titulo="Añadir un bloque detrás del que estás viendo">
          <Plus size={15} /> Añadir
        </Boton>
        {/* yaPregunta: la pregunta sale justo debajo, con el bloque delante. */}
        <BotonQuitar
          borrar
          yaPregunta
          onClick={() => setConfirmandoQuitar(true)}
          disabled={bloques.length <= 1}
          titulo={bloques.length <= 1 ? "Tiene que quedar al menos un bloque" : "Quitar este bloque"}
        />
      </div>

      {confirmandoQuitar && bloqueActual && (
        <div
          className="flex items-center gap-2 rounded px-3 py-2 mb-2"
          style={{ background: C.avisoFondo, border: `1px solid ${C.peligro}` }}
        >
          <p className="text-xs flex-1" style={{ color: C.peligro }}>
            ¿Quitar «{bloqueActual.texto || `Bloque ${seleccionado + 1}`}»? Se pierde también quién
            lo atendía.
          </p>
          <Boton variante="peligro" tamano="pequeno" onClick={quitarBloque}>
            Quitar
          </Boton>
          <Boton variante="secundario" tamano="pequeno" onClick={() => setConfirmandoQuitar(false)}>
            Cancelar
          </Boton>
        </div>
      )}

      {/* El nombre vuelve a ser editable (2026-09-14). Se había quitado el
          2026-08-29 para no repetirlo (ya salía en el <select>), pero
          desde que se pueden añadir bloques hace falta: un bloque nuevo
          nace como "Bloque nuevo" y sin esto no habría forma de
          rebautizarlo. */}
      {bloqueActual && (
        <div className="flex items-center gap-2 mb-4">
          <input
            value={bloqueActual.texto || ""}
            onChange={(e) => cambiarBloque(seleccionado, "texto", e.target.value)}
            placeholder="Nombre del bloque"
            style={{ ...inputStyle, height: 42, width: "100%" }}
          />
          <select
            value={DURACIONES.includes(Number(bloqueActual.duracionMin)) ? Number(bloqueActual.duracionMin) : ""}
            onChange={(e) => cambiarBloque(seleccionado, "duracionMin", Number(e.target.value))}
            style={{ ...inputStyle, width: 120, flexShrink: 0, height: 42 }}
            title="Cuánto dura este bloque"
          >
            {/* Un bloque guardado con una duración que no cae en los
                cincos (por ejemplo de antes de esta lista) se sigue
                viendo: no se le cambia el valor a nadie por la espalda. */}
            {!DURACIONES.includes(Number(bloqueActual.duracionMin)) && (
              <option value="">{nombreDuracion(Number(bloqueActual.duracionMin) || 0)}</option>
            )}
            {DURACIONES.map((m) => (
              <option key={m} value={m}>
                {nombreDuracion(m)}
              </option>
            ))}
          </select>
        </div>
      )}

      {bloqueActual && (
        <>
          {/* Quién atiende este bloque -- plegado por defecto, a
              petición del usuario, 2026-08-29. Dos cosas distintas
              aparte, no una sola: "¿está cubierto?" y "¿lo he
              comprobado yo?". El primer bloque (Recepción) es
              automático: lo cubren los colaboradores con invitados
              confirmados a su cargo, sin nada que marcar a mano ni
              elegir interno/externo. Para el resto, primero se elige
              Interno (colaboradores/invitados con rol) o Externo (del
              local o contratado -- gente ajena a la lista de
              invitados, como el equipo del restaurante en la Cena o un
              DJ contratado en el Baile). */}
          {/* Era un plegable hecho a mano aquí dentro: mismo botón, misma
              flecha, mismo resumen que `SeccionPlegable`. Copiado, no
              compartido -- justo lo que prohíbe la norma 7. Se cambia por
              la pieza de la app (2026-09-24), en modo controlado para que
              siga abriéndose y cerrándose con su propio estado. */}
          <div className="mb-2">
            <SeccionPlegable
              icono={UserCog}
              titulo="¿Quién lo atiende?"
              resumen={resumenAtiende}
              abierta={atiendeAbierto}
              onAlternar={() => setAtiendeAbierto((a) => !a)}
            >
              {seleccionado === 0 ? (
                <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Automático: cada colaborador recibe a sus propios invitados —{" "}
                  {colaboradoresConConfirmados.length === 0
                    ? "todavía ninguno tiene confirmados."
                    : colaboradoresConConfirmados.map((c) => c.nombre).join(", ")}
                  .
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <BotonOpcion
                      activo={tipoAtiende === "interno"}
                      onClick={() => cambiarBloque(seleccionado, "tipoAtiende", "interno")}
                    >
                      Interno
                    </BotonOpcion>
                    <BotonOpcion
                      activo={tipoAtiende === "externo"}
                      onClick={() => cambiarBloque(seleccionado, "tipoAtiende", "externo")}
                    >
                      Externo
                    </BotonOpcion>
                  </div>

                  {tipoAtiende === "interno" &&
                    (personas.length === 0 ? (
                      <p className="text-xs italic" style={{ color: C.charcoal, opacity: OP.tenue }}>
                        Todavía no hay ningún colaborador ni invitado con rol de trabajo.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {personas.map((p) => (
                          <label key={p.id} className="flex items-center gap-1.5 text-sm" style={{ color: C.charcoal }}>
                            <input
                              type="checkbox"
                              checked={estaAsignada(bloqueActual.asignados, p)}
                              onChange={() =>
                                cambiarBloque(
                                  seleccionado,
                                  "asignados",
                                  alternarPersonaAsignada(bloqueActual.asignados, p)
                                )
                              }
                            />
                            {p.nombre}
                            {p.roles.length > 0 && (
                              <span style={{ opacity: OP.secundario }}>({p.roles.join(", ")})</span>
                            )}
                          </label>
                        ))}
                      </div>
                    ))}

                  {tipoAtiende === "externo" && (
                    <div className="flex items-center gap-2">
                      <BotonOpcion
                        activo={bloqueActual.tipoExterno === "local"}
                        onClick={() => cambiarBloque(seleccionado, "tipoExterno", "local")}
                      >
                        Del local
                      </BotonOpcion>
                      <BotonOpcion
                        activo={bloqueActual.tipoExterno === "contratado"}
                        onClick={() => cambiarBloque(seleccionado, "tipoExterno", "contratado")}
                      >
                        Contratado
                      </BotonOpcion>
                    </div>
                  )}
                </>
              )}
            </SeccionPlegable>
          </div>

          <label className="flex items-center gap-2 text-sm mb-4" style={{ color: C.charcoal }}>
            <input
              type="checkbox"
              checked={Boolean(bloqueActual.supervisado)}
              onChange={(e) => cambiarBloque(seleccionado, "supervisado", e.target.checked)}
            />
            Ya lo he supervisado
          </label>
        </>
      )}

      {imagen && (
        <>
          <div id="zona-imprimible-cronograma">
            <img src={imagen} alt="Cronograma del día" className="w-full rounded mb-2" />
          </div>
          <Boton variante="secundario" onClick={imprimir}>
            <Printer size={14} /> Imprimir
          </Boton>
        </>
      )}

      {/* Solo colaboradores -- el cronograma es una herramienta de
          trabajo para quien organiza el evento, nunca para el invitado
          que solo viene a disfrutarlo. Nadie la ve por defecto -- para
          poder revisarla con calma antes de decidir. */}
      <div className="pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: C.charcoal }}>
          <input
            type="checkbox"
            checked={Boolean(evento.cronogramaVisibleColaboradores)}
            onChange={(e) => persistEvento({ ...evento, cronogramaVisibleColaboradores: e.target.checked })}
          />
          Visible para colaboradores
        </label>
      </div>
      </div>
    </div>
  );
}
