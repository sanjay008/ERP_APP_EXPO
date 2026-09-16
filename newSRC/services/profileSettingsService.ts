import ApiService from "../utils/Apiservice";
import apiConstants from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type LanguageOption = {
  code: string;
  label: string;
};

export type TimezoneOption = {
  id: string;
  label: string;
};

export type ProfileSettings = {
  user_language: string;
  timezone: string;
  otp_enabled: boolean;
  password_enabled: boolean;
  enable_2fa?: number | string;
  is_disable_password?: number | string;
  available_languages: LanguageOption[];
};

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "nl", label: "Dutch" },
  { code: "ar", label: "Arabic" },
];

export function isFlagOn(value: unknown): boolean {
  return value === 1 || value === "1" || value === true;
}

async function authFields(extra: Record<string, unknown> = {}) {
  const userData = await getData("USERDATA");
  return {
    customData: {
      token: userData?.data?.user?.verify_token ?? "",
      user_id: userData?.data?.user?.id ?? "",
      ...extra,
    },
  };
}

function normalizeLanguages(raw: unknown): LanguageOption[] {
  if (!Array.isArray(raw) || !raw.length) {
    return FALLBACK_LANGUAGES;
  }

  const mapped = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const code = String(row.code ?? row.language_shortname ?? "").trim();
      const label = String(row.label ?? row.language_name ?? code).trim();
      if (!code) return null;
      return { code, label };
    })
    .filter((item): item is LanguageOption => Boolean(item));

  return mapped.length ? mapped : FALLBACK_LANGUAGES;
}

function flattenTimezoneGroups(groups: unknown): TimezoneOption[] {
  if (!groups || typeof groups !== "object") return [];

  const list: TimezoneOption[] = [];
  Object.values(groups as Record<string, unknown>).forEach((entries) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((item) => {
      if (typeof item === "string") {
        list.push({ id: item, label: item });
        return;
      }
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      const id = String(row.value ?? row.timezone ?? row.id ?? "").trim();
      const label = String(row.label ?? id).trim();
      if (id) list.push({ id, label });
    });
  });
  return list;
}

function mapTimezoneItem(item: unknown): TimezoneOption | null {
  if (typeof item === "string") {
    return { id: item, label: item };
  }
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const id = String(row.value ?? row.timezone ?? row.id ?? row.name ?? "").trim();
  const label = String(row.label ?? row.name ?? id).trim();
  if (!id) return null;
  return { id, label };
}

function normalizeTimezones(raw: unknown): TimezoneOption[] {
  if (Array.isArray(raw)) {
    return raw
      .map(mapTimezoneItem)
      .filter((item): item is TimezoneOption => Boolean(item));
  }

  if (raw && typeof raw === "object") {
    const obj = raw as {
      groups?: unknown;
      timezones?: unknown;
      list?: unknown;
    };
    if (obj.groups) {
      return flattenTimezoneGroups(obj.groups);
    }
    const nested = obj.timezones ?? obj.list;
    if (Array.isArray(nested)) {
      return nested
        .map(mapTimezoneItem)
        .filter((item): item is TimezoneOption => Boolean(item));
    }
  }

  return [];
}

export async function fetchProfileSettings(): Promise<ProfileSettings> {
  const response = await ApiService<Record<string, unknown>>(
    apiConstants.get_profile_settings,
    await authFields()
  );

  const data = (response.data ?? {}) as Record<string, unknown>;

  return {
    user_language: String(data.user_language ?? "en"),
    timezone: String(data.timezone ?? ""),
    otp_enabled: isFlagOn(data.otp_enabled ?? data.enable_2fa),
    password_enabled:
      data.password_enabled != null
        ? isFlagOn(data.password_enabled)
        : !isFlagOn(data.is_disable_password),
    enable_2fa: data.enable_2fa as number | string | undefined,
    is_disable_password: data.is_disable_password as number | string | undefined,
    available_languages: normalizeLanguages(data.available_languages),
  };
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return ApiService(
    apiConstants.change_password,
    await authFields({
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
      confirm_new_password: payload.confirmPassword,
    })
  );
}

export async function updateUserLanguage(defaultLanguage: string) {
  return ApiService(
    apiConstants.update_user_language,
    await authFields({ default_language: defaultLanguage })
  );
}

export async function fetchTimezones(): Promise<{
  options: TimezoneOption[];
  currentTimezone: string;
}> {
  const response = await ApiService<{
    current_timezone?: string;
    groups?: unknown;
  }>(apiConstants.get_timezones, await authFields());

  const data = response.data;
  const currentTimezone =
    data && typeof data === "object" && !Array.isArray(data)
      ? String((data as { current_timezone?: string }).current_timezone ?? "")
      : "";

  return {
    options: normalizeTimezones(data),
    currentTimezone,
  };
}

export async function updateUserTimezone(timezone: string) {
  return ApiService(
    apiConstants.update_user_timezone,
    await authFields({ timezone })
  );
}

export async function updatePasswordSettings(payload: {
  otpEnabled: boolean;
  passwordEnabled: boolean;
}) {
  return ApiService(
    apiConstants.update_password_settings,
    await authFields({
      otp_enabled: payload.otpEnabled ? 1 : 0,
      password_enabled: payload.passwordEnabled ? 1 : 0,
    })
  );
}
