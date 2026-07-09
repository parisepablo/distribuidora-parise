"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatearDinero,
  formatearFecha,
  ProductoId,
  etiquetaProducto,
  CATEGORIAS_GASTO,
} from "@/lib/constants";
import {
  getHistorialResumen,
  getHistorialGastos,
} from "@/app/actions";
import {
  Banknote,
  Package,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Periodo = "hoy" | "semana" | "mes";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
];

export function HistorialTabs() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<Awaited<
    ReturnType<typeof getHistorialResumen>
  > | null>(null);
  const [gastos, setGastos] = useState<Awaited<
    ReturnType<typeof getHistorialGastos>
  > | null>(null);
  const [expandedRegistros, setExpandedRegistros] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        const [r, g] = await Promise.all([
          getHistorialResumen(periodo),
          getHistorialGastos(periodo),
        ]);
        setResumen(r);
        setGastos(g);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Algo salió mal. Revisá tu conexión e intentá de nuevo."
        );
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [periodo]);

  const ventasPorRegistro = useMemo(() => {
    const map = new Map<string, { producto: ProductoId; cantidad: number }[]>();
    if (!resumen) return map;
    for (const r of resumen.registros) {
      map.set(
        r.id,
        resumen.ventas.filter((v) => v.registro_id === r.id)
      );
    }
    return map;
  }, [resumen]);

  type GastoDia = {
    fecha: string;
    monto: number;
  };

  const gastosPorFecha = useMemo(() => {
    const map = new Map<string, GastoDia[]>();
    if (!resumen) return map;
    for (const g of resumen.gastos) {
      const lista = map.get(g.fecha) ?? [];
      lista.push(g);
      map.set(g.fecha, lista);
    }
    return map;
  }, [resumen]);

  function toggleRegistro(id: string) {
    setExpandedRegistros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="resumen" className="text-base">
          Resumen
        </TabsTrigger>
        <TabsTrigger value="gastos" className="text-base">
          Gastos
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 flex gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={periodo === p.id ? "default" : "outline"}
            onClick={() => setPeriodo(p.id)}
            className="h-12 flex-1 text-base"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <TabsContent value="resumen" className="mt-4 space-y-4">
        {loading || !resumen ? (
          <p className="py-8 text-center text-base text-muted-foreground">
            Cargando…
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Banknote className="size-4" /> Cobrado
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-success">
                    {formatearDinero(resumen.cobrado)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="size-4" /> Bidones vendidos
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-foreground">
                    {resumen.bidonesVendidos > 0
                      ? resumen.bidonesVendidos
                      : "—"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingDown className="size-4" /> Gastos
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-danger">
                    {formatearDinero(resumen.gastosTotales)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="size-4" /> Ganancia neta
                  </p>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-xl font-bold ${
                      resumen.gananciaNeta >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatearDinero(resumen.gananciaNeta)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Días del período</h3>
              {resumen.registros.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
                  <Package className="mx-auto mb-3 size-12" />
                  <p className="text-lg font-medium text-foreground">
                    No hay registros
                  </p>
                  <p className="text-base">
                    En esta fecha no cargaste ningún día todavía.
                  </p>
                </div>
              ) : (
                resumen.registros.map((r) => {
                  const ventas = ventasPorRegistro.get(r.id) ?? [];
                  const gastosDia = gastosPorFecha.get(r.fecha) ?? [];
                  const expandido = expandedRegistros.has(r.id);

                  return (
                    <Card key={r.id} className="border-border">
                      <button
                        type="button"
                        onClick={() => toggleRegistro(r.id)}
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <div>
                          <p className="text-base font-medium capitalize">
                            {formatearFecha(r.fecha, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-xl font-bold text-success">
                            {formatearDinero(r.total_cobrado)}
                          </p>
                        </div>
                        {expandido ? (
                          <ChevronUp className="size-6 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-6 text-muted-foreground" />
                        )}
                      </button>

                      {expandido && (
                        <CardContent className="border-t border-border pt-4">
                          {ventas.length > 0 && (
                            <div className="mb-3">
                              <p className="mb-1 text-base font-medium">
                                Ventas
                              </p>
                              <ul className="space-y-1 text-base text-muted-foreground">
                                {ventas.map((v) => (
                                  <li
                                    key={v.producto}
                                    className="flex justify-between"
                                  >
                                    <span>
                                      {v.cantidad}{" "}
                                      {etiquetaProducto(v.producto).toLowerCase()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {gastosDia.length > 0 && (
                            <div>
                              <p className="mb-1 text-base font-medium">
                                Gastos del día
                              </p>
                              <ul className="space-y-1 text-base text-muted-foreground">
                                {gastosDia.map((g, i) => (
                                  <li key={i} className="flex justify-between">
                                    <span>
                                      {g.monto > 0
                                        ? "Gasto variado"
                                        : "Recarga"}
                                    </span>
                                    <span className="text-danger">
                                      {formatearDinero(g.monto)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {r.notas && (
                            <div className="mt-3 rounded-lg bg-muted p-3">
                              <p className="text-base text-foreground">
                                {r.notas}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="gastos" className="mt-4 space-y-3">
        {loading || !gastos ? (
          <p className="py-8 text-center text-base text-muted-foreground">
            Cargando…
          </p>
        ) : gastos.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            <TrendingDown className="mx-auto mb-3 size-12" />
            <p className="text-lg font-medium text-foreground">
              No hay gastos
            </p>
            <p className="text-base">
              En este período no registraste gastos.
            </p>
          </div>
        ) : (
          gastos.map((g) => {
            const categoriaLabel = CATEGORIAS_GASTO.find(
              (c) => c.id === g.categoria
            )?.label;

            return (
              <Card key={`${g.tipo}-${g.id}`} className="border-border">
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-base font-medium">{g.descripcion}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatearFecha(g.fecha, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <Badge
                      variant={g.tipo === "fabrica" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {g.tipo === "fabrica" ? "Fábrica" : categoriaLabel}
                    </Badge>
                  </div>
                  <p className="text-xl font-bold text-danger">
                    {formatearDinero(g.monto)}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>
    </Tabs>
  );
}
