// Ventana "Lista de invitados": alta individual, importación masiva,
// filtros, la tabla editable fila a fila, el resumen de asignaciones
// pendientes de avisar al cerrarla, y el panel de imprimir/exportar CSV
// (tabla completa, solo canciones, o solo alergias). Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 5);
// convertida en ventana flotante (como el resto) el 2026-08-09, con la
// fila de filtros fija arriba al hacer scroll por la lista.
//
// `asignarColaborador` y `ocupacionMesa` no viven aquí: los usan también
// otras ventanas (Colaboradores, Mesas, Plano), así que siguen en
// VistaAnfitrion y llegan como props. `panelFlotante`/`setPanelFlotante`
// tampoco son exclusivos de esta sección -Mesas también los usa, para su
// aviso de familias sin mesa- así que también llegan como props.
// `filtros`/`setFiltros` igual: el botón "Editar asignación" de la
// ventana Avisos necesita poder rellenar el filtro de colaborador de
// esta misma tabla, así que ese estado también vive en VistaAnfitrion.
import { useState } from "react";
import {
  Check,
  Bell,
  Trash2,
  Music,
  AlertTriangle,
  Plus,
  Pencil,
  Copy,
  Printer,
} from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { datosCompletos, tieneAlergiaReal, resolverColaborador, parseImport, calcularEdad, edadPromedio } from "../../lib/invitados";
import { ordenarPorApellidoNombre } from "../../lib/formato";
import { descargarCSV } from "../../lib/descargas";
import { TextInput } from "../../components/Formulario";
import { Stamp, EncabezadoOrdenable, GrupoFamiliarInput } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";

// Ancho compartido por los 6 botones de la cabecera (Imprimir/Canciones/
// Alergias + Añadir/Editar/Importar) -- así las dos filas quedan del mismo
// ancho en vez de que cada botón se ajuste solo a su propio texto (a
// petición del usuario, 2026-08-18).
const ANCHO_BOTON_EXTRA = 92;

