// "Motor" de enviar la invitación a una familia -- calcula qué familias
// están listas (confirmadas + pagadas + con mesa), resuelve a quién
// enviarle, genera la imagen y dispara el envío real. Extraído de
// VistaAnfitrion.jsx el 2026-08-25 (antes vivía inline ahí) para poder
// reutilizarlo también desde VistaColaborador.jsx -- el permiso
// "invitaciones_enviar" (ver lib/permisos.js) deja a un colaborador
// concreto enviar invitaciones, pero SOLO a las familias que este mismo
// cálculo ya considera "listas" (confirmadas + pagadas + con mesa), sin
// tener que duplicar el filtro en dos sitios.
import { useState } from "react";
import { generarInvitacionImagen } from "./imagenInvitacion";

export function useMotorInvitaciones(data) {
  const { evento, colaboradores, invitados, ordenFamiliares, persistOrdenFamiliares, enviarInvitacionFamilia } = data;

  // Si el anfitrión reordenó los nombres a mano (p.ej. esposo primero),
  // se respeta ese orden; los que falten en él (recién confirmados) van
  // al final, en su orden normal.
  const ordenarConfirmados = (confirmados, ordenIds) => {
    if (!ordenIds || ordenIds.length === 0) return confirmados;
    const porId = Object.fromEntries(confirmados.map((m) => [m.id, m]));
    const ordenados = ordenIds.map((id) => porId[id]).filter(Boolean);
    const idsOrdenados = new Set(ordenIds);
    const resto = confirmados.filter((m) => !idsOrdenados.has(m.id));
    return [...ordenados, ...resto];
  };

  const familiasListasParaInvitacion = (() => {
    const grupos = {};
    invitados.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      (grupos[clave] = grupos[clave] || []).push(g);
    });
    return Object.entries(grupos)
      .map(([clave, miembros]) => {
        const confirmados = ordenarConfirmados(
          miembros.filter((m) => m.confirmado),
          ordenFamiliares[clave]?.orden
        );
        const apellido = miembros[0].apellido || clave;
        return {
          clave,
          apellido,
          confirmados,
          invitacionEnviada: Boolean(ordenFamiliares[clave]?.invitacionEnviada),
          invitacionEnviadaEn: ordenFamiliares[clave]?.invitacionEnviadaEn || null,
          listaParaInvitacion:
            confirmados.length > 0 &&
            confirmados.every((m) => m.pagado) &&
            confirmados.every((m) => m.mesa),
        };
      })
      .filter((f) => f.listaParaInvitacion);
  })();

  // El email de un invitado puede vivir en su propio registro, o -si ese
  // invitado es también colaborador- en el registro de colaboradores (se
  // edita solo ahí; el campo de su propia ficha se queda vacío a
  // propósito). Para saber la dirección real de alguien hay que mirar
  // los dos sitios.
  const emailDeInvitado = (miembro) =>
    miembro.email || colaboradores.find((c) => c.invitadoId === miembro.id)?.email || "";

  // El destinatario del email de invitación no tiene por qué ser el primero
  // del orden de nombres (ese orden es solo para el texto de la propia
  // invitación) — se busca el primer confirmado de la familia que SÍ tenga
  // email (propio o de su colaborador vinculado), sea cual sea su posición.
  const destinatarioConEmail = (familia) => {
    const elegido =
      familia.confirmados.find((m) => emailDeInvitado(m)) || familia.confirmados[0];
    return elegido ? { ...elegido, email: emailDeInvitado(elegido) } : elegido;
  };

  const marcarInvitacionEnviada = (clave) => {
    persistOrdenFamiliares({
      ...ordenFamiliares,
      [clave]: {
        ...ordenFamiliares[clave],
        invitacionEnviada: true,
        invitacionEnviadaEn: new Date().toISOString(),
      },
    });
  };

  const [descargando, setDescargando] = useState(null);
  const [modoCalibracion, setModoCalibracion] = useState(false);

  const generarImagenParaFamilia = async (familia, mostrarCuadricula = modoCalibracion) => {
    // Fraunces tiene que estar realmente cargada antes de dibujar en el
    // canvas — si no, el navegador la ignora en silencio y usa una por
    // defecto sin avisar.
    try {
      await document.fonts.load("bold 40px 'Fraunces'");
    } catch (_) {
      // Si falla la carga, se sigue igualmente con la fuente de reserva.
    }
    const nombres = familia.confirmados.map((m) => m.nombre);
    const cantidad = familia.confirmados.length;
    const mesas = [...new Set(familia.confirmados.map((m) => m.mesa).filter(Boolean))];
    const mesaTexto =
      mesas.length === 1
        ? `Mesa ${mesas[0]} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : mesas.length > 1
        ? `Mesas ${mesas.join(", ")} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : `${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`;
    return generarInvitacionImagen(evento, familia.apellido, nombres, mesaTexto, mostrarCuadricula);
  };

  const [previewInvitacion, setPreviewInvitacion] = useState(null); // { familia, dataUrl, destinatario } | null
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  const abrirPreviewInvitacion = async (familia) => {
    const destinatario = destinatarioConEmail(familia);
    if (!destinatario?.email) {
      window.alert(
        "No se puede enviar todavía: ninguno de los confirmados de esta familia tiene " +
          "email guardado. Rellena el de alguno de ellos (en su formulario de datos) para poder enviarle la invitación."
      );
      return;
    }
    setDescargando(familia.clave);
    const dataUrl = await generarImagenParaFamilia(familia);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    setPreviewInvitacion({ familia, dataUrl, destinatario });
  };

  const confirmarEnvioInvitacion = async () => {
    if (!previewInvitacion) return;
    setEnviandoInvitacion(true);
    const base64 = previewInvitacion.dataUrl.split(",")[1] || "";
    const ok = await enviarInvitacionFamilia(
      previewInvitacion.destinatario.email,
      `Tu invitación — ${evento.nombre || "evento"}`,
      evento.plantillaInvitacionFamilia || "",
      base64
    );
    setEnviandoInvitacion(false);
    if (ok) {
      marcarInvitacionEnviada(previewInvitacion.familia.clave);
      window.alert(`Invitación enviada a ${previewInvitacion.destinatario.email}.`);
      setPreviewInvitacion(null);
    }
  };

  return {
    familiasListasParaInvitacion,
    emailDeInvitado,
    destinatarioConEmail,
    marcarInvitacionEnviada,
    descargando,
    setDescargando,
    modoCalibracion,
    setModoCalibracion,
    generarImagenParaFamilia,
    previewInvitacion,
    setPreviewInvitacion,
    enviandoInvitacion,
    abrirPreviewInvitacion,
    confirmarEnvioInvitacion,
  };
}
