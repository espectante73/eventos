// UUID real (no Math.random()): las columnas de la base de datos son de tipo
// uuid, y además esto es lo que hace que el enlace de cada colaborador sea
// realmente imposible de adivinar (no hay contraseña, el id ES la "llave").
export const uid = () => crypto.randomUUID();
