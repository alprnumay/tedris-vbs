import { removeDistrictPrefixFromInstitutionName, slugifyKurum } from "./normalizeTurkish";

export function kurumKoduOner(district: string, institutionName: string): string {
  return slugifyKurum(district, removeDistrictPrefixFromInstitutionName(district, institutionName));
}
