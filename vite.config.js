import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VERSION_APP, AVISO_VERSION } from "./src/constants.js";

// /version.json (v81.6): el número y el aviso de lo publicado. Una pestaña
// abierta con la versión anterior lo lee para decir, en el aviso rojo, a
// qué versión lleva «Actualizar» y qué cambia (lib/avisoVersion.js).
const versionPublicada = () => ({
  name: "version-publicada",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ version: VERSION_APP, aviso: AVISO_VERSION }),
    });
  },
});

export default defineConfig({
  plugins: [react(), versionPublicada()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://ejemplo.com/",
      },
    },
  },
});
