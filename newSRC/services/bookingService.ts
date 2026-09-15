import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";
import { getData } from "../utils/storeData";

export type BookingClientInfo = {
  id?: number | string;
  display_name?: string;
  email_adres?: string;
  google_maps?: string;
  mobiel?: string;
  country_code?: string | number;
};

export type BookingFlightSchedule = {
  departure?: string;
  arrival?: string;
};

export type BookingDriverInfo = {
  id?: number | string;
  display_name?: string;
};

export type BookingComment = {
  id?: number | string;
  comment?: string;
  comment_type?: string;
  created_at?: string;
  user?: { username?: string };
  relatie?: { file_path?: string };
};

export type TaxiPaymentDetail = {
  id?: number | string;
  amount?: number | string;
  payment_method?: string;
  currency?: string;
  created_at?: string;
};

export type BookingCurrency = {
  code?: string;
  symbol?: string;
  name?: string;
};

export type DriverTripBooking = {
  id?: number | string;
  from_date?: string;
  pickup_time?: string;
  drop_time?: string | null;
  starting_selected_address?: string;
  destination_selected_address?: string;
  tour_name?: string;
  tour_price_display?: string | number;
  total_person?: string | number;
  total_suitcase_and_trolly?: string | number;
  status?: number | string;
  status_name?: string;
  status_color?: string;
  currency?: string;
  currency_symbol?: { symbol?: string; code?: string };
  company_client_info?: BookingClientInfo;
  client_person_info?: BookingClientInfo;
  flight_schedule?: BookingFlightSchedule;
  driver_display_names?: Array<string | BookingDriverInfo>;
  driver_names?: { driver_ids?: number | string };
  title_first?: string;
  remaining_payment?: string | number;
  payment_method?: string;
  payment_method_first?: string | string[];
  payment_method_second?: string | string[];
  payment_method_third?: string | string[];
  payment_method_four?: string | string[];
  texi_booking_comment?: string;
  comments?: BookingComment[];
  Taxi_payment_details?: TaxiPaymentDetail[];
  extra_stop_details?: Array<{ extra_stop_address?: string }>;
  relaties_vehicle_name?: {
    display_name?: string;
    voertuig_kenteken?: string;
    vehicle_color?: string;
    leads_status_data?: { status_name?: string; color?: string };
  };
};

export type BookingListMode = "past" | "planning";

export type DriverTripDetailResult = {
  booking: DriverTripBooking | null;
  currencies: BookingCurrency[];
};

type TripDetailsResponse = {
  status?: boolean;
  data?: DriverTripBooking[];
  currencies?: BookingCurrency[];
  message?: string;
};

async function getSession() {
  const stored = await getData("USERDATA");
  const datas = stored?.data;

  if (!datas?.user?.verify_token) {
    throw toAppApiError({ message: "Missing session token" });
  }

  return {
    token: datas.user.verify_token,
    relaties_id: datas.relaties?.id,
    role: datas.user.role,
    user_id: datas.user.id,
    relatiesId: datas.relaties?.id,
  };
}

async function fetchDriverTripBookingsPayload(mode: BookingListMode) {
  const session = await getSession();

  const response = (await ApiService<DriverTripBooking[]>(
    apiConstants.get_driver_trip_details,
    {
      includeToken: true,
      customData: {
        token: session.token,
        relaties_id: session.relaties_id,
        role: session.role,
        user_id: session.user_id,
        ...(mode === "past" ? { is_past_bookings: 1 } : { is_planing_page: 1 }),
      },
    }
  )) as TripDetailsResponse;

  if (!response?.status) {
    throw toAppApiError({
      message: response?.message || "Failed to fetch bookings",
    });
  }

  return {
    items: Array.isArray(response.data) ? response.data : [],
    currencies: Array.isArray(response.currencies) ? response.currencies : [],
  };
}

export async function fetchDriverTripBookings(mode: BookingListMode) {
  const { items } = await fetchDriverTripBookingsPayload(mode);
  return items;
}

export async function fetchDriverTripBookingDetail(
  bookingId: string | number,
  mode: BookingListMode
): Promise<DriverTripDetailResult> {
  const { items, currencies } = await fetchDriverTripBookingsPayload(mode);
  const booking = items.find((item) => String(item.id) === String(bookingId)) ?? null;
  return { booking, currencies };
}

export async function addTripComment(payload: {
  bookTaxiId: string | number;
  comment?: string;
  privateComment?: string;
}) {
  const session = await getSession();

  const response = await ApiService(apiConstants.add_trip_comment, {
    customData: {
      token: session.token,
      relaties_id: session.relaties_id,
      role: session.role,
      user_id: session.user_id,
      book_taxi_id: payload.bookTaxiId,
      ...(payload.comment ? { comment: payload.comment } : {}),
      ...(payload.privateComment ? { private_comment: payload.privateComment } : {}),
    },
  });

  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to add comment" });
  }
  return response;
}

