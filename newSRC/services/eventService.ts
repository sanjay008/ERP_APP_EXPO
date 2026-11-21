import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { isEmptyListResponse, toAppApiError } from "../utils/apiError";

export type EventImage = {
  event_dropbox_shared_link?: string;
};

export type EventListItem = {
  id?: number | string;
  name?: string;
  date?: string;
  description?: string;
  location?: string;
  images?: EventImage[];
};

export type EventBookingSingle = {
  id?: number | string;
  unique_code?: string;
  scan_info?: number | string;
  seat_data?: { seat_number?: string };
};

export type EventBookingItem = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  country_code?: string;
  unique_id?: string;
  created_at?: string;
  payment_status?: string;
  payment_method?: string;
  quantity?: number | string;
  total_price?: string;
  amount?: string;
  status?: number | string;
  scan_info?: number | string;
  is_scanned?: number | string | boolean;
  event_tickets?: { title?: string; ticket_note?: string };
  event_data?: { name?: string; date?: string; location?: string };
  relaties_data?: {
    voornaam?: string;
    achternaam?: string;
    display_name?: string;
    email_adres?: string;
    mobiel?: string;
    whatsapp_number?: string;
  };
  booking_single?: EventBookingSingle[];
};

export type EventGuestTicketRow = {
  key: string;
  booking: EventBookingItem;
  single?: EventBookingSingle;
};

/** Guest list: one row per booking_single ticket (scan_info lives there). */
export function flattenEventGuestTickets(items: EventBookingItem[]): EventGuestTicketRow[] {
  const rows: EventGuestTicketRow[] = [];
  items.forEach((booking, index) => {
    const singles = Array.isArray(booking.booking_single) ? booking.booking_single : [];
    if (!singles.length) {
      rows.push({ key: `booking-${booking.id ?? index}`, booking });
      return;
    }
    singles.forEach((single, singleIndex) => {
      rows.push({
        key: `booking-${booking.id ?? index}-single-${single.id ?? singleIndex}`,
        booking,
        single,
      });
    });
  });
  return rows;
}

/** Prefer booking_single.scan_info: 0 = not scanned, >= 1 = scanned. */
export function isEventBookingScanned(
  item?: EventBookingItem | null,
  single?: EventBookingSingle | null
) {
  if (single?.scan_info != null) return Number(single.scan_info) >= 1;
  if (!item) return false;
  const firstSingle = item.booking_single?.[0];
  if (firstSingle?.scan_info != null) return Number(firstSingle.scan_info) >= 1;
  if (item.scan_info != null) return Number(item.scan_info) >= 1;
  if (item.is_scanned != null) {
    return item.is_scanned === true || Number(item.is_scanned) >= 1;
  }
  return false;
}

export function getEventBookingPhone(item?: EventBookingItem | null) {
  if (!item) return "";
  const phone =
    item.phone ||
    item.mobile ||
    item.relaties_data?.mobiel ||
    item.relaties_data?.whatsapp_number ||
    "";
  const code = String(item.country_code || "").trim();
  if (!phone) return "";
  return code ? `${code} ${phone}` : String(phone);
}

export function getEventTicketCode(
  item?: EventBookingItem | null,
  single?: EventBookingSingle | null
) {
  if (single?.unique_code) return String(single.unique_code);
  if (!item) return "";
  return item.unique_id || item.booking_single?.[0]?.unique_code || "";
}

export function getEventTicketSeat(
  item?: EventBookingItem | null,
  single?: EventBookingSingle | null
) {
  if (single?.seat_data?.seat_number) return String(single.seat_data.seat_number);
  return item?.booking_single?.[0]?.seat_data?.seat_number || "";
}

export function getEventBookingDate(item?: EventBookingItem | null) {
  if (!item) return "";
  return item.event_data?.date || item.created_at || "";
}

type PaginatedBody<T> = {
  status?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    last_page?: number;
    lastPage?: number;
  };
  last_page?: number;
};

export async function fetchEvents(params: {
  pastEvents?: boolean;
  page?: number;
  pageLimit?: number;
}) {
  const response = await apiClient.post<PaginatedBody<EventListItem[]>>(
    apiConstants.get_event_list,
    {
      past_events: params.pastEvents ? 1 : 0,
      page_id: params.page ?? 1,
      page_limit: params.pageLimit ?? 25,
    }
  );

  const body = response.data;
  if (!body?.status) {
    if (isEmptyListResponse(body)) {
      return { items: [], lastPage: 1 };
    }
    throw toAppApiError({ message: body?.message || "Failed to fetch events" });
  }

  const lastPage =
    body.pagination?.last_page ??
    body.pagination?.lastPage ??
    body.last_page ??
    1;

  return {
    items: Array.isArray(body.data) ? body.data : [],
    lastPage: Number(lastPage) || 1,
  };
}