export function SeccionInvitados({
  data,
  asignarColaborador,
  ocupacionMesa,
  panelFlotante,
  setPanelFlotante,
  colaboradoresPendientes,
  filtros,
  setFiltros,
  onCerrar,
}) {
  const { evento, colaboradores, invitados, mesas, persistInvitados, avisarColaborador } = data;

  const [nuevoInvitado, setNuevoInvitado] = useState({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  const [textoImport, setTextoImport] = useState("");
  const [mostrarImport, setMostrarImport] = useState(false);
  const [mostrarAnadir, setMostrarAnadir] = useState(false);
  const [orden, setOrden] = useState({ columna: "invitado", direccion: "asc" });
  const [modoEdicion, setModoEdicion] = useState(false);

  // "avisoPendiente" vive en el servidor (columna en invitados), no solo
  // en memoria — así no se pierde el rastro si cancelas o cierras la
  // ventana. Al cerrarla, si queda alguien pendiente, se pregunta.
  const [mostrarResumenAsignacion, setMostrarResumenAsignacion] = useState(false);
  const [enviandoAvisosAsignacion, setEnviandoAvisosAsignacion] = useState(false);

  const cambiarOrden = (columna) => {
    setOrden((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };

  const agregarInvitado = () => {
    if (
      !nuevoInvitado.nombre.trim() ||
      !nuevoInvitado.apellido.trim() ||
      !nuevoInvitado.grupoFamiliar.trim()
    )
      return;
    persistInvitados([
      ...invitados,
      {
        id: uid(),
        nombre: nuevoInvitado.nombre.trim(),
        apellido: nuevoInvitado.apellido.trim(),
        zona: nuevoInvitado.zona.trim(),
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: nuevoInvitado.grupoFamiliar.trim(),
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      },
    ]);
    setNuevoInvitado({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  };

  const intentarCerrarInvitados = () => {
    if (colaboradoresPendientes.length > 0) {
      setMostrarResumenAsignacion(true);
      return;
    }
    onCerrar();
  };

  const enviarAvisosAsignacion = async () => {
    setEnviandoAvisosAsignacion(true);
    for (const c of colaboradoresPendientes) {
      await avisarColaborador(c.id);
    }
    setEnviandoAvisosAsignacion(false);
    setMostrarResumenAsignacion(false);
    onCerrar();
  };

  const cancelarAvisosAsignacion = () => {
    setMostrarResumenAsignacion(false);
    onCerrar();
  };

  const asignarGrupoFamiliar = (id, grupoFamiliar) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, grupoFamiliar } : g)));
  };

  const asignarApellido = (id, apellido) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, apellido } : g)));
  };

  const asignarNombre = (id, nombre) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, nombre } : g)));
  };

  const asignarZona = (id, zona) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, zona } : g)));
  };

  const asignarMesa = (id, mesaValue) => {
    const numero = mesaValue ? Number(mesaValue) : null;
    if (numero) {
      const mesa = mesas.find((m) => m.numero === numero);
      const invitadoActual = invitados.find((g) => g.id === id);
      const yaEnEstaMesa = invitadoActual && invitadoActual.mesa === numero;
      if (mesa && !yaEnEstaMesa && ocupacionMesa(numero) >= mesa.capacidad) {
        window.alert(`La mesa ${numero} ya está completa (${mesa.capacidad}/${mesa.capacidad}).`);
        return;
      }
    }
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, mesa: numero } : g))
    );
  };

  const importarInvitados = () => {
    const filas = parseImport(textoImport, colaboradores);
    if (filas.length === 0) return;
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
      email: "",
      cancion: "",
      alergias: "",
      observaciones: "",
      pagado: false,
    }));
    persistInvitados([...invitados, ...nuevos]);
    setTextoImport("");
  };

  const toggleConfirmar = (id) => {
    persistInvitados(
      invitados.map((g) =>
        g.id === id ? { ...g, confirmado: !g.confirmado } : g
      )
    );
  };

  const eliminarInvitado = (id) => {
    persistInvitados(invitados.filter((g) => g.id !== id));
  };

  const imprimirPanelActivo = () => {
    setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        // Bloqueado por el navegador: el usuario puede usar Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  const exportarPanelActivoCSV = () => {
    if (panelFlotante === "tabla") {
      const filas = invitadosOrdenados.map((g) => {
        const col = resolverColaborador(g, colaboradores);
        return [
          `${g.apellido}, ${g.nombre}`,
          g.grupoFamiliar || g.apellido || "",
          g.zona || "",
          col ? col.nombre : "",
          g.mesa ?? "",
          g.confirmado ? "Sí" : "Tentativa",
          g.confirmado ? (g.pagado ? "Sí" : "No") : "",
        ];
      });
      descargarCSV(
        `invitados-${evento.nombre || "evento"}.csv`,
        ["Invitado", "Grupo familiar", "Zona", "Colaborador", "Mesa", "Confirmado", "Pagado"],
        filas
      );
    } else if (panelFlotante === "canciones") {
      const filas = ordenarPorApellidoNombre(
        invitados.filter((g) => g.cancion && g.cancion.trim())
      ).map((g) => [`${g.apellido}, ${g.nombre}`, calcularEdad(g.anioNacimiento, evento) ?? "", g.cancion]);
      descargarCSV(`canciones-${evento.nombre || "evento"}.csv`, ["Invitado", "Edad", "Canción"], filas);
    } else if (panelFlotante === "alergias") {
      const filas = ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g) => [
        `${g.apellido}, ${g.nombre}`,
        g.mesa ?? "",
        g.alergias,
      ]);
      descargarCSV(`alergias-${evento.nombre || "evento"}.csv`, ["Invitado", "Mesa", "Alergia"], filas);
    }
  };

  const zonasUnicas = [...new Set(invitados.map((g) => g.zona).filter(Boolean))].sort();
  const gruposFamiliaresUnicos = [
    ...new Set(invitados.map((g) => g.grupoFamiliar).filter(Boolean)),
  ].sort();

  const invitadosOrdenados = invitados
    .filter((g) => {
      if (filtros.texto) {
        const t = filtros.texto.toLowerCase();
        const texto = `${g.nombre} ${g.apellido} ${g.grupoFamiliar || ""}`.toLowerCase();
        if (!texto.includes(t)) return false;
      }
      if (filtros.grupoFamiliar && g.grupoFamiliar !== filtros.grupoFamiliar) return false;
      if (filtros.zona && g.zona !== filtros.zona) return false;
      if (filtros.colaboradorId) {
        const col = resolverColaborador(g, colaboradores);
        if (!col || col.id !== filtros.colaboradorId) return false;
      }
      if (filtros.mesa && String(g.mesa || "") !== filtros.mesa) return false;
      if (filtros.confirmado === "confirmado" && !g.confirmado) return false;
      if (filtros.confirmado === "tentativa" && g.confirmado) return false;
      if (filtros.datos === "completo" && !(g.confirmado && datosCompletos(g))) return false;
      if (filtros.datos === "pendiente" && (!g.confirmado || datosCompletos(g))) return false;
      if (filtros.pagado === "pagado" && !g.pagado) return false;
      if (filtros.pagado === "pendiente" && g.pagado) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dir = orden.direccion === "asc" ? 1 : -1;
      const valor = (g) => {
        switch (orden.columna) {
          case "grupoFamiliar":
            return (g.grupoFamiliar || g.apellido || "").toLowerCase();
          case "zona":
            return (g.zona || "").toLowerCase();
          case "colaborador":
            return (resolverColaborador(g, colaboradores)?.nombre || "").toLowerCase();
          case "mesa":
            return g.mesa ? Number(g.mesa) : 9999;
          case "confirmado":
            return g.confirmado ? 1 : 0;
          case "datos":
            return g.confirmado && datosCompletos(g) ? 2 : g.confirmado ? 1 : 0;
          case "pagado":
            return g.pagado ? 1 : 0;
          default:
            return `${(g.apellido || "").toLowerCase()} ${(g.nombre || "").toLowerCase()}`;
        }
      };
      const va = valor(a);
      const vb = valor(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

  const columnasTabla = "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto";

  return (
    <>
      <VentanaFlotante
        clave="invitados"
        titulo="Lista de invitados"
        onCerrar={intentarCerrarInvitados}
        subtitulo={
          // Segunda línea bajo el título: solo la edad media (se quitó
          // "Lista invitados N", y el número va en negrita y 3px más
          // grande que el resto de la línea) -- y debajo, la cabecera de
          // columnas de la tabla (Invitado/Grupo familiar/...), subida
          // aquí desde el cuerpo para que quede siempre visible en la
          // barra verde aunque la tabla haga scroll (sustituye a la fila
          // de cabecera que antes vivía dentro de la caja blanca, y a la
          // línea suelta "Edad media de los asistentes" que había encima
          // de la tabla) -- a petición del usuario, 2026-08-18.
          // `stopPropagation` en mousedown/touchstart: es un control
          // interactivo (los botones de ordenar) dentro de la cabecera
          // arrastrable de la ventana, igual que ya exige `extra`.
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="text-xs" style={{ color: C.goldClaro, opacity: 0.85 }}>
              Edad media:{" "}
              <strong style={{ fontSize: 15 }}>
                {edadPromedio(invitadosOrdenados, evento) ?? "—"}
              </strong>
              {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
            </div>
            <div
              className="grid text-xs uppercase text-center"
              style={{
                gridTemplateColumns: columnasTabla,
                color: C.goldClaro,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <EncabezadoOrdenable claro columna="invitado" orden={orden} onClick={cambiarOrden}>
                Invitado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="grupoFamiliar" orden={orden} onClick={cambiarOrden}>
                Grupo familiar
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="zona" orden={orden} onClick={cambiarOrden}>
                Zona
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="colaborador" orden={orden} onClick={cambiarOrden}>
                Colaborador
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="mesa" orden={orden} onClick={cambiarOrden}>
                Mesa
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="confirmado" orden={orden} onClick={cambiarOrden}>
                Confirmado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="datos" orden={orden} onClick={cambiarOrden}>
                Datos
              </EncabezadoOrdenable>
              <EncabezadoOrdenable claro columna="pagado" orden={orden} onClick={cambiarOrden}>
                Pagado
              </EncabezadoOrdenable>
              <span></span>
            </div>
          </div>
        }
        extra={
          <div className="flex flex-col gap-1.5">
            {invitados.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPanelFlotante("tabla")}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ border: `1px solid ${C.gold}`, color: C.goldClaro, width: ANCHO_BOTON_EXTRA }}
                  title="Ver / imprimir / exportar la lista de invitados"
                >
                  <Printer size={12} /> Imprimir
                </button>
                <button
                  onClick={() => setPanelFlotante("canciones")}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ border: `1px solid ${C.gold}`, color: C.goldClaro, width: ANCHO_BOTON_EXTRA }}
                  title="Ver / imprimir / exportar solo la lista de canciones (para el DJ/grupo musical)"
                >
                  <Music size={12} /> Canciones
                </button>
                <button
                  onClick={() => setPanelFlotante("alergias")}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.wax, color: "#fff", width: ANCHO_BOTON_EXTRA }}
                  title="Ver / imprimir / exportar solo la lista de alergias, con su mesa (para cocina/catering)"
                >
                  <AlertTriangle size={12} /> Alergias
                </button>
              </div>
            )}
            {/* 2ª fila -- antes eran 3 botones sueltos en el cuerpo, con
                texto largo ("Añadir invitado individual", "Importar desde
                hoja de cálculo"); movidos aquí y acortados al mismo estilo
                corto de la fila de arriba (a petición del usuario,
                2026-08-18). Imprimir/Canciones pasan también a este mismo
                formato (borde + transparente) para que los 6 boones se
                vean como un solo grupo -- Alergias se queda con su fondo
                propio a propósito (la única que avisa de algo). Los 6
                comparten ANCHO_BOTON_EXTRA. */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarAnadir((v) => !v)}
                className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                style={{
                  border: `1px solid ${C.gold}`,
                  color: mostrarAnadir ? C.paper : C.goldClaro,
                  background: mostrarAnadir ? C.gold : "transparent",
                  width: ANCHO_BOTON_EXTRA,
                }}
                title="Añadir invitado individual"
              >
                <Plus size={12} /> Añadir
              </button>
              <button
                onClick={() => setModoEdicion((v) => !v)}
                className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                style={{
                  border: `1px solid ${C.gold}`,
                  color: modoEdicion ? C.paper : C.goldClaro,
                  background: modoEdicion ? C.gold : "transparent",
                  width: ANCHO_BOTON_EXTRA,
                }}
                title="Activa este modo para poder corregir el grupo familiar de un invitado"
              >
                <Pencil size={12} /> {modoEdicion ? "Terminar" : "Editar"}
              </button>
              <button
                onClick={() => setMostrarImport((v) => !v)}
                className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                style={{
                  border: `1px solid ${C.gold}`,
                  color: mostrarImport ? C.paper : C.goldClaro,
                  background: mostrarImport ? C.gold : "transparent",
                  width: ANCHO_BOTON_EXTRA,
                }}
                title="Importar desde hoja de cálculo"
              >
                <Copy size={12} /> Importar
              </button>
            </div>
          </div>
        }
      >
        {mostrarAnadir && (
        <div className="flex flex-wrap gap-2 mb-3">
          <TextInput
            placeholder="Grupo familiar"
            value={nuevoInvitado.grupoFamiliar}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, grupoFamiliar: e.target.value })
            }
          />
          <TextInput
            placeholder="Apellido familiar"
            value={nuevoInvitado.apellido}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, apellido: e.target.value })
            }
          />
          <TextInput
            placeholder="Nombre"
            value={nuevoInvitado.nombre}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, nombre: e.target.value })
            }
          />
          <TextInput
            placeholder="Zona"
            value={nuevoInvitado.zona}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, zona: e.target.value })
            }
          />
          <button
            onClick={agregarInvitado}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            <Plus size={14} /> Añadir
          </button>
        </div>
        )}

        {mostrarImport && (
          <div
            className="p-3 rounded mb-4"
            style={{ background: "#fff", border: `1px dashed ${C.gold}` }}
          >
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Pega tus filas en el orden Grupo familiar, Apellido, Nombre, Colaborador, Zona —
              directamente copiadas de tu hoja de cálculo (una fila por línea). Si el nombre
              del colaborador coincide con uno ya creado abajo, se enlaza automáticamente.
            </p>
            <textarea
              value={textoImport}
              onChange={(e) => setTextoImport(e.target.value)}
              placeholder={"Luis01\tLuis\tJavi\tBENITO\tIcod\nLuis02\tLuis\tDani\tDANIEL\tOrotava"}
              rows={4}
              className="w-full mb-2"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button
              onClick={importarInvitados}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Plus size={14} /> Importar filas
            </button>
          </div>
        )}

        <div
          className="rounded overflow-x-auto"
          style={{ border: `1px solid ${C.line}`, background: "#fff" }}
        >
          <div style={{ minWidth: 780 }}>
            {/* La cabecera de columnas (Invitado/Grupo familiar/...) ya no
                vive aquí -- subida a la barra verde de la ventana
                (subtitulo, más arriba) para que quede siempre visible
                aunque la tabla haga scroll. La fila de filtros, deliberadamente
                FUERA del bloque con scroll de abajo (no "position: sticky"
                encima del scroll): el div de aquí al lado, al tener
                también scroll horizontal propio (overflow-x-auto), se
                convierte él mismo en el contenedor de referencia para
                cualquier "sticky" que pusiéramos dentro — y ese
                contenedor nunca hace scroll vertical de verdad (crece con
                su contenido), así que el "sticky" no llegaba a fijarse
                nunca. Separarla en su propio bloque, fuera del área que sí
                hace scroll, es el mismo patrón ya probado en el historial
                de Avisos. */}
            <div>
              <div
                className="grid px-3 py-1.5"
                style={{
                  gridTemplateColumns: columnasTabla,
                  background: C.paperDark,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <TextInput
                  value={filtros.texto}
                  onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                  placeholder="Buscar..."
                  style={{ padding: "2px 5px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                />
                <select
                  value={filtros.grupoFamiliar}
                  onChange={(e) => setFiltros({ ...filtros, grupoFamiliar: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todos</option>
                  {gruposFamiliaresUnicos.map((gf) => (
                    <option key={gf} value={gf}>
                      {gf}
                    </option>
                  ))}
                </select>
                <select
                  value={filtros.zona}
                  onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todas</option>
                  {zonasUnicas.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
                <select
                  value={filtros.colaboradorId}
                  onChange={(e) => setFiltros({ ...filtros, colaboradorId: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todos</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={filtros.mesa}
                  onChange={(e) => setFiltros({ ...filtros, mesa: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todas</option>
                  {mesas.map((m) => (
                    <option key={m.numero} value={String(m.numero)}>
                      {m.numero}
                    </option>
                  ))}
                </select>
                <select
                  value={filtros.confirmado}
                  onChange={(e) => setFiltros({ ...filtros, confirmado: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todos</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="tentativa">Tentativa</option>
                </select>
                <select
                  value={filtros.datos}
                  onChange={(e) => setFiltros({ ...filtros, datos: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todos</option>
                  <option value="completo">Completos</option>
                  <option value="pendiente">Por recopilar</option>
                </select>
                <select
                  value={filtros.pagado}
                  onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
                  style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
                <span />
              </div>
            </div>
            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {invitadosOrdenados.map((g, i) => {
              return (
                <div
                  key={g.id}
                  className="grid items-center px-3 py-2 text-sm"
                  style={{
                    gridTemplateColumns: columnasTabla,
                    background: i % 2 ? C.paperDark : "#fff",
                    fontFamily: "'Inter', sans-serif",
                    color: C.charcoal,
                  }}
                >
                  <span>
                    {modoEdicion ? (
                      <span className="flex gap-1">
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.apellido ?? ""}
                            onCommit={(v) => asignarApellido(g.id, v)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.nombre ?? ""}
                            onCommit={(v) => asignarNombre(g.id, v)}
                          />
                        </div>
                      </span>
                    ) : (
                      <>
                        {g.apellido}, {g.nombre}
                        {colaboradores.some((c) => c.invitadoId === g.id) && (
                          <span
                            className="ml-1 text-xs"
                            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                            title="También es colaborador"
                          >
                            ★
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.grupoFamiliar ?? g.apellido ?? ""}
                        onCommit={(v) => asignarGrupoFamiliar(g.id, v)}
                      />
                    ) : (
                      g.grupoFamiliar || g.apellido || "—"
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.zona ?? ""}
                        onCommit={(v) => asignarZona(g.id, v)}
                      />
                    ) : (
                      g.zona || "—"
                    )}
                  </span>
                  <span className="text-xs flex items-center gap-1">
                    <select
                      value={g.colaboradorId || ""}
                      onChange={(e) => asignarColaborador(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin asignar</option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {g.colaboradorId &&
                      !colaboradores.find((c) => c.id === g.colaboradorId)?.email && (
                        <span
                          title="Este colaborador no tiene email guardado — no recibirá el aviso de esta asignación"
                          style={{ color: C.wax, flexShrink: 0 }}
                        >
                          ⚠
                        </span>
                      )}
                  </span>
                  <span className="text-xs">
                    <select
                      value={g.mesa || ""}
                      onChange={(e) => asignarMesa(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin mesa</option>
                      {mesas.map((m) => {
                        const ocupados = ocupacionMesa(m.numero);
                        const llena = ocupados >= m.capacidad && g.mesa !== m.numero;
                        return (
                          <option key={m.numero} value={m.numero} disabled={llena}>
                            Mesa {m.numero} ({ocupados}/{m.capacidad}){llena ? " — llena" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </span>
                  <span>
                    <button
                      onClick={() => toggleConfirmar(g.id)}
                      className="flex items-center gap-1"
                    >
                      {g.confirmado ? (
                        <Stamp color={C.ink}>Confirmado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                        >
                          Tentativa
                        </span>
                      )}
                    </button>
                  </span>
                  <span>
                    {g.confirmado ? (
                      datosCompletos(g) ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.ink }}>
                          <Check size={13} /> completos
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.wax }}>
                          <Bell size={13} /> por recopilar
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <span>
                    {g.confirmado ? (
                      g.pagado ? (
                        <Stamp color={C.ink}>Pagado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                          title="Se confirma desde la vista del colaborador"
                        >
                          Pendiente
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <button onClick={() => eliminarInvitado(g.id)}>
                    <Trash2 size={14} style={{ color: C.wax }} />
                  </button>
                </div>
              );
            })}
            {invitados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Aún no hay invitados en la lista.
              </p>
            )}
            {invitados.length > 0 && invitadosOrdenados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Ningún invitado coincide con los filtros aplicados.
              </p>
            )}
            </div>
          </div>
        </div>
      </VentanaFlotante>

      {mostrarResumenAsignacion && (
        <ModalFlotante
          titulo="Resumen de asignaciones"
          onCerrar={cancelarAvisosAsignacion}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Estos colaboradores tienen invitados nuevos asignados. ¿Quieres avisarles ya?
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {colaboradoresPendientes.map((c) => (
              <li key={c.id}>
                {c.nombre}
                {!c.email && (
                  <span style={{ color: C.wax }}> — sin email, no se le podrá avisar</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={enviarAvisosAsignacion}
              disabled={enviandoAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisosAsignacion ? "Enviando…" : "Enviar avisos"}
            </button>
            <button
              onClick={() => setMostrarResumenAsignacion(false)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Seguir editando
            </button>
            <button
              onClick={cancelarAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.wax}`, color: C.wax }}
            >
              Cancelar (no avisar)
            </button>
          </div>
        </ModalFlotante>
      )}

      {panelFlotante && panelFlotante !== "avisosMesas" && (
        <ModalFlotante
          titulo={
            panelFlotante === "tabla"
              ? "Lista de invitados"
              : panelFlotante === "canciones"
              ? `Canciones para bailar — ${evento.nombre || "Evento"}`
              : `⚠ Alergias — ${evento.nombre || "Evento"}`
          }
          colorTitulo={panelFlotante === "alergias" ? C.wax : C.ink}
          onCerrar={() => setPanelFlotante(null)}
          acciones={
            <>
              <button
                onClick={imprimirPanelActivo}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.ink, color: C.paper }}
              >
                <Printer size={14} /> Imprimir
              </button>
              <button
                onClick={exportarPanelActivoCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                <Copy size={14} /> Exportar CSV
              </button>
              <span className="text-xs ml-auto" style={{ color: C.charcoal, opacity: 0.6 }}>
                Si no se abre el diálogo de impresión, usa Cmd/Ctrl+P.
              </span>
            </>
          }
        >
          <div id="zona-imprimible">
            {panelFlotante === "tabla" && (
              <>
                <div
                  className="text-xs mb-2"
                  style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Edad media de los asistentes:{" "}
                  <strong style={{ color: C.ink }}>
                    {edadPromedio(invitadosOrdenados, evento) ?? "— (faltan años de nacimiento)"}
                    {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
                  </strong>
                </div>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Grupo familiar</span>
                  <span>Zona</span>
                  <span>Colaborador</span>
                  <span>Mesa</span>
                  <span>Confirmado</span>
                  <span>Pagado</span>
                </div>
                {invitadosOrdenados.map((g, i) => {
                  const col = resolverColaborador(g, colaboradores);
                  return (
                    <div
                      key={g.id}
                      className="grid px-2 py-1.5 text-sm"
                      style={{
                        gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{g.grupoFamiliar || g.apellido || "—"}</span>
                      <span>{g.zona || "—"}</span>
                      <span>{col ? col.nombre : "—"}</span>
                      <span>{g.mesa ?? "—"}</span>
                      <span>{g.confirmado ? "Sí" : "Tentativa"}</span>
                      <span>{g.confirmado ? (g.pagado ? "Sí" : "No") : "—"}</span>
                    </div>
                  );
                })}
                {invitadosOrdenados.length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Ningún invitado coincide con los filtros aplicados.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "canciones" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Edad</span>
                  <span>Canción</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter((g) => g.cancion && g.cancion.trim())).map(
                  (g, i) => (
                    <div
                      key={g.id}
                      className="grid px-2 py-2 text-sm"
                      style={{
                        gridTemplateColumns: "1.5fr 0.6fr 2fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{calcularEdad(g.anioNacimiento, evento) ?? "—"}</span>
                      <span>{g.cancion}</span>
                    </div>
                  )
                )}
                {invitados.filter((g) => g.cancion && g.cancion.trim()).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado una canción.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "alergias" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.wax,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Mesa</span>
                  <span>Alergia</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g, i) => (
                  <div
                    key={g.id}
                    className="grid px-2 py-2 text-sm"
                    style={{
                      gridTemplateColumns: "1.5fr 0.6fr 2fr",
                      background: i % 2 ? "#FBEAEA" : "#fff",
                      color: C.charcoal,
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      {g.apellido}, {g.nombre}
                    </span>
                    <span>{g.mesa ?? "—"}</span>
                    <span style={{ color: C.wax }}>{g.alergias}</span>
                  </div>
                ))}
                {invitados.filter(tieneAlergiaReal).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado alergias.
                  </p>
                )}
              </>
            )}
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
