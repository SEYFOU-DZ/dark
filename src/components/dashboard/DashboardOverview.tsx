'use client';

import { useState } from 'react';
import { Plus, FileText, Receipt, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QuoteWizard } from '@/components/QuoteWizard';
import { InvoiceWizard } from '@/components/InvoiceWizard';

interface DashboardOverviewProps {
  user: any;
  locale: string;
}

export default function DashboardOverview({ user, locale }: DashboardOverviewProps) {
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
      welcome: { en: 'Welcome', ar: 'مرحباً' },
      totalRequests: { en: 'Total Requests', ar: 'الطلبات الكلية' },
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      accepted: { en: 'Accepted', ar: 'مقبولة' },
      rejected: { en: 'Rejected', ar: 'مرفوضة' },
      createRequest: { en: 'Create Request', ar: 'إنشاء طلب' },
      createRequestDesc: { en: 'Create a new service request', ar: 'إنشاء طلب خدمة جديد' },
      createRequestBtn: { en: 'Create Request', ar: 'إنشاء طلب' },
      createInvoice: { en: 'Create Invoice', ar: 'إنشاء فاتورة' },
      createInvoiceDesc: { en: 'Create an invoice for existing request', ar: 'إنشاء فاتورة لطلب موجود' },
      createInvoiceBtn: { en: 'Create Invoice', ar: 'إنشاء فاتورة' },
      noRequests: { en: 'No requests yet', ar: 'لا توجد طلبات' },
      startRequest: { en: 'Start by creating a new request', ar: 'ابدأ بإنشاء طلب جديد' },
    };
    return translations[key]?.[locale] || key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard')}</h1>
        <p className="text-slate-600 mt-1">{t('welcome')}, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">{t('totalRequests')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">{t('pending')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">{t('accepted')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">{t('rejected')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('createRequest')}</h3>
              <p className="text-sm text-slate-600">{t('createRequestDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestWizard(true)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('createRequestBtn')}
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('createInvoice')}</h3>
              <p className="text-sm text-slate-600">{t('createInvoiceDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowInvoiceWizard(true)}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            {t('createInvoiceBtn')}
          </button>
        </div>
      </div>

      {/* Wizards */}
      {showRequestWizard && (
        <QuoteWizard onClose={() => setShowRequestWizard(false)} />
      )}
      {showInvoiceWizard && (
        <InvoiceWizard onClose={() => setShowInvoiceWizard(false)} />
      )}
    </div>
  );
}