export async function fetchEventBookings(params: {
  eventId: string | number;
  page?: number;
  pageLimit?: number;
}) {
  const response = await apiClient.post<PaginatedBody<EventBookingItem[]>>(
    apiConstants.events_booking_list,
    {
      event_id: params.eventId,
      page_no: params.page ?? 1,
      page_limit: params.pageLimit ?? 25,
    }
  );

  const body = response.data;
  if (!body?.status) {
    if (isEmptyListResponse(body)) {
      return { items: [], lastPage: 1 };
    }
    throw toAppApiError({ message: body?.message || "Failed to fetch event bookings" });
  }

  const lastPage = body.pagination?.last_page ?? body.last_page ?? 1;
  return {
    items: Array.isArray(body.data) ? body.data : [],
    lastPage: Number(lastPage) || 1,
  };
}

export async function fetchEventGuests(params: {
  eventId: string | number;
  page?: number;
  pageLimit?: number;
}) {
  const response = await apiClient.post<PaginatedBody<EventBookingItem[]>>(
    apiConstants.get_booking_list,
    {
      event_id: params.eventId,
      page_no: params.page ?? 1,
      page_limit: params.pageLimit ?? 25,
    }
  );

  const body = response.data;
  if (!body?.status) {
    if (isEmptyListResponse(body)) {
      return { items: [], lastPage: 1 };
    }
    throw toAppApiError({ message: body?.message || "Failed to fetch guest list" });
  }

  const lastPage = body.pagination?.last_page ?? body.last_page ?? 1;
  return {
    items: Array.isArray(body.data) ? body.data : [],
    lastPage: Number(lastPage) || 1,
  };
}

export function getDropboxDirectLink(url?: string) {
  if (!url) return "";
  try {
    if (url.includes("dropboxusercontent.com")) return url;
    if (url.includes("db.tt")) return url.replace("db.tt", "dl.dropboxusercontent.com");
    if (url.includes("dropbox.com")) {
      let cleaned = url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("dropbox.com", "dl.dropboxusercontent.com")
        .replace(/[?&](dl|raw)=[^&]*/g, "");
      cleaned += cleaned.includes("?") ? "&raw=1" : "?raw=1";
      return cleaned;
    }
    return url;
  } catch {
    return url;
  }
}

export function stripHtmlTags(input?: string) {
  if (!input) return "";
  return input
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function formatEventDate(inputDate?: string) {
  if (!inputDate) return "";
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return inputDate;

  const dayName = date.toLocaleDateString("nl-NL", { weekday: "long" });
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  const label = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${day} ${month} ${year} (${label})`;
}

export function getEventPersonName(item?: EventBookingItem | null) {
  if (!item) return "-";
  const fullName = [item.first_name || item.relaties_data?.voornaam, item.last_name || item.relaties_data?.achternaam]
    .filter(Boolean)
    .join(" ");
  return fullName || item.relaties_data?.display_name || "-";
}

export type EventVerificationResult = {
  status?: boolean;
  message?: string;
  data?: {
    payment_status?: string;
    event_tickets?: { title?: string };
  };
  sub_booking?: {
    id?: number | string;
    unique_code?: string;
    event_id?: number | string;
    scan_info?: number | string;
  };
  firstEvent?: { name?: string };
  error_message?: string;
};

export async function verifyEventBooking(params: {
  eventId: string | number;
  uniqueId: string | number;
}) {
  const response = await apiClient.post<EventVerificationResult>(
    apiConstants.event_booking_verification,
    {
      unique_id: params.uniqueId,
      event_id: params.eventId,
    }
  );

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Verification failed" });
  }
  return body;
}

export async function confirmEventBooking(params: {
  eventId: string | number;
  bookingId: string | number;
  token: string;
}) {
  const response = await apiClient.post<{ status?: boolean; message?: string }>(
    apiConstants.event_booking_confirmation,
    {
      token: params.token,
      event_id: params.eventId,
      booking_id: params.bookingId,
    }
  );

  const body = response.data;
  if (!body?.status) {
    throw toAppApiError({ message: body?.message || "Confirmation failed" });
  }
  return body;
}
