import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/db";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function Home({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = (searchParams.code || "").trim().toUpperCase();
  const cert = code
    ? await prisma.certificate.findUnique({ where: { code } })
    : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_45%,#FFFDF7_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <section className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_20px_60px_rgba(6,166,255,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#06A6FF] via-[#F3C80F] to-[#FB5A00]" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#06A6FF]/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FB5A00]/10 blur-3xl" />

            <div className="relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-12 lg:py-14">
              <div>
                <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold tracking-[0.12em] text-sky-700 uppercase">
                  Validación oficial
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                  Verifica tu
                  <span className="bg-gradient-to-r from-[#06A6FF] to-[#0B2A5B] bg-clip-text text-transparent">
                    {" "}
                    certificado
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Consulta la validez de tu certificado emitido por CEDULL de forma
                  rápida y segura. Ingresa el código único o accede directamente
                  desde el QR impreso.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="font-semibold text-slate-900">Código único</span>
                    <p className="mt-1 text-slate-600">Validación individual por registro.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="font-semibold text-slate-900">QR verificable</span>
                    <p className="mt-1 text-slate-600">Acceso directo a la versión pública.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="rounded-2xl border border-[#06A6FF]/15 bg-[linear-gradient(135deg,rgba(6,166,255,0.08),rgba(243,200,15,0.08),rgba(251,90,0,0.06))] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Ejemplo de código
                  </p>
                  <p className="mt-3 rounded-xl bg-slate-950 px-4 py-3 font-mono text-sm text-white shadow-sm">
                    CEDULL-2026-AB12CD
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    También puedes abrir directamente la URL pública del QR con el formato:
                  </p>
                  <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-sm text-slate-700">
                    /c/{"{codigo}"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Card className="overflow-hidden border border-slate-200 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#06A6FF] via-[#F3C80F] to-[#FB5A00]" />
            <CardHeader
              title="Búsqueda por código"
              subtitle="Pega el código del certificado y presiona Verificar."
              className="bg-gradient-to-b from-slate-50 to-white"
            />
            <CardContent>
              <form
                className="flex flex-col gap-4 sm:flex-row sm:items-center"
                action="/"
                method="GET"
              >
                <Input
                  name="code"
                  placeholder="CEDULL-2026-XXXXXX"
                  defaultValue={code}
                />
                <Button type="submit" className="sm:w-44">
                  Verificar
                </Button>
              </form>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Si tienes la URL del QR, también puedes pegarla o abrirla directamente
                en el navegador.
              </div>
            </CardContent>
          </Card>

          {code ? (
            cert ? (
              <Card className="overflow-hidden border border-emerald-200 shadow-[0_16px_50px_rgba(16,185,129,0.08)]">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-[#06A6FF]" />
                <CardHeader
                  title="Certificado verificado"
                  subtitle={`Estado: ${cert.status}`}
                  className="bg-gradient-to-b from-emerald-50 to-white"
                />
                <CardContent>
                  <div className="mb-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Certificado válido en sistema
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Código</span>
                      <p className="mt-1 font-mono font-semibold text-slate-900">
                        {cert.code}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Participante</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {cert.fullName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Documento</span>
                      <p className="mt-1 text-slate-900">{cert.documentId || "—"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Curso / Programa</span>
                      <p className="mt-1 text-slate-900">{cert.program}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Fechas</span>
                      <p className="mt-1 text-slate-900">
                        {fmtDate(cert.startDate)} al {fmtDate(cert.endDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Horas académicas</span>
                      <p className="mt-1 text-slate-900">{cert.hours}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Institución</span>
                      <p className="mt-1 text-slate-900">{cert.institution}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-slate-500">Autoridad / Firma</span>
                      <p className="mt-1 text-slate-900">{cert.authority}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                      <span className="text-slate-500">Fecha de emisión</span>
                      <p className="mt-1 text-slate-900">{fmtDate(cert.issueDate)}</p>
                    </div>

                    {cert.observations ? (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                        <span className="text-slate-500">Observaciones</span>
                        <p className="mt-1 text-slate-900">{cert.observations}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-5">
                    <a
                      className="inline-flex items-center rounded-xl border border-[#06A6FF]/20 bg-[#06A6FF]/5 px-4 py-2 text-sm font-semibold text-[#0B2A5B] shadow-sm transition hover:bg-[#06A6FF]/10"
                      href={`/c/${encodeURIComponent(cert.code)}`}
                    >
                      Abrir verificación pública
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border border-rose-200 shadow-[0_16px_50px_rgba(244,63,94,0.08)]">
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-[#FB5A00]" />
                <CardHeader
                  title="No encontrado"
                  subtitle="Verifica el código o intenta con el QR."
                  className="bg-gradient-to-b from-rose-50 to-white"
                />
                <CardContent>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                    No existe un certificado con el código{" "}
                    <span className="font-mono font-semibold">{code}</span>.
                  </div>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}