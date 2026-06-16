import { z } from "zod";
import { leadStatuses } from "@/lib/crm";

const trimmedString = (min: number, max: number) => z.string().trim().min(min).max(max);

export const quoteRequestSchema = z.object({
  companyName: trimmedString(2, 120),
  contactName: trimmedString(2, 120),
  email: z.string().trim().email().max(254),
  phone: trimmedString(6, 40),
  quantity: z.coerce.number().int().min(20).max(100000),
  budgetPerGift: z.coerce.number().min(5).max(10000),
  deliveryDate: z.string().date(),
  audience: trimmedString(2, 120),
  message: z.string().trim().max(1000).optional(),
  captchaToken: z.string().min(1).max(4096).optional()
});

export const advisorSchema = z.object({
  recipientType: trimmedString(2, 120),
  quantity: z.coerce.number().int().min(20).max(100000),
  budgetPerGift: z.coerce.number().min(5).max(10000),
  brandTone: trimmedString(2, 120),
  constraints: z.string().trim().max(800).optional()
});

export const uuidParamsSchema = z.object({
  id: z.string().uuid()
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type AdvisorInput = z.infer<typeof advisorSchema>;

export const leadStatusUpdateSchema = z.object({
  status: z.enum(leadStatuses)
});

export const quoteEmailSchema = z.object({
  email: z.string().trim().email().max(254).optional()
});
