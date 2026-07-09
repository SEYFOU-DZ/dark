'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Eye, Check, X } from 'lucide-react';
import { apiJson } from '@/lib/api';

interface Request {
  _id: string;
  customerName: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface RequestsListProps {
  user: any;
  locale: string;
}

export default function RequestsList({ user, locale }: RequestsListProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const endpoint = user.isAdmin ? '/api/requests/all' : '/api/requests';
      const data = await apiJson<Request[]>(endpoint);
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await apiJson(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          adminMessage:
            status === 'accepted'
              ? 'Your request has been accepted successfully.'
              : 'Your request has been rejected. Please contact support for more details.',
        }),
      });
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      requests: { en: 'Requests', ar: 'الطلبات' },
      requestsDesc: { en: 'View all your requests', ar: 'عرض جميع طلباتك' },
      requestsDescAdmin: { en: 'View and manage all requests', ar: 'عرض جميع الطلبات وإدارتها' },
      noRequests: { en: 'No requests yet', ar: 'لا توجد طلبات' },
      startRequest: { en: 'Start by creating a new request', ar: 'ابدأ بإنشاء طلب جديد' },
      requestNo: { en: 'Request #', ar: 'رقم الطلب #' },
      user: { en: 'User', ar: 'المستخدم' },
      customerName: { en: 'Customer Name', ar: 'اسم العميل' },
      phone: { en: 'Phone', ar: 'رقم الهاتف' },
      vehicle: { en: 'Vehicle', ar: 'المركبة' },
      status: { en: 'Status', ar: 'الحالة' },
      date: { en: 'Date', ar: 'التاريخ' },
      actions: { en: 'Actions', ar: 'الإجراءات' },
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      accepted: { en: 'Accepted', ar: 'مقبول' },
      rejected: { en: 'Rejected', ar: 'مرفوض' },
      accept: { en: 'Accept', ar: 'قبول' },
      reject: { en: 'Reject', ar: 'رفض' },
      processed: { en: 'Processed', ar: 'تمت المعالجة' },
      loading: { en: 'Loading...', ar: 'جاري التحميل...' },
    };
    return translations[key]?.[locale] || key;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock size={14} />
            {t('pending')}
          </span>
        );
      case 'accepted':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle size={14} />
            {t('accepted')}
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle size={14} />
            {t('rejected')}
          </span>
        );
      default:
        return null;
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
        <h1 className="text-3xl font-bold text-slate-900">{t('requests')}</h1>
        <p className="text-slate-600 mt-1">
          {user.isAdmin ? t('requestsDescAdmin') : t('requestsDesc')}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noRequests')}</h3>
          <p className="text-gray-600">{t('startRequest')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('requestNo')}</th>
                  {user.isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('user')}</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('customerName')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('phone')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('vehicle')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('date')}</th>
                  {user.isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{request._id.slice(-6)}
                    </td>
                    {user.isAdmin && request.userId && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.userId.name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {request.customerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.vehicleMake} {request.vehicleModel} ({request.vehicleYear})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}
                    </td>
                    {user.isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request._id, 'accepted')}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              <Check size={14} />
                              {t('accept')}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request._id, 'rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              <X size={14} />
                              {t('reject')}
                            </button>
                          </>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-slate-500">{t('processed')}</span>
                        )}
                      </td>
                    )}
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
