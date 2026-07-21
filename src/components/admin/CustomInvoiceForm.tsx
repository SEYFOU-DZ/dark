'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import type { CustomInvoiceFormData, CustomInvoiceItem, CompanyHeader } from '@/lib/custom-invoice/types';
import { DEFAULT_CUSTOM_INVOICE_DATA } from '@/lib/custom-invoice/types';
import CompanyHeadersList from './CompanyHeadersList';

interface CustomInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CustomInvoiceForm({ isOpen, onClose, onSuccess }: CustomInvoiceFormProps) {
  const [data, setData] = useState<CustomInvoiceFormData>(DEFAULT_CUSTOM_INVOICE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [selectedHeader, setSelectedHeader] = useState<CompanyHeader | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setData({
        ...DEFAULT_CUSTOM_INVOICE_DATA,
        invoiceDate: new Date().toISOString().split('T')[0],
        notes: [''],
      });
      setSelectedHeader(null);
      setError('');
      setSuccess('');
      setStep(1);
    }
  }, [isOpen]);

  const handleHeaderSelect = (header: CompanyHeader) => {
    setSelectedHeader(header);
    setData({
      ...data,
      companyHeaderId: header._id,
      companyHeaderSnapshot: {
        companyName: header.companyName,
        addressLines: header.addressLines,
        logoUrl: header.logoUrl,
      },
    });
  };

  const addItem = () => {
    const newItem: CustomInvoiceItem = {
      id: Date.now().toString(),
      descriptionAr: '',
      descriptionEn: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setData({ ...data, items: [...data.items, newItem] });
  };

  const updateItem = (id: string, field: keyof CustomInvoiceItem, value: string | number) => {
    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    setData({ ...data, items: updatedItems });
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    setData({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  // Notes list handlers
  const addNoteLine = () => {
    setData({ ...data, notes: [...data.notes, ''] });
  };

  const updateNoteLine = (idx: number, value: string) => {
    const updatedNotes = [...data.notes];
    updatedNotes[idx] = value;
    setData({ ...data, notes: updatedNotes });
  };

  const removeNoteLine = (idx: number) => {
    if (data.notes.length <= 1) {
      setData({ ...data, notes: [''] });
      return;
    }
    setData({ ...data, notes: data.notes.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate
      if (!data.companyHeaderId) throw new Error('Please select a Company Header');
      if (!data.clientName) throw new Error('Client Name is required');
      if (!data.items.length || data.items.some(i => !i.descriptionAr && !i.descriptionEn)) {
        throw new Error('Please add at least one item with a description');
      }

      // Generate invoice number automatically
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const invoiceNo = `INV-${randomPart}`;
      
      const formData = {
        ...data,
        invoiceNo,
        notes: data.notes.filter(n => n.trim() !== ''),
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/custom-invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.error || 'Failed to generate invoice');
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Invoice generated successfully!');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Invoice generation failed');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = data.discount || 0;
  const taxableBase = subtotal - discountAmount;
  const taxAmount = (taxableBase * (data.taxRate || 0)) / 100;
  const total = taxableBase + taxAmount;

  if (!isOpen) return null;

  const nextStep = () => setStep(Math.min(4, step + 1));
  const prevStep = () => setStep(Math.max(1, step - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="ltr">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Custom Invoice</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className={step >= 1 ? "text-slate-900 font-semibold" : ""}>Header</span>
                <ChevronRight size={10} />
                <span className={step >= 2 ? "text-slate-900 font-semibold" : ""}>Client</span>
                <ChevronRight size={10} />
                <span className={step >= 3 ? "text-slate-900 font-semibold" : ""}>Items</span>
                <ChevronRight size={10} />
                <span className={step >= 4 ? "text-slate-900 font-semibold" : ""}>Review</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* STEP 1: Company Header Selection */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <h3 className="text-base font-bold text-slate-900 mb-4">Select Company Header</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-[400px] overflow-y-auto">
              <CompanyHeadersList
                selectedId={data.companyHeaderId}
                onSelect={handleHeaderSelect}
                showSelector={true}
              />
            </div>
          </div>

          {/* STEP 2: Client Info & Dates */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <h3 className="text-base font-bold text-slate-900 mb-4">Client Details & Billing Dates</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client Name</label>
                  <input
                    type="text"
                    value={data.clientName}
                    onChange={(e) => setData({ ...data, clientName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                    placeholder="Enter client's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={data.clientEmail}
                    onChange={(e) => setData({ ...data, clientEmail: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm text-left"
                    dir="ltr"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={data.clientPhone}
                    onChange={(e) => setData({ ...data, clientPhone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm text-left"
                    dir="ltr"
                    placeholder="+971 50 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Billing Address</label>
                  <input
                    type="text"
                    value={data.clientAddress}
                    onChange={(e) => setData({ ...data, clientAddress: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                    placeholder="Dubai, United Arab Emirates"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    value={data.invoiceDate}
                    onChange={(e) => setData({ ...data, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={data.dueDate}
                    onChange={(e) => setData({ ...data, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <select
                    value={data.currency}
                    onChange={(e) => setData({ ...data, currency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                  >
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Items */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-700 transition"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-start relative group">
                  <div className="col-span-12 md:col-span-5 space-y-2">
                    <input
                      type="text"
                      placeholder="Description (Arabic)"
                      value={item.descriptionAr}
                      onChange={(e) => updateItem(item.id, 'descriptionAr', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-right"
                      dir="rtl"
                    />
                    <input
                      type="text"
                      placeholder="Description (English)"
                      value={item.descriptionEn}
                      onChange={(e) => updateItem(item.id, 'descriptionEn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-center focus:border-slate-900"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-center focus:border-slate-900"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Total</label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center font-bold text-slate-800">
                      {item.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-center items-center h-full pt-4">
                    {data.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: Totals & Notes list */}
          <div className={step === 4 ? 'block' : 'hidden'}>
            <h3 className="text-base font-bold text-slate-900 mb-4">Review & Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={data.taxRate}
                      onChange={(e) => setData({ ...data, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.discount}
                      onChange={(e) => setData({ ...data, discount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Notes List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Invoice Notes (List)</label>
                    <button
                      type="button"
                      onClick={addNoteLine}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      <Plus size={12} /> Add Note
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.notes.map((note, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => updateNoteLine(idx, e.target.value)}
                          placeholder="e.g. Please transfer to bank account details"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeNoteLine(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-fit">
                <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Financial Summary</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-medium text-slate-900">{subtotal.toFixed(2)} {data.currency}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{discountAmount.toFixed(2)} {data.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tax ({data.taxRate}%):</span>
                    <span className="font-medium text-slate-900">{taxAmount.toFixed(2)} {data.currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span>{total.toFixed(2)} {data.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : prevStep}
            className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && !data.companyHeaderId}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition text-sm font-medium disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <span>Generating PDF...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Generate & Save Invoice</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
