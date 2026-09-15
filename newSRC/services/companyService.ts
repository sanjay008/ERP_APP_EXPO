import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";

export type BusinessCompanyItem = {
  id: number | string;
  display_name?: string;
  bedrijfsnaam?: string;
  city?: string;
  email_adres?: string;
  telefoon?: string;
  telefoon_country_code?: string;
  adres?: string;
  region?: string;
  country?: string;
  kvk_nr?: string;
  btw_nr?: string;
  google_maps?: string;
  color_code?: string;
  company?: string | number;
  ecommerce_businesses?: Array<{
    id?: number | string;
    title?: string;
    ec_company_profile?: string;
    ec_business?: string;
    website?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp_number?: string;
    country_code_wh?: string;
    business_dropbox_shared_link?: string;
    business_tag?: string;
  }>;
};

type ApiBody<T> = {
  status?: boolean;
  success?: boolean;
  data?: T;
  message?: string;
};

export async function fetchBusinessCompanies() {
  const response = await apiClient.post<ApiBody<BusinessCompanyItem[]>>(
    apiConstants.get_business_company
  );
  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    throw toAppApiError({
      message: body?.message || "Failed to fetch companies",
    });
  }
  return body.data;
}

export async function fetchBusinessCompanyById(companyId: string | number) {
  const items = await fetchBusinessCompanies();
  return items.find((item) => String(item.id) === String(companyId)) ?? null;
}

export async function createBusinessCompany(payload: {
  google_maps: string;
  email: string;
  country_code: string;
  phone_number: string;
  company_name: string;
}) {
  const response = await apiClient.post<ApiBody<unknown>>(
    apiConstants.create_Relaties_company,
    {
      google_maps: payload.google_maps,
      email: payload.email,
      country_code: payload.country_code,
      phone_number: payload.phone_number,
      company_name: payload.company_name,
      firstname: payload.company_name,
      lastname: payload.company_name,
      address: payload.google_maps,
      register_policy: true,
    }
  );

  const body = response.data;
  if (!body?.success && !body?.status) {
    throw toAppApiError({
      message: body?.message || "Failed to create company",
    });
  }
  return body;
}

export type ServiceTag = {
  id?: number | string;
  service_name?: string;
};

export async function fetchServiceList() {
  const response = await apiClient.post<ApiBody<ServiceTag[]>>(apiConstants.serviceList);
  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    throw toAppApiError({ message: body?.message || "Failed to fetch services" });
  }
  return body.data;
}

export async function deleteCompanyImage(payload: {
  companyRelatiesId: string | number;
  imageField: string;
}) {
  const response = await apiClient.post<ApiBody<unknown>>(apiConstants.delete_company_image, {
    company_relaties_id: payload.companyRelatiesId,
    image_field: payload.imageField,
  });
  const body = response.data;
  if (!body?.status && !body?.success) {
    throw toAppApiError({ message: body?.message || "Failed to delete image" });
  }
  return body;
}

export async function updateBusinessCompany(payload: Record<string, unknown>) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((entry) => formData.append(`${key}[]`, String(entry)));
      return;
    }

    if (typeof value === "object" && "uri" in (value as object)) {
      formData.append(key, value as never);
      return;
    }

    formData.append(key, String(value));
  });

  const response = await apiClient.post<ApiBody<unknown>>(
    apiConstants.busines_company_update,
    formData
  );

  const body = response.data;
  if (!body?.status && !body?.success) {
    throw toAppApiError({
      message: body?.message || "Failed to update company",
    });
  }
  return body;
}
