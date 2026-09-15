import apiClient from "../utils/client";
import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData, storeData } from "../utils/storeData";
import { toAppApiError } from "../utils/apiError";
import { dedupeAsync } from "../utils/requestDedupe";

export type EmployeeContractOption = {
  id: string | number;
  title: string;
  from?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
  break_time?: string;
  day?: string;
  class_id?: string | number;
  contractDetails?: Record<string, unknown>;
  display_name?: string;
};

export type ScheduleItem = {
  start_time?: string;
  end_time?: string;
  break_time?: string;
  day?: string;
  class_id?: string | number;
  schedule_status?: Record<string, boolean>;
};

export type CheckInOutData = {
  id?: string | number;
  check_in_out?: number | string;
  display_name?: string;
  emp_contract_name?: string;
  start_time?: string;
  end_time?: string;
  original_start_time?: string;
  original_end_time?: string;
  day?: string;
  current_date?: string;
};

export type BreakTimeOption = {
  id?: string | number;
  break_time?: string;
};

export type ProjectOption = {
  id: string | number;
  project_name?: string;
  gmaps_working_address?: string;
  hour_rate?: string | number;
  travel_cost?: string | number;
};

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
  break_data?: BreakTimeOption[];
};

export function getTodayFormats() {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const formatted = today.toLocaleDateString("en-US", options);
  const [month, day, year] = formatted.split(/[\s,]+/);
  const displayDate = `${day} ${month} ${year}`;
  const apiDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const currentTime = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { displayDate, apiDate, currentTime };
}

export async function fetchActiveEmployeeContracts() {
  const response = await apiClient.post<
    ApiBody<Array<{ contract: Record<string, unknown>; display_name?: string }>>
  >(apiConstants.employee, { status_id: 33 });

  const body = response.data;
  if (!body?.status || !Array.isArray(body.data)) {
    throw toAppApiError({ message: body?.message || "Failed to fetch contracts" });
  }

  const today = new Date();
  return body.data
    .map((item) => {
      const contract = item.contract as Record<string, unknown>;
      return {
        ...contract,
        title: String(contract.contract_name || ""),
        id: contract.id as string | number,
        contractDetails: contract,
        display_name: item.display_name,
      } as EmployeeContractOption;
    })
    .filter((item) => {
      if (!item.from || !item.end) return true;
      const fromDate = new Date(String(item.from));
      const endDate = new Date(String(item.end));
      return today >= fromDate && today <= endDate;
    });
}

export async function fetchContractSchedule(contractId: string | number, apiDate: string) {
  try {
    const response = await apiClient.post<
      ApiBody<{ success?: boolean; data?: ScheduleItem[] }>
    >(apiConstants.getcontractschedule, {
      contract_id: contractId,
      contract_type: "employment_contract",
      todays_date: apiDate,
    });

    const body = response.data;
    if (!body?.status || !body.data?.success) {
      return { schedules: [] as ScheduleItem[], scheduleLabel: "" };
    }

    const schedules = Array.isArray(body.data.data) ? body.data.data : [];
    let scheduleLabel = "Scheduled";
    const first = schedules[0];
    if (first?.schedule_status) {
      if (first.schedule_status["Not Scheduled"]) scheduleLabel = "Not Scheduled";
      else if (first.schedule_status["Switch Date"]) scheduleLabel = "Switch Date";
      else if (first.schedule_status["Absence"]) scheduleLabel = "Absence";
      else if (first.schedule_status["Leave"]) scheduleLabel = "Leave";
    }

    return { schedules, scheduleLabel };
  } catch {
    return { schedules: [] as ScheduleItem[], scheduleLabel: "" };
  }
}

/** Old app sends display date e.g. "09 Oct 2024" — not yyyy-mm-dd. */
export async function fetchCheckInOutState(currentDate: string) {
  return dedupeAsync(`fetchCheckInOutState:${currentDate}`, async () => {
  try {
    const response = await apiClient.post<ApiBody<CheckInOutData>>(
      apiConstants.getcheckout,
      { current_date: currentDate }
    );

    const body = response.data;
    if (!body?.status) {
      return { checkData: null, breakTimes: [] as BreakTimeOption[], checkedIn: false };
    }

    const checkData = body.data ?? null;
    const breakTimes = Array.isArray(body.break_data) ? body.break_data : [];
    const checkedIn = Number(checkData?.check_in_out) === 1;

    if (checkData?.id) {
      await storeData("CHECK_IN_ID", checkData.id);
    }
    if (checkData?.check_in_out !== undefined) {
      await storeData("CHECKINOUT", checkData.check_in_out);
    }

    return { checkData, breakTimes, checkedIn };
  } catch {
    return { checkData: null, breakTimes: [] as BreakTimeOption[], checkedIn: false };
  }
  });
}

