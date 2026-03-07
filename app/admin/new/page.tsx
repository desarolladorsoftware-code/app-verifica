import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function AdminNew() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        right={
          <div className="flex items-center gap-2">
            <a href="/admin">
              <Button variant="secondary" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
                Volver
              </Button>
            </a>
            <form action="/api/logout" method="POST">
              <Button
                variant="secondary"
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Salir
              </Button>
            </form>
          </div>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
            Panel administrativo
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Crear certificado
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Completa la información del participante y del programa. El código se genera automáticamente.
          </p>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />

          <CardHeader
            title="Nuevo certificado"
            subtitle="Ingresa los datos con cuidado para generar un registro correcto."
            className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-6"
          />

          <CardContent className="px-6 py-6 sm:px-8">
            <form className="grid gap-6" action="/api/certificates" method="POST">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Nombre completo
                  </label>
                  <Input
                    name="fullName"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Documento (opcional)
                  </label>
                  <Input
                    name="documentId"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  Curso / Programa
                </label>
                <Input
                  name="program"
                  required
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Fecha inicio (ISO)
                  </label>
                  <Input
                    name="startDate"
                    placeholder="2026-03-01T00:00:00.000Z"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Fecha fin (ISO)
                  </label>
                  <Input
                    name="endDate"
                    placeholder="2026-03-30T00:00:00.000Z"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Horas académicas
                  </label>
                  <Input
                    name="hours"
                    type="number"
                    min={1}
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Institución / Organizador
                  </label>
                  <Input
                    name="institution"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Firma/Autoridad (texto)
                  </label>
                  <Input
                    name="authority"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Fecha de emisión (ISO)
                  </label>
                  <Input
                    name="issueDate"
                    placeholder="2026-03-30T00:00:00.000Z"
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  Observaciones (opcional)
                </label>
                <Input
                  name="observations"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm leading-relaxed text-amber-900">
                  <span className="font-semibold">Importante:</span> usa formato ISO con Z (UTC). Ejemplo:
                  {" "}
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-700 shadow-sm">
                    2026-03-01T00:00:00.000Z
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Revisa bien los datos antes de crear el certificado.
                </p>

                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
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