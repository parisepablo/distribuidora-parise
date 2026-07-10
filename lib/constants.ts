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

export const DIAS_SEMANA = [
  { id: "lunes" as const, label: "Lun", labelLargo: "Lunes" },
  { id: "martes" as const, label: "Mar", labelLargo: "Martes" },
  { id: "miercoles" as const, label: "Mié", labelLargo: "Miércoles" },
  { id: "jueves" as const, label: "Jue", labelLargo: "Jueves" },
  { id: "viernes" as const, label: "Vie", labelLargo: "Viernes" },
  { id: "sabado" as const, label: "Sáb", labelLargo: "Sábado" },
  { id: "domingo" as const, label: "Dom", labelLargo: "Domingo" },
] as const;

export type DiaSemanaId = (typeof DIAS_SEMANA)[number]["id"];

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
