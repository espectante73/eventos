// Genera el texto JSON de "Exportar todo" — usado tanto por la ventana
// "Copia de seguridad" (exportar a mano) como por BORRAR TODO y los
// reinicios (backup automático antes de una acción destructiva). Pura: no
// lee nada de React, solo los datos que se le pasan. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 1) para
// poder compartirla entre varias ventanas ya independientes.
import { ordenarPorApellidoNombre } from "./formato";
import { resolverColaborador } from "./invitados";

export function exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados }) {
  const datos = {
    version: 1,
    evento,
    mesas,
    fotosFamiliares,
    colaboradores: colaboradores.map((c) => ({
      nombre: c.nombre,
      email: c.email || "",
    })),
    invitados: ordenarPorApellidoNombre(invitados).map((g) => {
      const col = resolverColaborador(g, colaboradores);
      return {
        grupoFamiliar: g.grupoFamiliar || g.apellido || "",
        apellido: g.apellido || "",
        nombre: g.nombre || "",
        zona: g.zona || "",
        confirmado: Boolean(g.confirmado),
        colaboradorNombre: col ? col.nombre : "",
        mesa: g.mesa || null,
        anioNacimiento: g.anioNacimiento || "",
        anioBoda: g.anioBoda || "",
        email: g.email || "",
        cancion: g.cancion || "",
        alergias: g.alergias || "",
        observaciones: g.observaciones || "",
        pagado: Boolean(g.pagado),
      };
    }),
  };
  return JSON.stringify(datos, null, 2);
}
