import { slugifyKurum } from "./normalizeTurkish";

export function kurumKoduOner(district: string, institutionName: string): string {
  return slugifyKurum(district, institutionName);
}
