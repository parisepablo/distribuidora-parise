"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ProductoId,
  PRODUCTOS,
  CategoriaGastoId,
  etiquetaProducto,
} from "@/lib/constants";

function fechaHoy(): string {
  return new Date().toISOString().split("T")[0];
}

async function geocodificarDireccion(
  direccion: string
): Promise<{ lat: number; lng: number } | null> {
  if (!direccion.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", direccion);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ar");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "DistribuidoraParise/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
    }>;

    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

function inicioFinPeriodo(periodo: "hoy" | "semana" | "mes"): {
  inicio: string;
  fin: string;
} {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

  if (periodo === "hoy") {
    return { inicio: fechaHoyStr, fin: fechaHoyStr };
  }

  if (periodo === "semana") {
    const dia = hoy.getDay();
    const diffLunes = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diffLunes));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const inicio = `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, "0")}-${String(lunes.getDate()).padStart(2, "0")}`;
    const fin = `${domingo.getFullYear()}-${String(domingo.getMonth() + 1).padStart(2, "0")}-${String(domingo.getDate()).padStart(2, "0")}`;
    return { inicio, fin };
  }

  const inicioMes = `${yyyy}-${mm}-01`;
  const finMesDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const finMes = `${finMesDate.getFullYear()}-${String(finMesDate.getMonth() + 1).padStart(2, "0")}-${String(finMesDate.getDate()).padStart(2, "0")}`;
  return { inicio: inicioMes, fin: finMes };
}

export async function getActivePrecios() {
  const supabase = await createClient();
  const hoy = fechaHoy();

  const precios = await Promise.all(
    PRODUCTOS.map(async (p) => {
      const { data, error } = await supabase.rpc("precio_activo", {
        p_producto: p.id,
        p_fecha: hoy,
      });

      if (error) {
        throw new Error(`No se pudieron cargar los precios de ${p.label}`);
      }

      const row = data?.[0];
      return {
        producto: p.id,
        label: p.label,
        precio_costo: row?.precio_costo ?? 0,
        precio_venta: row?.precio_venta ?? 0,
      };
    })
  );

  return precios;
}

export async function getTodayRegistro() {
  const supabase = await createClient();
  const hoy = fechaHoy();

  const { data: registro, error: regError } = await supabase
    .from("registros_diarios")
    .select("id, fecha, total_cobrado, notas")
    .eq("fecha", hoy)
    .maybeSingle();

  if (regError) {
    throw new Error("No se pudo cargar el registro de hoy");
  }

  if (!registro) {
    return null;
  }

  const { data: ventas, error: ventasError } = await supabase
    .from("ventas_diarias")
    .select("producto, cantidad, precio_unitario")
    .eq("registro_id", registro.id);

  if (ventasError) {
    throw new Error("No se pudieron cargar las ventas de hoy");
  }

  return {
    ...registro,
    ventas: (ventas ?? []).map((v) => ({
      ...v,
      producto: v.producto as ProductoId,
    })),
  };
}

type VentaInput = {
  producto: ProductoId;
  cantidad: number;
};

export async function saveRegistroDiario({
  total_cobrado,
  notas,
  ventas,
}: {
  total_cobrado: number;
  notas: string;
  ventas: VentaInput[];
}) {
  const supabase = await createClient();
  const hoy = fechaHoy();

  const { data: registro, error: upsertError } = await supabase
    .from("registros_diarios")
    .upsert(
      {
        fecha: hoy,
        total_cobrado,
        notas: notas.trim() || null,
      },
      { onConflict: "fecha" }
    )
    .select("id")
    .single();

  if (upsertError || !registro) {
    throw new Error("No se pudo guardar el registro del día");
  }

  const ventasConCantidad = ventas.filter((v) => v.cantidad > 0);

  for (const venta of ventasConCantidad) {
    const { data: precio } = await supabase.rpc("precio_activo", {
      p_producto: venta.producto,
      p_fecha: hoy,
    });

    const precioUnitario = precio?.[0]?.precio_venta ?? 0;

    const { error: ventaError } = await supabase.from("ventas_diarias").upsert(
      {
        registro_id: registro.id,
        producto: venta.producto,
        cantidad: venta.cantidad,
        precio_unitario: precioUnitario,
      },
      { onConflict: "registro_id,producto" }
    );

    if (ventaError) {
      throw new Error(`No se pudo guardar la venta de ${venta.producto}`);
    }
  }

  const productosConCantidad = ventasConCantidad.map((v) => v.producto);

  if (productosConCantidad.length === 0) {
    await supabase
      .from("ventas_diarias")
      .delete()
      .eq("registro_id", registro.id);
  } else {
    await supabase
      .from("ventas_diarias")
      .delete()
      .eq("registro_id", registro.id)
      .not("producto", "in", `(${productosConCantidad.join(",")})`);
  }

  return { ok: true };
}

