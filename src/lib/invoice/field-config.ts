import type { InvoiceFormData } from "./types";

type FieldKind = "text" | "money" | "digits";

interface FieldRule {
  kind: FieldKind;
  required?: boolean;
  maxLength?: number;
  fullWidth?: boolean;
}

export const INVOICE_FIELD_RULES: Partial<
  Record<keyof InvoiceFormData, FieldRule>
> = {
  invoiceNo: { kind: "text", required: false, maxLength: 40 },
  invoiceDate: { kind: "text", required: true, maxLength: 20 },
  customerName: { kind: "text", required: true, maxLength: 80, fullWidth: true },
  vehicleType: { kind: "text", required: true, maxLength: 60 },
  vehicleCategory: { kind: "text", required: true, maxLength: 40 },
  trafficCode: { kind: "digits", required: true, maxLength: 20 },
  feeDescription: { kind: "text", required: true, maxLength: 120, fullWidth: true },
  feeAmount: { kind: "money", required: true },
  feeNotes: { kind: "text", maxLength: 60 },
  notes1: { kind: "text", maxLength: 200, fullWidth: true },
  notes2: { kind: "text", maxLength: 200, fullWidth: true },
};

export function sanitizeInvoiceField(
  name: keyof InvoiceFormData,
  raw: string
): string | number {
  const rule = INVOICE_FIELD_RULES[name];
  if (rule?.kind === "money") {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  if (rule?.kind === "digits") {
    return raw.replace(/\D/g, "").slice(0, rule.maxLength ?? 20);
  }
  return raw.slice(0, rule?.maxLength ?? 200);
}

export function validateInvoiceStepFields(
  fields: (keyof InvoiceFormData)[],
  data: InvoiceFormData
): string[] {
  const errors: string[] = [];

  for (const name of fields) {
    const rule = INVOICE_FIELD_RULES[name];
    if (!rule?.required) continue;

    const value = data[name];
    if (typeof value === "number") {
      if (value <= 0) errors.push(`${String(name)} is required`);
      continue;
    }
    if (!String(value).trim()) errors.push(`${String(name)} is required`);
  }

  return errors;
}
