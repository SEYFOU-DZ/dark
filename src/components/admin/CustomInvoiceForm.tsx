'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Upload, Save, Download, X } from 'lucide-react';
import type { CustomInvoiceFormData, CustomInvoiceItem } from '@/lib/custom-invoice/types';
import { DEFAULT_CUSTOM_INVOICE_DATA } from '@/lib/custom-invoice/types';

interface CustomInvoiceFormProps {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CustomInvoiceForm({ locale, isOpen, onClose, onSuccess }: CustomInvoiceFormProps) {
  const [data, setData] = useState<CustomInvoiceFormData>(DEFAULT_CUSTOM_INVOICE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setData(DEFAULT_CUSTOM_INVOICE_DATA);
      setLogoPreview('');
      setSignaturePreview('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      createInvoice: { en: 'Create Custom Invoice', ar: 'إنشاء فاتورة مخصصة' },
      invoiceDate: { en: 'Invoice Date', ar: 'تاريخ الفاتورة' },
      currency: { en: 'Currency', ar: 'العملة' },
      companyName: { en: 'Company Name', ar: 'اسم الشركة' },
      language: { en: 'Language', ar: 'اللغة' },
      arabic: { en: 'Arabic', ar: 'العربية' },
      english: { en: 'English', ar: 'الإنجليزية' },
      items: { en: 'Items', ar: 'العناصر' },
      addItem: { en: 'Add Item', ar: 'إضافة عنصر' },
      description: { en: 'Description', ar: 'الوصف' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      price: { en: 'Price', ar: 'السعر' },
      total: { en: 'Total', ar: 'الإجمالي' },
      taxRate: { en: 'Tax Rate (%)', ar: 'نسبة الضريبة (%)' },
      notes: { en: 'Notes', ar: 'ملاحظات' },
      signature: { en: 'Signature', ar: 'التوقيع' },
      manualSignature: { en: 'Manual Signature', ar: 'توقيع يدوي' },
      uploadSignature: { en: 'Upload Signature', ar: 'رفع توقيع' },
      uploadLogo: { en: 'Upload Logo', ar: 'رفع شعار' },
      generate: { en: 'Generate PDF', ar: 'توليد PDF' },
      generating: { en: 'Generating...', ar: 'جاري التوليد...' },
      clear: { en: 'Clear', ar: 'مسح' },
      close: { en: 'Close', ar: 'إغلاق' },
      success: { en: 'Invoice created successfully!', ar: 'تم إنشاء الفاتورة بنجاح!' },
      error: { en: 'Failed to create invoice', ar: 'فشل إنشاء الفاتورة' },
      ticket: { en: 'Subtotal', ar: 'المجموع الفرعي' },
    };
    return translations[key]?.[locale] || key;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setData({ ...data, logoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSignaturePreview(base64);
        setData({ ...data, signatureData: base64, signatureType: 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dataUrl = canvas.toDataURL();
        setSignaturePreview(dataUrl);
        setData({ ...data, signatureData: dataUrl, signatureType: 'manual' });
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignaturePreview('');
    setData({ ...data, signatureData: '' });
  };

  const addItem = () => {
    const newItem: CustomInvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setData({ ...data, items: [...data.items, newItem] });
  };

  const updateItem = (id: string, field: keyof CustomInvoiceItem, value: string | number) => {
    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    });
    setData({ ...data, items: updatedItems });
  };

  const removeItem = (id: string) => {
    setData({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate invoice number automatically (shorter format)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const invoiceNo = `INV-${randomPart}`;
      
      const formData = {
        ...data,
        invoiceNo,
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
        throw new Error('Failed to generate invoice');
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

      setSuccess(t('success'));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      
      // Reset form
      setData(DEFAULT_CUSTOM_INVOICE_DATA);
      setLogoPreview('');
      setSignaturePreview('');
      clearSignature();
    } catch (err: any) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{t('createInvoice')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('invoiceDate')}</label>
                <input
                  type="date"
                  value={data.invoiceDate}
                  onChange={(e) => setData({ ...data, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('currency')}</label>
                <select
                  value={data.currency}
                  onChange={(e) => setData({ ...data, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="AED">AED</option>
                  <option value="QAR">QAR</option>
                  <option value="OMR">OMR</option>
                  <option value="KWD">KWD</option>
                  <option value="BHD">BHD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('language')}</label>
                <select
                  value={data.language}
                  onChange={(e) => setData({ ...data, language: e.target.value as 'ar' | 'en' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ar">{t('arabic')}</option>
                  <option value="en">{t('english')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('companyName')}</label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('uploadLogo')}</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                >
                  <Upload size={16} />
                  <span className="text-sm">{t('uploadLogo')}</span>
                </label>
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-12 w-auto" />
                )}
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{t('items')}</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                >
                  <Plus size={16} />
                  <span className="text-sm">{t('addItem')}</span>
                </button>
              </div>

              <div className="space-y-3">
                {data.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-slate-50 rounded-lg">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('description')}</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('quantity')}</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('price')}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('total')}</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium">
                        {item.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('taxRate')}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={data.taxRate}
                onChange={(e) => setData({ ...data, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Totals Summary */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('ticket')}:</span>
                <span className="font-medium">{subtotal.toFixed(2)} {data.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('taxRate')} ({data.taxRate}%):</span>
                <span className="font-medium">{taxAmount.toFixed(2)} {data.currency}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                <span>{t('total')}:</span>
                <span>{total.toFixed(2)} {data.currency}</span>
              </div>
            </div>

            {/* Notes Section - Multiple notes with bullet points */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-slate-700">{t('notes')}</label>
                <button
                  type="button"
                  onClick={() => setData({ ...data, notes: [...data.notes, ''] })}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition text-sm"
                >
                  <Plus size={14} />
                  <span>{locale === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {data.notes.map((note, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex items-center justify-center w-6 h-10 bg-slate-100 rounded-lg text-slate-600">
                      •
                    </div>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => {
                        const updatedNotes = [...data.notes];
                        updatedNotes[index] = e.target.value;
                        setData({ ...data, notes: updatedNotes });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={locale === 'ar' ? 'أدخل ملاحظة...' : 'Enter a note...'}
                    />
                    {data.notes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedNotes = data.notes.filter((_, i) => i !== index);
                          setData({ ...data, notes: updatedNotes });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('signature')}</label>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setData({ ...data, signatureType: 'manual' })}
                  className={`px-4 py-2 rounded-lg transition ${data.signatureType === 'manual' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t('manualSignature')}
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, signatureType: 'image' })}
                  className={`px-4 py-2 rounded-lg transition ${data.signatureType === 'image' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t('uploadSignature')}
                </button>
              </div>

              {data.signatureType === 'manual' ? (
                <div>
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={100}
                    className="border border-gray-300 rounded-lg bg-white cursor-crosshair w-full max-w-[300px]"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm"
                  >
                    <X size={16} />
                    {t('clear')}
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                    id="signature-upload"
                  />
                  <label
                    htmlFor="signature-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                  >
                    <Upload size={16} />
                    <span className="text-sm">{t('uploadSignature')}</span>
                  </label>
                  {signaturePreview && (
                    <img src={signaturePreview} alt="Signature" className="mt-2 h-20 w-auto" />
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>{t('generating')}</span>
                ) : (
                  <>
                    <Save size={20} />
                    <span>{t('generate')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
