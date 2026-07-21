import { FIELD_LABELS } from "./labels";
import type { QuoteFormData } from "./types";

export type FieldKind =
  | "quotationNo"
  | "datetime"
  | "text"
  | "money"
  | "name"
  | "mobile"
  | "date"
  | "email"
  | "ncd"
  | "digits"
  | "nationality"
  | "plate"
  | "year"
  | "vehicleText"
  | "cylinders"
  | "chassis"
  | "seating"
  | "deductible"
  | "yesNo";

export interface FieldRule {
  kind: FieldKind;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  fullWidth?: boolean;
}

export const FIELD_RULES: Record<keyof QuoteFormData, FieldRule> = {
  quotationNo: { kind: "quotationNo", maxLength: 20, required: true },
  quoteIssueDate: { kind: "datetime", maxLength: 19, required: true },
  insuranceProduct: { kind: "text", maxLength: 80, required: true },
  insurancePeriod: { kind: "text", maxLength: 30, required: true },
  broker: { kind: "text", maxLength: 60, required: true },
  basicPremium: { kind: "money", min: 0, max: 9999999.99, required: true },
  additionalCovers: { kind: "money", min: 0, max: 9999999.99 },
  taxRate: { kind: "money", min: 0, max: 100, required: true },
  insuredName: { kind: "name", maxLength: 80, required: true, fullWidth: true },
  mobileNo: { kind: "mobile", maxLength: 15, required: true },
  dateOfBirth: { kind: "date", maxLength: 10, required: true },
  emailId: { kind: "email", maxLength: 80, required: true },
  ncdYears: { kind: "ncd", maxLength: 5, required: true },
  tcfNo: { kind: "digits", maxLength: 15, required: true },
  nationality: { kind: "nationality", maxLength: 40, required: true },
  insuredType: { kind: "text", required: true },
  regLocPlate: { kind: "plate", maxLength: 30, required: true },
  manufacturingYear: { kind: "year", required: true },
  make: { kind: "vehicleText", maxLength: 40, required: true },
  trimBodyType: { kind: "vehicleText", maxLength: 50, required: true },
  cylinders: { kind: "cylinders", maxLength: 2, required: true },
  chassisNo: { kind: "chassis", maxLength: 17, required: true, fullWidth: true },
  seatingCapacity: { kind: "seating", maxLength: 10, required: true },
  gccSpecification: { kind: "yesNo", required: true },
  vehicleValue: { kind: "money", min: 1, max: 99999999, required: true },
  repairType: { kind: "text", required: true },
  hireCarCovered: { kind: "yesNo", required: true },
  hireCarPremium: { kind: "money", min: 0, max: 999999.99 },
  agencyRepairCovered: { kind: "yesNo", required: true },
  basicDeductible: { kind: "deductible", maxLength: 20, required: true },
  printedDate: { kind: "datetime", maxLength: 19 },
  lossOrDamage: { kind: "yesNo", required: true },
  fireTheft: { kind: "yesNo", required: true },
  thirdPartyBodily: { kind: "yesNo", required: true },
  thirdPartyProperty: { kind: "yesNo", required: true },
  pabDriver: { kind: "yesNo", required: true },
  pabPassengers: { kind: "yesNo", required: true },
  pabFamily: { kind: "yesNo", required: true },
  geographicalArea: { kind: "yesNo", required: true },
  stormFlood: { kind: "yesNo", required: true },
  offRoad: { kind: "yesNo", required: true },
  ambulance: { kind: "yesNo", required: true },
  emergencyMedical: { kind: "yesNo", required: true },
  windscreen: { kind: "yesNo", required: true },
  personalEffects: { kind: "yesNo", required: true },
  roadsideAssistance: { kind: "yesNo", required: true },
};

const QUOTATION_PATTERN = /^MT-\d{4}-\d{7}$/;
const DATE_PATTERN = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const DATETIME_PATTERN =
  /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4} ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[\d\s\-]{7,15}$/;
const NCD_PATTERN = /^(\d{1,2}\+?|\d+)$/;

function label(name: keyof QuoteFormData) {
  return FIELD_LABELS[name] ?? name;
}

