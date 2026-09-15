import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";

export type TimeRegistrationRow = {
  id?: string | number;
  current_date?: string;
  start_time?: string;
  end_time?: string;
  original_start_time?: string;
  original_end_time?: string;
  original_break_time?: string;
  break_time?: string;
  formatted_total_over_time?: string;
  total_time?: string;
  approved_disapproved?: number;
  description?: string;
  schedule_status?: string;
};

export type ProjectTimeListItem = {
  id: string | number;
  project_name?: string;
  project_image?: string;
  relaties_owners?: Array<{ display_name?: string }>;
};

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
};

export const TIME_REGISTRATION_MONTHS = [
  { id: "01", label: "January" },
  { id: "02", label: "February" },
  { id: "03", label: "March" },
  { id: "04", label: "April" },
  { id: "05", label: "May" },
  { id: "06", label: "June" },
  { id: "07", label: "July" },
  { id: "08", label: "August" },
  { id: "09", label: "September" },
  { id: "10", label: "October" },
  { id: "11", label: "November" },
  { id: "12", label: "December" },
] as const;

export function formatTimeRegistrationDate(dateString?: string) {
  if (!dateString) return "-";
  if (!dateString.includes("-")) return dateString;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day} ${months[parseInt(month, 10) - 1]}`;
}

export function formatTimeShort(time?: string) {
  if (!time) return "";
  return time.length > 5 ? time.slice(0, 5) : time;
}

async function fetchRows(endpoint: string, payload: Record<string, unknown>) {
  const response = await apiClient.post<ApiBody<TimeRegistrationRow[]>>(endpoint, payload);
  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    throw toAppApiError({ message: body?.message || "Failed to fetch time registration" });
  }
  return body.data;
}

export function fetchEmployeeTimeRegistration(year: number, month: string) {
  return fetchRows(apiConstants.getemployeetimeregistration, { year, month });
}

export function fetchChildTimeRegistration(year: number, month: string) {
  return fetchRows(apiConstants.kidstimeregistration, { year, month });
}

export function fetchProjectTimeRegistration(
  projectId: string | number,
  year: number,
  month: string
) {
  return fetchRows(apiConstants.projecttimeregistration, {
    project_id: projectId,
    year,
    month,
  });
}

export async function fetchProjectsForTimeRegistration() {
  const response = await apiClient.post<ApiBody<ProjectTimeListItem[]>>(apiConstants.getprojects);
  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    throw toAppApiError({ message: body?.message || "Failed to fetch projects" });
  }
  return body.data;
}

export function buildEmployeeScheduleLabel(row: TimeRegistrationRow) {
  return `${formatTimeShort(row.start_time)}(${formatTimeShort(row.original_start_time)}) ${formatTimeShort(row.end_time)}(${formatTimeShort(row.original_end_time || "--")})`;
}

export function buildProjectScheduleLabel(row: TimeRegistrationRow) {
  return `${formatTimeShort(row.original_start_time)}-${formatTimeShort(row.original_end_time)}`;
}

export function getOvertimeBackground(approved?: number) {
  if (approved === 1) return "#E0FCE0";
  if (approved === 2) return "#F8EBEB";
  return undefined;
}
