'use client';

import { useState } from 'react';
import { Plus, Trash2, Upload, Save, X, Building2 } from 'lucide-react';
import type { AddressLine } from '@/lib/custom-invoice/types';

interface CompanyHeaderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompanyHeaderForm({ isOpen, onClose, onSuccess }: CompanyHeaderFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [addressLines, setAddressLines] = useState<AddressLine[]>([
    { ar: '', en: '' },
  ]);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setAddressLines([{ ar: '', en: '' }]);
    setLogoPreview('');
    setLogoBase64('');
    setError('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setLogoPreview(b64);
      setLogoBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const addLine = () => setAddressLines([...addressLines, { ar: '', en: '' }]);

  const removeLine = (i: number) =>
    setAddressLines(addressLines.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: 'ar' | 'en', val: string) => {
    const next = [...addressLines];
    next[i] = { ...next[i], [field]: val };
    setAddressLines(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/company-headers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: companyName.trim(), // Use companyName as internal name too
          companyName: companyName.trim(),
          addressLines: addressLines.filter((l) => l.ar.trim() || l.en.trim()),
          logoUrl: logoBase64,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save company header');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-left" dir="ltr">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Company Header</h2>
              <p className="text-xs text-slate-500">Configure company metadata for invoices</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Company Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Dubai National Insurance / دبي الوطنية"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm outline-none transition"
              required
            />
          </div>

          {/* Address Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">
                Address Lines (Bilingual)
              </label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
              >
                <Plus size={12} />
                Add Address Line
              </button>
            </div>

            <div className="space-y-2">
              {addressLines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                  <input
                    type="text"
                    dir="rtl"
                    value={line.ar}
                    onChange={(e) => updateLine(i, 'ar', e.target.value)}
                    placeholder={`Arabic Address Line ${i + 1}`}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 outline-none"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={line.en}
                    onChange={(e) => updateLine(i, 'en', e.target.value)}
                    placeholder={`English Address Line ${i + 1}`}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                  />
                  {addressLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="header-logo-upload"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition text-sm text-slate-700"
              >
                <Upload size={15} />
                Upload Logo File
              </label>
              <input
                id="header-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoPreview && (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-14 w-auto border border-gray-200 rounded-lg object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => { setLogoPreview(''); setLogoBase64(''); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview strip */}
          {(companyName || logoPreview) && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border-b border-slate-200">
                Live Preview (Bilingual Header Output)
              </div>
              <div className="grid grid-cols-3 gap-0 divide-x divide-gray-200 bg-white p-3">
                {/* EN side */}
                <div className="pr-3 space-y-0.5 text-left">
                  {companyName && (
                    <p className="text-xs font-bold text-slate-900">{companyName}</p>
                  )}
                  {addressLines.map((l, i) =>
                    l.en ? <p key={i} className="text-[10px] text-slate-500">{l.en}</p> : null
                  )}
                </div>
                {/* Logo center */}
                <div className="flex items-center justify-center px-2">
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <div className="text-xs text-slate-400 italic">Logo Container</div>
                  )}
                </div>
                {/* AR side */}
                <div className="pl-3 space-y-0.5 text-right">
                  {companyName && (
                    <p className="text-xs font-bold text-slate-900">{companyName}</p>
                  )}
                  {addressLines.map((l, i) =>
                    l.ar ? <p key={i} className="text-[10px] text-slate-500">{l.ar}</p> : null
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="flex-1 py-2.5 px-4 bg-gray-100 text-slate-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <span>Saving Header...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Company Header</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
