import { Card, CardContent, CardHeader } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { prisma } from "@/lib/db";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function VerifyByUrl({
  params,
}: {
  params: { code: string };
}) {
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const cert = await prisma.certificate.findUnique({ where: { code } });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_45%,#FFFDF7_100%)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          <section className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_20px_60px_rgba(6,166,255,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#06A6FF] via-[#F3C80F] to-[#FB5A00]" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#06A6FF]/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FB5A00]/10 blur-3xl" />

            <div className="relative px-6 py-10 sm:px-10 lg:px-12">
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold tracking-[0.12em] uppercase text-sky-700">
                Verificación pública
              </div>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Validación de
                <span className="bg-gradient-to-r from-[#06A6FF] to-[#0B2A5B] bg-clip-text text-transparent">
                  {" "}
                  certificado
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta página confirma si el certificado consultado existe en el
                sistema institucional de CEDULL.
              </p>
            </div>
          </section>

          {cert ? (
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
                  <a href="/">
                    <Button variant="secondary">Volver al verificador</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border border-rose-200 shadow-[0_16px_50px_rgba(244,63,94,0.08)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-[#FB5A00]" />
              <CardHeader
                title="No encontrado"
                subtitle="El código del QR no existe o fue escrito incorrectamente."
                className="bg-gradient-to-b from-rose-50 to-white"
              />
              <CardContent>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                  Código consultado:{" "}
                  <span className="font-mono font-semibold">{code}</span>
                </div>

                <div className="pt-5">
                  <a href="/">
                    <Button variant="secondary">Volver al verificador</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}