import apiClient from "../utils/client";
import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";
import { fetchEmployeeContracts } from "./employeeService";

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

export async function fetchLeaveTypes(contractId: string | number, relatiesId?: string | number) {
  const response = await post<LeaveTypeItem[]>(apiConstants.getleavetypes, {
    contract_id: contractId,
    ...(relatiesId ? { relaties_id: relatiesId } : {}),
  });
  return response?.status && Array.isArray(response.data) ? response.data : [];
}

/** Old APK: contract.employer_id, not the employee relaties id. */
export async function resolveAbsenceEmployerId(contractId: string | number) {
  try {
    const response = await fetchEmployeeContracts();
    const match = (response.data || []).find((item) => String(item.id) === String(contractId));
    if (match?.employer_id == null || String(match.employer_id) === "") return undefined;
    return match.employer_id;
  } catch {
    return undefined;
  }
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

export async function submitLeaveAbsence(leaveId: string | number) {
  // Old Absencerequest.js Submit (Leave Requests only):
  // checkconflictinghours(id) + update_leave_absence(id) together, FormData + logged-in user.
  const userData = await getData("USERDATA");
  const auth = {
    user_id: userData?.data?.user?.id,
    relaties_id: userData?.data?.relaties?.id,
    role: userData?.data?.user?.role,
  };

  const conflictPromise = ApiService(apiConstants.check_conflicting_hours, {
    includeToken: true,
    customData: {
      ...auth,
      leave_id: leaveId,
    },
  });

  const updatePromise = ApiService(apiConstants.update_leave_absence, {
    includeToken: true,
    customData: {
      ...auth,
      leave_id: leaveId,
    },
  });

  const [conflictRes, updateRes] = await Promise.all([conflictPromise, updatePromise]);

  // Old: update_leave_absence success drives refresh even if check also ran.
  if (updateRes?.status) {
    return updateRes;
  }

  // Prefer the clearer conflict message when both fail (old showed check alert too).
  if (!conflictRes?.status && conflictRes?.message) {
    throw toAppApiError({ message: conflictRes.message });
  }

  throw toAppApiError({
    message: updateRes?.message || "Leave Not Submitted.",
  });
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
  const next = { ...payload };
  if (next.absence_employer_id == null || String(next.absence_employer_id) === "") {
    const employerId = await resolveAbsenceEmployerId(next.contract_id as string | number);
    if (employerId == null) {
      throw toAppApiError({ message: "The Absence Employer ID field is required." });
    }
    next.absence_employer_id = employerId;
  }
  const response = await post(apiConstants.store_absence, next);
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
