import { PrecioCard } from "@/components/precio-card";
import {
  getActivePrecios,
  getUltimaFechaPrecio,
} from "@/app/actions";
import { PRODUCTOS } from "@/lib/constants";

export default async function PreciosPage() {
  const [precios, ultimasFechas] = await Promise.all([
    getActivePrecios(),
    Promise.all(PRODUCTOS.map((p) => getUltimaFechaPrecio(p.id))),
  ]);

  const fechasMap = new Map(
    PRODUCTOS.map((p, i) => [p.id, ultimasFechas[i]])
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Configurar precios
        </h2>
        <p className="text-base text-muted-foreground">
          Actualizá lo que pagás a la fábrica y lo que cobrás a tus clientes.
        </p>
      </div>

      <div className="space-y-5">
        {PRODUCTOS.map((p) => {
          const precio = precios.find((pr) => pr.producto === p.id);
          return (
            <PrecioCard
              key={p.id}
              producto={p.id}
              label={p.label}
              precioCosto={precio?.precio_costo ?? 0}
              precioVenta={precio?.precio_venta ?? 0}
              ultimaFecha={fechasMap.get(p.id) ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}
