import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";

export type ScheduleIcon = {
  viewBox?: string;
  path?: string;
};

export type CalendarWorkDetail = {
  screen_name?: string;
  details_id?: number | string;
  color?: string;
  display_title?: string;
  display_id?: number | string;
};

export type CalendarScheduleItem = {
  date?: string;
  day?: string;
  class?: string;
  start_time?: string;
  end_time?: string;
  break_time?: string;
  total_time?: string;
  schedule_status?: string;
  schedule_status_text?: string;
  schedule_status_background_color?: string;
  schedule_status_text_color?: string;
  schedule_status_icon?: ScheduleIcon;
  emp_schedule_status_icon?: ScheduleIcon[];
  is_overtime?: boolean | number;
  overtime?: string | number;
  work_details?: CalendarWorkDetail[];
};

export type CalendarBreakItem = {
  start_time?: string;
  end_time?: string;
  total_break_time?: string;
  stand_by_relaties_data?: { display_name?: string } | null;
  icon?: ScheduleIcon;
};

export type CalendarTimelineItem = {
  date?: string;
  day_of_week?: string;
  display_date?: string;
  calendar_data?: {
    success?: boolean;
    data?: CalendarScheduleItem[];
    break_schedule?: {
      data?: CalendarBreakItem[];
    };
  };
};

type CalendarTimelineResponse = {
  success?: boolean;
  status?: boolean;
  data?: CalendarTimelineItem[];
  message?: string;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    token: userData?.data?.user?.verify_token,
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

function stringifyCalendarLog(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return payload;
  }
}

function logCalendarApi(label: string, payload: unknown) {
  console.log(`📅 CALENDAR API ${label}`, stringifyCalendarLog(payload));
}

function logCalendarDataDays(response: CalendarTimelineResponse) {
  const days = Array.isArray(response.data) ? response.data : [];
  days.forEach((item, index) => {
    console.log(
      `📅 CALENDAR DATA [${index}] ${item.display_date || item.date || ""}`,
      stringifyCalendarLog(item.calendar_data),
    );
  });
}

export async function fetchCalendarTimeline(date: string) {
  const ctx = await getUserContext();
  const request = {
    url: apiConstants.timeline,
    token: ctx.token,
    role: ctx.role,
    relaties_id: ctx.relaties_id,
    user_id: ctx.user_id,
    s_date: date,
    e_date: date,
  };

  logCalendarApi("REQUEST => get_timeline", request);

  try {
    const response = (await ApiService<CalendarTimelineItem[]>(apiConstants.timeline, {
      includeToken: true,
      customData: {
        role: ctx.role,
        relaties_id: ctx.relaties_id,
        user_id: ctx.user_id,
        s_date: date,
        e_date: date,
      },
    })) as CalendarTimelineResponse;

    logCalendarApi("RESPONSE => get_timeline", response);
    logCalendarDataDays(response);

    const ok = response.success || response.status;
    if (!ok) {
      throw toAppApiError({
        message: response.message || "Failed to fetch calendar timeline",
      });
    }

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const err = error as { message?: string; response?: { data?: unknown } };
    logCalendarApi("ERROR => get_timeline", err?.response?.data || err?.message || error);
    throw error;
  }
}

export function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getIsoWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
