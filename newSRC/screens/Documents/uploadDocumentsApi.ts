import ApiService from "../../utils/Apiservice";
import apiConstants from "../../utils/apiConstants";
import { getData } from "../../utils/storeData";
import {
  buildUploadTypeCards,
  isPayslipDocumentType,
  type PickedDocumentFile,
  type QuickUploadType,
  type RelatieDocument,
} from "./types";

type AuthUser = {
  user?: {
    id?: number | string;
    role?: string;
    verify_token?: string;
  };
  relaties?: {
    id?: number | string;
  };
};

export function buildDocumentAuth(userData: AuthUser | null | undefined) {
  return {
    token: userData?.user?.verify_token,
    relaties_id: userData?.relaties?.id,
    user_id: userData?.user?.id,
    role: userData?.user?.role,
  };
}

export async function loadDocumentAuthUser(): Promise<AuthUser | null> {
  const stored = await getData("USERDATA");
  if (!stored) return null;
  return (stored.data ?? stored) as AuthUser;
}

export function isApiSuccess(res: any) {
  return (
    Boolean(res?.status) &&
    (res?.status_code == null || Number(res.status_code) === 200)
  );
}

function logDocFile(file?: PickedDocumentFile | null) {
  if (!file) return null;
  return { uri: file.uri, name: file.name, type: file.type };
}

function logDocumentApi(label: string, request: unknown) {
  console.log(`📄 DOC API REQUEST => ${label}`, request);
}

function logDocumentApiResult(label: string, response: unknown) {
  console.log(`📄 DOC API RESPONSE => ${label}`, response);
}

function logDocumentApiError(label: string, error: unknown) {
  const err = error as { message?: string; response?: { data?: unknown } };
  console.log(`📄 DOC API ERROR => ${label}`, err?.response?.data || err?.message || error);
}

async function callDocumentApi(label: string, request: unknown, run: () => Promise<any>) {
  logDocumentApi(label, request);
  try {
    const response = await run();
    logDocumentApiResult(label, response);
    return response;
  } catch (error) {
    logDocumentApiError(label, error);
    throw error;
  }
}

export async function fetchQuickUploadTypes(
  userData: AuthUser | null | undefined,
  mobileOnly = false,
) {
  const request = {
    ...buildDocumentAuth(userData),
    mobile_only: mobileOnly ? 1 : 0,
  };
  return callDocumentApi(
    `get-quick-upload-types (mobile_only=${request.mobile_only})`,
    request,
    () =>
      ApiService(apiConstants.getQuickUploadTypes, {
        customData: request,
      }),
  );
}

export async function fetchRelatieDocuments(
  userData: AuthUser | null | undefined,
) {
  const request = buildDocumentAuth(userData);
  return callDocumentApi("get-relatie-documents", request, () =>
    ApiService(apiConstants.getRelatieDocuments, {
      customData: request,
    }),
  );
}

export async function fetchDocumentDetails(
  userData: AuthUser | null | undefined,
  documentId: number | string,
) {
  const request = {
    ...buildDocumentAuth(userData),
    document_id: documentId,
  };
  return callDocumentApi("get-document-details", request, () =>
    ApiService(apiConstants.getDocumentDetails, {
      customData: request,
    }),
  );
}

export type QuickUploadPayload = {
  type: string;
  expire_date?: string;
  front_file: PickedDocumentFile;
  back_file?: PickedDocumentFile | null;
  filename?: string;
  short_description?: string;
};

export async function quickUploadDocuments(
  userData: AuthUser | null | undefined,
  payload: QuickUploadPayload,
) {
  const request = {
    ...buildDocumentAuth(userData),
    type: payload.type,
    expire_date: payload.expire_date || "",
    filename: payload.filename || payload.type,
    short_description: payload.short_description || "",
    front_file: {
      uri: payload.front_file.uri,
      name: payload.front_file.name || "photo_front.jpg",
      type: payload.front_file.type || "image/jpeg",
    },
    ...(payload.back_file
      ? {
          back_file: {
            uri: payload.back_file.uri,
            name: payload.back_file.name || "photo_back.jpg",
            type: payload.back_file.type || "image/jpeg",
          },
        }
      : {}),
  };
  return callDocumentApi(
    `quick-upload (${payload.type})`,
    {
      ...request,
      front_file: logDocFile(request.front_file),
      back_file: logDocFile((request as { back_file?: PickedDocumentFile }).back_file),
    },
    () =>
      ApiService(apiConstants.quickUploadDocument, {
        customData: request,
      }),
  );
}

export function parseQuickUploadTypes(res: any): QuickUploadType[] {
  const list = res?.data?.types;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item) => item && (item.type || item.slug) && !isPayslipDocumentType(item),
  );
}

export function parseDocumentTypeCards(mobileRes: any, allRes?: any) {
  return buildUploadTypeCards(
    parseQuickUploadTypes(mobileRes),
    parseQuickUploadTypes(allRes),
  );
}

export function parseRelatieDocuments(res: any): RelatieDocument[] {
  const list = res?.data?.documents;
  if (!Array.isArray(list)) return [];
  return list;
}

export function parseDocumentDetails(res: any): RelatieDocument | null {
  const data = res?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (data.id == null) return null;
  return data as RelatieDocument;
}

function collectErrorStrings(value: unknown, out: string[]) {
  if (value == null) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) out.push(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectErrorStrings(item, out));
    return;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      collectErrorStrings(item, out),
    );
  }
}

export function extractDocumentApiError(payload: any): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload.trim();

  const root =
    payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? { ...payload, ...payload.data }
      : payload;

  if (!root || typeof root !== "object") return "";

  const direct =
    (typeof root.message === "string" && root.message.trim()) ||
    (typeof root.error === "string" && root.error.trim()) ||
    "";

  const fieldMessages: string[] = [];
  if (root.errors != null) {
    collectErrorStrings(root.errors, fieldMessages);
  }

  if (fieldMessages.length) {
    const generic = /^validation\s+(failed|error)/i.test(direct);
    if (direct && !generic) return `${direct}. ${fieldMessages.join(". ")}`;
    return fieldMessages.join(". ");
  }

  return direct;
}
