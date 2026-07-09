import type { InvoiceFormData } from "./types";

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

let localInvoiceCounter = 1;

export function generateInvoiceNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const seq = pad(localInvoiceCounter++, 3);
  return `INV-${y}-${m}${d}-${seq}`;
}

export function resetLocalCounter() {
  localInvoiceCounter = 1;
}

export function formatInvoiceDate(date = new Date()): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function createDefaultInvoiceData(): InvoiceFormData {
  return {
    invoiceNo: generateInvoiceNo(),
    invoiceDate: formatInvoiceDate(),
    customerName: "",
    vehicleType: "",
    vehicleCategory: "",
    trafficCode: "",
    feeDescription: "رسوم مستردة",
    feeAmount: 500,
    feeNotes: "—",
    notes1: "يرجى التأكد من صحة البيانات المذكورة أعلاه قبل الدفع.",
    notes2: "الفاتورة صالحة لمدة 30 يوم من تاريخ الإصدار.",
  };
}

export function formatFeeAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTotalAmount(amount: number): string {
  return `${formatFeeAmount(amount)} درهم`;
}

export function summarizeInvoice(data: InvoiceFormData) {
  return {
    ...data,
    feeAmountFormatted: formatFeeAmount(data.feeAmount),
    totalFormatted: formatTotalAmount(data.feeAmount),
  };
}