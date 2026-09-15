import type { Router } from "expo-router";

export type HomeMenuItem = {
  id: number | string;
  color_code?: string;
  item_image?: string;
  item_title: string;
  link_to?: string;
};

type HomeRoute = {
  pathname:
    | "/(app)/connections"
    | "/(app)/projects"
    | "/(app)/tasks"
    | "/(app)/tickets"
    | "/(app)/work-orders"
    | "/(app)/tenant-contracts"
    | "/(app)/employees"
    | "/(app)/profile"
    | "/(app)/check-in-out"
    | "/(app)/check-in-out/project"
    | "/(app)/employee-time"
    | "/(app)/child-time"
    | "/(app)/project-time"
    | "/(app)/home-tasks/create"
    | "/(app)/home-tasks/multiple-user"
    | "/(app)/customers"
    | "/(app)/bookings"
    | "/(app)/bookings/past"
    | "/(app)/my-company"
    | "/(app)/products"
    | "/(app)/events"
    | "/(app)/my-bookings"
    | "/(app)/pay-job"
    | "/(app)/pay-order"
    | "/(app)/about";
  params?: Record<string, string>;
};

/**
 * Maps API `link_to` values from get_home_items to app routes.
 * Old src/Home.js uses the same keys.
 */
const HOME_ROUTE_MAP: Record<string, (item: HomeMenuItem) => HomeRoute> = {
  connections: (item) => ({
    pathname: "/(app)/connections",
    params: { color: item.color_code || "" },
  }),
  child: (item) => ({
    pathname: "/(app)/connections",
    params: {
      color: item.color_code || "",
      type: "child",
    },
  }),
  project: (item) => ({
    pathname: "/(app)/projects",
    params: { color: item.color_code || "" },
  }),
  tasks: (item) => ({
    pathname: "/(app)/tasks",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Tasks/Complaints",
    },
  }),
  Ticket: () => ({
    pathname: "/(app)/tickets",
  }),
  workorders: (item) => ({
    pathname: "/(app)/work-orders",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Work Orders",
    },
  }),
  tenantcontracts: (item) => ({
    pathname: "/(app)/tenant-contracts",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Tenant Contracts",
    },
  }),
  employees: (item) => ({
    pathname: "/(app)/employees",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Employees",
    },
  }),
  checkinout: () => ({
    pathname: "/(app)/check-in-out",
  }),
  absence_request_employee: (item) => ({
    pathname: "/(app)/employees",
    params: {
      color: item.color_code || "",
      type: "leaverequest",
      title: item.item_title || "Absence & Request",
    },
  }),
  employee_time_registration: (item) => ({
    pathname: "/(app)/employee-time",
    params: {
      color: item.color_code || "",
    },
  }),
  child_time_registration: (item) => ({
    pathname: "/(app)/child-time",
    params: {
      color: item.color_code || "",
    },
  }),
  project_time_registration: (item) => ({
    pathname: "/(app)/project-time",
    params: {
      color: item.color_code || "",
    },
  }),
  task_house: (item) => ({
    pathname: "/(app)/home-tasks/create",
    params: {
      linkTo: "task_house",
      color: item.color_code || "",
      title: item.item_title || "Add Task For Home",
    },
  }),
  task_child: (item) => ({
    pathname: "/(app)/home-tasks/create",
    params: {
      linkTo: "task_child",
      color: item.color_code || "",
      title: item.item_title || "Add Task For Child",
    },
  }),
  task_user: (item) => ({
    pathname: "/(app)/home-tasks/create",
    params: {
      linkTo: "task_user",
      color: item.color_code || "",
      title: item.item_title || "Add Task For User",
    },
  }),
  task_multiple_user: (item) => ({
    pathname: "/(app)/home-tasks/multiple-user",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Add Task For Multiple Users",
    },
  }),
  customers: (item) => ({
    pathname: "/(app)/customers",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Customers",
    },
  }),
  bookinglist: (item) => ({
    pathname: "/(app)/bookings",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Booking List",
    },
  }),
  AllPastBooking: (item) => ({
    pathname: "/(app)/bookings/past",
    params: {
      color: item.color_code || "",
      title: item.item_title || "All Past Booking",
    },
  }),
  MyCompany: (item) => ({
    pathname: "/(app)/my-company",
    params: {
      color: item.color_code || "",
      title: item.item_title || "My Company",
    },
  }),
  EcommerceTemplate: (item) => ({
    pathname: "/(app)/products",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Ecommerce Product",
    },
  }),
  EventList: (item) => ({
    pathname: "/(app)/events",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Event List",
    },
  }),
  MyBookings: (item) => ({
    pathname: "/(app)/my-bookings",
    params: {
      color: item.color_code || "",
      title: item.item_title || "My Booking",
    },
  }),
  "Check_In/Out_for_Project": () => ({
    pathname: "/(app)/check-in-out/project",
  }),
  relaties: () => ({
    pathname: "/(app)/profile",
  }),
  pay_job: (item) => ({
    pathname: "/(app)/pay-job",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Pay Job",
    },
  }),
  pay_order: (item) => ({
    pathname: "/(app)/pay-order",
    params: {
      color: item.color_code || "",
      title: item.item_title || "Pay order",
    },
  }),
};

export function logHomeItems(items: HomeMenuItem[]) {
  console.log(
    "🏠 Home API => get_home_items | items:",
    items.map((item) => ({
      id: item.id,
      title: item.item_title,
      link_to: item.link_to,
      color_code: item.color_code,
    }))
  );
}

export function navigateFromHomeItem(
  router: Pick<Router, "push">,
  item: HomeMenuItem
): boolean {
  const linkTo = item.link_to?.trim();

  if (!linkTo) {
    console.log("🏠 HomeNav: missing link_to for", item.item_title);
    return false;
  }

  const resolver = HOME_ROUTE_MAP[linkTo];
  if (!resolver) {
    console.log("🏠 HomeNav: screen not wired yet for link_to =", linkTo);
    return false;
  }

  const route = resolver(item);
  console.log(
    "🏠 HomeNav:",
    linkTo,
    "→",
    route.pathname,
    route.params ?? "(no params)"
  );

  router.push(route as never);
  return true;
}