export async function completeTrip(payload: {
  bookTaxiId: string | number;
  complete: 0 | 1;
}) {
  const session = await getSession();

  const response = await ApiService<{ success?: boolean; message?: string }>(
    apiConstants.complate_trip,
    {
      includeToken: true,
      customData: {
        token: session.token,
        relaties_id: session.relaties_id,
        role: session.role,
        user_id: session.user_id,
        book_taxi_id: payload.bookTaxiId,
        complate: payload.complete,
      },
    }
  );

  if (!response?.status && !(response as { success?: boolean }).success) {
    throw toAppApiError({ message: response?.message || "Failed to update trip" });
  }
  return response;
}

export async function saveTaxiBookingPayment(payload: {
  bookingId: string | number;
  amount: number;
  currencyCode: string;
  paymentMethod: string;
}) {
  const session = await getSession();

  const response = await ApiService(apiConstants.save_taxi_booking_payment, {
    includeToken: true,
    customData: {
      verify_token: session.token,
      user_id: session.user_id,
      role: session.role,
      relaties_id: session.relaties_id,
      booking_id: payload.bookingId,
      currency: payload.currencyCode,
      amount: payload.amount,
      payment_method: payload.paymentMethod,
    },
  });

  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to save payment" });
  }
  return response;
}

export async function updateBookingClientRelatie(payload: {
  selectedRelatiesId?: string | number;
  displayName: string;
  email?: string;
  googleMaps?: string;
  countryCode?: string;
  phone?: string;
}) {
  const session = await getSession();
  const response = await ApiService(apiConstants.updateProfile, {
    includeToken: true,
    customData: {
      display_name: payload.displayName,
      email_adres: payload.email || "",
      google_maps: payload.googleMaps || "",
      country_code: payload.countryCode || "",
      whatsapp_number: payload.phone || "",
      verify_token: session.token,
      user_id: session.user_id,
      role: session.role,
      relaties_id: session.relaties_id,
      selected_relaties_id: payload.selectedRelatiesId,
    },
  });

  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to update client" });
  }
  return response;
}

export type TripTypeOption = { id?: number | string; name?: string; title?: string };
export type TripDetailOption = {
  id?: number | string;
  name?: string;
  trip_details?: string;
};
export type VehicleCategoryOption = {
  id?: number | string;
  category_name?: string;
  price_title?: string;
  matched_price?: number | string;
  max_person?: number | string;
  max_suitcase_trolly_combine?: number | string;
};
export type AddressOption = {
  id?: number | string;
  destination_address?: string;
};
export type TourOption = { id?: number | string; tour_name?: string; price?: number | string };

function mergeApiPayload(payload: Record<string, unknown>) {
  const nested =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : {};

  return { ...nested, ...payload };
}

export function normalizePaymentMethods(
  ...values: Array<string | string[] | null | undefined>
) {
  const methods: string[] = [];

  values.forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) methods.push(String(item));
      });
      return;
    }

    if (value) methods.push(String(value));
  });

  return methods.filter(Boolean);
}

export function getTripTypeLabel(item?: TripTypeOption) {
  return item?.title || item?.name || "";
}

export function getTripDetailLabel(item?: TripDetailOption) {
  return item?.trip_details || item?.name || "";
}

export function getVehicleCategoryLabel(item?: VehicleCategoryOption) {
  return item?.price_title || item?.category_name || "";
}

export async function fetchTripSetup(params?: {
  tripTypeId?: string | number;
  vehicleCategoryId?: string | number;
  currencyCode?: string;
}) {
  const session = await getSession();
  const response = await ApiService<{
    type_of_trip?: TripTypeOption[];
    tripDetails?: TripDetailOption[];
    category?: VehicleCategoryOption[];
    all_currency?: BookingCurrency[];
    country_data?: unknown;
  }>(apiConstants.get_trip_types_and_details, {
    includeToken: true,
    customData: {
      token: session.token,
      relaties_id: session.relaties_id,
      role: session.role,
      user_id: session.user_id,
      type_of_trip: params?.tripTypeId ?? "",
      price_vehicle_id: params?.vehicleCategoryId ?? "",
      currency: params?.currencyCode ?? "",
    },
  });

  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to load trip options" });
  }

  const merged = mergeApiPayload(response as Record<string, unknown>);

  return {
    tripTypes: (merged.type_of_trip as TripTypeOption[]) ?? [],
    tripDetails: (merged.tripDetails as TripDetailOption[]) ?? [],
    categories: (merged.category as VehicleCategoryOption[]) ?? [],
    currencies: (merged.all_currency as BookingCurrency[]) ?? [],
  };
}

