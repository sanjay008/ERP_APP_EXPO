export type QuickUploadType = {
  type: string;
  slug: string;
  label?: string | number;
  label_id?: number;
  label_name?: string;
  status?: string | number;
  status_id?: number;
  status_name?: string;
  relaties_id?: number;
  expire_date_required?: boolean | number | string;
  min_photos?: number | string;
  allow_camera?: boolean | number | string;
  show_on_mobile?: boolean | number | string;
  allow_multiple?: boolean | number | string;
  accept_pdf?: boolean | number | string;
  max_files?: number | string;
  required?: boolean | number | string;
  is_required?: boolean | number | string;
  mandatory?: boolean | number | string;
};

export type RelatieDocument = {
  id: number | string;
  filename?: string;
  type?: string;
  short_description?: string;
  expire_date?: string | null;
  status_id?: number;
  status_name?: string;
  label_id?: number;
  label_name?: string;
  shared_link?: string;
  view_url?: string;
  download_url?: string;
  side?: "front" | "back" | string;
  file_extension?: string;
  file_type?: "image" | "pdf" | string;
  quick_upload?: number;
};

export type PickedDocumentFile = {
  uri: string;
  name: string;
  type: string;
};

export function isDocFlag(value: unknown, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return defaultValue;
}

export const DEFAULT_CERTIFICATE_TYPE: QuickUploadType = {
  type: "Certificate",
  slug: "certificate",
  min_photos: 1,
  expire_date_required: false,
  allow_camera: true,
  allow_multiple: true,
  accept_pdf: true,
  max_files: 24,
};

export function getMinPhotos(item?: QuickUploadType | null) {
  const n = Number(item?.min_photos);
  if (Number.isFinite(n) && n >= 1) return Math.min(Math.floor(n), 6);
  if (isCertificateDocumentType(item) || !isIdentityDocumentType(item)) return 1;
  return 2;
}

export function getMaxFiles(item?: QuickUploadType | null) {
  const n = Number(item?.max_files);
  if (!Number.isFinite(n) || n < 1) return 24;
  return Math.min(Math.floor(n), 24);
}

const MOBILE_DOCUMENT_ORDER = [
  "id",
  "passport",
  "vog",
  "work_permit",
  "driving_licence",
  "niwo",
  "diploma",
  "certificate",
  "bank",
] as const;

type MobileDocumentGroup = (typeof MOBILE_DOCUMENT_ORDER)[number];

