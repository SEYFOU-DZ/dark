import type { QuoteFormData, YesNo } from "./types";

export type BenefitFieldName =
  | "lossOrDamage"
  | "fireTheft"
  | "thirdPartyBodily"
  | "thirdPartyProperty"
  | "pabDriver"
  | "pabPassengers"
  | "pabFamily"
  | "geographicalArea"
  | "stormFlood"
  | "offRoad"
  | "ambulance"
  | "emergencyMedical"
  | "windscreen"
  | "personalEffects"
  | "roadsideAssistance";

export interface BenefitField {
  name: BenefitFieldName;
  pdfKey: string;
}

export const BENEFIT_FIELDS = [
  { name: "lossOrDamage", pdfKey: "lossOrDamage" },
  { name: "fireTheft", pdfKey: "fireTheft" },
  { name: "thirdPartyBodily", pdfKey: "thirdPartyBodily" },
  { name: "thirdPartyProperty", pdfKey: "thirdPartyProperty" },
  { name: "pabDriver", pdfKey: "pabDriver" },
  { name: "pabPassengers", pdfKey: "pabPassengers" },
  { name: "pabFamily", pdfKey: "pabFamily" },
  { name: "geographicalArea", pdfKey: "geographicalArea" },
  { name: "stormFlood", pdfKey: "stormFlood" },
  { name: "offRoad", pdfKey: "offRoad" },
  { name: "ambulance", pdfKey: "ambulance" },
  { name: "emergencyMedical", pdfKey: "emergencyMedical" },
  { name: "windscreen", pdfKey: "windscreen" },
  { name: "personalEffects", pdfKey: "personalEffects" },
  { name: "roadsideAssistance", pdfKey: "roadsideAssistance" },
] as const satisfies readonly BenefitField[];

export const YES_NO_DEFAULT: YesNo = "Yes";

export function createDefaultBenefits(): Pick<QuoteFormData, BenefitFieldName> {
  return BENEFIT_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.name]: YES_NO_DEFAULT }),
    {} as Pick<QuoteFormData, BenefitFieldName>
  );
}
