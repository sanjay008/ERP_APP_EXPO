import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type ConnectionItem = {
  id: number;
  display_name: string;
  soort_relatie?: string;
  file_path?: string;
};

export type ConnectionLabel = {
  id?: number;
  label_name?: string;
  name?: string;
};

export type ConnectionDetail = {
  id?: number;
  display_name?: string;
  bedrijf_particulier?: number;
  bedrijfsnaam?: string;
  voertuig_project?: string;
  soort_relatie?: string;
  leadstatus?: { status_name?: string; color_code?: string };
  labels?: ConnectionLabel[];
  whatsapp_number?: string;
  contact_telefoon?: string;
  email_adres?: string;
  email_adres_private?: string;
  google_maps?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website?: string;
  file_path?: string;
  object_nr?: string;
  project_naam?: string;
  voertuig_kenteken?: string;
  voertuig_merk?: string;
  voertuig_model?: string;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchConnections(type?: string) {
  const ctx = await getUserContext();
  return ApiService<ConnectionItem[]>(apiConstants.Connections, {
    includeToken: true,
    customData: {
      id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      ...(type === "child" ? { soort_relatie: "kind" } : {}),
    },
  });
}

export async function fetchConnectionDetails(id: string | number) {
  const ctx = await getUserContext();
  return ApiService<{ relaties: ConnectionDetail }>(apiConstants.relatiesdata, {
    includeToken: true,
    customData: {
      id,
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}
