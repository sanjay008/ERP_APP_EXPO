export const isValidEmail = (value: string): boolean => {
  const email = value.trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
};

export const normalizeCountryCode = (code: string): string => {
  if (!code) return "";
  return code.replace(/[^\d+]/g, "").replace(/^\+?/, "");
};

export const isPhoneValid = (countryCode: string, phone: string): boolean => {
  const digits = phone.replace(/[^0-9]/g, "");
  const code = normalizeCountryCode(countryCode);

  switch (code) {
    case "31":
      return digits.length >= 9 && digits.length <= 10;
    case "91":
      return digits.length === 10;
    case "597":
      return digits.length === 7;
    default:
      return digits.length >= 6;
  }
};

export const formatPhoneDisplay = (countryCode: string, phone: string): string => {
  const code = normalizeCountryCode(countryCode);
  const prefix = code ? `+${code}` : "";
  return `${prefix} ${phone}`.trim();
};

import { getApiErrorMessage as resolveApiErrorMessage } from "./apiError";

export const getApiErrorMessage = (error: unknown, fallback: string): string =>
  resolveApiErrorMessage(error, fallback);
