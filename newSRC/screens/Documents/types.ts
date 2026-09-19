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
  if (!Number.isFinite(n) || n < 1) return 2;
  return Math.min(Math.floor(n), 6);
}

export function getMaxFiles(item?: QuickUploadType | null) {
  const n = Number(item?.max_files);
  if (!Number.isFinite(n) || n < 1) return 24;
  return Math.min(Math.floor(n), 24);
}

export function isIdentityDocumentType(
  item?: { type?: string; slug?: string } | null,
) {
  const slug = String(item?.slug || "").toLowerCase();
  const type = String(item?.type || "").toLowerCase();
  return (
    slug === "id" ||
    type === "id" ||
    slug.includes("driving_licence") ||
    type.includes("driving licence") ||
    slug.includes("paspoort") ||
    type.includes("paspoort") ||
    slug.includes("niwo") ||
    type.includes("niwo")
  );
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

export function isMultiPhotoType(item?: QuickUploadType | null) {
  return isDocFlag(item?.allow_multiple) || isCertificateDocumentType(item);
}

export function buildUploadTypeCards(
  mobileTypes: QuickUploadType[],
  allTypes: QuickUploadType[] = [],
) {
  const identitySource = mobileTypes.length
    ? mobileTypes
    : allTypes.filter(isIdentityDocumentType);

  const base = identitySource.filter(
    (item) => !isCertificateDocumentType(item) && !isPayslipDocumentType(item),
  );

  const fromApi =
    allTypes.find(isCertificateDocumentType) ||
    identitySource.find(isCertificateDocumentType);
  const certificate: QuickUploadType = fromApi
    ? {
        ...fromApi,
        type: fromApi.type || "Certificate",
        min_photos: 1,
        allow_multiple: true,
        accept_pdf: fromApi.accept_pdf ?? true,
        expire_date_required: false,
        max_files: fromApi.max_files ?? 24,
      }
    : DEFAULT_CERTIFICATE_TYPE;

  return [...base, certificate];
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
  if (minPhotos === 1) {
    parts.push(isDocFlag(item.accept_pdf) ? "Photo or PDF" : "At least 1 photo");
  } else {
    parts.push(`At least ${minPhotos} photos`);
  }
  if (
    !isCertificateDocumentType(item) &&
    isDocFlag(item.expire_date_required, true)
  ) {
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
