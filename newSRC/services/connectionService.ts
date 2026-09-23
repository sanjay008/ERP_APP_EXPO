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
  document_nr?: string;
  documents?: ConnectionDocument[];
};

export type ConnectionDocument = {
  id?: number | string;
  filename?: string;
  type?: string;
  shared_link?: string;
  view_url?: string;
  download_url?: string;
  file_path?: string;
  file_extension?: string;
  file_type?: string;
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
  return ApiService<{ relaties: ConnectionDetail; documents?: ConnectionDocument[] }>(
    apiConstants.relatiesdata,
    {
      includeToken: true,
      customData: {
        id,
        relaties_id: ctx.relaties_id,
        role: ctx.role,
        user_id: ctx.user_id,
      },
    },
  );
}

export async function fetchConnectionDocuments(relatiesId: string | number) {
  const ctx = await getUserContext();
  return ApiService<{ documents?: ConnectionDocument[] } | ConnectionDocument[]>(
    apiConstants.getRelatieDocuments,
    {
      includeToken: true,
      customData: {
        relaties_id: relatiesId,
        role: ctx.role,
        user_id: ctx.user_id,
      },
    },
  );
}

function asDocumentList(data: unknown): ConnectionDocument[] {
  if (Array.isArray(data)) return data as ConnectionDocument[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const nested = record.documents || record.documenten || record.files;
    if (Array.isArray(nested)) return nested as ConnectionDocument[];
  }
  return [];
}

export function parseConnectionDocuments(
  detailsRes: unknown,
  docsRes?: unknown,
): ConnectionDocument[] {
  const details = detailsRes as {
    data?: {
      documents?: ConnectionDocument[];
      documenten?: ConnectionDocument[];
      relaties?: ConnectionDetail;
    };
  } | null;
  const extra = docsRes as { data?: unknown } | null;
  const fromDetails = asDocumentList(
    details?.data?.documents ||
      details?.data?.documenten ||
      details?.data?.relaties?.documents,
  );
  const fromDocsApi = asDocumentList(extra?.data);
  const merged = [...fromDetails, ...fromDocsApi];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = String(item.id || item.view_url || item.shared_link || item.file_path || item.filename);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
