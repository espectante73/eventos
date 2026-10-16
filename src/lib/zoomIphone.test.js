import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { evitarZoomAlEscribir, esIOS } from "./zoomIphone";

const IPHONE = { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15", platform: "iPhone", maxTouchPoints: 5 };
const IPAD = { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", platform: "MacIntel", maxTouchPoints: 5 };
const MAC = { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 };
const ANDROID = { userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140", platform: "Linux armv8l", maxTouchPoints: 5 };

const viewport = () => document.querySelector('meta[name="viewport"]').getAttribute("content");

beforeEach(() => {
  document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';
});

describe("el iPhone no acerca la pantalla al tocar un campo (v68.4)", () => {
  it("en iPhone e iPad, el viewport lleva maximum-scale=1, una sola vez", () => {
    expect(evitarZoomAlEscribir(document, IPHONE)).toBe(true);
    evitarZoomAlEscribir(document, IPHONE);
    expect(viewport()).toBe("width=device-width, initial-scale=1.0, maximum-scale=1");
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';
    expect(evitarZoomAlEscribir(document, IPAD)).toBe(true);
  });

  it("en Android y en el ordenador no se toca: ahí quitaría ampliar con dos dedos", () => {
    expect(esIOS(ANDROID)).toBe(false);
    expect(esIOS(MAC)).toBe(false);
    evitarZoomAlEscribir(document, ANDROID);
    expect(viewport()).toBe("width=device-width, initial-scale=1.0");
  });

  it("la app lo llama al arrancar", () => {
    expect(readFileSync("src/main.jsx", "utf8")).toMatch(/evitarZoomAlEscribir\(\);/);
  });
});
