import type { Router } from "expo-router";
import type { CalendarWorkDetail } from "../services/calendarTimelineService";

export function navigateFromCalendarWorkDetail(
  router: Pick<Router, "push">,
  item: CalendarWorkDetail
) {
  const id = String(item.details_id ?? "");
  if (!id) return;

  const screen = item.screen_name?.trim();
  if (screen === "Details" || screen === "Workorder") {
    router.push({
      pathname: "/(app)/work-orders/[id]",
      params: { id, color: item.color || "" },
    } as never);
    return;
  }

  if (screen === "Taskdetails" || screen === "Tasklist") {
    router.push({
      pathname: "/(app)/tasks/[id]",
      params: { id, color: item.color || "" },
    } as never);
  }
}
