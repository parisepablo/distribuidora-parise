export const PRODUCTOS = [
  { id: "bidon_12" as const, label: "Bidón 12L" },
  { id: "bidon_20" as const, label: "Bidón 20L" },
  { id: "cajon_soda" as const, label: "Cajón de soda" },
] as const;

export type ProductoId = (typeof PRODUCTOS)[number]["id"];

export const CATEGORIAS_GASTO = [
  { id: "combustible" as const, label: "Combustible" },
  { id: "mantenimiento" as const, label: "Mantenimiento" },
  { id: "insumos" as const, label: "Insumos" },
  { id: "otros" as const, label: "Otros" },
] as const;

export type CategoriaGastoId = (typeof CATEGORIAS_GASTO)[number]["id"];

export function formatearDinero(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(valor);
}

export function formatearFecha(
  fecha: Date | string,
  opciones: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  }
): string {
  const fechaDate = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-AR", opciones).format(fechaDate);
}

export function etiquetaProducto(id: ProductoId): string {
  return PRODUCTOS.find((p) => p.id === id)?.label ?? id;
}
