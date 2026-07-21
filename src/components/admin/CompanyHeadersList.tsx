'use client';

import { useState, useEffect } from 'react';
import { Building2, Trash2, CheckCircle, Plus } from 'lucide-react';
import type { CompanyHeader } from '@/lib/custom-invoice/types';
import CompanyHeaderForm from './CompanyHeaderForm';

interface CompanyHeadersListProps {
  selectedId?: string;
  onSelect?: (header: CompanyHeader) => void;
  showSelector?: boolean; // true = selection mode, false = management mode
  refreshKey?: number;
}

export default function CompanyHeadersList({
  selectedId,
  onSelect,
  showSelector = false,
  refreshKey = 0,
}: CompanyHeadersListProps) {
  const [headers, setHeaders] = useState<CompanyHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHeaders();
  }, [refreshKey]);

  const fetchHeaders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/company-headers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setHeaders(data);
    } catch {
      setError('Could not load company headers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company header?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/company-headers/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setHeaders((prev) => prev.filter((h) => h._id !== id));
    } catch {
      alert('Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10" dir="ltr">
        <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left" dir="ltr">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Company Headers</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage company metadata for billing documents</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-700 transition font-medium"
        >
          <Plus size={12} />
          Add Header
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {headers.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No company headers found</p>
          <p className="text-xs text-slate-400 mt-1">
            Add a company header to start generating custom invoices.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 transition"
          >
            Add First Header
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          {headers.map((header) => {
            const isSelected = selectedId === header._id;
            return (
              <div
                key={header._id}
                onClick={() => onSelect?.(header)}
                className={`group relative rounded-xl border-2 transition-all ${
                  showSelector ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-slate-400 hover:shadow-sm'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <CheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                )}

                <div className="p-3 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  {/* EN info */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {header.companyName}
                    </p>
                    {header.addressLines?.slice(0, 2).map((l, i) =>
                      l.en ? (
                        <p key={i} className="text-[10px] text-slate-400 truncate">
                          {l.en}
                        </p>
                      ) : null
                    )}
                  </div>

                  {/* Logo + name */}
                  <div className="flex flex-col items-center gap-1 px-2">
                    {header.logoUrl ? (
                      <img
                        src={header.logoUrl}
                        alt="logo"
                        className="h-9 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-9 w-14 flex items-center justify-center bg-gray-100 rounded text-slate-400">
                        <Building2 size={16} />
                      </div>
                    )}
                  </div>

                  {/* AR info */}
                  <div className="space-y-0.5 text-right">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {header.companyName}
                    </p>
                    {header.addressLines?.slice(0, 2).map((l, i) =>
                      l.ar ? (
                        <p key={i} className="text-[10px] text-slate-400 truncate">
                          {l.ar}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Delete button (management mode only) */}
                {!showSelector && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(header._id); }}
                    disabled={deletingId === header._id}
                    className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CompanyHeaderForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchHeaders}
      />
    </div>
  );
}
