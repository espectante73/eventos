// El icono de Invitaciones (él, v90.6: «mejor un móvil con QR en la
// pantalla»): la invitación llega al móvil y lleva el QR con el que se entra
// (v83.2). Dibujado con el mismo trazo que los iconos de la app (lucide):
// mismo cuadrado de 24, mismo grosor y puntas redondas, para que en el menú y
// en la barra se vea del mismo tamaño que los demás.
export function IconoMovilQr({ size = 24, strokeWidth = 2, ...resto }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      {/* El QR: sus tres esquinas y unos puntos, con trazo más fino. */}
      <g strokeWidth={strokeWidth * 0.75}>
        <rect x="8" y="5.5" width="3" height="3" rx="0.4" />
        <rect x="13" y="5.5" width="3" height="3" rx="0.4" />
        <rect x="8" y="10.5" width="3" height="3" rx="0.4" />
        <path d="M13 11h0.01M15.5 11v2.5M13 13.5h1" />
      </g>
      <path d="M10.5 18.5h3" />
    </svg>
  );
}
