// @vitest-environment jsdom
// v72.4: el script anti-robots solo se pide en la pantalla de entrar.
import { it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { cargarTurnstile, URL_TURNSTILE } from "./turnstile";

const scripts = () => [...document.head.querySelectorAll("script")].filter((s) => s.src === URL_TURNSTILE);

beforeEach(() => {
  delete window.turnstile;
  scripts().forEach((s) => s.remove());
});

it("ya no va en index.html, que se descarga al abrir la app siempre", () => {
  expect(readFileSync("index.html", "utf8")).not.toContain("challenges.cloudflare.com");
});

it("lo pide una sola vez aunque la pantalla de entrar se abra varias", () => {
  cargarTurnstile();
  cargarTurnstile();
  expect(scripts()).toHaveLength(1);
});

it("si ya está, no lo vuelve a pedir", async () => {
  window.turnstile = { render: () => "w" };
  await expect(cargarTurnstile()).resolves.toBe(window.turnstile);
  expect(scripts()).toHaveLength(0);
});
