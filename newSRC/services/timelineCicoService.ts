import ApiService from "../utils/Apiservice";
import type { ApiResponse } from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { toAppApiError } from "../utils/apiError";
import { getGoogleMapsApiKey } from "../utils/googleMapsApiKey";
import { getData } from "../utils/storeData";

export type CicoAddressItem = {
  id?: number | string;
  title?: string;
  address?: string;
  is_default?: boolean | number | string;
};

export type CicoScheduleItem = {
  schedule_id?: number | string;
  day?: string;
  start_time?: string;
  end_time?: string;
  break_time?: string;
  total_time?: string;
  class?: string | number;
  class_id?: string | number;
};

export type CicoSession = {
  cicoStatus: "check_in" | "check_out" | string;
  addressBuckets: Record<string, CicoAddressItem[]>;
  startingPointTypes: string[];
  destinationTypes: string[];
  openCheckInId?: number | string | null;
  openEndPointType?: string | null;
  scheduleData?: {
    data?: CicoScheduleItem[];
    employment_contract?: { id?: number | string };
    status_text_value?: string;
    success?: boolean;
  } | null;
  travelCostEnabled: boolean;
  companyTravelCost: number;
  canEditDateTime: boolean;
  raw?: Record<string, unknown>;
};

export type CicoCoords = { lat: number; lng: number };

function pickDefaultAddress(list: CicoAddressItem[] = []) {
  if (!list.length) return null;
  const preferred = list.find(
    (item) => item.is_default === true || item.is_default === 1 || item.is_default === "1"
  );
  return preferred || list[0];
}

export async function fetchCicoSession(date: string): Promise<CicoSession> {
  const userData = await getData("USERDATA");
  const response = (await ApiService<Record<string, CicoAddressItem[]>>(
    apiConstants.gettimelinedata,
    {
      includeToken: true,
      customData: {
        relaties_id: userData?.data?.relaties?.id,
        role: userData?.data?.user?.role,
        user_id: userData?.data?.user?.id,
        date,
      },
    }
  )) as ApiResponse<Record<string, CicoAddressItem[]>> & {
    starting_point_data?: string[];
    destination_data?: string[];
    cico_status?: string;
    check_in_out_data?: { id?: number | string; end_point_type?: string };
    schedule_data?: CicoSession["scheduleData"];
    relaties_data?: { is_travel_costs_enable?: boolean | number | string };
    company_data?: { travel_cost?: string | number };
    cico_permission?: { can_edit_date_time?: boolean | number | string };
  };

  const buckets = response.data || {};
  const starting =
    response.starting_point_data ||
    Object.keys(buckets).filter((key) => (buckets[key] || []).length > 0);
  const destination =
    response.destination_data ||
    Object.keys(buckets).filter((key) => (buckets[key] || []).length > 0);

  const checkInOutData = response.check_in_out_data || {};
  const relatiesData = response.relaties_data || {};
  const companyData = response.company_data || {};
  const permission = response.cico_permission || {};
  const cicoStatus = String(
    response.cico_status || (checkInOutData?.id ? "check_out" : "check_in")
  );

  return {
    cicoStatus: cicoStatus.includes("out") ? "check_out" : "check_in",
    addressBuckets: buckets,
    startingPointTypes: Array.isArray(starting) ? starting : Object.keys(buckets),
    destinationTypes: Array.isArray(destination) ? destination : Object.keys(buckets),
    openCheckInId: checkInOutData?.id ?? null,
    openEndPointType: checkInOutData?.end_point_type ?? null,
    scheduleData: response.schedule_data || null,
    travelCostEnabled: Boolean(
      relatiesData?.is_travel_costs_enable === true ||
        relatiesData?.is_travel_costs_enable === 1 ||
        relatiesData?.is_travel_costs_enable === "1"
    ),
    companyTravelCost: Number(companyData?.travel_cost || 0),
    canEditDateTime: Boolean(
      permission?.can_edit_date_time === true ||
        permission?.can_edit_date_time === 1 ||
        permission?.can_edit_date_time === "1"
    ),
    raw: response as unknown as Record<string, unknown>,
  };
}

