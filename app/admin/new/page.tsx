import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function AdminNew() {
  return (
    <div>
      <Navbar
        right={
          <div className="flex gap-2">
            <a href="/admin"><Button variant="secondary">Volver</Button></a>
            <form action="/api/logout" method="POST">
              <Button variant="secondary" type="submit">Salir</Button>
            </form>
          </div>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader title="Crear certificado" subtitle="El código se genera automáticamente." />
          <CardContent>
            <form className="grid gap-3" action="/api/certificates" method="POST">
              <label className="text-sm font-semibold">Nombre completo</label>
              <Input name="fullName" required />

              <label className="text-sm font-semibold">Documento (opcional)</label>
              <Input name="documentId" />

              <label className="text-sm font-semibold">Curso / Programa</label>
              <Input name="program" required />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold">Fecha inicio (ISO)</label>
                  <Input name="startDate" placeholder="2026-03-01T00:00:00.000Z" required />
                </div>
                <div>
                  <label className="text-sm font-semibold">Fecha fin (ISO)</label>
                  <Input name="endDate" placeholder="2026-03-30T00:00:00.000Z" required />
                </div>
              </div>

              <label className="text-sm font-semibold">Horas académicas</label>
              <Input name="hours" type="number" min={1} required />

              <label className="text-sm font-semibold">Institución / Organizador</label>
              <Input name="institution" required />

              <label className="text-sm font-semibold">Firma/Autoridad (texto)</label>
              <Input name="authority" required />

              <label className="text-sm font-semibold">Fecha de emisión (ISO)</label>
              <Input name="issueDate" placeholder="2026-03-30T00:00:00.000Z" required />

              <label className="text-sm font-semibold">Observaciones (opcional)</label>
              <Input name="observations" />

              <Button type="submit" className="mt-2">Crear</Button>
            </form>

            <p className="text-xs text-slate-500 mt-3">
              Importante: usa formato ISO con Z (UTC). Ejemplo: 2026-03-01T00:00:00.000Z
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}