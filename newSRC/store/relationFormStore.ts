import { create } from "zustand";
import i18n from "../translation/i18n";
import {
  fieldInitialValue,
  fetchQuickRelationForm,
  findCountryCodeField,
  getQuickRelationFieldKind,
  isDutchWhatsAppValid,
  isPersonWhatsAppField,
  isQuickRelationFieldRequired,
  isRelationDateValid,
  isRelationFlagOn,
  parseQuickRelationItem,
  saveQuickRelation,
  toApiDate,
  toDisplayDate,
  type QuickRelationField,
  type QuickRelationFormData,
  type QuickRelationItem,
} from "../services/relationService";
import {
  addressPartFieldsFor,
  fetchGooglePlaceAddress,
} from "../utils/googlePlaceAddress";
import type { GooglePlacePrediction } from "../Components/GooglePlacesInput";
import { AppApiError, parseApiError, type ParsedApiError } from "../utils/apiError";
import { isPhoneValid, isValidEmail, normalizeCountryCode } from "../utils/validation";
import { normalizeCallingCode } from "../utils/countryListHelper";

function buildInitialValues(fields: QuickRelationField[], defaultCountryCode?: string) {
  const values: Record<string, string> = {};
  fields.forEach((field) => {
    const initial = fieldInitialValue(field);
    values[field.name] = field.name === "voertuig_apk_datum" ? toDisplayDate(initial) : initial;
  });

  const fallbackCode = normalizeCallingCode(defaultCountryCode);
  if (fallbackCode) {
    fields
      .filter((field) => String(field.name || "").toLowerCase().includes("country_code"))
      .forEach((field) => {
        if (!normalizeCallingCode(values[field.name])) {
          values[field.name] = fallbackCode;
        }
      });
  }

  return values;
}

type RelationFormStore = {
  item: QuickRelationItem | null;
  form: QuickRelationFormData | null;
  values: Record<string, string>;
  errors: Record<string, string>;
  loading: boolean;
  submitting: boolean;
  apiError: ParsedApiError | null;
  activeField: string | null;
  dateField: string | null;
  setItemFromParams: (params: {
    item?: string;
    category_id?: string;
    popup_text?: string;
    default_country_code?: string;
    is_employee_client?: string;
    is_customer_client?: string;
    is_employee_of_company?: string;
  }) => void;
  loadForm: () => Promise<void>;
  setFieldValue: (name: string, value: string) => void;
  applyGoogleAddress: (fieldName: string, place: GooglePlacePrediction) => Promise<void>;
  setActiveField: (name: string | null) => void;
  setDateField: (name: string | null) => void;
  validate: () => boolean;
  save: () => Promise<
    | { ok: true; message: string; userCreated: boolean }
    | { ok: false; message: string; reason: "validation" | "api" }
  >;
  reset: () => void;
};