function normalizeDocText(item?: { type?: string; slug?: string } | null) {
  return [item?.slug, item?.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function docTokens(item?: { type?: string; slug?: string } | null) {
  return normalizeDocText(item).split(/\s+/).filter(Boolean);
}

export function getMobileDocumentGroup(
  item?: { type?: string; slug?: string } | null,
): MobileDocumentGroup | null {
  if (!item) return null;

  const haystack = normalizeDocText(item);
  const tokens = docTokens(item);

  if (isPayslipDocumentType(item)) return null;
  if (isCertificateDocumentType(item)) return "certificate";
  if (tokens.includes("niwo") || haystack.includes("niwo")) return "niwo";

  if (tokens.includes("id") || haystack.includes("id card") || tokens.includes("identity")) {
    return "id";
  }
  if (tokens.includes("paspoort") || tokens.includes("passport")) return "passport";
  if (tokens.includes("vog")) return "vog";
  if (
    haystack.includes("work permit") ||
    tokens.includes("work_permit") ||
    tokens.includes("werkvergunning") ||
    (tokens.includes("work") && tokens.includes("permit"))
  ) {
    return "work_permit";
  }
  if (
    haystack.includes("driving licence") ||
    haystack.includes("driving license") ||
    tokens.includes("rijbewijs") ||
    (tokens.includes("driving") && (tokens.includes("licence") || tokens.includes("license")))
  ) {
    return "driving_licence";
  }
  if (tokens.includes("diploma")) return "diploma";
  if (tokens.includes("bank") || haystack.includes("bank document")) return "bank";
  return null;
}

export function isAllowedMobileDocumentType(
  item?: { type?: string; slug?: string } | null,
) {
  return getMobileDocumentGroup(item) != null;
}

export function isIdentityDocumentType(
  item?: { type?: string; slug?: string } | null,
) {
  const group = getMobileDocumentGroup(item);
  return group === "id" || group === "passport" || group === "driving_licence";
}

export function isCertificateDocumentType(
  item?: { type?: string; slug?: string } | null,
) {
  const haystack = [item?.type, item?.slug].filter(Boolean).join(" ").toLowerCase();
  return (
    haystack.includes("certificate") ||
    haystack.includes("certificaat") ||
    /(^|[^a-z])sir([^a-z]|$)/.test(haystack)
  );
}

export function getDocumentTypeLabel(item?: QuickUploadType | null) {
  if (isCertificateDocumentType(item)) return "Certificate";
  return item?.type || item?.slug || "Document";
}

export function getDocumentUploadType(item?: QuickUploadType | null) {
  if (isCertificateDocumentType(item)) return "Certificate";
  return item?.type || item?.slug || "";
}

export function isRequiredDocumentType(item?: QuickUploadType | null) {
  return isDocFlag(item?.required ?? item?.is_required ?? item?.mandatory);
}

export function requiresExpiryDate(item?: QuickUploadType | null) {
  if (isCertificateDocumentType(item)) return false;
  if (
    item?.expire_date_required !== undefined &&
    item?.expire_date_required !== null &&
    item?.expire_date_required !== ""
  ) {
    return isDocFlag(item.expire_date_required);
  }
  return isIdentityDocumentType(item);
}

export function isMultiPhotoType(item?: QuickUploadType | null) {
  return isDocFlag(item?.allow_multiple) || isCertificateDocumentType(item);
}

function toCertificateCard(fromApi?: QuickUploadType | null): QuickUploadType {
  if (!fromApi) return DEFAULT_CERTIFICATE_TYPE;
  return {
    ...fromApi,
    type: "Certificate",
    slug: fromApi.slug && !/sir/i.test(fromApi.slug) ? fromApi.slug : "certificate",
    min_photos: 1,
    allow_multiple: true,
    accept_pdf: fromApi.accept_pdf ?? true,
    expire_date_required: false,
    max_files: fromApi.max_files ?? 24,
  };
}

export function buildUploadTypeCards(
  mobileTypes: QuickUploadType[],
  allTypes: QuickUploadType[] = [],
) {
  const source = allTypes.length ? allTypes : mobileTypes;
  const extras = allTypes.length ? mobileTypes : [];
  const merged: QuickUploadType[] = [];
  const seen = new Set<string>();
  let certificateFromApi: QuickUploadType | undefined;

  [...source, ...extras].forEach((item) => {
    if (!item || isPayslipDocumentType(item) || !isAllowedMobileDocumentType(item)) return;
    if (
      item.show_on_mobile !== undefined &&
      item.show_on_mobile !== null &&
      item.show_on_mobile !== "" &&
      !isDocFlag(item.show_on_mobile)
    ) {
      return;
    }
    const group = getMobileDocumentGroup(item);
    if (!group || group === "certificate") {
      if (group === "certificate" && !certificateFromApi) certificateFromApi = item;
      return;
    }
    if (seen.has(group)) return;
    seen.add(group);
    merged.push(item);
  });

  return [...merged, toCertificateCard(certificateFromApi)].sort((left, right) => {
    const leftIndex = MOBILE_DOCUMENT_ORDER.indexOf(
      getMobileDocumentGroup(left) || "certificate",
    );
    const rightIndex = MOBILE_DOCUMENT_ORDER.indexOf(
      getMobileDocumentGroup(right) || "certificate",
    );
    return leftIndex - rightIndex;
  });
}

export function getDocumentUploadProgress(
  types: QuickUploadType[],
  documents: RelatieDocument[],
) {
  const total = types.length;
  if (!total) {
    return { done: 0, total: 0, remaining: 0, percent: 0 };
  }

  const uploadedGroups = new Set<string>();
  documents.forEach((doc) => {
    const group = getMobileDocumentGroup({ type: doc.type, slug: "" });
    if (group) uploadedGroups.add(group);
  });

  const done = types.filter((item) => {
    const group = getMobileDocumentGroup(item);
    return Boolean(group && uploadedGroups.has(group));
  }).length;

  return {
    done,
    total,
    remaining: Math.max(total - done, 0),
    percent: Math.round((done / total) * 100),
  };
}

export function isPayslipDocumentType(item?: { type?: string; slug?: string; label_name?: string } | null) {
  const haystack = [item?.type, item?.slug, item?.label_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    haystack.includes("loonstrook") ||
    haystack.includes("payslip") ||
    haystack.includes("jaaropgave")
  );
}

export function isPdfFile(file?: { name?: string; type?: string } | null) {
  if (!file) return false;
  return (
    String(file.type || "").toLowerCase().includes("pdf") ||
    String(file.name || "").toLowerCase().endsWith(".pdf")
  );
}

export function buildTypeSubtitle(item: QuickUploadType) {
  const parts: string[] = [];
  const minPhotos = getMinPhotos(item);
  if (isRequiredDocumentType(item)) {
    parts.push("Required");
  }
  if (minPhotos === 1) {
    parts.push(isDocFlag(item.accept_pdf) ? "Photo or PDF" : "At least 1 photo");
  } else {
    parts.push(`At least ${minPhotos} photos`);
  }
  if (requiresExpiryDate(item)) {
    parts.push("Expiry date required");
  }
  if (isMultiPhotoType(item)) {
    parts.push("Add multiple photos");
  }
  return parts.join(" · ") || "Upload document photo";
}

export function resolveDocumentFileType(doc: RelatieDocument | null | undefined) {
  const explicit = String(doc?.file_type || "").toLowerCase();
  if (explicit === "image" || explicit === "pdf") return explicit;

  const ext = String(doc?.file_extension || "")
    .toLowerCase()
    .replace(/^\./, "");
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "bmp"].includes(ext)) {
    return "image";
  }
  if (ext === "pdf") return "pdf";
  return explicit || "file";
}
