import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD");

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export const CertificateCreateSchema = z.object({
  fullName: z.string().min(3).max(200),
  documentId: z.string().max(50).optional().nullable(),
  program: z.string().min(2).max(200),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  hours: z.number().int().min(1).max(10000),
  institution: z.string().min(2).max(200),
  authority: z.string().min(2).max(200),
  issueDate: dateOnlySchema,
  observations: z.string().max(2000).optional().nullable(),
});

export const CertificateUpdateSchema = CertificateCreateSchema.extend({
  status: z.enum(["ACTIVO", "REVOCADO"]).optional(),
});