import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { prisma } from "@/lib/db";
import { qrDataUrl } from "@/lib/qr";
import QrDownloadButton from "./QrDownloadButton";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

export default async function AdminDetail({ params }: { params: { id: string } }) {
  const cert = await prisma.certificate.findUnique({ where: { id: params.id } });
  if (!cert) {
    return (
      <div>
        <Navbar right={<a href="/admin"><Button variant="secondary">Volver</Button></a>} />
        <main className="mx-auto max-w-3xl px-4 py-10">No encontrado</main>
      </div>
    );
  }

  const baseUrl = process.env.BASE_URL || "https://verifica.edu.edu.pe";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(cert.code)}`;
  const qr = await qrDataUrl(publicUrl);

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
      <main className="mx-auto max-w-3xl px-4 py-8 grid gap-4">
        <Card>
          <CardHeader title="Detalle del certificado" subtitle={`Estado: ${cert.status}`} />
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div><span className="text-slate-600">Código:</span> <span className="font-mono font-semibold">{cert.code}</span></div>
              <div><span className="text-slate-600">Participante:</span> <span className="font-semibold">{cert.fullName}</span></div>
              <div><span className="text-slate-600">Documento:</span> {cert.documentId || "—"}</div>
              <div><span className="text-slate-600">Programa:</span> {cert.program}</div>
              <div><span className="text-slate-600">Fechas:</span> {fmtDate(cert.startDate)} → {fmtDate(cert.endDate)}</div>
              <div><span className="text-slate-600">Horas:</span> {cert.hours}</div>
              <div><span className="text-slate-600">Institución:</span> {cert.institution}</div>
              <div><span className="text-slate-600">Autoridad:</span> {cert.authority}</div>
              <div><span className="text-slate-600">Emisión:</span> {fmtDate(cert.issueDate)}</div>
              {cert.observations ? <div><span className="text-slate-600">Obs.:</span> {cert.observations}</div> : null}

              <div className="pt-3">
                <a className="underline" href={publicUrl} target="_blank" rel="noreferrer">
                  Abrir verificación pública
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="QR" subtitle="El QR apunta a la URL pública real." />
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" className="w-56 h-56 rounded-xl ring-1 ring-slate-200 bg-white" />
              <div className="grid gap-2">
                <div className="text-xs text-slate-600 break-all">{publicUrl}</div>
                <QrDownloadButton dataUrl={qr} filename={`${cert.code}.png`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Acciones" subtitle="Editar/Revocar desde API." />
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <form action={`/api/certificates/${cert.id}`} method="POST">
                <input type="hidden" name="_method" value="DELETE" />
                <Button variant="danger" type="submit" disabled={cert.status === "REVOCADO"}>
                  Revocar (DELETE)
                </Button>
              </form>
              <a href="/admin/new"><Button variant="secondary">Crear otro</Button></a>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Revocar = cambia estado a REVOCADO (no se borra).
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}