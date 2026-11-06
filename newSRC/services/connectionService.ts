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

export type AllRelationItem = {
  id: number | string;
  display_name?: string;
  bedrijfsnaam?: string;
  voornaam?: string;
  achternaam?: string;
  soort_relatie?: string;
  bedrijf_particulier?: number | string;
  category_id?: number | string;
  file_path?: string;
};

export type AllRelationTab = "company" | "person" | "employee";

function relationText(item: AllRelationItem) {
  return String(item.soort_relatie || "").toLowerCase();
}

function relationCategory(item: AllRelationItem) {
  const value = Number(item.bedrijf_particulier ?? item.category_id);
  return Number.isFinite(value) ? value : 0;
}

export function isEmployeeRelation(item: AllRelationItem) {
  const value = relationText(item);
  return (
    value.includes("medewerker") ||
    value.includes("employee") ||
    value.includes("werknemer") ||
    value.includes("personeel") ||
    value === "staff"
  );
}

function isClientRelation(item: AllRelationItem) {
  if (isEmployeeRelation(item)) return false;
  const value = relationText(item);
  const category = relationCategory(item);
  if (!value) return category === 1 || category === 2;
  return (
    value.includes("opdrachtgever") ||
    value.includes("klant") ||
    value.includes("client") ||
    value.includes("customer")
  );
}

export function matchesAllRelationTab(item: AllRelationItem, tab: AllRelationTab) {
  if (tab === "employee") return isEmployeeRelation(item);
  if (!isClientRelation(item)) return false;

  const category = relationCategory(item);
  if (tab === "company") {
    if (category === 1) return true;
    if (category === 2) return false;
    return Boolean(item.bedrijfsnaam) && !item.voornaam;
  }

  if (category === 2) return true;
  if (category === 1) return false;
  return Boolean(item.voornaam) || !item.bedrijfsnaam;
}

function normalizeAllRelation(raw: unknown): AllRelationItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as AllRelationItem;
  if (item.id == null || item.id === "") return null;
  const image = item.file_path || (raw as { profile_image?: { file_path?: string } }).profile_image?.file_path;
  return {
    id: item.id,
    display_name: item.display_name,
    bedrijfsnaam: item.bedrijfsnaam,
    voornaam: item.voornaam,
    achternaam: item.achternaam,
    soort_relatie: item.soort_relatie,
    bedrijf_particulier: item.bedrijf_particulier,
    category_id: item.category_id,
    file_path: image,
  };
}

export async function fetchAllRelations() {
  const ctx = await getUserContext();
  const [filtered, connections] = await Promise.all([
    ApiService<unknown[]>(apiConstants.get_filtered_relaties_list, {
      includeToken: true,
      customData: {
        relaties_id: ctx.relaties_id,
        role: ctx.role,
        user_id: ctx.user_id,
      },
    }).catch(() => null),
    fetchConnections().catch(() => null),
  ]);

  if (!filtered?.status && !connections?.status) {
    throw filtered || connections || new Error("Something went wrong");
  }

  const merged = new Map<string, AllRelationItem>();
  const add = (list: unknown) => {
    if (!Array.isArray(list)) return;
    list.forEach((raw) => {
      const item = normalizeAllRelation(raw);
      if (!item) return;
      const key = String(item.id);
      const current = merged.get(key);
      merged.set(key, current ? { ...current, ...item } : item);
    });
  };

  if (filtered?.status) add(filtered.data);
  if (connections?.status) add(connections.data);
  return [...merged.values()];
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
