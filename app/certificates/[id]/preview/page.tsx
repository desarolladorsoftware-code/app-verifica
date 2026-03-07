import { prisma } from "@/lib/db";
import { qrDataUrl } from "@/lib/qr";
import CertificateTemplate from "@/components/certificates/CertificateTemplate";

function fmtDate(d: Date) {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default async function CertificatePreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
  });

  if (!cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">No encontrado</h1>
          <p className="mt-2 text-sm text-slate-600">
            El certificado solicitado no existe.
          </p>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.BASE_URL || "https://verifica.cedull.edu.pe";
  const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(cert.code)}`;
  const qrSrc = await qrDataUrl(publicUrl);

  return (
    <CertificateTemplate
      fullName={cert.fullName}
      program={cert.program}
      startDate={fmtDate(cert.startDate)}
      endDate={fmtDate(cert.endDate)}
      hours={cert.hours}
      issueDate={fmtDate(cert.issueDate)}
      qrSrc={qrSrc}
      logoSrc="/assets/certificates/logo-cedull.png"
      signatureSrc="/assets/certificates/firma-director.png"
    />
  );
}