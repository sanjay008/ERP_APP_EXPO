import { worldCountriesData } from "./worldCountriesData";

export type MergedCountry = {
  apiId?: number;
  name: string;
  countrycode: string;
  cca2: string;
  flag: string;
  favorite: number;
  phoneLength?: number;
};

const FAVORITE_CODES = new Set(["NL", "IN", "SR"]);

const CALLING_CODE_TO_CCA2: Record<string, string> = {
  "31": "NL",
  "91": "IN",
  "597": "SR",
  "1": "US",
  "44": "GB",
  "49": "DE",
  "33": "FR",
  "32": "BE",
};

export const flagFromCca2 = (cca2?: string): string => {
  if (!cca2 || cca2.length !== 2) return "🏳️";
  const points = cca2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
};

export const normalizeCallingCode = (code?: string): string =>
  String(code ?? "").replace(/[^\d]/g, "");

export const findCountryByCode = (
  list: MergedCountry[],
  countryCode?: string
): MergedCountry | undefined => {
  const normalized = normalizeCallingCode(countryCode);
  return list.find((item) => item.countrycode === normalized);
};

export const filterCountriesWithCallingCode = (
  list: MergedCountry[]
): MergedCountry[] => list.filter((item) => item.countrycode);

export const filterCountriesByQuery = (
  list: MergedCountry[],
  query: string
): MergedCountry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.countrycode.includes(q) ||
      item.cca2.toLowerCase().includes(q) ||
      `+${item.countrycode}`.includes(q)
  );
};

export const getPhoneLengthRules = (countryCode?: string) => {
  const code = normalizeCallingCode(countryCode);

  switch (code) {
    case "31":
      return { min: 9, max: 10 };
    case "91":
      return { min: 10, max: 10 };
    case "597":
      return { min: 7, max: 7 };
    default:
      return { min: 6, max: 15 };
  }
};

export const isPhoneLengthValid = (countryCode: string | undefined, phone: string) => {
  const digits = phone.replace(/\D/g, "");
  const { min, max } = getPhoneLengthRules(countryCode);
  return digits.length >= min && digits.length <= max;
};

export const normalizePhoneForCountry = (countryCode: string, phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  const { max } = getPhoneLengthRules(countryCode);
  return digits.slice(0, max);
};

export const mergeApiCountries = (
  apiCountries: Array<{
    id?: number;
    country_name?: string;
    country_code?: string;
    flag_code?: string;
  }> = []
): MergedCountry[] => {
  const byCca2 = new Map<string, MergedCountry>();

  // Full dialer list (same source as legacy CountryPicker).
  for (const item of worldCountriesData) {
    const countrycode = normalizeCallingCode(item.countrycode);
    if (!countrycode || !item.cca2) continue;
    const cca2 = item.cca2.toUpperCase();
    byCca2.set(cca2, {
      name: item.countryname,
      countrycode,
      cca2,
      flag: item.flag || flagFromCca2(cca2),
      favorite: FAVORITE_CODES.has(cca2) ? 1 : 0,
      phoneLength: item.phoneLength,
    });
  }

  // Overlay API countries (ids / localized names / extra entries).
  for (const item of apiCountries) {
    const countrycode = normalizeCallingCode(item.country_code);
    if (!countrycode) continue;

    const cca2 = (
      item.flag_code?.toUpperCase() ||
      CALLING_CODE_TO_CCA2[countrycode] ||
      ""
    ).toUpperCase();
    if (!cca2) continue;

    const existing = byCca2.get(cca2);
    byCca2.set(cca2, {
      apiId: item.id,
      name: item.country_name || existing?.name || cca2,
      countrycode,
      cca2,
      flag: existing?.flag || flagFromCca2(cca2),
      favorite: FAVORITE_CODES.has(cca2) ? 1 : existing?.favorite ?? 0,
      phoneLength: existing?.phoneLength,
    });
  }

  return Array.from(byCca2.values()).sort((a, b) => {
    if (b.favorite !== a.favorite) return b.favorite - a.favorite;
    return a.name.localeCompare(b.name);
  });
};
