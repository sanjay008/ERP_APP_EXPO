import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { isEmptyListResponse, toAppApiError } from "../utils/apiError";

export type GlamBookingDetails = {
  id?: number | string;
  date?: string;
  time_slot?: string;
};

export type GlamOrderDetails = {
  first_name?: string;
  last_name?: string;
  email?: string;
  country_code?: string;
  phone_number?: string;
  payment_status?: string;
  payment_type?: string;
  total_price?: string | number;
  shipping_cost?: string | number;
  full_address?: string;
  shipping_address?: string;
  mollie_payment_id?: string;
  created_at?: string;
  cart_data?: string;
};

export type GlamRelatieDetails = {
  display_name?: string;
  email_adres?: string;
  mobiel?: string;
  country_code?: string;
  soort_relatie?: string;
};

export type GlamBookingItem = {
  id?: number | string;
  booking_details?: GlamBookingDetails;
  order_details?: GlamOrderDetails;
  relaties_details?: GlamRelatieDetails;
};

type ApiBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
};

export async function fetchMyBookings() {
  const response = await apiClient.post<ApiBody<GlamBookingItem[]>>(apiConstants.getBookingDetails);
  const body = response.data;
  if (!body?.status) {
    if (isEmptyListResponse(body)) return [];
    throw toAppApiError({ message: body?.message || "Failed to fetch bookings" });
  }
  return Array.isArray(body.data) ? body.data : [];
}

export async function fetchMyBookingById(bookingId: string | number) {
  const items = await fetchMyBookings();
  return (
    items.find((item) => String(item.booking_details?.id ?? item.id) === String(bookingId)) ??
    null
  );
}

export function parseCartData(cartData?: string) {
  try {
    const parsed = JSON.parse(cartData || "[]");
    return Array.isArray(parsed) ? parsed[0] ?? null : null;
  } catch {
    return null;
  }
}

export function getPaymentStatusStyle(status = "") {
  switch (status.toLowerCase()) {
    case "paid":
      return { bg: "#E0FCE0", text: "#06AC14" };
    case "expired":
      return { bg: "#F8EBEB", text: "#A32D2D" };
    case "pending":
      return { bg: "#FFF3CD", text: "#856404" };
    case "failed":
      return { bg: "#FFE8E8", text: "#D14343" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280" };
  }
}

export function formatBookingDate(dateStr = "") {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatBookingTime(timeStr = "") {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m || "00"} ${ampm}`;
}

export function formatDateTime(dtStr = "") {
  if (!dtStr) return "-";
  const date = new Date(dtStr);
  if (Number.isNaN(date.getTime())) return dtStr;
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}  ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "??";
}
