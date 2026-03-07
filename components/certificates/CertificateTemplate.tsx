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
    <div className="w-full flex justify-center bg-neutral-200 p-6">
      <div
        className="relative w-[1123px] h-[794px] overflow-hidden bg-white shadow-2xl"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Fondo decorativo */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[360px] h-[230px] bg-[#0F67B5]" />
          <div className="absolute -top-[180px] -left-[120px] w-[520px] h-[420px] rounded-full border-[10px] border-[#E7AA16]" />
          <div className="absolute -bottom-[170px] -right-[80px] w-[520px] h-[360px] rounded-full border-[10px] border-[#E7AA16]" />
          <div className="absolute bottom-0 right-0 w-[220px] h-[150px] bg-[#0F67B5]" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 h-full px-14 py-10">
          {/* Logo */}
          <div className="absolute top-8 right-10">
            <img
              src={logoSrc}
              alt="Logo CEDULL"
              className="h-[80px] w-auto object-contain"
            />
          </div>

          {/* Texto institucional */}
          <div className="pt-16 text-center">
            <p className="mx-auto max-w-[720px] text-[22px] leading-[1.35] text-[#2A2A2A]">
              Corporación de Educación Luis Llerena “CEDULL” otorga el presente
            </p>
          </div>

          {/* Título */}
          <div className="mt-10 text-center">
            <h1 className="text-[68px] font-light tracking-[1px] text-[#1F1F1F]">
              CERTIFICADO
            </h1>
          </div>

          {/* a: */}
          <div className="mt-6 text-center">
            <p className="text-[34px] text-[#222]">a:</p>
          </div>

          {/* Nombre */}
          <div className="mt-4 text-center px-16">
            <h2
              className="text-[34px] italic tracking-[1px] text-[#1E1E1E] uppercase"
              style={{ fontFamily: '"Comic Sans MS", "Segoe Script", cursive' }}
            >
              {fullName}
            </h2>
          </div>

          {/* Texto descriptivo */}
          <div className="mt-10 flex justify-center">
            <p className="max-w-[860px] text-center text-[19px] leading-[1.45] text-[#333]">
              por haber aprobado satisfactoriamente el curso{" "}
              <span className="font-medium">{program}</span>, realizado del{" "}
              {startDate} al {endDate}, con una duración de {hours} horas
              académicas.
            </p>
          </div>

          {/* Pie */}
          <div className="absolute left-0 right-0 bottom-10 px-14">
            <div className="grid grid-cols-3 items-end">
              {/* QR */}
              <div className="flex items-end justify-start">
                <div className="h-[118px] w-[118px] rounded bg-white p-2 shadow-sm">
                  <img
                    src={qrSrc}
                    alt="Código QR"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Firma */}
              <div className="flex flex-col items-center justify-end">
                <img
                  src={signatureSrc}
                  alt="Firma"
                  className="h-[105px] w-auto object-contain"
                />
                <div className="mt-[-6px] w-[250px] border-t border-[#555]" />
                <p className="mt-2 text-center text-[15px] font-semibold uppercase leading-tight text-[#222]">
                  JOSE LUIS LLERENA FLORES
                </p>
                <p className="text-center text-[14px] leading-tight text-[#444]">
                  Director de Formación Continua
                </p>
              </div>

              {/* Fecha */}
              <div className="flex items-end justify-end">
                <p className="text-[15px] text-[#4B6FAE]">
                  Fecha de Emisión: {issueDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}