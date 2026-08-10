// Ventana "Formularios": qué invitados tiene asignados cada colaborador,
// con el desplegable para reasignarlos. Es la otra mitad de la antigua
// VentanaColaboradores.jsx (la otra vive en
// VentanaColaboradoresDatos.jsx) — separadas en el reparto del
// 2026-08-09 porque son dos cosas distintas: quién es cada colaborador
// vs. qué invitados gestiona cada uno.
//
// `asignarColaborador` no vive aquí: se sigue definiendo en VistaAnfitrion
// porque la tabla principal de invitados (Lista de invitados) también la
// usa para su propio desplegable de asignación — moverla aquí duplicaría
// esa lógica en dos sitios.
import { C } from "../../theme";
import { ColaboradorFormularioCard } from "../../components/ColaboradorFormularioCard";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaColaboradoresFormularios({ data, asignarColaborador, onCerrar }) {
  const { colaboradores, invitados } = data;

  return (
    <VentanaFlotante clave="colaboradores-formularios" titulo="Formularios de colaboradores" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Qué invitados tiene asignados cada colaborador — reasígnalos desde el
        desplegable de cada fila.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {colaboradores.map((c) => (
          <ColaboradorFormularioCard
            key={c.id}
            c={c}
            invitados={invitados}
            colaboradores={colaboradores}
            onAsignarColaborador={asignarColaborador}
          />
        ))}
        {colaboradores.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Aún no hay colaboradores.
          </p>
        )}
      </div>
    </VentanaFlotante>
  );
}
