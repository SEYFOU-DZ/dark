"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FileDown, X } from "lucide-react";
import {
  createDefaultInvoiceData,
  formatFeeAmount,
  summarizeInvoice,
} from "@/lib/invoice/defaults";
import { apiJson } from "@/lib/api";
import { INVOICE_FORM_STEPS } from "@/lib/invoice/form-steps";
import { validateInvoiceStepFields } from "@/lib/invoice/field-config";
import type { InvoiceFormData } from "@/lib/invoice/types";
import { useLocale } from "@/contexts/LocaleContext";
import { InvoiceFormFieldInput } from "./InvoiceFormFieldInput";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

interface InvoiceWizardProps {
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

const STEP_KEYS = ["customer", "fees"] as const;

export function InvoiceWizard({ onClose, onSuccess }: InvoiceWizardProps) {
  const { tr, dir } = useLocale();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<InvoiceFormData>(createDefaultInvoiceData);
  const [errors, setErrors] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const ALL_STEPS = [
    ...STEP_KEYS.map((k) => tr(`invoiceSteps.${k}.title`)),
    tr("review"),
  ];

  const totalSteps = INVOICE_FORM_STEPS.length + 1;
  const isReview = step === INVOICE_FORM_STEPS.length;
  const currentStep = INVOICE_FORM_STEPS[step];
  const stepKey = STEP_KEYS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const review = useMemo(() => summarizeInvoice(data), [data]);

  function updateField(name: keyof InvoiceFormData, value: string | number) {
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  }

  function goNext() {
    if (!currentStep) return;
    const stepErrors = validateInvoiceStepFields(currentStep.fields, data);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors([]);
    setStep((s) => Math.max(0, s - 1));
  }

  async function downloadPdf() {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch("/api/generate-invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Could not generate PDF. Please try again.");
      }

      const pdfUrl = response.headers.get("x-pdf-url") || undefined;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      await apiJson("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoiceNo: data.invoiceNo,
          invoiceDate: data.invoiceDate,
          customerName: data.customerName,
          vehicleType: data.vehicleType,
          vehicleCategory: data.vehicleCategory,
          trafficCode: data.trafficCode,
          feeDescription: data.feeDescription,
          feeAmount: data.feeAmount,
          feeNotes: data.feeNotes,
          subtotal: data.feeAmount,
          total: data.feeAmount,
          items: [
            {
              description: data.feeDescription,
              quantity: 1,
              price: data.feeAmount,
              total: data.feeAmount,
            },
          ],
          pdfUrl,
        }),
      });

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4 backdrop-blur-[1px]"
    >
      <div className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:max-h-[92vh]">
        <header className="border-b border-slate-100 bg-white px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {tr("newInvoice")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {tr("stepOf", {
                  current: String(Math.min(step + 1, totalSteps)),
                  total: String(totalSteps),
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100/80 p-3">
            <Progress value={progress} />
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {ALL_STEPS.map((title, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <div
                    key={index}
                    className={`rounded-md px-2 py-1.5 text-center text-[11px] font-medium leading-tight sm:text-xs transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : done
                          ? "bg-slate-200 text-slate-700"
                          : "bg-white text-slate-400 border border-slate-200/50"
                    }`}
                  >
                    {index + 1}. {title}
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {!isReview && currentStep && stepKey && (
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {tr(`invoiceSteps.${stepKey}.title`)}
              </h3>
              <p className="mb-4 text-sm text-slate-500">
                {tr(`invoiceSteps.${stepKey}.desc`)}
              </p>

              {step === 1 && (
                <Card className="mb-5 border-slate-200 bg-slate-50/50 shadow-none">
                  <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                    <Stat
                      label={tr("invoiceFields.feeAmount")}
                      value={`${formatFeeAmount(data.feeAmount)} AED`}
                    />
                    <Stat
                      label={tr("invoiceTotalDue")}
                      value={review.totalFormatted}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {currentStep.fields.map((fieldName) => (
                  <InvoiceFormFieldInput
                    key={fieldName}
                    name={fieldName}
                    value={data[fieldName]}
                    onChange={updateField}
                  />
                ))}
              </div>
            </div>
          )}

          {isReview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {tr("reviewTitle")}
                </h3>
                <p className="text-sm text-slate-500">{tr("invoiceReviewDesc")}</p>
              </div>

              <ReviewSection title={tr("invoiceSections.header")}>
                <ReviewItem label={tr("invoiceFields.invoiceNo")} value={review.invoiceNo} />
                <ReviewItem label={tr("invoiceFields.invoiceDate")} value={review.invoiceDate} />
              </ReviewSection>

              <ReviewSection title={tr("invoiceSections.customer")}>
                <ReviewItem label={tr("invoiceFields.customerName")} value={review.customerName} />
                <ReviewItem label={tr("invoiceFields.vehicleType")} value={review.vehicleType} />
                <ReviewItem label={tr("invoiceFields.vehicleCategory")} value={review.vehicleCategory} />
                <ReviewItem label={tr("invoiceFields.trafficCode")} value={review.trafficCode} />
              </ReviewSection>

              <ReviewSection title={tr("invoiceSections.fees")}>
                <ReviewItem label={tr("invoiceFields.feeDescription")} value={review.feeDescription} />
                <ReviewItem label={tr("invoiceFields.feeAmount")} value={`${review.feeAmountFormatted} AED`} />
                <ReviewItem label={tr("invoiceTotalDue")} value={review.totalFormatted} />
              </ReviewSection>

              {downloadError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {downloadError}
                </p>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <ul className="list-disc ps-4">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="secondary" onClick={step === 0 ? onClose : goBack}>
            {step === 0 ? tr("cancel") : tr("back")}
          </Button>

          {!isReview ? (
            <Button onClick={goNext}>{tr("next")}</Button>
          ) : (
            <Button onClick={downloadPdf} disabled={downloading}>
              <FileDown className="h-4 w-4" />
              {downloading ? tr("generating") : tr("downloadInvoice")}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-slate-200/80 shadow-none">
      <CardContent className="p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
          {title}
        </h4>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-slate-800 mt-0.5" dir="auto">
        {value || "—"}
      </dd>
    </div>
  );
}