export function sanitizeFieldValue(
  name: keyof QuoteFormData,
  raw: string
): string | number {
  const rule = FIELD_RULES[name];
  if (!rule) return raw;

  if (rule.kind === "money") {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}` : cleaned;
    const num = normalized === "" || normalized === "." ? 0 : Number(normalized);
    if (rule.max !== undefined) return Math.min(num, rule.max);
    return num;
  }

  if (rule.kind === "digits" || rule.kind === "cylinders" || rule.kind === "year") {
    let digits = raw.replace(/\D/g, "");
    if (rule.maxLength) digits = digits.slice(0, rule.maxLength);
    return digits;
  }

  if (rule.kind === "mobile") {
    return raw.replace(/[^\d+\-\s]/g, "").slice(0, rule.maxLength ?? 15);
  }

  if (rule.kind === "chassis") {
    return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 17);
  }

  if (rule.kind === "date") {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  if (rule.kind === "datetime") {
    return raw.slice(0, rule.maxLength ?? 19);
  }

  if (rule.kind === "name" || rule.kind === "nationality") {
    return raw.slice(0, rule.maxLength ?? 80);
  }

  if (rule.kind === "quotationNo") {
    return raw.toUpperCase().slice(0, rule.maxLength ?? 20);
  }

  return raw.slice(0, rule.maxLength ?? 200);
}

export function validateField(
  name: keyof QuoteFormData,
  data: QuoteFormData
): string | null {
  const rule = FIELD_RULES[name];
  if (!rule) return null;

  const fieldLabel = label(name);
  const value = data[name];

  if (rule.required) {
    if (typeof value === "number") {
      if (name === "vehicleValue" && value <= 0) {
        return `${fieldLabel} is required.`;
      }
      if (name === "basicPremium" && value < 0) {
        return `${fieldLabel} must be zero or greater.`;
      }
    } else if (!String(value).trim()) {
      return `${fieldLabel} is required.`;
    }
  }

  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldLabel} must be at least ${rule.min}.`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `${fieldLabel} must not exceed ${rule.max}.`;
    }
    return null;
  }

  const str = String(value).trim();
  if (!str && !rule.required) return null;

  if (rule.maxLength && str.length > rule.maxLength) {
    return `${fieldLabel} must not exceed ${rule.maxLength} characters.`;
  }

  switch (rule.kind) {
    case "quotationNo":
      if (!QUOTATION_PATTERN.test(str)) {
        return `${fieldLabel} format is invalid (MT-YYYY-XXXXXXX).`;
      }
      break;
    case "datetime":
      if (!DATETIME_PATTERN.test(str)) {
        return `${fieldLabel} format is invalid.`;
      }
      break;
    case "date":
      if (!DATE_PATTERN.test(str)) {
        return `Date must be DD/MM/YYYY.`;
      }
      break;
    case "email":
      if (!EMAIL_PATTERN.test(str)) {
        return `Please enter a valid email address.`;
      }
      break;
    case "mobile":
      if (!MOBILE_PATTERN.test(str)) {
        return `Please enter a valid phone number (7–15 digits).`;
      }
      break;
    case "ncd":
      if (!NCD_PATTERN.test(str)) {
        return `${fieldLabel} format is invalid.`;
      }
      break;
    case "digits":
      if (!/^\d+$/.test(str)) {
        return `${fieldLabel} must contain digits only.`;
      }
      break;
    case "year": {
      const y = Number(str);
      if (!/^\d{4}$/.test(str) || y < 1990 || y > 2035) {
        return `Enter a valid 4-digit year.`;
      }
      break;
    }
    case "cylinders": {
      const c = Number(str);
      if (!/^\d{1,2}$/.test(str) || c < 1 || c > 16) {
        return `${fieldLabel} must be between 1 and 16.`;
      }
      break;
    }
    case "chassis":
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(str)) {
        return `Chassis number must be 17 alphanumeric characters.`;
      }
      break;
    default:
      break;
  }

  return null;
}

export function validateStepFields(
  fieldNames: (keyof QuoteFormData)[],
  data: QuoteFormData
): string[] {
  const errors: string[] = [];
  for (const name of fieldNames) {
    const err = validateField(name, data);
    if (err) errors.push(err);
  }
  return errors;
}
