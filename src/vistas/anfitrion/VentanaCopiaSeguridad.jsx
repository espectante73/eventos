// Ventana "Copia de seguridad": exporta a texto una foto de los datos.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 1). `exportarTodo` vive aparte, en lib/backup.js, porque BORRAR
// TODO, Modo Pruebas y los reinicios también la usan para su copia
// automática antes de la acción destructiva.
//
// ⚠️ RESTAURAR SE RETIRÓ el 2026-09-13 (v24.4). Existía desde la época
// en que la app era un artefacto sin base de datos: republicar borraba
// todo, y pegar aquí el texto era la única forma de recuperarlo. Hoy hay
// base de datos real y un volcado diario automático, así que ese camino
// no solo sobraba -- se había vuelto peligroso:
//
// - `exportarTodo` guarda 5 de las 12 tablas. Se dejaba fuera el tablón,
//   las cuentas, el orden de las familias y los avisos enviados.
// - De cada colaborador solo guardaba nombre y email: NI su cuenta de
//   acceso (`authUserId`) NI sus permisos. Restaurar dejaba a los doce
//   colaboradores sin poder entrar.
// - Regeneraba todos los ids y volvía a enlazar a las personas
//   comparando nombres escritos -- un apellido distinto y el invitado se
//   quedaba huérfano.
//
// Recuperar de verdad es una emergencia rara y toca hacerlo desde el
// volcado diario (.github/workflows/backup.yml), que sí está completo.
// Si algún día se quiere volver a tener un "restaurar" aquí dentro,
// primero hay que arreglar `exportarTodo` para que guarde la caja
// entera y conserve los ids -- ver el análisis en CLAUDE.md.
import { useState } from "react";
import { Copy } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { exportarTodo } from "../../lib/backup";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaCopiaSeguridad({ data, onCerrar }) {
  const { evento, mesas, fotosFamiliares, colaboradores, invitados } = data;
  const [mostrarExportar, setMostrarExportar] = useState(false);

  return (
    <VentanaFlotante clave="copiaSeguridad" titulo="Copia de seguridad" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
        La copia de seguridad de verdad se hace sola: cada día se guarda un volcado completo
        de la base de datos. Esto de aquí es solo una foto de mano, por si quieres llevarte el
        estado actual a un archivo antes de tocar algo.
      </p>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
        No hay botón de restaurar a propósito: esta foto no guarda las cuentas ni los permisos
        de los colaboradores, así que recuperarla dejaría a todos sin poder entrar. Si algún día
        hace falta recuperar de verdad, se hace desde el volcado diario.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setMostrarExportar((v) => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ border: `1px solid ${C.gold}`, color: C.gold }}
        >
          <Copy size={14} /> Exportar todo
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
    </VentanaFlotante>
  );
}
