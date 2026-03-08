type CertificateTemplateProps = {
  fullName: string;
  program: string;
  startDate: string;
  endDate: string;
  hours: string | number;
  issueDate: string;
  qrSrc: string;
  logoSrc: string;
  signatureSrc: string;
};

export default function CertificateTemplate({
  fullName,
  program,
  startDate,
  endDate,
  hours,
  issueDate,
  qrSrc,
  logoSrc,
  signatureSrc,
}: CertificateTemplateProps) {
  return (
    <div className="flex w-full justify-center bg-neutral-300 p-6">
      <div
        className="relative h-[794px] w-[1123px] overflow-hidden bg-white shadow-2xl"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* MARCO EXTERIOR */}
        <div className="absolute inset-[14px] border-[4px] border-[#06A6FF]" />

        {/* MARCO INTERIOR */}
        <div className="absolute inset-[30px] border border-[#F3C80F]" />

        {/* ACENTOS DECORATIVOS SUTILES */}
        <div className="absolute left-[30px] top-[30px] h-[6px] w-[220px] bg-[#FB5A00]" />
        <div className="absolute right-[30px] top-[30px] h-[6px] w-[220px] bg-[#F3C80F]" />
        <div className="absolute bottom-[30px] left-[30px] h-[6px] w-[220px] bg-[#F3C80F]" />
        <div className="absolute bottom-[30px] right-[30px] h-[6px] w-[220px] bg-[#06A6FF]" />

        {/* MARCAS DECORATIVAS ESQUINAS */}
        <div className="absolute left-[30px] top-[30px] h-[70px] w-[70px] border-l-[4px] border-t-[4px] border-[#06A6FF]" />
        <div className="absolute right-[30px] top-[30px] h-[70px] w-[70px] border-r-[4px] border-t-[4px] border-[#FB5A00]" />
        <div className="absolute bottom-[30px] left-[30px] h-[70px] w-[70px] border-b-[4px] border-l-[4px] border-[#F3C80F]" />
        <div className="absolute bottom-[30px] right-[30px] h-[70px] w-[70px] border-b-[4px] border-r-[4px] border-[#06A6FF]" />

        {/* CONTENIDO */}
        <div className="relative z-10 h-full px-[72px] py-[56px]">
          {/* LOGO SUPERIOR DERECHA */}
          <div className="absolute right-[72px] top-[54px]">
            <img
              src={logoSrc}
              alt="Logo CEDULL"
              className="h-[88px] w-auto object-contain"
            />
          </div>

          {/* CABECERA */}
          <div className="pt-[56px] text-center">
            <p className="mx-auto max-w-[700px] text-[16px] font-normal leading-[1.5] text-[#000000]">
              Corporación de Educación Luis Llerena “CEDULL” otorga el presente
            </p>
          </div>

          {/* TITULO */}
          <div className="mt-[28px] text-center">
            <h1 className="text-[64px] font-bold tracking-[1.5px] text-[#000000]">
              CERTIFICADO
            </h1>
            <div className="mx-auto mt-3 h-[4px] w-[180px] rounded-full bg-[#FB5A00]" />
          </div>

          {/* SUBTITULO */}
          <div className="mt-[22px] text-center">
            <p className="text-[22px] font-medium text-[#06A6FF]">Otorgado a:</p>
          </div>

          {/* NOMBRE */}
          <div className="mt-[20px] px-10 text-center">
            <h2 className="text-[38px] font-semibold uppercase tracking-[1px] text-[#000000]">
              {fullName}
            </h2>
            <div className="mx-auto mt-4 h-[2px] w-[460px] max-w-full bg-[#F3C80F]" />
          </div>

          {/* TEXTO DESCRIPTIVO */}
          <div className="mt-[44px] flex justify-center">
            <p className="max-w-[830px] text-center text-[20px] leading-[1.7] text-[#000000]">
              Por haber aprobado satisfactoriamente el curso{" "}
              <span className="font-bold">{program}</span>, realizado del{" "}
              <span className="font-semibold">{startDate}</span> al{" "}
              <span className="font-semibold">{endDate}</span>, con una duración
              de <span className="font-semibold">{hours} horas académicas</span>.
            </p>
          </div>

          {/* PIE */}
          <div className="absolute bottom-[58px] left-[72px] right-[72px]">
            <div className="grid grid-cols-3 items-end">
              {/* QR */}
              <div className="flex flex-col items-start justify-end">
                <div className="rounded-[8px] border border-[#D9D9D9] bg-white p-2">
                  <img
                    src={qrSrc}
                    alt="Código QR"
                    className="h-[110px] w-[110px] object-contain"
                  />
                </div>
              </div>

              {/* FIRMA */}
              <div className="flex flex-col items-center justify-end">
                <img
                  src={signatureSrc}
                  alt="Firma"
                  className="h-[105px] w-auto object-contain"
                />
                <div className="mt-[-2px] w-[280px] border-t border-[#000000]" />
                <p className="mt-2 text-center text-[15px] font-bold uppercase leading-tight text-[#000000]">
                  JOSE LUIS LLERENA FLORES
                </p>
                <p className="mt-1 text-center text-[14px] leading-tight text-[#000000]">
                  Director de Formación Continua
                </p>
              </div>

              {/* FECHA */}
              <div className="flex items-end justify-end">
                <div className="text-right">
                  <p className="text-[13px] uppercase tracking-[1px] text-[#FB5A00]">
                    Fecha de emisión
                  </p>
                  <p className="mt-1 text-[22px] font-semibold text-[#000000]">
                    {issueDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DETALLE DECORATIVO INFERIOR SUAVE */}
          <div className="absolute bottom-[120px] left-1/2 h-[90px] w-[320px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(6,166,255,0.06),rgba(243,200,15,0.10),rgba(251,90,0,0.06))]" />
        </div>
      </div>
    </div>
  );
}