import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { AppApiError, flattenFieldErrors, toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";

export type ProjectStatus = {
  id?: number | string;
  status_name?: string;
  color?: string;
};

export type ProjectItem = {
  id: number;
  project_name: string;
  project_image?: string;
  deadline?: string;
  project_status_data_api?: ProjectStatus;
};

export type ProjectLabel = {
  labels?: string;
  color_code?: string;
};

export type ProjectPerson = {
  id?: number | string;
  relatie_id?: number | string;
  display_name?: string;
  telefoon?: string;
  profile_img?: string;
};

export type ProjectCurrency = {
  id?: number | string;
  code?: string;
  symbol?: string;
  name?: string;
};

export type ProjectImageFile = {
  uri: string;
  type: string;
  name: string;
};

export type ProjectActivity = {
  working_schedule?: string;
  working_schedule_days?: string;
  activity_data?: {
    activity_name?: string;
    activity_category_data?: {
      activities_category_name?: string;
    };
  };
};

export type ProjectTask = {
  title?: string;
  deadline?: string;
  priority?: string;
  relatie_data?: { display_name?: string };
  task_status_data?: ProjectStatus;
};

export type ProjectTicket = {
  id?: number;
  project_name?: string;
  ticket_title?: string;
  ticketstatus?: ProjectStatus;
  action_relatie_data?: { display_name?: string };
  gmaps_working_address?: string;
};

export type QuickCreatePerson = {
  id: number | string;
  name: string;
};

export type QuickCreateCompany = {
  id: number | string;
  name: string;
  persons: QuickCreatePerson[];
};

export type QuickCreateFormData = {
  companies: QuickCreateCompany[];
};

export type QuickCreateSaveResult = {
  project_id?: number | string | null;
  order_id?: number | string | null;
};

export type ProjectRelationType = "owner" | "contact" | "member";

export type ProjectRelationRecord = {
  id: number | string;
  name: string;
};

export type QuickCreatePayload = {
  company_enabled: 0 | 1;
  company_id?: number | string;
  person_id?: number | string;
  project_name: string;
  create_order: 0 | 1;
  order_title?: string;
};

let refreshProjectsOnFocus = false;

export function requestProjectsRefresh() {
  refreshProjectsOnFocus = true;
}

export function consumeProjectsRefresh() {
  const next = refreshProjectsOnFocus;
  refreshProjectsOnFocus = false;
  return next;
}

export type ProjectDetail = {
  id?: number;
  project_name?: string;
  project_image?: string;
  deadline?: string;
  budject?: string | number | null;
  budject_currency?: string | number | null;
  budject_currency_data?: ProjectCurrency | null;
  gmaps_working_address?: string;
  project_status_data_api?: ProjectStatus;
  project_labels_data_api?: ProjectLabel[];
  relaties_owners?: ProjectPerson[];
  connected_relaties?: ProjectPerson[];
  relaties_members?: ProjectPerson[];
  project_activity?: ProjectActivity[];
  task_data?: ProjectTask[];
  ticket_data?: ProjectTicket[];
};

export function projectPersonId(person: ProjectPerson) {
  return person.relatie_id ?? person.id;
}

export function formatProjectBudget(
  amount?: string | number | null,
  currency?: ProjectCurrency | null
) {
  const value = amount == null ? "" : String(amount).trim();
  const symbol = String(currency?.symbol || currency?.code || "").trim();
  if (!value && !symbol) return "";
  if (!value) return symbol;
  if (!symbol) return value;
  return `${symbol} ${value}`;
}

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchProjects() {
  const ctx = await getUserContext();
  return ApiService<ProjectItem[]>(apiConstants.getprojects, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
    },
  });
}

