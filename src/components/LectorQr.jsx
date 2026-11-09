// Leer un QR con la cámara DENTRO de la página (él, v83.8), para acreditar
// una familia tras otra sin salir: una página no puede abrir la app Cámara
// del móvil ni usar su lector, y Safari no les presta el suyo. La librería,
// solo al abrir esto: no pesa en el resto de la app.
// ⚠️ Mientras se usa, no tocar la dirección de la página (ni hash ni
// replaceState): el iPhone puede volver a pedir el permiso de la cámara.
import { useEffect, useRef, useState } from "react";
import { C, OP, R } from "../theme";
import { LineaAviso } from "./LineaAviso";

const CADA_MS = 200;
// Más que esto no ayuda a leer el QR y cuesta en un móvil.
const LADO_ANALISIS = 800;
// El mismo QR, todavía delante de la cámara, no se vuelve a entregar en este
// rato: si no valía, su aviso se queda en pantalla para poder leerlo.
const REPETIR_MS = 3000;

const motivoSinCamara = (error) =>
  error?.name === "NotAllowedError"
    ? "El móvil no ha dado permiso para usar la cámara. Actívalo en los ajustes del navegador, o lee el QR con la cámara normal."
    : "No se ha podido encender la cámara. Lee el QR con la cámara normal del móvil.";

export function LectorQr({ onTexto }) {
  const videoRef = useRef(null);
  const onTextoRef = useRef(onTexto);
  useEffect(() => {
    onTextoRef.current = onTexto;
  }, [onTexto]);
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    let flujo = null;
    let turno = null;
    // Cada arranque o parada lo sube: lo que estaba a medias ya no vale.
    let intento = 0;
    let anterior = "";
    let cuando = 0;
    const lienzo = document.createElement("canvas");

    const parar = () => {
      intento += 1;
      clearTimeout(turno);
      flujo?.getTracks().forEach((pista) => pista.stop());
      flujo = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const textoDelVideo = (video, jsQR) => {
      const { videoWidth: ancho, videoHeight: alto } = video;
      if (!ancho || !alto) return "";
      const escala = Math.min(1, LADO_ANALISIS / Math.max(ancho, alto));
      lienzo.width = Math.round(ancho * escala);
      lienzo.height = Math.round(alto * escala);
      const pincel = lienzo.getContext("2d", { willReadFrequently: true });
      pincel.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      const { data, width, height } = pincel.getImageData(0, 0, lienzo.width, lienzo.height);
      return jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data || "";
    };

    const arrancar = async () => {
      parar();
      const este = intento;
      setFallo("");
      try {
        const { default: jsQR } = await import("jsqr");
        const nuevo = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        });
        if (este !== intento) {
          nuevo.getTracks().forEach((pista) => pista.stop());
          return;
        }
        flujo = nuevo;
        const video = videoRef.current;
        video.srcObject = nuevo;
        await video.play();
        const vuelta = async () => {
          try {
            const texto = textoDelVideo(video, jsQR);
            const ahora = Date.now();
            if (texto && (texto !== anterior || ahora - cuando > REPETIR_MS)) {
              anterior = texto;
              cuando = ahora;
              await onTextoRef.current?.(texto);
            }
          } catch {
            // Un fotograma que falla no puede dejar la cámara sin leer.
          }
          if (este === intento) turno = setTimeout(vuelta, CADA_MS);
        };
        turno = setTimeout(vuelta, CADA_MS);
      } catch (error) {
        if (este === intento) setFallo(motivoSinCamara(error));
      }
    };

    // Con el móvil bloqueado o en otra app, la cámara se apaga.
    const alCambiar = () => (document.hidden ? parar() : arrancar());
    arrancar();
    document.addEventListener("visibilitychange", alCambiar);
    return () => {
      document.removeEventListener("visibilitychange", alCambiar);
      parar();
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden" style={{ borderRadius: R.caja, background: C.ink, aspectRatio: "1 / 1" }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      {fallo ? (
        <LineaAviso className="text-sm">{fallo}</LineaAviso>
      ) : (
        <p className="text-center" style={{ opacity: OP.secundario }}>
          Enfoca el QR de la invitación.
        </p>
      )}
    </div>
  );
}
