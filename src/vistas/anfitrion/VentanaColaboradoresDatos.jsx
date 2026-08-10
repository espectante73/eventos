// Ventana "Datos Colab.": añadir uno nuevo (buscando entre los invitados
// ya existentes) y la tarjeta de cada uno (ColaboradorCard: enlace,
// email, invitación, relevo, eliminar). Es la mitad de "quién es cada
// colaborador" — la otra mitad ("qué invitados gestiona cada uno") vive
// en VentanaColaboradoresFormularios.jsx. Ambas sustituyen a la antigua
// VentanaColaboradores.jsx (reparto del 2026-08-09, dos ventanas
// accesibles desde el submenú "Colaboradores" de "Abrir sección…").
import { useState } from "react";
import { Plus } from "lucide-react";
import { C } from "../../theme";
import { uid } from "../../lib/id";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { BuscadorInvitado } from "../../components/BuscadorInvitado";
import { ColaboradorCard } from "../../components/ColaboradorCard";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaColaboradoresDatos({ data, onCerrar }) {
  const { colaboradores, invitados, persistColaboradores, persistInvitados, probarEmailColaborador, enviarInvitacionLogin } = data;
  const [nuevoColab, setNuevoColab] = useState({ invitadoId: "" });

  const idsYaColaboradores = new Set(colaboradores.map((c) => c.invitadoId).filter(Boolean));
  const invitadosDisponiblesParaColaborador = invitados.filter((g) => !idsYaColaboradores.has(g.id));

  const agregarColaborador = () => {
    if (!nuevoColab.invitadoId) return;

    const inv = invitados.find((g) => g.id === nuevoColab.invitadoId);
    if (!inv) return;
    const nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();

    persistColaboradores([
      ...colaboradores,
      { id: uid(), nombre: nombreFinal, invitadoId: nuevoColab.invitadoId, email: "" },
    ]);
    setNuevoColab({ invitadoId: "" });
  };

  const eliminarColaborador = (id) => {
    persistColaboradores(colaboradores.filter((c) => c.id !== id));
  };

  const cambiarEmailColaborador = (id, email) => {
    persistColaboradores(colaboradores.map((c) => (c.id === id ? { ...c, email } : c)));
  };

  // Relevo: un nuevo colaborador toma el relevo del anterior. Los invitados ya
  // asignados (y sus datos ya recopilados) pasan al nuevo sin perder nada.
  const relevarColaborador = (idAnterior, { invitadoId, nombreNuevo }) => {
    const anterior = colaboradores.find((c) => c.id === idAnterior);
    if (!anterior) return;

    let invitadoIdFinal = invitadoId;
    let nombreFinal = nombreNuevo;
    let invitadosSiguientes = invitados;

    if (invitadoIdFinal) {
      const inv = invitados.find((g) => g.id === invitadoIdFinal);
      if (inv) nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();
    } else if (nombreFinal) {
      const [apellido = "", nombre = ""] = nombreFinal.split(",").map((s) => s.trim());
      const nuevoInvitadoObj = {
        id: uid(),
        nombre,
        apellido,
        zona: "",
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: apellido || nombre,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      };
      invitadoIdFinal = nuevoInvitadoObj.id;
      invitadosSiguientes = [...invitados, nuevoInvitadoObj];
    } else {
      return;
    }

    const nuevoId = uid();
    persistColaboradores(
      colaboradores
        .filter((c) => c.id !== idAnterior)
        .concat({ id: nuevoId, nombre: nombreFinal, invitadoId: invitadoIdFinal, email: "" })
    );
    persistInvitados(
      invitadosSiguientes.map((g) =>
        g.colaboradorId === idAnterior ? { ...g, colaboradorId: nuevoId } : g
      )
    );
  };

  return (
    <VentanaFlotante clave="colaboradores-datos" titulo="Datos de colaboradores" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
        Los colaboradores son también invitados del evento: búscalo por apellido o
        nombre entre los ya añadidos a la lista. Si aún no está en la lista, añádelo
        primero abajo en "Lista de invitados".
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <BuscadorInvitado
          invitados={invitadosDisponiblesParaColaborador}
          invitadoId={nuevoColab.invitadoId}
          onSeleccionar={(id) => setNuevoColab({ ...nuevoColab, invitadoId: id })}
          placeholder="Buscar invitado para hacerlo colaborador..."
        />
        <button
          onClick={agregarColaborador}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ background: C.ink, color: C.paper }}
        >
          <Plus size={14} /> Añadir
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {colaboradores.map((c) => {
          const pendientes = invitados.filter(
            (g) =>
              resolverColaborador(g, colaboradores)?.id === c.id &&
              g.confirmado &&
              !datosCompletos(g)
          ).length;
          return (
            <ColaboradorCard
              key={c.id}
              c={c}
              pendientes={pendientes}
              invitados={invitados}
              colaboradores={colaboradores}
              onEliminar={eliminarColaborador}
              onRelevar={relevarColaborador}
              onCambiarEmail={cambiarEmailColaborador}
              onProbarEmail={probarEmailColaborador}
              onEnviarInvitacionLogin={enviarInvitacionLogin}
            />
          );
        })}
        {colaboradores.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Aún no hay colaboradores.
          </p>
        )}
      </div>
    </VentanaFlotante>
  );
}
