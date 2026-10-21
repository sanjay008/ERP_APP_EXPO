import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";

/** category_id is the form type: 1 company, 2 person, 3 object, 4 vehicle. */
export type QuickRelationCategoryId = 1 | 2 | 3 | 4 | number;

export type QuickRelationItem = {
  id?: number | string;
  title?: string;
  color?: string;
  hover_text?: string;
  icon?: string;
  popup_text?: string;
  category_id?: QuickRelationCategoryId;
  category_name?: string;
  relation_type_id?: number | string;
  relation_type_name?: string;
  relation_type_slug?: string;
  default_country_code?: string;
  is_employee_client?: boolean | number | string;
  is_customer_client?: boolean | number | string;
  is_employee_of_company?: boolean | number | string;
  is_create_user?: boolean | number | string;
};

export type QuickRelationField = {
  name: string;
  label?: string;
  type?: string;
  required?: boolean | number | string;
  options_key?: string;
  value?: string | number | boolean | null;
};

export type QuickRelationOption = {
  id?: string | number;
  value?: string | number;
  label?: string;
  name?: string;
  title?: string;
  country_code?: string;
  countrycode?: string;
  flag?: string;
  [key: string]: unknown;
};

export type QuickRelationFormData = {
  fields: QuickRelationField[];
  options: Record<string, QuickRelationOption[]>;
  popup_text?: string;
};

export type QuickRelationSaveResult = {
  relatie_id?: number | string;
  user_created?: boolean | number | string;
};

export type QuickRelationFieldKind =
  | "hidden"
  | "select"
  | "date"
  | "whatsapp"
  | "phone"
  | "address"
  | "email"
  | "number"
  | "text";

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export function isRelationFlagOn(value?: boolean | number | string) {
  return value === 1 || value === "1" || value === true || value === "true";
}

export function parseQuickRelationItem(raw?: string): QuickRelationItem | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuickRelationItem;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function isQuickRelationFieldRequired(field: QuickRelationField) {
  return (
    field.required === true ||
    field.required === 1 ||
    field.required === "1" ||
    field.required === "true"
  );
}

export function optionValue(option: QuickRelationOption) {
  return String(option.value ?? option.id ?? "");
}

export function optionLabel(option: QuickRelationOption) {
  return String(option.label ?? option.name ?? option.title ?? option.value ?? option.id ?? "");
}

export function normalizeQuickRelationOptions(raw: unknown): QuickRelationOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (item == null) return { value: "", label: "" };
    if (typeof item === "string" || typeof item === "number") {
      return { value: item, label: String(item) };
    }
    return item as QuickRelationOption;
  });
}

export function fieldInitialValue(field: QuickRelationField) {
  if (field.value == null || field.value === false) return "";
  return String(field.value);
}

export function getQuickRelationFieldKind(field: QuickRelationField): QuickRelationFieldKind {
  const type = String(field.type || "").toLowerCase();
  const name = String(field.name || "").toLowerCase();

  if (type === "hidden") return "hidden";
  if (field.options_key || type === "select" || type === "dropdown") return "select";
  if (type === "date" || type === "datepicker") return "date";
  if (type === "whatsapp" || name.includes("whatsapp")) return "whatsapp";
  if (
    type === "phone" ||
    type === "tel" ||
    name.includes("phone") ||
    name.includes("telefoon") ||
    name.includes("mobiel")
  ) {
    return "phone";
  }
  if (
    type === "address" ||
    type === "google_maps" ||
    name.includes("google_maps") ||
    name.includes("address") ||
    name.includes("adres")
  ) {
    return "address";
  }
  if (type === "email" || name.includes("email")) return "email";
  if (
    type === "number" ||
    type === "year" ||
    name.includes("year") ||
    name.includes("jaar") ||
    name.includes("mileage") ||
    name.includes("kilometer")
  ) {
    return "number";
  }
  return "text";
}

export function isDutchWhatsAppValid(value: string) {
  return /^0\d{9}$/.test(value.replace(/\s/g, ""));
}

export function findCountryCodeField(
  fields: QuickRelationField[],
  phoneFieldName: string
) {
  const name = phoneFieldName.toLowerCase();
  const preferred = name.includes("whatsapp")
    ? ["whatsapp_country_code", "country_code_wh", "country_code"]
    : ["telefoon_country_code", "phone_country_code", "country_code"];

  return (
    fields.find((field) => preferred.includes(String(field.name || "").toLowerCase())) ??
    fields.find((field) => String(field.name || "").toLowerCase().includes("country_code"))
  );
}

function parseFormPayload(raw: unknown): QuickRelationFormData {
  const body = (raw && typeof raw === "object" ? raw : {}) as {
    fields?: unknown;
    options?: unknown;
    popup_text?: string;
    data?: { fields?: unknown; options?: unknown; popup_text?: string };
  };
  const source = Array.isArray(body.fields) ? body : body.data ?? body;
  const optionsRaw =
    source.options && typeof source.options === "object" && !Array.isArray(source.options)
      ? (source.options as Record<string, unknown>)
      : {};

  const options: Record<string, QuickRelationOption[]> = {};
  Object.entries(optionsRaw).forEach(([key, value]) => {
    options[key] = normalizeQuickRelationOptions(value);
  });

  return {
    fields: Array.isArray(source.fields) ? (source.fields as QuickRelationField[]) : [],
    options,
    popup_text: source.popup_text,
  };
}

export async function fetchQuickRelations() {
  const ctx = await getUserContext();
  return ApiService<QuickRelationItem[]>(apiConstants.getQuickRelations, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchQuickRelationForm(quickRelationId: string | number) {
  const ctx = await getUserContext();
  const response = await ApiService<QuickRelationFormData>(apiConstants.getQuickRelationForm, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      quick_relation_id: quickRelationId,
    },
  });

  return {
    ...response,
    data: parseFormPayload(response.data),
  };
}

export async function saveQuickRelation(
  quickRelationId: string | number,
  values: Record<string, string>
) {
  const ctx = await getUserContext();
  const response = await ApiService<QuickRelationSaveResult>(apiConstants.saveQuickRelation, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      quick_relation_id: quickRelationId,
      ...values,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}
