// Ventana "Copia de seguridad": exportar todo a texto, o restaurarlo desde
// un texto pegado (admite también el formato antiguo de solo invitados).
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 1). `exportarTodo` vive aparte, en lib/backup.js, porque BORRAR
// TODO y los reinicios (todavía en VistaAnfitrion.jsx) también la usan
// para su copia de seguridad automática antes de la acción destructiva.
import { useState } from "react";
import { Copy, Repeat } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { parseImport } from "../../lib/invitados";
import { exportarTodo } from "../../lib/backup";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaCopiaSeguridad({ data, onCerrar }) {
  const {
    evento,
    mesas,
    fotosFamiliares,
    colaboradores,
    invitados,
    persistEvento,
    persistMesas,
    persistFotosFamiliares,
    persistColaboradores,
    persistInvitados,
  } = data;

  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false);
  const [textoRestaurar, setTextoRestaurar] = useState("");

  const restaurarTodo = () => {
    let datos;
    try {
      datos = JSON.parse(textoRestaurar);
    } catch (_) {
      // No es JSON: puede ser el formato antiguo de "solo invitados" (separado
      // por tabulaciones). Lo intentamos como alternativa antes de rendirnos.
      const filas = parseImport(textoRestaurar, colaboradores);
      if (filas.length === 0) {
        window.alert(
          "No he podido leer ese texto. Pega el contenido que generó \"Exportar todo\" (o, si es una copia antigua de solo invitados, en el formato Grupo familiar, Apellido, Nombre, Colaborador, Zona)."
        );
        return;
      }
      const ok = window.confirm(
        `Esto es un formato antiguo: solo recuperaré los ${filas.length} invitados (nombre, apellido, zona, grupo familiar y colaborador si coincide el nombre). El evento, las mesas y los datos de colaborador/año/email/etc. de cada invitado NO se restauran con este formato. ¿Continuar?`
      );
      if (!ok) return;
      const nuevos = filas.map((r) => ({
        id: uid(),
        nombre: r.nombre,
        apellido: r.apellido,
        zona: r.zona,
        confirmado: false,
        colaboradorId: r.colaboradorId,
        grupoFamiliar: r.grupoFamiliar,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        conyuge: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      }));
      persistInvitados([...invitados, ...nuevos]);
      setTextoRestaurar("");
      setMostrarRestaurar(false);
      return;
    }

    // 1) Invitados primero, con ids nuevos (los antiguos ya no sirven).
    const nuevosInvitados = (datos.invitados || []).map((r) => ({
      id: uid(),
      nombre: r.nombre || "",
      apellido: r.apellido || "",
      zona: r.zona || "",
      confirmado: Boolean(r.confirmado),
      colaboradorId: null,
      grupoFamiliar: r.grupoFamiliar || r.apellido || "",
      mesa: r.mesa || null,
      anioNacimiento: r.anioNacimiento || "",
      anioBoda: r.anioBoda || "",
      conyuge: r.conyuge || "",
      email: r.email || "",
      cancion: r.cancion || "",
      alergias: r.alergias || "",
      observaciones: r.observaciones || "",
      pagado: Boolean(r.pagado),
      _colaboradorNombreTmp: r.colaboradorNombre || "",
    }));

    // 2) Colaboradores, enlazados al invitado que coincide en apellido y nombre.
    const nuevosColaboradores = (datos.colaboradores || []).map((c) => {
      const [ap, no] = (c.nombre || "").split(",").map((s) => s.trim());
      const match = nuevosInvitados.find((g) => g.apellido === ap && g.nombre === no);
      return {
        id: uid(),
        nombre: c.nombre || "",
        invitadoId: match ? match.id : null,
        email: c.email || "",
      };
    });

    // 3) Resolver el colaborador asignado a cada invitado, y limpiar el campo temporal.
    const invitadosFinal = nuevosInvitados.map((g) => {
      const { _colaboradorNombreTmp, ...resto } = g;
      if (_colaboradorNombreTmp) {
        const col = nuevosColaboradores.find((c) => c.nombre === _colaboradorNombreTmp);
        resto.colaboradorId = col ? col.id : null;
      }
      return resto;
    });

    const eventoRestaurado = datos.evento || evento;
    if (!eventoRestaurado.imagen) eventoRestaurado.imagen = "/cabecera-defecto.jpg";
    if (!eventoRestaurado.imagenInvitacion) eventoRestaurado.imagenInvitacion = "/invitacion-defecto.jpg";
    persistEvento(eventoRestaurado);
    if (datos.mesas) persistMesas(datos.mesas);
    if (datos.fotosFamiliares) persistFotosFamiliares(datos.fotosFamiliares);
    persistColaboradores(nuevosColaboradores);
    persistInvitados(invitadosFinal);
    setTextoRestaurar("");
    setMostrarRestaurar(false);
  };

  return (
    <VentanaFlotante clave="copiaSeguridad" titulo="Copia de seguridad" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
        Antes de pedir más cambios y volver a publicar el artefacto, exporta todo (evento,
        colaboradores, mesas e invitados) y guárdalo en una nota. Tras publicar la nueva
        versión, pega ese mismo texto aquí para recuperarlo todo de una vez.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setMostrarExportar((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ border: `1px solid ${C.gold}`, color: C.gold }}
        >
          <Copy size={14} /> Exportar todo
        </button>
        <button
          onClick={() => setMostrarRestaurar((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ border: `1px solid ${C.ink}`, color: C.ink }}
        >
          <Repeat size={14} /> Restaurar todo
        </button>
      </div>

      {mostrarExportar && (
        <div className="mb-3">
          <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
            Toca dentro del cuadro, Cmd/Ctrl+A y Cmd/Ctrl+C para copiarlo todo.
          </p>
          <textarea
            readOnly
            value={exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados })}
            onFocus={(e) => e.target.select()}
            rows={8}
            className="w-full"
            style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
          />
        </div>
      )}

      {mostrarRestaurar && (
        <div>
          <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
            Pega aquí el texto que generó "Exportar todo" en una versión anterior.
          </p>
          <textarea
            value={textoRestaurar}
            onChange={(e) => setTextoRestaurar(e.target.value)}
            rows={8}
            className="w-full mb-2"
            style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
          />
          <button
            onClick={restaurarTodo}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            Restaurar
          </button>
        </div>
      )}
    </VentanaFlotante>
  );
}
