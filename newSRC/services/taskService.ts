import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type TaskStatus = {
  id: number | string;
  status_name: string;
  color?: string;
};

export type TaskItem = {
  id: number;
  title: string;
  quantity?: number | string;
  quantity_type?: string;
  deadline?: string;
  task_status_data?: TaskStatus;
};

export type TaskNote = {
  id: number;
  comment?: string;
  created_at?: string;
  user?: { username?: string };
};

export type TaskDetail = {
  id?: number;
  title?: string;
  deadline?: string | null;
  priority?: string | null;
  quantity?: number | string | null;
  quantity_type?: string | null;
  short_description?: string | null;
  file_path?: string;
  task_status_data?: TaskStatus;
  notes?: TaskNote[];
  relatie_data?: {
    display_name?: string;
    adres?: string;
    profile_image?: { file_path?: string };
  };
  service_time_tasktype?: string | null;
};

export type PriorityOption = {
  id?: number;
  value?: string;
  name?: string;
  label?: string;
};

export type RelatieOption = {
  id: number;
  display_name?: string;
  bedrijfsnaam?: string;
  profile_image?: { file_path?: string };
  telefoon_country_code?: string;
  mobiel?: string;
  email_adres?: string;
  whatsapp_number?: string;
  google_maps?: string;
};

export type HomeTaskType =
  | "task_house"
  | "task_child"
  | "task_user"
  | "task_multiple_user";

export type TaskTemplateOption = {
  id: number | string;
  title?: string;
};

export type TaxOption = {
  value?: string;
  label?: string;
};

export type CurrencyOption = {
  code?: string;
  symbol?: string;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchTasks() {
  const ctx = await getUserContext();
  return ApiService<TaskItem[]>(apiConstants.tasklist, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
    },
  });
}

export async function fetchTaskStatuses() {
  const ctx = await getUserContext();
  return ApiService<TaskStatus[]>(apiConstants.getstatus, {
    includeToken: true,
    customData: {
      slug: "task_n_order",
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchTaskDetails(taskId: string | number) {
  const ctx = await getUserContext();
  return ApiService<TaskDetail>(apiConstants.tasklistdetails, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      task_id: taskId,
    },
  });
}

export async function addTaskComment(taskId: string | number, comment: string) {
  const ctx = await getUserContext();
  return ApiService(apiConstants.tasklistcomment, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      task_id: taskId,
      comment,
    },
  });
}

export async function fetchPriorities() {
  const ctx = await getUserContext();
  return ApiService<PriorityOption[]>(apiConstants.Priority, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
    },
  });
}

export async function fetchCustomers() {
  const ctx = await getUserContext();
  return ApiService<RelatieOption[]>(apiConstants.customer, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchTaskTemplates() {
  const ctx = await getUserContext();
  return ApiService<TaskTemplateOption[]>(apiConstants.task_template, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
    },
  });
}

export async function fetchTaxes() {
  const ctx = await getUserContext();
  return ApiService<TaxOption[]>(apiConstants.tax, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
    },
  });
}

export async function fetchCompanyCurrencies() {
  const ctx = await getUserContext();
  return ApiService<CurrencyOption[]>(apiConstants.companycurrency, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
    },
  });
}

export async function createHomeTask(payload: {
  type: HomeTaskType;
  title: string;
  short_description: string;
  selected_relaties_id?: number | string;
  priority?: string;
  task_template?: number | string;
  quantity?: string;
  price?: string;
  currency?: string;
  tax?: string;
}) {
  const ctx = await getUserContext();
  return ApiService(apiConstants.Task_house, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      title: payload.title,
      short_description: payload.short_description,
      type: payload.type,
      selected_relaties_id: payload.selected_relaties_id ?? "",
      priority: payload.priority ?? "",
      task_template: payload.task_template ?? "",
      quantity: payload.quantity ?? "",
      price: payload.price ?? "",
      currency: payload.currency ?? "",
      tax: payload.tax ?? "",
    },
  });
}

export async function createTask(payload: {
  selected_relaties_id?: number;
  title?: string;
  short_description?: string;
  priority?: string;
}) {
  const ctx = await getUserContext();
  return ApiService(apiConstants.store_normal_task, {
    includeToken: true,
    customData: {
      selected_relaties_id: payload.selected_relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      title: payload.title,
      short_description: payload.short_description,
      priority: payload.priority,
      document: "",
    },
  });
}
