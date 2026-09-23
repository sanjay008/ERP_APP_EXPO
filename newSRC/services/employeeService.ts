import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { isEmptyListResponse, toAppApiError } from "../utils/apiError";

export type EmployeeStatus = {
  id: number | string;
  status_name?: string;
  color?: string;
};

export type EmployeeContractItem = {
  id: number;
  relaties_id?: number;
  contract_name?: string;
  from?: string;
  end?: string;
  contract_month?: string;
  contract_hour_per_week?: string | number;
  minimal_hour_per_week?: string | number;
  maximum_hour_per_week?: string | number;
  contract_status?: number;
  period_name?: string;
  status_name?: string;
  color?: string;
  display_name?: string;
  total_leave_hours?: string | number;
  cao_contract?: string;
  positiondata?: { position_title?: string };
  contract_template_data?: { template_name?: string };
  leave_details?: Record<string, unknown>;
  created_at?: string;
};

export type LeaveDetailRow = {
  start?: string | number;
  approved?: string | number;
  left?: string | number;
};

export type EmployeeContractDetail = {
  display_name?: string;
  contract?: EmployeeContractItem;
  leave_details?: Record<string, LeaveDetailRow>;
  Afwezig?: { total_hours?: string | number; days?: string | number };
};

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
};

/** Same payload as old src/screens/Employee.js — uses apiClient for consistent auth fields. */
export async function fetchEmployeeContracts() {
  const response = await apiClient.post<
    ApiBody<
      Array<{
        contract: EmployeeContractItem;
        display_name?: string;
        leave_details?: Record<string, LeaveDetailRow>;
      }>
    >
  >(apiConstants.employee);

  const body = response.data;

  if (!body?.status || !Array.isArray(body.data)) {
    if (isEmptyListResponse(body) || (body?.status && !Array.isArray(body.data))) {
      return { ...body, data: [] };
    }
    throw toAppApiError({ message: body?.message || "Failed to fetch employee contracts" });
  }

  const items = body.data.map((item) => ({
    ...item.contract,
    display_name: item.display_name,
    leave_details: item.leave_details,
  }));

  return { ...body, data: items };
}

export async function fetchEmployeeContractStatuses() {
  const response = await apiClient.post<ApiBody<EmployeeStatus[]>>(
    apiConstants.getstatus,
    { slug: "employee_contract" }
  );
  return response.data ?? { status: false, data: [] };
}

export async function fetchEmployeeContractDetails(contractId: string | number) {
  const response = await apiClient.post<ApiBody<EmployeeContractDetail>>(
    apiConstants.employeedetails,
    { contract_id: contractId }
  );
  return response.data ?? { status: false, data: undefined };
}

export function formatEmployeeDate(dateString?: string | null) {
  if (!dateString) return "-";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

export type EmployeeTimeRow = {
  id?: string | number;
  current_date?: string;
  start_time?: string;
  end_time?: string;
  original_start_time?: string;
  original_end_time?: string;
  original_break_time?: string;
  formatted_total_over_time?: string;
  approved_disapproved?: number;
  description?: string;
  schedule_status?: string;
};

export async function fetchEmployeeTimeRegistration(year: number, month: string) {
  const response = await apiClient.post<
    ApiBody<EmployeeTimeRow[]>
  >(apiConstants.getemployeetimeregistration, { year, month });

  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    if (isEmptyListResponse(body) || (body?.status && !Array.isArray(body.data))) {
      return [];
    }
    throw toAppApiError({ message: body?.message || "Failed to fetch timesheet" });
  }
  return body.data;
}

export function formatEmployeeTimeDate(dateString?: string) {
  if (!dateString) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day} ${months[parseInt(month, 10) - 1]}`;
}

export function formatTimeShort(time?: string) {
  if (!time) return "";
  return time.length > 5 ? time.slice(0, 5) : time;
}