export async function savePrecio({
  producto,
  precio_costo,
  precio_venta,
}: {
  producto: ProductoId;
  precio_costo: number;
  precio_venta: number;
}) {
  const supabase = await createClient();
  const hoy = fechaHoy();

  const { error } = await supabase.from("precios").insert({
    producto,
    precio_costo,
    precio_venta,
    vigente_desde: hoy,
  });

  if (error) {
    throw new Error("No se pudo guardar el precio");
  }

  return { ok: true };
}

export async function getUltimaFechaPrecio(producto: ProductoId) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("precios")
    .select("vigente_desde")
    .eq("producto", producto)
    .order("vigente_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar la fecha del precio");
  }

  return data?.vigente_desde ?? null;
}

export async function saveRecargaFabrica({
  fecha,
  notas,
  recargas,
}: {
  fecha: string;
  notas: string;
  recargas: { producto: ProductoId; cantidad: number }[];
}) {
  const supabase = await createClient();

  for (const r of recargas) {
    if (r.cantidad <= 0) continue;

    const { data: precio } = await supabase.rpc("precio_activo", {
      p_producto: r.producto,
      p_fecha: fecha,
    });

    const costoUnitario = precio?.[0]?.precio_costo ?? 0;

    const { error } = await supabase.from("recargas_fabrica").insert({
      fecha,
      producto: r.producto,
      cantidad: r.cantidad,
      costo_unitario: costoUnitario,
      notas: notas.trim() || null,
    });

    if (error) {
      throw new Error(`No se pudo guardar la recarga de ${r.producto}`);
    }
  }

  revalidatePath("/historial");
  return { ok: true };
}

export async function saveGastoOtro({
  fecha,
  descripcion,
  monto,
  categoria,
}: {
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: CategoriaGastoId;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("gastos_otros").insert({
    fecha,
    descripcion: descripcion.trim(),
    monto,
    categoria,
  });

  if (error) {
    throw new Error("No se pudo guardar el gasto");
  }

  revalidatePath("/historial");
  return { ok: true };
}

export async function getHistorialResumen(periodo: "hoy" | "semana" | "mes") {
  const supabase = await createClient();
  const { inicio, fin } = inicioFinPeriodo(periodo);

  const { data: registros, error: regError } = await supabase
    .from("registros_diarios")
    .select("id, fecha, total_cobrado, notas")
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: false });

  if (regError) {
    throw new Error("No se pudieron cargar los registros");
  }

  const { data: ventas, error: ventasError } = await supabase
    .from("ventas_diarias")
    .select("registro_id, producto, cantidad")
    .in(
      "registro_id",
      registros?.map((r) => r.id) ?? []
    );

  if (ventasError) {
    throw new Error("No se pudieron cargar las ventas");
  }

  const ventasTipadas = (ventas ?? []).map((v) => ({
    ...v,
    producto: v.producto as ProductoId,
  }));

  const { data: recargas, error: recError } = await supabase
    .from("recargas_fabrica")
    .select("fecha, total")
    .gte("fecha", inicio)
    .lte("fecha", fin);

  if (recError) {
    throw new Error("No se pudieron cargar las recargas");
  }

  const { data: gastos, error: gastosError } = await supabase
    .from("gastos_otros")
    .select("fecha, monto")
    .gte("fecha", inicio)
    .lte("fecha", fin);

  if (gastosError) {
    throw new Error("No se pudieron cargar los gastos");
  }

  const cobrado =
    registros?.reduce((sum, r) => sum + (r.total_cobrado ?? 0), 0) ?? 0;

  const bidonesVendidos =
    ventas?.reduce((sum, v) => sum + (v.cantidad ?? 0), 0) ?? 0;

  const totalRecargas =
    recargas?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;
  const totalGastos =
    gastos?.reduce((sum, g) => sum + (g.monto ?? 0), 0) ?? 0;
  const gastosTotales = totalRecargas + totalGastos;

  const gananciaNeta = cobrado - gastosTotales;

  return {
    inicio,
    fin,
    cobrado,
    bidonesVendidos,
    gastosTotales,
    gananciaNeta,
    registros: registros ?? [],
    ventas: ventasTipadas,
    recargas: recargas ?? [],
    gastos: gastos ?? [],
  };
}

