// Ventana "Logística": panel de solo lectura con el estado general del
// evento de un vistazo -- a petición del usuario, 2026-08-26, tras caer
// en la cuenta de que la app entera es, en el fondo, una recopilación de
// datos para la logística del día, pero cada pieza (cronograma, tablón/
// FAQ, música, permisos, colaboradores) vivía repartida en su propia
// ventana de Configuración sin ningún sitio que las reuniera. No añade
// ningún dato nuevo ni ninguna edición -- todo lo que muestra ya existe
// en otra ventana; esta es solo el resumen para volver a mirar según se
// acerca noviembre.
//
// Deliberadamente NO se fusionó con "Progreso" (VentanaProgreso.jsx): esa
// se queda centrada en datos/pagos/canciones por colaborador (su alcance
// de siempre), y esta es el panel general -- a petición explícita del
// usuario, para no mezclar los dos.
//
// Segundo ajuste, mismo día: se estaba pareciendo cada vez más a Progreso
// (mismo recuadro fijo con barras) -- a petición del usuario, pasa a ser
// una ventana de verdad del sistema operativo (igual que Novedades, ver
// lib/usePopupWindow.js) con sus secciones plegables y plegadas por
// defecto, en vez de un panel fijo. No usa el objeto `ventana` (no hay
// portapapeles/alert/confirm aquí, es de solo lectura) pero VistaAnfitrion
// lo pasa igual por si algún día hiciera falta.
import { useState, useEffect } from "react";
import { ChevronDown, ClipboardList, Euro, Clock3, MessageSquareText, Music, KeyRound, Users } from "lucide-react";
import { C } from "../../theme";
import { supabase } from "../../supabaseClient";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { diasHasta } from "../../lib/formato";
import { ETIQUETAS_PERMISOS } from "../../lib/permisos";
import { generarImagenCronograma } from "../../lib/cronograma";
import { BarraCompacta } from "../../components/Widgets";

const BUCKET_MUSICA = "musica-ambiental";

