// El cuerpo de la noticia «De dónde venimos» en el tablón (v73, él, boceto
// aprobado): las zonas de los confirmados, dos por línea y en orden
// alfabético, cada una con cuántos vienen; la del propio invitado, en
// verde; y al pie, el total. Solo cifras: nunca quién.
import { C, OP } from "../theme";
import { Cargando } from "../components/Cargando";
import { ordenarZonas, pieZonas } from "../lib/zonasTablon";

// `datos`: lo que da tablon_zonas ({ miZona, zonas: [{ zona, confirmados }] }),
// o null mientras llega.
export function ZonasTablon({ datos }) {
  if (!datos) return <Cargando />;
  const zonas = ordenarZonas(datos.zonas || []);
  if (zonas.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
        Todavía no hay ningún confirmado.
      </p>
    );
  }
  return (
    <div>
      <ul className="grid grid-cols-2 gap-2">
        {zonas.map((z) => {
          const tuya = z.zona === datos.miZona;
          return (
            <li
              key={z.zona}
              data-zona={z.zona}
              className="flex items-baseline justify-between gap-2 rounded-full px-3 py-1.5 min-w-0 text-sm"
              style={{
                background: tuya ? C.ink : C.paper,
                color: tuya ? C.paper : C.ink,
                border: `1px solid ${tuya ? C.ink : C.line}`,
              }}
            >
              <span className="truncate">{z.zona}</span>
              <b style={{ fontFamily: "'Fraunces', serif" }}>{z.confirmados}</b>
            </li>
          );
        })}
      </ul>
      <p className="text-xs mt-3" style={{ color: C.charcoal, opacity: OP.secundario }}>
        {pieZonas(zonas)}
      </p>
    </div>
  );
}
