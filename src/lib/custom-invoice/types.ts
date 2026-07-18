export interface CustomInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomInvoiceFormData {
  invoiceNo: string;
  invoiceDate: string;
  currency: string;
  logoUrl?: string;
  items: CustomInvoiceItem[];
  taxRate: number;
  notes: string[]; // Array of notes instead of single string
  signatureType: 'manual' | 'image';
  signatureData?: string; // Base64 for manual signature or image URL
  language: 'ar' | 'en';
  companyName?: string;
  companyAddress?: string;
}

export const DEFAULT_CUSTOM_INVOICE_DATA: CustomInvoiceFormData = {
  invoiceNo: '', // Will be auto-generated
  invoiceDate: new Date().toISOString().split('T')[0],
  currency: 'SAR',
  items: [
    {
      id: '1',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    },
  ],
  taxRate: 15,
  notes: [], // Array of notes
  signatureType: 'manual',
  signatureData: '',
  language: 'ar',
  companyName: '',
  companyAddress: '',
};