export async function fetchRelatieAddresses(params: {
  currencyCode?: string;
  tourId?: string | number;
}) {
  const session = await getSession();
  const response = await ApiService<{
    data?: Array<{
      relatie_address?: string;
      relatie_extra_address?: Array<{ id?: number | string; destination_address?: string }>;
    }>;
    tour_name?: TourOption[];
    priceData?: { price?: number | string };
    payment_method_first?: string;
    payment_method_second?: string;
    payment_method_third?: string;
    payment_method_four?: string;
  }>(apiConstants.get_relatie_address, {
    includeToken: true,
    customData: {
      token: session.token,
      relaties_id: session.relaties_id,
      role: session.role,
      user_id: session.user_id,
      currency: params.currencyCode ?? "",
      tour_id: params.tourId ?? "",
    },
  });

  if (!response?.status) {
    throw toAppApiError({ message: response?.message || "Failed to load addresses" });
  }

  const merged = mergeApiPayload(response as Record<string, unknown>);
  const addressRows = Array.isArray(merged.data)
    ? (merged.data as Array<{
        relatie_address?: string;
        relatie_extra_address?: Array<{ id?: number | string; destination_address?: string }>;
      }>)
    : [];

  const addresses: AddressOption[] = [];
  addressRows.forEach((item, index) => {
    if (item.relatie_address) {
      addresses.push({ id: `relatie_${index}`, destination_address: item.relatie_address });
    }
    (item.relatie_extra_address ?? []).forEach((extra) => {
      if (extra.destination_address) {
        addresses.push({ id: extra.id, destination_address: extra.destination_address });
      }
    });
  });

  const paymentMethods = normalizePaymentMethods(
    merged.payment_method_first as string | string[] | undefined,
    merged.payment_method_second as string | string[] | undefined,
    merged.payment_method_third as string | string[] | undefined,
    merged.payment_method_four as string | string[] | undefined
  );

  return {
    addresses,
    tours: (merged.tour_name as TourOption[]) ?? [],
    tourPrice: (merged.priceData as { price?: number | string }) ?? null,
    paymentMethods,
  };
}

export async function createTaxiBooking(payload: {
  companyClientId?: string | number;
  tripTypeId: string | number;
  tripDetailsId: string | number;
  startingAddress: string;
  destinationAddress: string;
  fromDate: string;
  pickupTime: string;
  dropTime?: string;
  totalPerson: string | number;
  totalSuitcase?: string | number;
  totalTrolly?: string | number;
  currencyCode: string;
  comments?: string;
  paymentMethod: string;
  tourId?: string | number;
  tourPrice?: number | string;
  vehicleCategoryId?: string | number;
  vehiclePrice?: number | string;
  extraStopAddresses?: string[];
  pickupSwitch?: 0 | 1;
  dropSwitch?: 0 | 1;
}) {
  const session = await getSession();
  const calculatedPrice =
    Number(payload.tourPrice ?? 0) + Number(payload.vehiclePrice ?? 0);
  const extraStops = (payload.extraStopAddresses ?? []).filter(Boolean).join("////");

  const response = await ApiService(apiConstants.taxi_booking, {
    includeToken: true,
    customData: {
      token: session.token,
      relaties_id: session.relaties_id,
      role: session.role,
      user_id: session.user_id,
      company_client: payload.companyClientId ?? "",
      client_person: session.relatiesId,
      trip_type: payload.tripTypeId,
      trip_details_id: payload.tripDetailsId,
      starting_address: payload.startingAddress,
      destination_address: payload.destinationAddress,
      extra_custom_address: "",
      extra_stop_address: extraStops,
      from_date: payload.fromDate,
      pickup_time: payload.pickupTime,
      drop_time: payload.dropTime ?? "",
      total_person: payload.totalPerson,
      total_suitcase: payload.totalSuitcase ?? "0",
      total_trolly: payload.totalTrolly ?? "0",
      price_currency: payload.currencyCode,
      comments: payload.comments ?? "",
      tour_price: payload.tourPrice ?? 0,
      payment_method: payload.paymentMethod,
      tour_id: payload.tourId ?? "",
      vehicle_category_id: payload.vehicleCategoryId ?? "",
      vehicle_price: payload.vehiclePrice ?? 0,
      pickup_switch: payload.pickupSwitch ?? 0,
      drop_switch: payload.dropSwitch ?? 0,
      calculated_price: calculatedPrice,
    },
  });

  if (!response?.status && !(response as { success?: boolean }).success) {
    throw toAppApiError({ message: response?.message || "Failed to create booking" });
  }
  return response;
}

export function isAssignedDriver(
  booking: DriverTripBooking,
  currentRelatiesId?: number | string
) {
  if (currentRelatiesId == null) return false;

  const driverId = booking.driver_names?.driver_ids;
  if (driverId != null && String(driverId) === String(currentRelatiesId)) {
    return true;
  }

  return (booking.driver_display_names ?? []).some((driver) => {
    if (typeof driver === "string") return false;
    return String(driver.id) === String(currentRelatiesId);
  });
}

export function isBookingToday(fromDate?: string) {
  if (!fromDate) return false;
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const day = String(today.getDate()).padStart(2, "0");
  const month = today.toLocaleDateString("en-US", { month: "short" });
  const year = today.getFullYear();
  const todayLabel = `${dayName} ${day} ${month} ${year}`;
  return fromDate.trim() === todayLabel;
}
