import Link from "next/link";
import { getClientes } from "@/app/actions";
import { ClienteNuevoModal } from "@/components/cliente-nuevo-modal";
import { ClientesDayFilter } from "@/components/clientes-day-filter";
import { Card, CardContent } from "@/components/ui/card";
import { DIAS_SEMANA } from "@/lib/constants";
import { Phone, MapPin, ChevronRight, Users, CalendarDays } from "lucide-react";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const dia = typeof searchParams.dia === "string" ? searchParams.dia : null;
  const clientes = await getClientes();

  const clientesFiltrados = dia
    ? clientes.filter(
        (c) => c.dias && (c.dias as string[]).includes(dia)
      )
    : clientes;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
        <p className="text-base text-muted-foreground">
          Direcciones y cuentas corrientes.
        </p>
      </div>

      <ClientesDayFilter dia={dia} />

      {clientesFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Users className="mx-auto mb-4 size-14 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">Sin clientes aún</p>
          <p className="mt-1 text-base text-muted-foreground">
            {dia
              ? "No hay clientes asignados para este día."
              : "Agregá un cliente para llevar su cuenta y dirección de entrega."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientesFiltrados.map((cliente) => (
            <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
              <Card className="border-border transition-colors hover:border-primary/50 hover:bg-secondary/30">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-primary">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {cliente.nombre}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {cliente.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-4" />
                          <span className="truncate">{cliente.telefono}</span>
                        </span>
                      )}
                      {cliente.direccion && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="size-4" />
                          <span className="truncate">{cliente.direccion}</span>
                        </span>
                      )}
                      {cliente.dias && cliente.dias.length > 0 && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-4" />
                          <span className="truncate">
                            {cliente.dias
                              .map(
                                (diaId) =>
                                  DIAS_SEMANA.find((d) => d.id === diaId)?.label
                              )
                              .join(", ")}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-6 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ClienteNuevoModal />
    </section>
  );
}
