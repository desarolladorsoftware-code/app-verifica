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
      <div className="min-h-screen bg-slate-50">
        <Navbar
          right={
            <a href="/admin">
              <Button variant="secondary">Volver</Button>
            </a>
          }
        />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">No encontrado</h1>
            <p className="mt-2 text-sm text-slate-600">
              El certificado solicitado no existe o fue eliminado.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const baseUrl = process.env.BASE_URL || "https://verifica.edu.edu.pe";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(cert.code)}`;
  const qr = await qrDataUrl(publicUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar
        right={
          <div className="flex gap-2">
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

      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
        <div className="mb-1">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
            Certificado
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Detalle del certificado
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Revisa los datos registrados, la URL pública y las acciones disponibles.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />
          <CardHeader
            title="Información general"
            subtitle={`Estado actual: ${cert.status}`}
            className="bg-gradient-to-b from-slate-50 to-white"
          />
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Código</span>
                <span className="font-mono font-semibold text-slate-900">{cert.code}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Participante</span>
                <span className="font-semibold text-slate-900">{cert.fullName}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Documento</span>
                <span className="text-slate-800">{cert.documentId || "—"}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Programa</span>
                <span className="text-slate-800">{cert.program}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Fechas</span>
                <span className="text-slate-800">
                  {fmtDate(cert.startDate)} → {fmtDate(cert.endDate)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Horas</span>
                <span className="text-slate-800">{cert.hours}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Institución</span>
                <span className="text-slate-800">{cert.institution}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Autoridad</span>
                <span className="text-slate-800">{cert.authority}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                <span className="font-semibold text-slate-500">Emisión</span>
                <span className="text-slate-800">{fmtDate(cert.issueDate)}</span>
              </div>

              {cert.observations ? (
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
                  <span className="font-semibold text-slate-500">Observaciones</span>
                  <span className="text-slate-800">{cert.observations}</span>
                </div>
              ) : null}

              <div className="pt-4">
                <a
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir verificación pública
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Código QR"
            subtitle="Este QR apunta a la URL pública real de verificación."
          />
          <CardContent>
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR"
                className="h-56 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
              />

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 break-all">
                  {publicUrl}
                </div>
                <QrDownloadButton dataUrl={qr} filename={`${cert.code}.png`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Acciones"
            subtitle="Gestiona el estado del certificado desde esta vista."
          />
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <form action={`/api/certificates/${cert.id}`} method="POST">
                <input type="hidden" name="_method" value="DELETE" />
                <Button
                  variant="danger"
                  type="submit"
                  disabled={cert.status === "REVOCADO"}
                >
                  Revocar certificado
                </Button>
              </form>

              <a href="/admin/new">
                <Button variant="secondary">Crear otro</Button>
              </a>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Revocar cambia el estado a <span className="font-semibold">REVOCADO</span>; el
              registro no se elimina de la base de datos.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}