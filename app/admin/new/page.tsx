import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Nombre completo
                  </label>
                  <Input id="fullName" name="fullName" required />
                </div>

                <div>
                  <label
                    htmlFor="documentId"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Documento (opcional)
                  </label>
                  <Input id="documentId" name="documentId" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="program"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Curso / Programa
                </label>
                <Input id="program" name="program" required />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Fecha de inicio
                  </label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={todayISO()}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Fecha de fin
                  </label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={todayISO()}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="hours"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Horas académicas
                  </label>
                  <Input id="hours" name="hours" type="number" min={1} required />
                </div>

                <div>
                  <label
                    htmlFor="institution"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Institución / Organizador
                  </label>
                  <Input id="institution" name="institution" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="authority"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Firma / Autoridad
                  </label>
                  <Input id="authority" name="authority" required />
                </div>

                <div>
                  <label
                    htmlFor="issueDate"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Fecha de emisión
                  </label>
                  <Input
                    id="issueDate"
                    name="issueDate"
                    type="date"
                    defaultValue={todayISO()}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="observations"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Observaciones (opcional)
                </label>
                <Input id="observations" name="observations" />
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm leading-6 text-emerald-900">
                  Selecciona las fechas desde el calendario. El sistema las convertirá automáticamente al formato correcto al guardar el certificado.
                </p>
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