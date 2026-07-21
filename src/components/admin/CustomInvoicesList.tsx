'use client';

import { useState, useEffect } from 'react';
import { Receipt, Download, Eye, Trash2 } from 'lucide-react';
import { apiJson } from '@/lib/api';

interface CustomInvoice {
  _id: string;
  invoiceNo: string;
  invoiceDate: string;
  currency: string;
  clientName: string;
  companyHeaderSnapshot?: {
    companyNameEn: string;
    companyNameAr: string;
  };
  total: number;
  pdfUrl: string;
  createdAt: string;
}

interface CustomInvoicesListProps {
  locale: string;
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function CustomInvoicesList({ locale, refreshKey, onRefresh }: CustomInvoicesListProps) {
  const [invoices, setInvoices] = useState<CustomInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      customInvoices: { en: 'Custom Invoices', ar: 'الفواتير المخصصة' },
      customInvoicesDesc: { en: 'View and manage custom invoices', ar: 'عرض وإدارة الفواتير المخصصة' },
      noInvoices: { en: 'No custom invoices yet', ar: 'لا توجد فواتير مخصصة' },
      startInvoice: { en: 'Start by creating a new custom invoice', ar: 'ابدأ بإنشاء فاتورة مخصصة جديدة' },
      invoiceNo: { en: 'Invoice #', ar: 'رقم الفاتورة #' },
      company: { en: 'Company Header', ar: 'ترويسة الشركة' },
      client: { en: 'Client', ar: 'العميل' },
      amount: { en: 'Amount', ar: 'المبلغ' },
      date: { en: 'Date', ar: 'التاريخ' },
      actions: { en: 'Actions', ar: 'الإجراءات' },
      view: { en: 'View', ar: 'عرض' },
      download: { en: 'Download', ar: 'تحميل' },
      delete: { en: 'Delete', ar: 'حذف' },
      loading: { en: 'Loading...', ar: 'جاري التحميل...' },
    };
    return translations[key]?.[locale] || key;
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshKey, onRefresh]);

  const fetchInvoices = async () => {
    try {
      const data = await apiJson<CustomInvoice[]>('/api/custom-invoices');
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await apiJson(`/api/custom-invoices/${id}`, { method: 'DELETE' });
      setInvoices(invoices.filter(inv => inv._id !== id));
    } catch (err: any) {
      setError(err.message);
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
        <h1 className="text-3xl font-bold text-slate-900">{t('customInvoices')}</h1>
        <p className="text-slate-600 mt-1">{t('customInvoicesDesc')}</p>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('company')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('client')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('amount')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.companyHeaderSnapshot?.companyNameAr || invoice.companyHeaderSnapshot?.companyNameEn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.clientName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {invoice.total.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.invoiceDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                      <a
                        href={`/api/custom-invoices/pdf/${invoice._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye size={14} />
                        {t('view')}
                      </a>
                      <a
                        href={`/api/custom-invoices/pdf/${invoice._id}?download=true`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        <Download size={14} />
                        {t('download')}
                      </a>
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                        {t('delete')}
                      </button>
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