export async function fetchProjectStatuses() {
  const ctx = await getUserContext();
  return ApiService<ProjectStatus[]>(apiConstants.getstatus, {
    includeToken: true,
    customData: {
      slug: "project",
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePerson(raw: unknown): QuickCreatePerson | null {
  const item = asRecord(raw);
  if (!item) return null;
  const id = item.id ?? item.person_id;
  const name = String(item.name ?? item.display_name ?? item.person_name ?? "").trim();
  if (id == null || id === "") return null;
  return { id, name };
}

function normalizeCompany(raw: unknown): QuickCreateCompany | null {
  const item = asRecord(raw);
  if (!item) return null;
  const id = item.id ?? item.company_id;
  const name = String(item.name ?? item.company_name ?? "").trim();
  if (id == null || id === "") return null;
  const persons = Array.isArray(item.persons)
    ? item.persons.map(normalizePerson).filter((person): person is QuickCreatePerson => person != null)
    : [];
  return { id, name, persons };
}

function parseQuickCreateForm(raw: unknown): QuickCreateFormData {
  const root = asRecord(raw);
  const nested = asRecord(root?.data);
  const companiesRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(root?.companies)
      ? root.companies
      : Array.isArray(nested?.companies)
        ? nested.companies
        : [];

  return {
    companies: companiesRaw
      .map(normalizeCompany)
      .filter((company): company is QuickCreateCompany => company != null),
  };
}

export async function fetchQuickCreateForm() {
  const ctx = await getUserContext();
  const response = await ApiService<unknown>(apiConstants.quickCreateProjectForm, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return {
    ...response,
    data: parseQuickCreateForm(response.data),
  };
}

export async function saveQuickCreateProject(payload: QuickCreatePayload) {
  const ctx = await getUserContext();
  const response = await ApiService<QuickCreateSaveResult>(apiConstants.quickCreateProject, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      ...payload,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

function normalizeRelationRecord(raw: unknown): ProjectRelationRecord | null {
  const item = asRecord(raw);
  if (!item) return null;
  const id = item.id ?? item.relatie_id;
  const name = String(item.name ?? item.display_name ?? "").trim();
  if (id == null || id === "") return null;
  return { id, name };
}

function parseRelationRecords(raw: unknown): ProjectRelationRecord[] {
  const root = asRecord(raw);
  const nested = asRecord(root?.data);
  const recordsRaw = Array.isArray(root?.records)
    ? root.records
    : Array.isArray(nested?.records)
      ? nested.records
      : Array.isArray(raw)
        ? raw
        : [];

  return recordsRaw
    .map(normalizeRelationRecord)
    .filter((item): item is ProjectRelationRecord => item != null);
}

export async function fetchProjectRelationOptions(
  projectId: string | number,
  type: ProjectRelationType
) {
  const ctx = await getUserContext();
  const response = await ApiService<unknown>(apiConstants.projectRelationOptions, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      type,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return parseRelationRecords(response.data);
}

export async function addProjectRelation(
  projectId: string | number,
  type: ProjectRelationType,
  relatieId: string | number
) {
  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectAddRelation, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      type,
      relatie_id: relatieId,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

export async function updateProject(
  projectId: string | number,
  changes: {
    project_name?: string;
    budject?: string;
    budject_currency?: string;
    project_image?: ProjectImageFile;
  }
) {
  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectUpdate, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      ...changes,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

export async function removeProjectRelation(
  projectId: string | number,
  type: ProjectRelationType,
  relatieId: string | number
) {
  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectRemoveRelation, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      type,
      relatie_id: relatieId,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

export async function fetchProjectDetails(projectId: string | number) {
  const ctx = await getUserContext();
  return ApiService<ProjectDetail[]>(apiConstants.get_project_details, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      project_id: projectId,
    },
  });
}

export type ProjectFileItem = {
  id?: number | string;
  name?: string;
  folder_name?: string;
  title?: string;
  comment?: string;
  shared_link?: string;
  view_url?: string;
  file_path?: string;
  file_extension?: string;
  file_type?: string;
};

export type ProjectFilesData = {
  folders: ProjectFileItem[];
  documents: ProjectFileItem[];
  photos: ProjectFileItem[];
};

export type ProjectUploadFile = {
  uri: string;
  type: string;
  name: string;
};

function normalizeFileItem(raw: unknown): ProjectFileItem | null {
  const item = asRecord(raw);
  if (!item) return null;
  const name = String(item.name || item.title || item.folder_name || "").trim();
  const folderName = String(item.folder_name || item.name || "").trim();
  const firstUrl = [
    item.shared_link,
    item.view_url,
    item.file_path,
    item.preview,
    item.thumbnail,
    item.download_url,
    item.url,
  ]
    .map((value) => String(value || "").trim())
    .find(Boolean);
  return {
    id: item.id,
    name,
    folder_name: folderName || undefined,
    title: item.title != null ? String(item.title) : undefined,
    comment: item.comment != null ? String(item.comment) : undefined,
    shared_link: firstUrl,
    view_url: item.view_url != null ? String(item.view_url) : undefined,
    file_path: item.file_path != null ? String(item.file_path) : undefined,
    file_extension: item.file_extension != null ? String(item.file_extension) : undefined,
    file_type: item.file_type != null ? String(item.file_type) : undefined,
  };
}

function parseFileList(raw: unknown): ProjectFileItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? { folder_name: item, name: item } : normalizeFileItem(item)))
      .filter((item): item is ProjectFileItem => item != null && Boolean(item.name || item.folder_name));
  }
  return [];
}

function parseProjectFiles(raw: unknown): ProjectFilesData {
  const root = asRecord(raw);
  const nested = asRecord(root?.data);
  const source = nested ?? root ?? {};
  return {
    folders: parseFileList(source.folders),
    documents: parseFileList(source.documents),
    photos: parseFileList(source.photos),
  };
}

function filePayload(files: ProjectUploadFile[]) {
  if (files.length === 1) return { file: files[0] };
  return { "files[]": files };
}

function optionalText(value?: string) {
  const next = value?.trim();
  return next ? next : undefined;
}

export function projectFolderName(item: ProjectFileItem) {
  return String(item.folder_name || item.name || "").trim();
}

export function collectProjectFolderNames(data: ProjectFilesData) {
  const names = new Set<string>();
  data.folders.forEach((item) => {
    const name = projectFolderName(item);
    if (name) names.add(name);
  });
  data.photos.forEach((item) => {
    const name = projectFolderName(item);
    if (name) names.add(name);
  });
  return [...names];
}

export async function fetchProjectFiles(projectId: string | number) {
  const ctx = await getUserContext();
  const response = await ApiService<unknown>(apiConstants.projectFiles, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return parseProjectFiles(response.data);
}

export async function uploadProjectDocument(
  projectId: string | number,
  files: ProjectUploadFile[],
  extras?: { title?: string; comment?: string }
) {
  if (!files.length) {
    throw toAppApiError({ message: "No file selected" });
  }

  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectUploadDocument, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      title: optionalText(extras?.title),
      comment: optionalText(extras?.comment),
      ...filePayload(files),
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

export async function createProjectPhotoFolders(
  projectId: string | number,
  folderCount: number,
  folderName: string
) {
  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectPhotoFolders, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      folder_count: folderCount,
      folder_name: folderName,
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}

export function projectFileId(item: ProjectFileItem) {
  return item.id;
}

function removeFileApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    const fieldErrors = error.fieldErrors;
    if (fieldErrors?.project_id || fieldErrors?.file_id || fieldErrors?.type) {
      return error;
    }
    const message = String(error.message || "").trim();
    if (message && message !== "No Data Found" && message !== "No data found") {
      return error;
    }
  }

  const payload =
    error && typeof error === "object"
      ? (error as { message?: string; errors?: unknown; status_code?: number })
      : undefined;
  const message = String(payload?.message || "").trim();
  const fieldErrors = flattenFieldErrors(payload?.errors);

  return new AppApiError({
    kind: "server",
    message: message || "Something went wrong",
    statusCode: payload?.status_code,
    fieldErrors,
  });
}

export async function removeProjectFile(
  projectId: string | number,
  fileId: string | number,
  type: "document" | "photo"
) {
  const ctx = await getUserContext();
  try {
    const response = await ApiService(apiConstants.projectRemoveFile, {
      includeToken: true,
      customData: {
        relaties_id: ctx.relaties_id,
        role: ctx.role,
        user_id: ctx.user_id,
        project_id: projectId,
        file_id: fileId,
        type,
      },
    });

    if (response?.status) return response;
    throw removeFileApiError(response);
  } catch (error) {
    throw removeFileApiError(error);
  }
}

export async function uploadProjectPhoto(
  projectId: string | number,
  folderName: string,
  files: ProjectUploadFile[],
  extras?: { title?: string; comment?: string }
) {
  if (!files.length) {
    throw toAppApiError({ message: "No file selected" });
  }

  const ctx = await getUserContext();
  const response = await ApiService(apiConstants.projectUploadPhoto, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      project_id: projectId,
      folder_name: folderName,
      title: optionalText(extras?.title),
      comment: optionalText(extras?.comment),
      ...filePayload(files),
    },
  });

  if (!response?.status) {
    throw toAppApiError(response);
  }

  return response;
}
