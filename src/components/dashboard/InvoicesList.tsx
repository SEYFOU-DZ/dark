'use client';

import { useState, useEffect } from 'react';
import { Receipt, Download, Eye } from 'lucide-react';
import { apiJson } from '@/lib/api';

interface Invoice {
  _id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  vehicleCategory: string;
  trafficCode: string;
  feeDescription: string;
  feeAmount: number;
  feeNotes: string;
  notes1: string;
  notes2: string;
  total: number;
  pdfUrl: string;
  createdAt: string;
}

interface InvoicesListProps {
  user: any;
  locale: string;
}

export default function InvoicesList({ user, locale }: InvoicesListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      invoices: { en: 'Invoices', ar: 'الفواتير' },
      invoicesDesc: { en: 'View all your invoices', ar: 'عرض جميع فواتيرك' },
      noInvoices: { en: 'No invoices yet', ar: 'لا توجد فواتير' },
      startInvoice: { en: 'Start by creating a new invoice', ar: 'ابدأ بإنشاء فاتورة جديدة' },
      invoiceNo: { en: 'Invoice #', ar: 'رقم الفاتورة #' },
      customerName: { en: 'Customer Name', ar: 'اسم العميل' },
      phone: { en: 'Phone', ar: 'رقم الهاتف' },
      amount: { en: 'Amount', ar: 'المبلغ' },
      date: { en: 'Date', ar: 'التاريخ' },
      actions: { en: 'Actions', ar: 'الإجراءات' },
      view: { en: 'View', ar: 'عرض' },
      download: { en: 'Download', ar: 'تحميل' },
      loading: { en: 'Loading...', ar: 'جاري التحميل...' },
    };
    return translations[key]?.[locale] || key;
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await apiJson<Invoice[]>('/api/invoices');
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('invoices')}</h1>
        <p className="text-slate-600 mt-1">{t('invoicesDesc')}</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('noInvoices')}</h3>
          <p className="text-slate-600">{t('startInvoice')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoiceNo')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('customerName')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('phone')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('amount')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{invoice._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.customerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                      <a
                        href={`/api/invoices/pdf/${invoice._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye size={14} />
                        {t('view')}
                      </a>
                      <a
                        href={`/api/invoices/pdf/${invoice._id}?download=true`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        <Download size={14} />
                        {t('download')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
