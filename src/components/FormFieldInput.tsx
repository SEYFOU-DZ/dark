"use client";

import { FIELD_RULES, sanitizeFieldValue } from "@/lib/field-config";
import { AUTO_FIELDS, SELECT_FIELDS, YES_NO_FIELDS } from "@/lib/form-steps";
import { FIELD_LABELS } from "@/lib/labels";
import type { QuoteFormData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps {
  name: keyof QuoteFormData;
  value: string | number;
  onChange: (name: keyof QuoteFormData, value: string | number) => void;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:border-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/5";

export function FormFieldInput({ name, value, onChange }: FieldProps) {
  const rule = FIELD_RULES[name];
  const label = FIELD_LABELS[name] ?? name;
  const isAuto = AUTO_FIELDS.has(name);
  const selectOptions = SELECT_FIELDS[name];
  const isYesNo = YES_NO_FIELDS.has(name);
  const fullWidth = rule?.fullWidth;

  const labelElement = (
    <Label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-700">
      {label}
      {rule?.required && <span className="text-rose-500"> *</span>}
    </Label>
  );

  if (isYesNo || selectOptions) {
    const options =
      selectOptions ?? [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
      ];

    return (
      <div className={fullWidth ? "sm:col-span-2" : undefined}>
        {labelElement}
        <select
          id={name}
          value={String(value)}
          onChange={(e) => onChange(name, e.target.value)}
          className={selectClass}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (rule?.kind === "money") {
    return (
      <div className={fullWidth ? "sm:col-span-2" : undefined}>
        {labelElement}
        <Input
          id={name}
          inputMode="decimal"
          value={
            value === 0 && name !== "basicPremium" && name !== "vehicleValue"
              ? ""
              : String(value)
          }
          placeholder="0.00"
          onChange={(e) => onChange(name, sanitizeFieldValue(name, e.target.value))}
        />
      </div>
    );
  }

  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      {labelElement}
      <Input
        id={name}
        type={rule?.kind === "email" ? "email" : "text"}
        inputMode={
          rule?.kind === "mobile" || rule?.kind === "digits" || rule?.kind === "year"
            ? "tel"
            : rule?.kind === "email"
              ? "email"
              : "text"
        }
        value={String(value)}
        maxLength={rule?.maxLength}
        onChange={(e) => onChange(name, sanitizeFieldValue(name, e.target.value))}
        placeholder={
          rule?.kind === "date"
            ? "DD/MM/YYYY"
            : rule?.kind === "mobile"
              ? "Phone number"
              : rule?.kind === "chassis"
                ? "17 characters"
                : undefined
        }
      />
      {isAuto && (
        <p className="mt-1.5 text-xs text-slate-400">
          Filled automatically. You can edit it.
        </p>
      )}
    </div>
  );
}

