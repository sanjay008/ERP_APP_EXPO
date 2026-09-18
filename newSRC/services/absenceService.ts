import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";

export type AbsenceLeaveItem = {
  id: number | string;
  date?: string;
  total_hours?: string | number;
  start_time?: string;
  end_time?: string;
  reason_field?: string;
  leave_absence_store?: number;
  leave_log?: { created_at?: string; user_name?: { username?: string } };
  leave_type_data?: {
    id?: string | number;
    leave_type_id?: string | number;
    leave_type_name?: string;
    leave_hour_system?: number;
  };
  leave_type?: string | number;
  leave_type_id?: string | number;
  status_data?: { status_name?: string; color?: string };
  status_permission?: { read?: boolean };
  permissions?: { permission_edit?: boolean; permission_delete?: boolean };
  permission?: { edit?: boolean; delete?: boolean };
  employementdata?: { contract_name?: string; id?: string | number };
  employerscheduledata?: {
    day?: string;
    start_time?: string;
    end_time?: string;
  };
  contract_id?: string | number;
  schedule_id?: string | number;
  schedule_total_time?: string | number;
  schedule_start_time?: string;
  schedule_end_time?: string;
  schedule_break_time?: string;
};

export type LeaveTimelineDate = {
  date: string;
  schedule_id?: string | number;
  total_hours?: string | number;
};

export type LeaveTypeItem = {
  id: string | number;
  leave_type_name?: string;
};

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
};

async function post<T>(endpoint: string, data?: Record<string, unknown>) {
  const response = await apiClient.post<ApiBody<T>>(endpoint, data ?? {});
  return response.data;
}

export async function fetchLeaveAbsenceList(contractId: string | number, relatiesId?: string | number) {
  try {
    const response = await post<AbsenceLeaveItem[]>(apiConstants.Absencerequest, {
      contract_id: contractId,
      ...(relatiesId ? { relaties_id: relatiesId } : {}),
    });
    if (!response?.status) {
      const message = (response?.message || "").toLowerCase();
      // Backend returns status:false with "No leave absences found..." when empty
      if (
        message.includes("not found") ||
        message.includes("no leave") ||
        message.includes("no absence") ||
        message.includes("no data")
      ) {
        return [];
      }
      throw toAppApiError({ message: response?.message || "Failed to fetch leave requests" });
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("not found") ||
        message.includes("no leave") ||
        message.includes("no absence") ||
        message.includes("no data")
      ) {
        return [];
      }
    }
    throw error;
  }
}

export async function fetchAdditionalLeaves(contractId: string | number) {
  try {
    const response = await post<AbsenceLeaveItem[]>(apiConstants.getadditionalleave, {
      contract_id: contractId,
    });
    return response?.status && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchAbsenceLeaves(contractId: string | number) {
  try {
    const response = await post<AbsenceLeaveItem[]>(apiConstants.getabsenceleaves, {
      contract_id: contractId,
    });
    return response?.status && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchSwitchDates(contractId: string | number) {
  try {
    const response = await post<AbsenceLeaveItem[]>(apiConstants.getswitchdates, {
      contract_id: contractId,
    });
    return response?.status && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchHrStatuses() {
  try {
    const response = await post<Array<{ id: string | number; status_name?: string; color?: string }>>(
      apiConstants.getstatus,
      { slug: "human_resource_view" }
    );
    return response?.status && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function fetchLeaveTypes(contractId: string | number) {
  const response = await post<LeaveTypeItem[]>(apiConstants.getleavetypes, {
    contract_id: contractId,
  });
  return response?.status && Array.isArray(response.data) ? response.data : [];
}

export async function fetchLeaveTimelineDates(contractId: string | number) {
  const response = await post<LeaveTimelineDate[]>(apiConstants.get_time_line_by_employee_id, {
    contract_id: contractId,
  });
  const rows = response?.status && Array.isArray(response.data) ? response.data : [];
  return rows
    .map((item) => ({
      date: String(item?.date || ""),
      schedule_id: item?.schedule_id,
      total_hours: item?.total_hours,
    }))
    .filter((item) => item.date);
}

export async function fetchLeaveAbsenceDetails(leaveId: string | number) {
  const response = await post<AbsenceLeaveItem | AbsenceLeaveItem[]>(
    apiConstants.Absencerequestdetails,
    { leave_id: leaveId }
  );
  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to fetch leave details" });
  }
  const data = response.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function deleteLeaveAbsence(leaveId: string | number) {
  return post(apiConstants.deleteleaveabsence, { leave_id: leaveId });
}

export async function submitLeaveAbsence(leaveId: string | number, relatiesId?: string | number) {
  const extra = relatiesId ? { relaties_id: relatiesId } : {};

  // Old app always called update_leave_absence even if conflict check failed.
  // Blocking on check_conflicting_hours showed "already sent" for the wrong user.
  await post(apiConstants.check_conflicting_hours, {
    leave_id: leaveId,
    ...extra,
  });

  const response = await post(apiConstants.update_leave_absence, {
    leave_id: leaveId,
    ...extra,
  });
  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to submit leave" });
  }
  return response;
}

export async function updateLeaveAbsenceStatus(leaveId: string | number, statusId: string | number) {
  return post(apiConstants.approvedstatus, { leave_id: leaveId, status_id: statusId });
}

export async function storeLeaveRequest(payload: Record<string, unknown>) {
  const response = await post(apiConstants.storeleaveabsence, payload);
  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to create leave" });
  }
  return response;
}

export async function storeAbsenceRequest(payload: Record<string, unknown>) {
  const response = await post(apiConstants.store_absence, payload);
  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to create absence" });
  }
  return response;
}

export async function updateLeaveRequest(payload: Record<string, unknown>) {
  const response = await post(apiConstants.editleaveabsence, payload);
  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to update leave" });
  }
  return response;
}

export function formatAbsenceLogDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString();
}
