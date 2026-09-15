import type { HomeTaskType } from "../../services/taskService";

export function getHomeTaskScreenTitle(linkTo: HomeTaskType, fallback?: string) {
  switch (linkTo) {
    case "task_house":
      return "Add Task For Home";
    case "task_child":
      return "Add Task For Child";
    case "task_user":
      return "Add Task For User";
    case "task_multiple_user":
      return fallback || "Add Task For Multiple Users";
    default:
      return fallback || "Add Task";
  }
}

export function parseHomeTaskType(value?: string): HomeTaskType {
  if (
    value === "task_house" ||
    value === "task_child" ||
    value === "task_user" ||
    value === "task_multiple_user"
  ) {
    return value;
  }
  return "task_house";
}
