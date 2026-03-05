import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/db";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function Home({ searchParams }: { searchParams: { code?: string } }) {
  const code = (searchParams.code || "").trim().toUpperCase();
  const cert = code
    ? await prisma.certificate.findUnique({ where: { code } })
    : null;

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Verifica tu certificado</h1>
            <p className="text-slate-600 mt-2">
              Ingresa el código (ej: <span className="font-mono">CEDULL-2026-AB12CD</span>) o abre el QR.
            </p>
          </div>

          <Card>
            <CardHeader title="Búsqueda por código" subtitle="Pega el código y presiona Verificar." />
            <CardContent>
              <form className="flex flex-col gap-3 sm:flex-row" action="/" method="GET">
                <Input name="code" placeholder="CEDULL-2026-XXXXXX" defaultValue={code} />
                <Button type="submit" className="sm:w-40">Verificar</Button>
              </form>

              <div className="mt-4 text-sm text-slate-600">
                Si tienes una URL del QR, pégala en el navegador. El formato es:{" "}
                <span className="font-mono">/c/{"{codigo}"}</span>
              </div>
            </CardContent>
          </Card>

          {code ? (
            cert ? (
              <Card>
                <CardHeader title="Certificado verificado" subtitle={`Estado: ${cert.status}`} />
                <CardContent>
                  <div className="grid gap-2">
                    <div><span className="text-slate-600">Código:</span> <span className="font-mono font-semibold">{cert.code}</span></div>
                    <div><span className="text-slate-600">Participante:</span> <span className="font-semibold">{cert.fullName}</span></div>
                    <div><span className="text-slate-600">Documento:</span> {cert.documentId || "—"}</div>
                    <div><span className="text-slate-600">Curso/Programa:</span> {cert.program}</div>
                    <div><span className="text-slate-600">Fechas:</span> {fmtDate(cert.startDate)} → {fmtDate(cert.endDate)}</div>
                    <div><span className="text-slate-600">Horas:</span> {cert.hours}</div>
                    <div><span className="text-slate-600">Institución:</span> {cert.institution}</div>
                    <div><span className="text-slate-600">Autoridad/Firma:</span> {cert.authority}</div>
                    <div><span className="text-slate-600">Emisión:</span> {fmtDate(cert.issueDate)}</div>
                    {cert.observations ? (
                      <div><span className="text-slate-600">Obs.:</span> {cert.observations}</div>
                    ) : null}
                    <div className="pt-3">
                      <a className="underline text-sm" href={`/c/${encodeURIComponent(cert.code)}`}>
                        Abrir verificación pública (/c/{cert.code})
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader title="No encontrado" subtitle="Verifica el código o intenta con el QR." />
                <CardContent>
                  <p className="text-slate-700">
                    No existe un certificado con el código <span className="font-mono font-semibold">{code}</span>.
                  </p>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}