export async function getDeviceCoordinates(): Promise<CicoCoords | null> {
  try {
    const Location = await import("expo-location");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

async function geocodeAddress(address: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;
  const response = await fetch(url);
  const json = await response.json();
  if (json?.status !== "OK" || !json?.results?.[0]?.geometry?.location) {
    throw new Error(`Geocoding failed: ${json?.status || "unknown"}`);
  }
  return json.results[0].geometry.location as CicoCoords;
}

export async function calculateDistanceKm(
  address1?: string,
  address2?: string
): Promise<number> {
  if (!address1 || !address2) return 0;
  const apiKey = await getGoogleMapsApiKey();
  if (!apiKey) return 0;

  try {
    const loc1 = await geocodeAddress(address1, apiKey);
    const loc2 = await geocodeAddress(address2, apiKey);
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${loc1.lat},${loc1.lng}` +
      `&destinations=${loc2.lat},${loc2.lng}` +
      `&mode=driving&key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json();
    const meters = json?.rows?.[0]?.elements?.[0]?.distance?.value;
    if (typeof meters !== "number") return 0;
    return Number((meters / 1000).toFixed(2));
  } catch {
    return 0;
  }
}

export async function adjustTravelCost(officeId: string | number, cost: string | number) {
  const userData = await getData("USERDATA");
  const response = await ApiService<{ cost?: string | number }>(apiConstants.test_post, {
    includeToken: true,
    customData: {
      relaties_id: userData?.data?.relaties?.id,
      role: userData?.data?.user?.role,
      user_id: userData?.data?.user?.id,
      cost,
      office_id: officeId,
    },
  });
  const adjusted = (response as any)?.data?.cost ?? (response as any)?.cost;
  return adjusted != null ? Number(adjusted) : Number(cost);
}

export function resolveDefaultAddress(
  buckets: Record<string, CicoAddressItem[]>,
  type?: string | null
) {
  if (!type) return null;
  return pickDefaultAddress(buckets[type] || []);
}

function schedulePayload(session: CicoSession) {
  const scheduleItem = session.scheduleData?.data?.[0] || {};
  return {
    schedule_id: scheduleItem.schedule_id || 0,
    schedule_employee_contract_id: session.scheduleData?.employment_contract?.id || null,
    schedule_day: scheduleItem.day || null,
    schedule_start_time: scheduleItem.start_time || null,
    schedule_end_time: scheduleItem.end_time || null,
    schedule_break_time: scheduleItem.break_time || null,
    schedule_total_time: scheduleItem.total_time || null,
    schedule_class: scheduleItem.class || scheduleItem.class_id || null,
    schedule_status: session.scheduleData?.status_text_value || null,
  };
}

export type CicoSubmitPayload = {
  isSimple: boolean;
  date: string;
  time: string;
  startType: string;
  startAddress?: CicoAddressItem | null;
  endType: string;
  endAddress?: CicoAddressItem | null;
  distance: number;
  tripCost: number | string;
  travelCostEnabled: boolean;
  coords?: CicoCoords | null;
  session: CicoSession;
  // checkout only
  breakTime?: string;
  description?: string;
  stopTime?: boolean;
  closingDay?: boolean;
};

export async function performCicoCheckIn(payload: CicoSubmitPayload) {
  const userData = await getData("USERDATA");
  const response = await ApiService(apiConstants.checkintimeline, {
    includeToken: true,
    customData: {
      relaties_id: userData?.data?.relaties?.id,
      role: userData?.data?.user?.role,
      user_id: userData?.data?.user?.id,
      type: "check_in",
      check_in_out_date: payload.date,
      check_in_out_time: payload.time,
      start_point_check_in: payload.startType,
      option_start_point_check_in: payload.startAddress?.address || "",
      option_start_point_check_in_id: payload.startAddress?.id || "",
      end_point_check_in: payload.endType,
      option_end_point_check_in: payload.endAddress?.address || "",
      option_end_point_check_in_id: payload.endAddress?.id || "",
      distance: payload.distance || 0,
      single_trip_cost: payload.tripCost || 0,
      travel_cost_enabled: payload.travelCostEnabled,
      closing_day: 0,
      check_in_current_latitude: payload.coords?.lat || "",
      check_in_current_longitude: payload.coords?.lng || "",
      is_direct: payload.isSimple ? 1 : null,
      ...schedulePayload(payload.session),
    },
  });

  if (!(response as any)?.status) {
    throw toAppApiError({
      message: (response as any)?.message || "Check-in failed",
    });
  }
  return response;
}

export async function performCicoCheckOut(payload: CicoSubmitPayload) {
  const userData = await getData("USERDATA");
  const checkInId = payload.session.openCheckInId;
  if (!checkInId) {
    throw toAppApiError({ message: "Missing check-in id" });
  }

  const response = await ApiService(apiConstants.checkouttimeline, {
    includeToken: true,
    customData: {
      relaties_id: userData?.data?.relaties?.id,
      role: userData?.data?.user?.role,
      user_id: userData?.data?.user?.id,
      type: "check_out",
      check_in_out_date: payload.date,
      check_in_out_time: payload.time,
      check_in_id: checkInId,
      break_time: payload.breakTime || "00:00",
      description: payload.description || "",
      closing_day: payload.isSimple ? 1 : payload.closingDay ? 1 : 0,
      stop_time: payload.isSimple ? 1 : payload.stopTime ? 1 : 0,
      start_point_check_out: payload.startType,
      option_start_point_check_out: payload.startAddress?.address || "",
      option_start_point_check_out_id: payload.startAddress?.id || "",
      end_point_check_out: payload.endType,
      option_end_point_check_out: payload.endAddress?.address || "",
      option_end_point_check_out_id: payload.endAddress?.id || "",
      distance: payload.distance || 0,
      single_trip_cost: payload.tripCost || 0,
      travel_cost_enabled: payload.travelCostEnabled,
      check_out_current_latitude: payload.coords?.lat || "",
      check_out_current_longitude: payload.coords?.lng || "",
      is_direct: payload.isSimple ? 1 : null,
      ...schedulePayload(payload.session),
    },
  });

  if (!(response as any)?.status) {
    throw toAppApiError({
      message: (response as any)?.message || "Check-out failed",
    });
  }
  return response;
}

export function formatCicoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCicoTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getTypeOptions(
  session: CicoSession,
  kind: "start" | "end"
): string[] {
  const keys = kind === "start" ? session.startingPointTypes : session.destinationTypes;
  const filtered = keys.filter((key) => (session.addressBuckets[key] || []).length > 0);
  return filtered.length > 0 ? filtered : Object.keys(session.addressBuckets);
}
