import type { QuoteFormData } from "./types";
import { BENEFIT_FIELDS } from "./benefits";

export const FORM_STEPS: {
  id: string;
  fields: (keyof QuoteFormData)[];
}[] = [
  {
    id: "quotation",
    fields: [
      "quotationNo",
      "quoteIssueDate",
      "insuranceProduct",
      "insurancePeriod",
      "broker",
      "basicPremium",
      "additionalCovers",
    ],
  },
  {
    id: "insured",
    fields: [
      "insuredName",
      "mobileNo",
      "dateOfBirth",
      "emailId",
      "ncdYears",
      "tcfNo",
      "nationality",
      "insuredType",
      "regLocPlate",
    ],
  },
  {
    id: "vehicle",
    fields: [
      "manufacturingYear",
      "make",
      "trimBodyType",
      "cylinders",
      "chassisNo",
      "seatingCapacity",
      "gccSpecification",
      "vehicleValue",
      "repairType",
    ],
  },
  {
    id: "benefits",
    fields: BENEFIT_FIELDS.map((b) => b.name),
  },
  {
    id: "covers",
    fields: [
      "hireCarCovered",
      "hireCarPremium",
      "agencyRepairCovered",
      "basicDeductible",
    ],
  },
];

export const AUTO_FIELDS = new Set<keyof QuoteFormData>([
  "quotationNo",
  "quoteIssueDate",
  "insuranceProduct",
  "broker",
  "basicDeductible",
]);

export const SELECT_FIELDS: Partial<
  Record<keyof QuoteFormData, { value: string; label: string }[]>
> = {
  insuredType: [
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "COMPANY", label: "Company" },
  ],
  gccSpecification: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ],
  repairType: [
    { value: "Agency", label: "Agency" },
    { value: "Non-Agency", label: "Non-Agency" },
  ],
  hireCarCovered: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ],
  agencyRepairCovered: [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ],
};

export const YES_NO_FIELDS = new Set<keyof QuoteFormData>([
  "gccSpecification",
  "hireCarCovered",
  "agencyRepairCovered",
  ...BENEFIT_FIELDS.map((b) => b.name),
]);
