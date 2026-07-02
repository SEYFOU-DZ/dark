"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FileDown, X } from "lucide-react";
import {
  createDefaultQuoteData,
  calculatePremiums,
  summarizeForReview,
} from "@/lib/defaults";
import { FORM_STEPS } from "@/lib/form-steps";
import { validateStepFields } from "@/lib/field-config";
import { FIELD_LABELS, STEP_META } from "@/lib/labels";
import { formatCurrency } from "@/lib/format";
import type { QuoteFormData } from "@/lib/types";
import { FormFieldInput } from "./FormFieldInput";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

interface QuoteWizardProps {
  onClose: () => void;
}

const ALL_STEPS = [...STEP_META.map((s) => s.title), "Review"];

export function QuoteWizard({ onClose }: QuoteWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuoteFormData>(createDefaultQuoteData);
  const [errors, setErrors] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const totalSteps = FORM_STEPS.length + 1;
  const isReview = step === FORM_STEPS.length;
  const currentStep = FORM_STEPS[step];
  const stepMeta = STEP_META[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const premiums = useMemo(
    () => calculatePremiums(data.basicPremium, data.additionalCovers),
    [data.basicPremium, data.additionalCovers]
  );

  const review = useMemo(() => summarizeForReview(data), [data]);

  function updateField(name: keyof QuoteFormData, value: string | number) {
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  }

  function goNext() {
    if (!currentStep) return;
    const stepErrors = validateStepFields(currentStep.fields, data);
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
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          printedDate: data.printedDate || data.quoteIssueDate,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Could not generate PDF. Please try again.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.quotationNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:max-h-[92vh]">
        <header className="border-b border-slate-100 bg-white px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Motor Quote</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Step {Math.min(step + 1, totalSteps)} of {totalSteps}
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
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
              {ALL_STEPS.map((title, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <div
                    key={title}
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
          {!isReview && currentStep && stepMeta && (
            <div>
              <h3 className="text-base font-semibold text-slate-900">{stepMeta.title}</h3>
              <p className="mb-4 text-sm text-slate-500">{stepMeta.desc}</p>

              {step === 0 && (
                <Card className="mb-5 border-slate-200 bg-slate-50/50 shadow-none">
                  <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                    <Stat label="Total" value={`${formatCurrency(premiums.subtotal)} AED`} />
                    <Stat label="VAT (5%)" value={`${formatCurrency(premiums.vat)} AED`} />
                    <Stat label="Total + VAT" value={`${formatCurrency(premiums.totalWithVat)} AED`} />
                  </CardContent>
                </Card>
              )}

              <div
                className={`grid gap-4 ${
                  currentStep.id === "benefits" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                {currentStep.fields.map((fieldName) => (
                  <FormFieldInput
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
                <h3 className="text-base font-semibold text-slate-900">Review & Download</h3>
                <p className="text-sm text-slate-500">
                  Verify your details, then download in English or Arabic.
                </p>
              </div>

              <ReviewSection title="Quotation & Premium">
                <ReviewItem label={FIELD_LABELS.quotationNo} value={review.quotationNo} />
                <ReviewItem label={FIELD_LABELS.insuredName} value={review.insuredName} />
                <ReviewItem label={FIELD_LABELS.make} value={review.make} />
                <ReviewItem label="Total + VAT" value={`${review.totalWithVatFormatted} AED`} />
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
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {!isReview ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button onClick={downloadPdf} disabled={downloading}>
              <FileDown className="h-4 w-4" />
              {downloading ? "Generating..." : "Download PDF"}
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
        <h4 className="mb-3 text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">{title}</h4>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-slate-800 mt-0.5">{value || "—"}</dd>
    </div>
  );
}
