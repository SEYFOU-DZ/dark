export type YesNo = "Yes" | "No";

export interface QuoteFormData {
  quotationNo: string;
  quoteIssueDate: string;
  insuranceProduct: string;
  insurancePeriod: string;
  broker: string;
  basicPremium: number;
  additionalCovers: number;
  insuredName: string;
  mobileNo: string;
  dateOfBirth: string;
  emailId: string;
  ncdYears: string;
  tcfNo: string;
  nationality: string;
  insuredType: string;
  regLocPlate: string;
  manufacturingYear: string;
  make: string;
  trimBodyType: string;
  cylinders: string;
  chassisNo: string;
  seatingCapacity: string;
  gccSpecification: YesNo;
  vehicleValue: number;
  repairType: string;
  lossOrDamage: YesNo;
  fireTheft: YesNo;
  thirdPartyBodily: YesNo;
  thirdPartyProperty: YesNo;
  pabDriver: YesNo;
  pabPassengers: YesNo;
  pabFamily: YesNo;
  geographicalArea: YesNo;
  stormFlood: YesNo;
  offRoad: YesNo;
  ambulance: YesNo;
  emergencyMedical: YesNo;
  windscreen: YesNo;
  personalEffects: YesNo;
  roadsideAssistance: YesNo;
  hireCarCovered: YesNo;
  hireCarPremium: number;
  agencyRepairCovered: YesNo;
  basicDeductible: string;
  printedDate: string;
  taxRate: number;
}

export interface PremiumTotals {
  subtotal: number;
  vat: number;
  totalWithVat: number;
}

