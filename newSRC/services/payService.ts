import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";

export type PayJobItem = {
  id?: number | string;
  pay_job_generated_number?: string;
  pay_order_nr?: string;
  description?: string;
  amount?: number | string;
  rent_currency?: string;
  start_date?: string;
  end_date?: string;
  module_status?: PayOrderStatus & { id?: number | string };
  status_data?: PayOrderStatus & { id?: number | string };
  status?: string | PayOrderStatus;
  status_name?: string;
  color?: string;
  color_code?: string;
};

export type PayOrderStatus = {
  status_name?: string;
  color?: string;
};

export type PayOrderPayment = {
  payment_date?: string;
  created_at?: string;
  description?: string;
  amount?: number | string;
};

export type PayOrderItem = {
  id?: number | string;
  pay_order_nr?: string;
  description?: string;
  amount?: number | string;
  paid?: number | string;
  outstading?: number | string;
  pay_order_start_date?: string;
  pay_order_end_date?: string;
  rent_currencys?: { symbol?: string };
  module_status?: PayOrderStatus;
  payments?: PayOrderPayment[];
};

export type PayOrderStatusFilter = {
  id?: number | string;
  status_name?: string;
  color?: string;
};

async function getUserContext() {
  const userData = await getData("USERDATA");
  return {
    relaties_id: userData?.data?.relaties?.id,
    user_id: userData?.data?.user?.id,
    role: userData?.data?.user?.role,
  };
}

export async function fetchPayJobs() {
  const ctx = await getUserContext();
  const response = await ApiService<PayJobItem[]>(apiConstants.pay_job, {
    includeToken: true,
    customData: {
      role: ctx.role,
      relaties_id: ctx.relaties_id,
      user_id: ctx.user_id,
    },
  });

  if (!response?.status && !Array.isArray(response?.data)) {
    return [];
  }
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchPayOrders() {
  const ctx = await getUserContext();
  const response = await ApiService<{ pay_orders?: PayOrderItem[] }>(
    apiConstants.pay_orders,
    {
      includeToken: true,
      customData: {
        role: ctx.role,
        relaties_id: ctx.relaties_id,
        user_id: ctx.user_id,
      },
    }
  );

  const orders = response?.data?.pay_orders;
  return Array.isArray(orders) ? orders : [];
}

export async function fetchPayOrderById(id: string | number) {
  const orders = await fetchPayOrders();
  return orders.find((item) => String(item.id) === String(id)) ?? null;
}

export async function fetchPayOrderStatuses() {
  const ctx = await getUserContext();
  const response = await ApiService<PayOrderStatusFilter[]>(apiConstants.getstatus, {
    includeToken: true,
    customData: {
      slug: "Pay_order",
      relaties_id: ctx.relaties_id,
      role: ctx.role,
      user_id: ctx.user_id,
    },
  });

  if (!response?.status) return [];
  return Array.isArray(response.data) ? response.data : [];
}
