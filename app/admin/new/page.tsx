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
            Completa los datos del certificado. El código se genera automáticamente
            al momento de registrar la información.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />

          <Card>
            <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-6 sm:px-8">
              <CardHeader
                title="Nuevo certificado"
                subtitle="Ingresa correctamente los datos del participante, programa y emisión."
              />
            </div>

            <div className="px-6 py-6 sm:px-8">
              <CardContent>
                <form className="grid gap-6" action="/api/certificates" method="POST">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Nombre completo
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input name="fullName" required />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Documento (opcional)
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input name="documentId" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Curso / Programa
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                      <Input name="program" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Fecha inicio (ISO)
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input
                          name="startDate"
                          placeholder="2026-03-01T00:00:00.000Z"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Fecha fin (ISO)
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input
                          name="endDate"
                          placeholder="2026-03-30T00:00:00.000Z"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Horas académicas
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input name="hours" type="number" min={1} required />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Institución / Organizador
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input name="institution" required />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Firma/Autoridad (texto)
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input name="authority" required />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Fecha de emisión (ISO)
                      </label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                        <Input
                          name="issueDate"
                          placeholder="2026-03-30T00:00:00.000Z"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Observaciones (opcional)
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                      <Input name="observations" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-sm leading-6 text-amber-900">
                      <span className="font-semibold">Importante:</span> usa formato ISO con Z
                      (UTC). Ejemplo:
                    </p>
                    <div className="mt-2 inline-block rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">
                      2026-03-01T00:00:00.000Z
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Revisa bien los datos antes de crear el certificado.
                    </p>

                    <div className="rounded-2xl shadow-lg shadow-slate-900/10">
                      <Button type="submit">Crear</Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}