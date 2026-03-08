import { Card, CardContent, CardHeader } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/db";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function VerifyByUrl({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const cert = await prisma.certificate.findUnique({ where: { code } });

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {cert ? (
          <Card>
            <CardHeader title="Certificado verificado" subtitle={`Estado: ${cert.status}`} />
            <CardContent>
              <div className="grid gap-2">
                <div><span className="text-slate-600">Código:</span> <span className="font-mono font-semibold">{cert.code}</span></div>
                <div><span className="text-slate-600">Participante:</span> <span className="font-semibold">{cert.fullName}</span></div>
                <div><span className="text-slate-600">Documento:</span> {cert.documentId || "—"}</div>
                <div><span className="text-slate-600">Curso/Programa:</span> {cert.program}</div>
                <div><span className="text-slate-600">Fechas:</span> {fmtDate(cert.startDate)} al {fmtDate(cert.endDate)}</div>
                <div><span className="text-slate-600">Horas:</span> {cert.hours}</div>
                <div><span className="text-slate-600">Institución:</span> {cert.institution}</div>
                <div><span className="text-slate-600">Autoridad/Firma:</span> {cert.authority}</div>
                <div><span className="text-slate-600">Emisión:</span> {fmtDate(cert.issueDate)}</div>
                {cert.observations ? (
                  <div><span className="text-slate-600">Obs.:</span> {cert.observations}</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader title="No encontrado" subtitle="El código del QR no existe o fue escrito mal." />
            <CardContent>
              <p className="text-slate-700">
                Código: <span className="font-mono font-semibold">{code}</span>
              </p>
              <a className="underline text-sm" href="/">Volver al verificador</a>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}