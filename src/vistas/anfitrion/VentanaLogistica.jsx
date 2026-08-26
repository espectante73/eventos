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
import { useEffect, useState } from "react";
import { ClipboardList, Euro, Clock3, MessageSquareText, Music, KeyRound, Users } from "lucide-react";
import { C } from "../../theme";
import { supabase } from "../../supabaseClient";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { diasHasta } from "../../lib/formato";
import { ETIQUETAS_PERMISOS } from "../../lib/permisos";
import { BarraCompacta } from "../../components/Widgets";
import { VentanaFlotante } from "../../components/VentanaFlotante";

const BUCKET_MUSICA = "musica-ambiental";
const BUCKET_CRONOGRAMA = "cronograma";

// Una fila de estado: icono + etiqueta a la izquierda, el propio estado
// (texto corto, ya resuelto por quien llama) a la derecha -- mismo
// criterio "pulgar derecho" del resto de la app.
function FilaEstado({ icono: Icono, etiqueta, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
      <span className="flex items-center gap-2 text-sm" style={{ color: C.ink }}>
        <Icono size={15} style={{ color: C.gold }} />
        {etiqueta}
      </span>
      <span className="text-sm text-right" style={{ color: C.charcoal }}>
        {children}
      </span>
    </div>
  );
}

export function VentanaLogistica({ data, onCerrar }) {
  const { evento, invitados, colaboradores, novedades, preguntaTablon } = data;
  const confirmados = invitados.filter((g) => g.confirmado);

  // Música y cronograma no vienen de useLedgerData (igual que en
  // VistaTablon.jsx) -- se listan aparte al abrir esta ventana.
  const [pistasMusica, setPistasMusica] = useState(null);
  const [cronogramaSubido, setCronogramaSubido] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: archivosMusica } = await supabase.storage.from(BUCKET_MUSICA).list();
      setPistasMusica((archivosMusica || []).filter((f) => f.name && !f.name.startsWith(".")).length);
      const { data: archivosCronograma } = await supabase.storage.from(BUCKET_CRONOGRAMA).list();
      setCronogramaSubido(Boolean((archivosCronograma || []).find((f) => f.name === "cronograma.jpg")));
    })();
  }, []);

  const dias = diasHasta(evento.fecha);
  const novedadesPublicadas = novedades.filter((n) => n.publicada);

  const cronogramaVisiblePara = [
    evento.cronogramaVisibleColaboradores && "colaboradores",
    evento.cronogramaVisibleInvitados && "invitados",
  ].filter(Boolean);

  return (
    <VentanaFlotante clave="logistica" titulo="Logística" onCerrar={onCerrar}>
      {/* Cuenta atrás + las 3 barras generales, mismo lenguaje visual que
          el recuadro de arriba de Progreso (degradado oscuro + dorado). */}
      <div
        className="rounded p-3 mb-3"
        style={{
          background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)",
          border: `1px solid ${C.gold}`,
          marginTop: -14,
          marginLeft: -14,
          marginRight: -14,
        }}
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

      <FilaEstado icono={Clock3} etiqueta="Cronograma">
        {cronogramaSubido === null
          ? "…"
          : !cronogramaSubido
            ? "Sin subir"
            : cronogramaVisiblePara.length === 0
              ? "Subido, oculto"
              : `Visible: ${cronogramaVisiblePara.join(" y ")}`}
      </FilaEstado>

      <FilaEstado icono={MessageSquareText} etiqueta="Tablón / FAQ">
        {novedadesPublicadas.length} de {novedades.length} publicadas
        {preguntaTablon?.pregunta ? " · con pregunta de acceso" : " · sin pregunta de acceso"}
      </FilaEstado>

      <FilaEstado icono={Music} etiqueta="Música ambiental">
        {pistasMusica === null ? "…" : pistasMusica > 0 ? `${pistasMusica} pista(s)` : "Ninguna subida"}
      </FilaEstado>

      <FilaEstado icono={Users} etiqueta="Colaboradores">
        {(() => {
          const conAlgunoAsignado = colaboradores.filter((c) =>
            invitados.some((g) => g.confirmado && resolverColaborador(g, colaboradores)?.id === c.id)
          );
          const terminados = conAlgunoAsignado.filter((c) => {
            const suyos = invitados.filter((g) => g.confirmado && resolverColaborador(g, colaboradores)?.id === c.id);
            return suyos.length > 0 && suyos.every((g) => datosCompletos(g) && g.pagado);
          });
          return `${terminados.length} de ${conAlgunoAsignado.length} han terminado lo suyo`;
        })()}
      </FilaEstado>

      <div className="pt-2">
        <div className="flex items-center gap-2 text-sm mb-1.5" style={{ color: C.ink }}>
          <KeyRound size={15} style={{ color: C.gold }} />
          Permisos concedidos
        </div>
        {colaboradores.filter((c) => Array.isArray(c.permisos) && c.permisos.length > 0).length === 0 ? (
          <p className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Ningún colaborador tiene permisos extra todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {colaboradores
              .filter((c) => Array.isArray(c.permisos) && c.permisos.length > 0)
              .map((c) => (
                <div key={c.id} className="text-xs" style={{ color: C.charcoal }}>
                  <span style={{ fontWeight: 600 }}>{c.nombre}:</span>{" "}
                  {c.permisos.map((p) => ETIQUETAS_PERMISOS[p] || p).join(", ")}
                </div>
              ))}
          </div>
        )}
      </div>
    </VentanaFlotante>
  );
}
