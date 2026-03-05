import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Table } from "@/components/Table";
import { prisma } from "@/lib/db";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function AdminDashboard() {
  const certs = await prisma.certificate.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div>
      <Navbar
        right={
          <div className="flex gap-2">
            <form action="/api/logout" method="POST">
              <Button variant="secondary" type="submit">Salir</Button>
            </form>
            <a href="/admin/new">
              <Button>Nuevo</Button>
            </a>
          </div>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-4">
        <h1 className="text-2xl font-extrabold">Certificados</h1>

        <Table>
          <thead className="bg-slate-50 text-slate-600">
            <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-3">
              <th>Código</th>
              <th>Participante</th>
              <th>Programa</th>
              <th>Emisión</th>
              <th>Estado</th>
              <th className="w-24">Acción</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
            {certs.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="font-mono text-xs">{c.code}</td>
                <td className="font-semibold">{c.fullName}</td>
                <td>{c.program}</td>
                <td>{fmtDate(c.issueDate)}</td>
                <td>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.status === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <a className="underline" href={`/admin/${c.id}`}>Ver</a>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </main>
    </div>
  );
}