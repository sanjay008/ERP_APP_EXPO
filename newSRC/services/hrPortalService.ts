import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { isEmptyListResponse, takeApiItem, takeApiList, toAppApiError } from "../utils/apiError";

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
};

export type AnnouncementItem = {
  id: number | string;
  title?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type PayslipItem = {
  id: number | string;
  filename?: string;
  type?: string;
  month?: number | string;
  year?: number | string;
  period_label?: string;
  view_url?: string;
  download_url?: string;
  shared_link?: string;
  file_extension?: string;
  file_type?: string;
  status_name?: string;
  created_at?: string;
};

export type PerformanceReviewItem = {
  id: number | string;
  title?: string;
  review_date?: string;
  period_start?: string;
  period_end?: string;
  status?: string;
  rating?: number | string;
  reviewer_name?: string;
  summary?: string;
  goals?: string;
  employee_comments?: string;
  created_at?: string;
  updated_at?: string;
};

function asArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>)[key];
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
}

function asObject<T>(data: unknown, key: string): T | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record[key] && typeof record[key] === "object") {
    return record[key] as T;
  }
  if ("id" in record) return data as T;
  return null;
}

export function formatHrDate(value?: string | null) {
  if (!value) return "-";
  const datePart = value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day || year === "0000") return value;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthName = months[parseInt(month, 10) - 1];
  if (!monthName) return value;
  return `${day} ${monthName} ${year}`;
}

export async function fetchAnnouncements() {
  const response = await apiClient.post<
    ApiBody<{ announcements?: AnnouncementItem[] } | AnnouncementItem[]>
  >(apiConstants.announcementsList);

  return takeApiList(
    response.data,
    (data) => asArray<AnnouncementItem>(data, "announcements"),
    "Failed to fetch announcements"
  );
}

export async function fetchAnnouncementDetails(announcementId: string | number) {
  const response = await apiClient.post<
    ApiBody<{ announcement?: AnnouncementItem } | AnnouncementItem>
  >(apiConstants.announcementsDetails, { announcement_id: announcementId });

  return takeApiItem(
    response.data,
    (data) => asObject<AnnouncementItem>(data, "announcement"),
    "Failed to fetch announcement"
  );
}

export async function fetchPayslips(year?: string | number) {
  const response = await apiClient.post<
    ApiBody<{ payslips?: PayslipItem[] } | PayslipItem[]>
  >(apiConstants.payslipsList, year ? { year } : {});

  return takeApiList(
    response.data,
    (data) => asArray<PayslipItem>(data, "payslips"),
    "Failed to fetch payslips"
  );
}

export async function fetchPayslipDetails(payslipId: string | number) {
  const response = await apiClient.post<
    ApiBody<{ payslip?: PayslipItem } | PayslipItem>
  >(apiConstants.payslipsDetails, { payslip_id: payslipId });

  return takeApiItem(
    response.data,
    (data) => asObject<PayslipItem>(data, "payslip"),
    "Failed to fetch payslip"
  );
}

export async function fetchPerformanceReviews() {
  const response = await apiClient.post<
    ApiBody<{
      reviews?: PerformanceReviewItem[];
      table_ready?: boolean;
    } | PerformanceReviewItem[]>
  >(apiConstants.performanceReviewsList);

  const body = response.data;
  if (!body?.status) {
    if (isEmptyListResponse(body)) {
      return { reviews: [], tableReady: true };
    }
    throw toAppApiError({
      message: body?.message || "Failed to fetch performance reviews",
    });
  }

  const data = body.data;
  const tableReady =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as { table_ready?: boolean }).table_ready !== false
      : true;

  return {
    reviews: asArray<PerformanceReviewItem>(data, "reviews"),
    tableReady,
  };
}

export async function fetchPerformanceReviewDetails(reviewId: string | number) {
  const response = await apiClient.post<
    ApiBody<{ review?: PerformanceReviewItem } | PerformanceReviewItem>
  >(apiConstants.performanceReviewsDetails, { review_id: reviewId });

  return takeApiItem(
    response.data,
    (data) => asObject<PerformanceReviewItem>(data, "review"),
    "Failed to fetch review"
  );
}
