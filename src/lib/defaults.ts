import type { PremiumTotals, QuoteFormData } from "./types";
import { createDefaultBenefits } from "./benefits";
import {
  formatDateTime,
  formatCurrency,
  formatVehicleValue,
  generateQuotationNo,
} from "./format";

export function calculatePremiums(
  basicPremium: number,
  additionalCovers: number
): PremiumTotals {
  const subtotal = basicPremium + additionalCovers;
  const vat = Math.round(subtotal * 0.05 * 100) / 100;
  const totalWithVat = Math.round((subtotal + vat) * 100) / 100;
  return { subtotal, vat, totalWithVat };
}

export function createDefaultQuoteData(): QuoteFormData {
  const now = formatDateTime();
  return {
    quotationNo: generateQuotationNo(),
    quoteIssueDate: now,
    insuranceProduct: "MOTOR COMPREHENSIVE INSURANCE",
    insurancePeriod: "13 Months",
    broker: "DNI DIRECT SALES (CC)",
    basicPremium: 0,
    additionalCovers: 0,
    insuredName: "",
    mobileNo: "",
    dateOfBirth: "",
    emailId: "",
    ncdYears: "3+",
    tcfNo: "",
    nationality: "",
    insuredType: "INDIVIDUAL",
    regLocPlate: "",
    manufacturingYear: new Date().getFullYear().toString(),
    make: "",
    trimBodyType: "",
    cylinders: "6",
    chassisNo: "",
    seatingCapacity: "7 + 1",
    gccSpecification: "Yes",
    vehicleValue: 0,
    repairType: "Agency",
    ...createDefaultBenefits(),
    hireCarCovered: "Yes",
    hireCarPremium: 0,
    agencyRepairCovered: "Yes",
    basicDeductible: "AED 500/-",
    printedDate: now,
  };
}

export function summarizeForReview(data: QuoteFormData) {
  const premiums = calculatePremiums(data.basicPremium, data.additionalCovers);
  return {
    ...data,
    premiums,
    basicPremiumFormatted: formatCurrency(data.basicPremium),
    additionalCoversFormatted: formatCurrency(data.additionalCovers),
    subtotalFormatted: formatCurrency(premiums.subtotal),
    vatFormatted: formatCurrency(premiums.vat),
    totalWithVatFormatted: formatCurrency(premiums.totalWithVat),
    vehicleValueFormatted: formatVehicleValue(data.vehicleValue),
    hireCarPremiumFormatted: formatCurrency(data.hireCarPremium),
  };
}