export const useRelationFormStore = create<RelationFormStore>((set, get) => ({
  item: null,
  form: null,
  values: {},
  errors: {},
  loading: true,
  submitting: false,
  apiError: null,
  activeField: null,
  dateField: null,

  setItemFromParams: (params) => {
    const parsed = parseQuickRelationItem(params.item);
    set({
      item: {
        ...(parsed ?? {}),
        category_id: parsed?.category_id ?? Number(params.category_id),
        popup_text: parsed?.popup_text || params.popup_text,
        default_country_code: parsed?.default_country_code || params.default_country_code,
        is_employee_client: parsed?.is_employee_client ?? params.is_employee_client,
        is_customer_client: parsed?.is_customer_client ?? params.is_customer_client,
        is_employee_of_company: parsed?.is_employee_of_company ?? params.is_employee_of_company,
      },
    });
  },

  loadForm: async () => {
    const item = get().item;
    if (item?.id == null || item.id === "") {
      set({ form: null, loading: false, apiError: null });
      return;
    }

    try {
      set({ loading: true, apiError: null });
      const response = await fetchQuickRelationForm(item.id);
      set({
        form: response.data,
        values: buildInitialValues(response.data.fields, item.default_country_code),
        errors: {},
        loading: false,
      });
    } catch (error) {
      set({
        form: null,
        loading: false,
        apiError: parseApiError(error, i18n.t("Something went wrong")),
      });
    }
  },

  setFieldValue: (name, value) => {
    set((state) => {
      const errors = { ...state.errors };
      delete errors[name];
      return { values: { ...state.values, [name]: value }, errors };
    });
  },

  applyGoogleAddress: async (fieldName, place) => {
    const details = await fetchGooglePlaceAddress(place.place_id);
    const formatted = details?.formatted || place.description;
    const partMap = addressPartFieldsFor(fieldName);
    const fieldNames = new Set((get().form?.fields ?? []).map((field) => field.name));

    set((state) => {
      const values = { ...state.values, [fieldName]: formatted };
      if (details) {
        (Object.keys(partMap) as Array<keyof typeof partMap>).forEach((key) => {
          const target = partMap[key];
          if (fieldNames.has(target)) values[target] = details[key];
        });
      }
      const errors = { ...state.errors };
      delete errors[fieldName];
      return { values, errors };
    });
  },

  setActiveField: (name) => set({ activeField: name }),
  setDateField: (name) => set({ dateField: name }),

  validate: () => {
    const { form, values } = get();
    const nextErrors: Record<string, string> = {};

    (form?.fields ?? []).forEach((field) => {
      const kind = getQuickRelationFieldKind(field);
      if (kind === "hidden") return;

      const value = String(values[field.name] ?? "").trim();
      const required = isQuickRelationFieldRequired(field);
      const countryField = findCountryCodeField(form?.fields ?? [], field.name);
      const countryCode = normalizeCountryCode(countryField ? values[countryField.name] || "" : "");

      if (isPersonWhatsAppField(field.name)) {
        if (countryCode === "" || countryCode === "31") {
          if (!isDutchWhatsAppValid(value)) {
            nextErrors[field.name] = i18n.t(
              "A Dutch WhatsApp number must be 10 digits starting with 0."
            );
          }
        } else if (required && !value) {
          nextErrors[field.name] = i18n.t("This field is required");
        } else if (value && !isPhoneValid(countryCode, value)) {
          nextErrors[field.name] = i18n.t("Enter a valid phone number");
        }
        return;
      }

      if (kind === "phone") {
        if (required && !value) {
          nextErrors[field.name] = i18n.t("This field is required");
        } else if (value && !isPhoneValid(countryCode || "31", value)) {
          nextErrors[field.name] = i18n.t("Enter a valid phone number");
        }
        return;
      }

      if (kind === "email") {
        if (required && !value) {
          nextErrors[field.name] = i18n.t("This field is required");
        } else if (value && !isValidEmail(value)) {
          nextErrors[field.name] = i18n.t("Enter a valid email address");
        }
        return;
      }

      if (kind === "date") {
        if (required && !value) {
          nextErrors[field.name] = i18n.t("This field is required");
        } else if (value && !isRelationDateValid(value)) {
          nextErrors[field.name] = i18n.t("Select date");
        }
        return;
      }

      if (kind === "number") {
        const yearField = field.name.toLowerCase().includes("year") || field.name.toLowerCase().includes("jaar");
        if (required && !value) {
          nextErrors[field.name] = i18n.t("This field is required");
        } else if (value && yearField) {
          const year = Number(value);
          if (!/^\d{4}$/.test(value) || year < 1900 || year > 2100) {
            nextErrors[field.name] = i18n.t("Enter year");
          }
        }
        return;
      }

      if (required && !value) {
        nextErrors[field.name] = i18n.t("This field is required");
      }
    });

    set({ errors: nextErrors });
    return Object.keys(nextErrors).length === 0;
  },

  save: async () => {
    const { form, item, values, validate } = get();
    if (!form || item?.id == null || item.id === "") {
      return { ok: false, message: i18n.t("Something went wrong"), reason: "api" };
    }
    if (!validate()) {
      return { ok: false, message: "", reason: "validation" };
    }

    try {
      set({ submitting: true });
      const payload: Record<string, string> = {};
      form.fields.forEach((field) => {
        const raw = values[field.name] ?? "";
        payload[field.name] = field.name === "voertuig_apk_datum" ? toApiDate(raw) : raw;
      });

      const response = await saveQuickRelation(item.id, payload);
      set({ submitting: false, errors: {} });
      return {
        ok: true,
        message: response.message || i18n.t("Relation saved"),
        userCreated: isRelationFlagOn(response.data?.user_created),
      };
    } catch (error) {
      const fieldErrors = error instanceof AppApiError ? error.fieldErrors : undefined;
      set({
        submitting: false,
        errors: fieldErrors ?? get().errors,
      });
      return {
        ok: false,
        reason: "api",
        message: parseApiError(error, i18n.t("Something went wrong")).message,
      };
    }
  },

  reset: () =>
    set({
      item: null,
      form: null,
      values: {},
      errors: {},
      loading: true,
      submitting: false,
      apiError: null,
      activeField: null,
      dateField: null,
    }),
}));
