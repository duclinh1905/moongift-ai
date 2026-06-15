import { z } from "zod";

export const quoteRequestSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  quantity: z.coerce.number().int().min(20).max(100000),
  budgetPerGift: z.coerce.number().min(5).max(10000),
  deliveryDate: z.string().min(8).max(20),
  audience: z.string().min(2).max(120),
  message: z.string().max(1000).optional()
});

export const advisorSchema = z.object({
  recipientType: z.string().min(2).max(120),
  quantity: z.coerce.number().int().min(20).max(100000),
  budgetPerGift: z.coerce.number().min(5).max(10000),
  brandTone: z.string().min(2).max(120),
  constraints: z.string().max(800).optional()
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type AdvisorInput = z.infer<typeof advisorSchema>;
