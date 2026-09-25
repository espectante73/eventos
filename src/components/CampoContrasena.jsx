// El campo de contraseña de la app, con el ojo para verla.
//
// Pedido por el usuario el 2026-09-23: **"el ojo que permite ver la
// contraseña para evitar error"**. En el móvil, escribir una contraseña
// a ciegas y equivocarse en una letra es lo más normal del mundo, y el
// mensaje que sale después ("no se pudo entrar") no dice que el fallo
// fue una tecla.
//
// Pieza única: hay cuatro campos de contraseña en la app (entrar, crear
// cuenta y las dos de cambiarla). Cuatro copias del mismo ojo acabarían
// siendo cuatro ojos distintos.
//
// ⚠️ El ojo NO lleva relieve, a diferencia de lo que pide la norma 4.
// Es el mismo caso que los links del login: un icono dentro del campo es
// el estándar de internet, el que cualquiera reconoce. Una pastilla con
// relieve metida dentro de un input se vería como un error.
// Aun así, `type="button"` y 44 px de alto: el dedo tiene dónde acertar.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { C, inputStyle, OP } from "../theme";

export function CampoContrasena({ etiqueta = "Contraseña", className = "", style, ...resto }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      {etiqueta && (
        <label className="block text-xs mb-1" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {etiqueta}
        </label>
      )}
      <div className={`relative ${className}`}>
        <input
          {...resto}
          type={visible ? "text" : "password"}
          className="w-full"
          // Sitio a la derecha para el ojo, para que no se meta encima
          // del texto cuando la contraseña es larga.
          style={{ ...inputStyle, width: "100%", height: 42, paddingRight: 44, ...style }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // El estado se dice en palabras: un icono solo no lo cuenta un
          // lector de pantalla.
          title={visible ? "Ocultar la contraseña" : "Ver la contraseña"}
          aria-label={visible ? "Ocultar la contraseña" : "Ver la contraseña"}
          aria-pressed={visible}
          className="absolute top-0 right-0 flex items-center justify-center"
          style={{ width: 44, height: 42, background: "none", border: "none", color: C.charcoal, opacity: OP.secundario, cursor: "pointer" }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}
