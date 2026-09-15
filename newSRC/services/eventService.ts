import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";

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

export type EventBookingItem = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  event_data?: { name?: string };
  relaties_data?: {
    voornaam?: string;
    achternaam?: string;
    display_name?: string;
    email_adres?: string;
  };
};

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
  return url
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "")
    .replace("?dl=1", "");
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

export function getEventPersonName(item: EventBookingItem) {
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