export async function getHistorialGastos(periodo: "hoy" | "semana" | "mes") {
  const supabase = await createClient();
  const { inicio, fin } = inicioFinPeriodo(periodo);

  const { data: recargas, error: recError } = await supabase
    .from("recargas_fabrica")
    .select("id, fecha, producto, cantidad, total")
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: false });

  if (recError) {
    throw new Error("No se pudieron cargar las recargas");
  }

  const { data: gastos, error: gastosError } = await supabase
    .from("gastos_otros")
    .select("id, fecha, descripcion, monto, categoria")
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: false });

  if (gastosError) {
    throw new Error("No se pudieron cargar los gastos");
  }

  const itemsRecarga = (recargas ?? []).map((r) => ({
    id: r.id,
    tipo: "fabrica" as const,
    fecha: r.fecha,
    descripcion: `Recarga fábrica — ${etiquetaProducto(r.producto as ProductoId).toLowerCase()} × ${r.cantidad}`,
    monto: r.total ?? 0,
    categoria: null,
    producto: r.producto as ProductoId,
    cantidad: r.cantidad,
  }));

  const itemsGasto = (gastos ?? []).map((g) => ({
    id: g.id,
    tipo: "otro" as const,
    fecha: g.fecha,
    descripcion: g.descripcion,
    monto: g.monto ?? 0,
    categoria: g.categoria as CategoriaGastoId,
    producto: null,
    cantidad: null,
  }));

  return [...itemsRecarga, ...itemsGasto].sort(
    (a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

export async function getClientes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los clientes");
  }

  return data ?? [];
}

export async function saveCliente({
  nombre,
  telefono,
  direccion,
  notas,
}: {
  nombre: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
}) {
  const supabase = await createClient();

  const coordenadas = await geocodificarDireccion(direccion ?? "");

  const { error } = await supabase.from("clientes").insert({
    nombre: nombre.trim(),
    telefono: telefono?.trim() || null,
    direccion: direccion?.trim() || null,
    notas: notas?.trim() || null,
    lat: coordenadas?.lat ?? null,
    lng: coordenadas?.lng ?? null,
  });

  if (error) {
    throw new Error("No se pudo guardar el cliente");
  }

  revalidatePath("/clientes");
  return { ok: true };
}

export async function getCliente(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, lat, lng, notas, activo")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el cliente");
  }

  return data;
}

export async function getTransaccionesCliente(clienteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transacciones_clientes")
    .select("id, tipo, producto, cantidad, monto, precio_unitario, fecha, notas")
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar las transacciones");
  }

  return (data ?? []).map((t) => ({
    ...t,
    tipo: t.tipo as "entrega" | "pago",
    producto: t.producto as ProductoId | null,
  }));
}

export async function saveTransaccionCliente({
  clienteId,
  tipo,
  producto,
  cantidad,
  monto,
  precio_unitario,
  fecha,
  notas,
}: {
  clienteId: string;
  tipo: "entrega" | "pago";
  producto?: ProductoId;
  cantidad?: number;
  monto: number;
  precio_unitario?: number;
  fecha: string;
  notas?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("transacciones_clientes").insert({
    cliente_id: clienteId,
    tipo,
    producto: producto ?? null,
    cantidad: cantidad ?? null,
    monto,
    precio_unitario: precio_unitario ?? null,
    fecha,
    notas: notas?.trim() || null,
  });

  if (error) {
    throw new Error("No se pudo guardar la transacción");
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

