import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type TimelineEndpointType =
  | "Task"
  | "Workoder"
  | "Project"
  | "Office"
  | "Home"
  | string;

export type TimelineItem = {
  id?: number | string;
  cico_status?: "Check-in" | "Check-out" | string;
  cico_bg_color?: string;
  check_in_date?: string;
  check_out_date?: string;
  check_in_date_with_day?: string;
  check_out_date_with_day?: string;
  check_in_time?: string;
  check_out_time?: string;
  break_time?: string;
  stop_time?: string | null;
  check_in_end_point_type?: TimelineEndpointType;
  check_out_end_point_type?: TimelineEndpointType;
  check_in_end_point_address?: string;
  check_out_end_point_address?: string;
  check_in_end_point_data?: { id?: number | string };
  check_out_end_point_data?: { id?: number | string };
  [key: string]: unknown;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchTimelineCheckInOut() {
  const ctx = await getUserContext();
  return ApiService<TimelineItem[]>(apiConstants.timelinedata, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export function getTimelineItemDate(item: TimelineItem): string {
  const isCheckIn = item.cico_status === "Check-in";
  return (isCheckIn ? item.check_in_date : item.check_out_date) ?? "";
}

export function parseTimelineDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const direct = new Date(dateStr);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function getWeekRange(reference = new Date()) {
  const ref = new Date(reference);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(ref);
  start.setDate(ref.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMonthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function filterTimelineByRange(
  items: TimelineItem[],
  mode: "week" | "month",
  reference = new Date()
): TimelineItem[] {
  const { start, end } = mode === "week" ? getWeekRange(reference) : getMonthRange(reference);

  return items.filter((item) => {
    const dateStr = getTimelineItemDate(item);
    const parsed = parseTimelineDate(dateStr);
    if (!parsed) return true;
    return parsed >= start && parsed <= end;
  });
}

export function getEndpointTitle(item: TimelineItem, isCheckIn: boolean): string {
  const endPointType = isCheckIn
    ? item.check_in_end_point_type
    : item.check_out_end_point_type;

  const endpointData =
    (item[`${isCheckIn ? "check_in" : "check_out"}_end_point_${endPointType}_data`] as
      | Record<string, unknown>
      | undefined) ?? {};

  if (endPointType === "Task") {
    return String(endpointData.title ?? "Default Task Title");
  }
  if (endPointType === "Workoder") {
    return String(endpointData.order_name ?? "Default Workorder Title");
  }
  if (endPointType === "Project") {
    return String(endpointData.project_name ?? "Default Project Title");
  }
  if (endPointType === "Office") {
    const relatie = endpointData.relatie as { display_name?: string } | undefined;
    return relatie?.display_name ?? "Default Office Name";
  }
  return endPointType ?? "Unknown Type";
}

export function getEndpointAddress(item: TimelineItem, isCheckIn: boolean): string {
  const endPointType = isCheckIn
    ? item.check_in_end_point_type
    : item.check_out_end_point_type;
  const endPointAddress = isCheckIn
    ? item.check_in_end_point_address
    : item.check_out_end_point_address;

  if (endPointType === "Home" || !endPointAddress) return "";
  return endPointAddress.split(",").slice(0, -1).join(",").trim();
}
