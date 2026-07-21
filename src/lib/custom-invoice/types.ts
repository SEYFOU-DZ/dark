// ─── Company Header (the saved reusable top section) ─────────────────────────
export interface AddressLine {
  ar: string;
  en: string;
}

export interface CompanyHeader {
  _id: string;
  name?: string;           // Optional internal label
  companyName: string;     // Single company name shown top-left and top-right
  addressLines: AddressLine[];
  logoUrl?: string;        // Base64 or URL
  createdAt?: string;
}

// ─── Invoice Item (bilingual) ─────────────────────────────────────────────────
export interface CustomInvoiceItem {
  id: string;
  descriptionAr: string;
  descriptionEn: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Full Invoice Form Data ───────────────────────────────────────────────────
export interface CustomInvoiceFormData {
  invoiceNo: string;
  companyHeaderId?: string;
  companyHeaderSnapshot?: {
    companyName: string;
    addressLines: AddressLine[];
    logoUrl?: string;
  };
  logoUrl?: string;
  companyName?: string;
  // Client Info
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  // Dates
  invoiceDate: string;
  dueDate: string;
  // Financials
  currency: string;
  items: CustomInvoiceItem[];
  taxRate: number;
  discount: number;
  // Notes list
  notes: string[];
}

// ─── Default form state ───────────────────────────────────────────────────────
export const DEFAULT_CUSTOM_INVOICE_DATA: CustomInvoiceFormData = {
  invoiceNo: '',
  companyHeaderId: '',
  companyHeaderSnapshot: undefined,
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  clientAddress: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  currency: 'SAR',
  items: [
    {
      id: '1',
      descriptionAr: '',
      descriptionEn: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ],
  taxRate: 15,
  discount: 0,
  notes: [''],
};