// Una sección plegable: título + resumen corto SIEMPRE visibles (para
// poder leer el estado sin tener que abrir nada), el detalle solo al
// desplegar -- plegada por defecto, a petición del usuario. Cada una
// lleva su propio estado (no "una sola a la vez" como en Novedades/FAQ:
// aquí son categorías independientes, no un texto largo que abruma si se
// lee de golpe). Excepción: Cronograma nace desplegada
// (`abiertaPorDefecto`) -- a petición del usuario, para ver la imagen de
// un vistazo sin tener que abrir nada al entrar en esta ventana.
function Seccion({ icono: Icono, titulo, resumen, children, abiertaPorDefecto = false }) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink, fontWeight: 600 }}>
          <Icono size={15} style={{ color: C.gold, flexShrink: 0 }} />
          <span className="truncate">{titulo}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            {resumen}
          </span>
          <ChevronDown
            size={15}
            style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          />
        </span>
      </button>
      {abierta && (
        <div className="px-3 pb-3 pt-1 text-xs" style={{ borderTop: `1px solid ${C.line}`, color: C.charcoal }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function VentanaLogistica({ data }) {
  const { evento, invitados, colaboradores, novedades, preguntaTablon } = data;
  const confirmados = invitados.filter((g) => g.confirmado);

  // La música no viene de useLedgerData (igual que en VistaTablon.jsx) --
  // se lista aparte al abrir esta ventana. El cronograma ya no hace
  // falta listarlo: es evento.cronogramaBloques, siempre presente.
  const [pistasMusica, setPistasMusica] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: archivosMusica } = await supabase.storage.from(BUCKET_MUSICA).list();
      setPistasMusica((archivosMusica || []).filter((f) => f.name && !f.name.startsWith(".")).length);
    })();
  }, []);

  const dias = diasHasta(evento.fecha);
  const novedadesPublicadas = novedades.filter((n) => n.publicada);

  // Solo colaboradores -- el cronograma nunca se enseña a invitados
  // (herramienta de trabajo de quien organiza, no para quien solo viene
  // a disfrutar), a petición explícita del usuario, 2026-08-27.
  const cronogramaVisible = Boolean(evento.cronogramaVisibleColaboradores);

  const colaboradoresConPermisos = colaboradores.filter((c) => Array.isArray(c.permisos) && c.permisos.length > 0);

  const conAlgunoAsignado = colaboradores.filter((c) =>
    invitados.some((g) => g.confirmado && resolverColaborador(g, colaboradores)?.id === c.id)
  );
  const detalleColaboradores = conAlgunoAsignado.map((c) => {
    const suyos = invitados.filter((g) => g.confirmado && resolverColaborador(g, colaboradores)?.id === c.id);
    const terminado = suyos.length > 0 && suyos.every((g) => datosCompletos(g) && g.pagado);
    return { c, terminado };
  });
  const terminados = detalleColaboradores.filter((d) => d.terminado);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100%", background: C.paper, fontFamily: "'Inter', sans-serif" }}
    >
      <div className="panel-flotante-cristal px-4 py-3" style={{ flexShrink: 0 }}>
        <h3 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
          Logística
        </h3>
      </div>

      <div className="p-4 space-y-2" style={{ flex: 1, overflowY: "auto" }}>
        {/* Cuenta atrás + las 2 barras generales -- cabecera fija, no una
            sección más: es el titular de todo lo demás. */}
        <div
          className="rounded p-3 mb-1"
          style={{ background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)", border: `1px solid ${C.gold}` }}
        >
          {dias !== null && (
            <div className="text-center mb-2" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
              {dias > 0 ? `Faltan ${dias} días` : dias === 0 ? "¡Es hoy!" : "Ya ha pasado"}
            </div>
          )}
          <BarraCompacta
            icono={ClipboardList}
            completado={confirmados.filter((g) => datosCompletos(g)).length}
            total={confirmados.length}
            color={C.goldClaro}
            claro
          />
          <BarraCompacta
            icono={Euro}
            completado={confirmados.filter((g) => g.pagado).length}
            total={confirmados.length}
            color={C.goldClaro}
            claro
          />
        </div>

        <Seccion
          icono={Clock3}
          titulo="Cronograma"
          abiertaPorDefecto
          resumen={cronogramaVisible ? "Visible para colaboradores" : "Oculto"}
        >
          {cronogramaVisible
            ? "Visible para colaboradores."
            : "Oculto -- márcalo en Configuración → Cronograma si quieres que lo vean."}
          {/* La imagen se ve aquí SIEMPRE para ti, aunque la casilla de
              Configuración → Cronograma esté desmarcada (esa solo
              controla si la ven los colaboradores) -- a petición del
              usuario: no tenía ningún sitio propio donde revisarla. Se
              dibuja sola a partir de evento.cronogramaBloques (ver
              lib/cronograma.js), ya no es una imagen subida a mano. */}
          {Array.isArray(evento.cronogramaBloques) && evento.cronogramaBloques.length > 0 && (
            <img
              src={generarImagenCronograma(evento.cronogramaBloques, evento.cronogramaHoraFin || "23:45")}
              alt="Cronograma del día"
              className="w-full rounded mt-2"
            />
          )}
        </Seccion>

        <Seccion icono={MessageSquareText} titulo="Tablón / FAQ" resumen={`${novedadesPublicadas.length}/${novedades.length} publicadas`}>
          <p>{novedadesPublicadas.length} de {novedades.length} entradas están publicadas (el resto son borradores).</p>
          <p className="mt-1">
            {preguntaTablon?.pregunta ? "Tiene pregunta de acceso configurada." : "Sin pregunta de acceso -- cualquiera con el enlace entra directo."}
          </p>
        </Seccion>

        {/* "Música ambiental" es la de fondo del tablón público -- distinta
            de la canción que pide cada invitado para el convite (esa se
            sigue viendo en la ventana Progreso, no aquí), a petición del
            usuario para no confundir las dos. */}
        <Seccion
          icono={Music}
          titulo="Música ambiental (tablón público)"
          resumen={pistasMusica === null ? "…" : pistasMusica > 0 ? `${pistasMusica} pista(s)` : "Ninguna"}
        >
          <p>
            {pistasMusica === null
              ? "Comprobando…"
              : pistasMusica > 0
                ? `${pistasMusica} pista(s) de fondo subida(s) para el tablón público (Configuración → Fondo musical).`
                : "Ninguna pista de fondo subida todavía."}
          </p>
          <p className="mt-1 italic" style={{ opacity: 0.75 }}>
            No confundir con la canción que cada invitado pide para el convite -- eso se ve en la ventana Progreso.
          </p>
        </Seccion>

        <Seccion icono={Users} titulo="Colaboradores" resumen={`${terminados.length}/${conAlgunoAsignado.length} terminados`}>
          {detalleColaboradores.length === 0 ? (
            <p className="italic" style={{ opacity: 0.6 }}>Ningún colaborador tiene invitados confirmados todavía.</p>
          ) : (
            <ul className="space-y-0.5">
              {detalleColaboradores.map(({ c, terminado }) => (
                <li key={c.id}>
                  {terminado ? "✓" : "…"} {c.nombre}
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion icono={KeyRound} titulo="Permisos concedidos" resumen={`${colaboradoresConPermisos.length} colaborador(es)`}>
          {colaboradoresConPermisos.length === 0 ? (
            <p className="italic" style={{ opacity: 0.6 }}>Ningún colaborador tiene permisos extra todavía.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {colaboradoresConPermisos.map((c) => (
                <div key={c.id}>
                  <span style={{ fontWeight: 600 }}>{c.nombre}:</span>{" "}
                  {c.permisos.map((p) => ETIQUETAS_PERMISOS[p] || p).join(", ")}
                </div>
              ))}
            </div>
          )}
        </Seccion>
      </div>
    </div>
  );
}
