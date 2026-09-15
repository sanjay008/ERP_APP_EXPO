import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type WorkOrderStatus = {
  id?: number | string;
  status_name?: string;
  color?: string;
};

export type WorkOrderCustomer = {
  display_name?: string;
  relaties_profile_img?: string;
};

export type WorkOrderItem = {
  id: number;
  order_id?: string | number;
  date?: string;
  execution_date?: string;
  gmaps_working_address?: string;
  relaties_customer?: WorkOrderCustomer;
  workorder_status?: WorkOrderStatus;
};

export type WorkOrderExecutor = {
  display_name?: string;
};

export type WorkOrderTask = {
  id: number;
  title?: string;
  short_description?: string;
  quantity?: number | string;
  quantity_type?: string;
  deadline?: string;
  priority?: string;
  priority_background_color?: string;
  priority_color?: string;
};

export type WorkOrderComment = {
  id?: number;
  username?: string;
  comment?: string;
  created_at?: string;
  user?: { profile_image?: string; username?: string };
};

export type WorkOrderDetail = {
  id?: number;
  order_id?: string | number;
  customer_relationship_id?: number | string;
  gmaps_working_address?: string;
  execution_date?: string;
  sign_name?: string;
  signature_image?: string;
  relaties_customer?: WorkOrderCustomer;
  workorder_status?: WorkOrderStatus;
  tasks?: WorkOrderTask[];
  executor_relaties?: WorkOrderExecutor[];
  comments?: WorkOrderComment[];
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchWorkOrders() {
  const ctx = await getUserContext();
  return ApiService<WorkOrderItem[]>(apiConstants.Workorderuitvoer, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });
}

export async function fetchWorkOrderDetails(id: string | number) {
  const ctx = await getUserContext();
  return ApiService<WorkOrderDetail>(apiConstants.Detailsworkorderuitvoer, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
      id,
    },
  });
}

export async function addWorkOrderComment(payload: {
  id: string | number;
  customer_relationship_id?: string | number;
  comment: string;
}) {
  const ctx = await getUserContext();
  return ApiService(apiConstants.workorderuitvoeraddcomment, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      customer_relationship_id: payload.customer_relationship_id,
      id: payload.id,
      comment: payload.comment,
    },
  });
}

export async function updateWorkOrderStatus(payload: {
  id: string | number;
  status_id: string | number;
  sign_name?: string;
  signature?: string;
}) {
  const ctx = await getUserContext();
  return ApiService(apiConstants.workorderuitvoerupdatestusts, {
    includeToken: true,
    customData: {
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
      role: ctx.role,
      id: payload.id,
      status_id: payload.status_id,
      sign_name: payload.sign_name || "",
      signature: payload.signature || "",
    },
  });
}
