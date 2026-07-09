import { notFound } from "next/navigation";
import { getCliente, getTransaccionesCliente } from "@/app/actions";
import { ClienteDetail } from "@/components/cliente-detail";

export default async function ClientePage({
  params,
}: {
  params: { id: string };
}) {
  const cliente = await getCliente(params.id);

  if (!cliente) {
    notFound();
  }

  const transacciones = await getTransaccionesCliente(params.id);

  return <ClienteDetail cliente={cliente} transacciones={transacciones} />;
}
