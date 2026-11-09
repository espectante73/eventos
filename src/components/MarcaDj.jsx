// Los auriculares junto al nombre del DJ contratado (él, v84.2), en las listas
// y fichas: quién es lo dice su zona (esDj, lib/invitados.js).
import { Headphones } from "lucide-react";
import { esDj } from "../lib/invitados";

export function MarcaDj({ persona, size = 14 }) {
  if (!esDj(persona)) return null;
  return <Headphones size={size} aria-label="DJ" className="inline-block align-text-bottom mr-1" />;
}
