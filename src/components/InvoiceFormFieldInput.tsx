"use client";

import {
  INVOICE_FIELD_RULES,
  sanitizeInvoiceField,
} from "@/lib/invoice/field-config";
import { INVOICE_AUTO_FIELDS } from "@/lib/invoice/form-steps";
import type { InvoiceFormData } from "@/lib/invoice/types";
import { useLocale } from "@/contexts/LocaleContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps {
  name: keyof InvoiceFormData;
  value: string | number;
  onChange: (name: keyof InvoiceFormData, value: string | number) => void;
}

export function InvoiceFormFieldInput({ name, value, onChange }: FieldProps) {
  const { tr } = useLocale();
  const rule = INVOICE_FIELD_RULES[name];
  const labelKey = `invoiceFields.${name}`;
  const label = tr(labelKey) !== labelKey ? tr(labelKey) : name;
  const isAuto = INVOICE_AUTO_FIELDS.has(name);
  const fullWidth = rule?.fullWidth;

  const labelElement = (
    <Label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-700">
      {label}
      {rule?.required && <span className="text-rose-500"> *</span>}
    </Label>
  );

  if (rule?.kind === "money") {
    return (
      <div className={fullWidth ? "sm:col-span-2" : undefined}>
        {labelElement}
        <Input
          id={name}
          inputMode="decimal"
          value={value === 0 ? "" : String(value)}
          placeholder="0.00"
          onChange={(e) => onChange(name, sanitizeInvoiceField(name, e.target.value))}
          dir="ltr"
        />
      </div>
    );
  }

  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      {labelElement}
      <Input
        id={name}
        type="text"
        inputMode={rule?.kind === "digits" ? "tel" : "text"}
        value={String(value)}
        maxLength={rule?.maxLength}
        onChange={(e) => onChange(name, sanitizeInvoiceField(name, e.target.value))}
        dir="auto"
      />
      {isAuto && (
        <p className="mt-1.5 text-xs text-slate-400">{tr("autoFilled")}</p>
      )}
    </div>
  );
}
