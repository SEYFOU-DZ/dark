import type { InvoiceFormData } from "./types";

export interface InvoiceFormStep {
  id: string;
  fields: (keyof InvoiceFormData)[];
}

export const INVOICE_FORM_STEPS: InvoiceFormStep[] = [
  {
    id: "customer",
    fields: ["invoiceDate", "customerName", "vehicleType", "vehicleCategory", "trafficCode"],
  },
  {
    id: "fees",
    fields: ["feeAmount", "feeNotes", "notes1", "notes2"],
  },
];

export const INVOICE_AUTO_FIELDS = new Set<keyof InvoiceFormData>([
  "invoiceNo",
  "feeDescription",
]);
