// El pago y la llegada, para toda la familia de una vez (norma 11): al
// marcar o deshacer uno, se pregunta "¿es para toda la familia?", Sí o No.
//
// Aquí solo se prepara la pregunta: quién entra, quién no puede y por qué,
// y el total a cobrar. Quién marca de verdad es la base
// (colaborador_marcar_familia), que hace las mismas comprobaciones para
// todos a la vez: o todos o ninguno.
import { claveFamilia, datosCompletos, importeEsperadoInvitado } from "./invitados";
import { nombreCompleto } from "./formato";
import { requisitosActivos } from "./modoPruebas";

// Un miembro de la familia con lo justo para preguntar. Es lo mismo que
// devuelve colaborador_familia_de, para que el anfitrión (que tiene la
// lista entera) y el colaborador (que la pide a la base) usen una sola
// forma.
export function comoMiembro(g) {
  return {
    id: g.id,
    nombre: g.nombre,
    apellido: g.apellido,
    anioNacimiento: g.anioNacimiento,
    datosCompletos: datosCompletos(g),
    pagado: Boolean(g.pagado),
    presente: Boolean(g.presente),
  };
}

// Los confirmados de la misma familia, sacados de una lista entera (la del
// anfitrión). Incluye a los que lleva otro colaborador.
export function familiaDe(invitados, g) {
  const clave = claveFamilia(g);
  if (!clave) return [comoMiembro(g)];
  return invitados.filter((x) => x.confirmado && claveFamilia(x) === clave).map(comoMiembro);
}

const MOTIVO = {
  datos: "le faltan datos obligatorios",
  pago: "todavía no ha pagado",
  cerrado: "el anfitrión todavía no ha abierto el control de llegadas",
};

// campo: "pagado" | "presente"; valor: true = marcar, false = deshacer.
// Devuelve a quién cambiaría, quién lo impide (con su motivo) y, al
// cobrar, el total. `puedeTodos` es falso si alguien lo impide: la base
// no haría nada, así que el "Sí" no se ofrece.
export function preguntaFamilia(miembros, campo, valor, { evento, marcadoAbierto = true } = {}) {
  const aCambiar = miembros.filter((m) => m[campo] !== valor);
  // En Modo Pruebas nadie queda bloqueado (lib/modoPruebas.js).
  const bloqueados = valor && requisitosActivos(evento)
    ? aCambiar
        .map((m) => {
          if (campo === "presente" && !marcadoAbierto) return { m, motivo: MOTIVO.cerrado };
          if (!m.datosCompletos) return { m, motivo: MOTIVO.datos };
          if (campo === "presente" && !m.pagado) return { m, motivo: MOTIVO.pago };
          return null;
        })
        .filter(Boolean)
    : [];
  const total =
    campo === "pagado" && valor ? aCambiar.reduce((s, m) => s + importeEsperadoInvitado(m, evento), 0) : null;
  return { aCambiar, bloqueados, total, puedeTodos: bloqueados.length === 0 };
}

export const euros = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

// El texto de la pregunta, una línea por persona ("Apellido, Nombre",
// norma 15), el total al cobrar y, si alguien lo impide, quién y por qué
// (norma 13).
export function textoPreguntaFamilia({ aCambiar, bloqueados, total }, campo, valor, evento) {
  const lineas = aCambiar.map((m) =>
    campo === "pagado" && valor ? `${nombreCompleto(m)} — ${euros(importeEsperadoInvitado(m, evento))}` : nombreCompleto(m)
  );
  if (total !== null) lineas.push(`Total: ${euros(total)}`);
  if (bloqueados.length) {
    lineas.push("");
    lineas.push("No se puede a toda la familia:");
    bloqueados.forEach(({ m, motivo }) => lineas.push(`${nombreCompleto(m)}: ${motivo}.`));
  }
  return lineas.join("\n");
}