export async function performCheckIn(params: {
  contractId: string | number;
  scheduleItem: ScheduleItem;
  scheduleLabel: string;
  currentDate: string;
  currentTime: string;
}) {
  const { contractId, scheduleItem, scheduleLabel, currentDate, currentTime } = params;
  const response = await apiClient.post<ApiBody<CheckInOutData & { id?: string | number }>>(
    apiConstants.checkin,
    {
      contract_id: contractId,
      original_end_time: scheduleItem.end_time || "",
      original_break_time: scheduleItem.break_time || "",
      check_in_out: "1",
      original_day: scheduleItem.day || "",
      start_time: scheduleItem.start_time || "",
      original_start_time: currentTime,
      class_id: scheduleItem.class_id || "",
      schedule_status: scheduleLabel,
      current_date: currentDate,
    }
  );

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Check-in failed" });
  }

  const result = body.data;
  if (result?.id) {
    await storeData("CHECK_IN_ID", result.id);
  }
  if (result?.check_in_out !== undefined) {
    await storeData("CHECKINOUT", result.check_in_out);
  }

  return result;
}

export async function performCheckOut(params: {
  checkData: CheckInOutData;
  selectedBreak: string;
  description: string;
  currentDate: string;
  currentTime: string;
}) {
  const { checkData, selectedBreak, description, currentDate, currentTime } = params;
  const checkInId = (await getData("CHECK_IN_ID")) || checkData.id;

  const response = await apiClient.post<ApiBody<CheckInOutData>>(apiConstants.checkout, {
    start_time_check_out: checkData.start_time || "",
    end_time_check_out: checkData.end_time || "",
    description,
    check_in_out: "0",
    original_start_time_out: checkData.original_start_time,
    original_end_time_out: checkData.original_end_time || "",
    original_break_time_out: selectedBreak,
    original_day: checkData.day || "",
    check_in_id: checkInId,
    current_time_check_out: currentTime,
    current_date: currentDate,
  });

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Check-out failed" });
  }

  if (body.data?.check_in_out !== undefined) {
    await storeData("CHECKINOUT", body.data.check_in_out);
  }

  return body.data;
}

export async function fetchProjectsForCheckIn() {
  const userData = await getData("USERDATA");
  const response = await ApiService<ProjectOption[]>(apiConstants.getprojects, {
    includeToken: true,
    customData: {
      relaties_id: userData?.data?.relaties?.id,
      role: userData?.data?.user?.role,
      user_id: userData?.data?.user?.id,
    },
  });

  if (!response?.status || !Array.isArray(response.data)) {
    throw toAppApiError({ message: response?.message || "Failed to fetch projects" });
  }
  return response.data;
}

export async function fetchProjectCheckInOutState(currentDate: string) {
  return dedupeAsync(`fetchProjectCheckInOutState:${currentDate}`, async () => {
  try {
    const response = await apiClient.post<
      ApiBody<CheckInOutData & { id?: string | number; original_start_time?: string }>
    >(apiConstants.getdatacicoprojectid, { todays_date: currentDate });

    const body = response.data;
    if (!body?.status) {
      return { checkData: null, breakTimes: [] as BreakTimeOption[], checkedIn: false };
    }

    const checkData = body.data ?? null;
    const breakTimes = Array.isArray(body.break_data) ? body.break_data : [];
    const checkedIn = Number(checkData?.check_in_out) === 1;

    if (checkData?.id) {
      await storeData("CHECK_IN_ID_PROJECT", checkData.id);
    }
    if (checkData?.check_in_out !== undefined) {
      await storeData("CHECKINOUT_PROJECT", checkData.check_in_out);
    }

    return { checkData, breakTimes, checkedIn };
  } catch {
    return { checkData: null, breakTimes: [] as BreakTimeOption[], checkedIn: false };
  }
  });
}

export async function performProjectCheckIn(params: {
  project: ProjectOption;
  currentDate: string;
  currentTime: string;
  address: string;
}) {
  const { project, currentDate, currentTime, address } = params;
  const response = await apiClient.post<ApiBody<unknown>>(apiConstants.storeprojectcheckin, {
    todays_date: currentDate,
    project_id: project.id,
    currect_time: currentTime,
    currect_address: address,
    working_address: project.gmaps_working_address,
    check_in_out: "1",
    hour_rate: project.hour_rate,
    cost: project.travel_cost,
  });

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Project check-in failed" });
  }
  return body.data;
}

export async function performProjectCheckOut(params: {
  checkData: CheckInOutData & { id?: string | number; original_start_time?: string };
  selectedBreak: string;
  description: string;
  currentDate: string;
  currentTime: string;
}) {
  const { checkData, selectedBreak, description, currentDate, currentTime } = params;
  const response = await apiClient.post<ApiBody<unknown>>(apiConstants.storeprojectcheckout, {
    todays_date: currentDate,
    project_id: checkData.id,
    check_in_project_time: checkData.original_start_time,
    currect_time: currentTime,
    description,
    check_in_out: "0",
    original_project_break_time_check_in_out: selectedBreak,
  });

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Project check-out failed" });
  }
  return body.data;
}

export function formatBreakTime(time?: string) {
  if (!time) return "";
  return time.length > 5 ? time.slice(0, 5) : time;
}
