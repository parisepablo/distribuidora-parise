import Link from "next/link";
import { getClientes } from "@/app/actions";
import { ClienteNuevoModal } from "@/components/cliente-nuevo-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, MapPin, ChevronRight } from "lucide-react";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Clientes</h2>
        <p className="text-base text-muted-foreground">
          Direcciones y cuentas corrientes.
        </p>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 size-12" />
          <p className="text-lg font-medium text-foreground">Sin clientes aún</p>
          <p className="mt-1 text-base">
            Agregá un cliente para llevar su cuenta y dirección de entrega.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => (
            <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
              <Card className="border-border transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {cliente.nombre}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                      {cliente.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-4" />
                          {cliente.telefono}
                        </span>
                      )}
                      {cliente.direccion && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="size-4" />
                          {cliente.direccion}
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
