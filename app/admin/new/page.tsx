import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function AdminNew() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar
        right={
          <div className="flex items-center gap-2">
            <a href="/admin">
              <Button variant="secondary">Volver</Button>
            </a>
            <form action="/api/logout" method="POST">
              <Button variant="secondary" type="submit">
                Salir
              </Button>
            </form>
          </div>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
            Panel administrativo
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Crear certificado
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Completa los datos del certificado. El código se genera automáticamente al momento de registrar la información.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />

          <CardHeader
            title="Nuevo certificado"
            subtitle="Ingresa correctamente los datos del participante, programa y emisión."
            className="bg-gradient-to-b from-slate-50 to-white"
          />

          <CardContent>
            <form className="grid gap-6" action="/api/certificates" method="POST">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Nombre completo
                  </label>
                  <Input name="fullName" required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Documento (opcional)
                  </label>
                  <Input name="documentId" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Curso / Programa
                </label>
                <Input name="program" required />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Fecha inicio (ISO)
                  </label>
                  <Input
                    name="startDate"
                    placeholder="2026-03-01T00:00:00.000Z"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Fecha fin (ISO)
                  </label>
                  <Input
                    name="endDate"
                    placeholder="2026-03-30T00:00:00.000Z"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Horas académicas
                  </label>
                  <Input name="hours" type="number" min={1} required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Institución / Organizador
                  </label>
                  <Input name="institution" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Firma/Autoridad (texto)
                  </label>
                  <Input name="authority" required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Fecha de emisión (ISO)
                  </label>
                  <Input
                    name="issueDate"
                    placeholder="2026-03-30T00:00:00.000Z"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Observaciones (opcional)
                </label>
                <Input name="observations" />
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm leading-6 text-amber-900">
                  <span className="font-semibold">Importante:</span> usa formato ISO con Z (UTC). Ejemplo:
                </p>
                <div className="mt-2 inline-block rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">
                  2026-03-01T00:00:00.000Z
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Revisa bien los datos antes de crear el certificado.
                </p>

                <Button type="submit" className="px-6 py-3">
                  Crear certificado
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}