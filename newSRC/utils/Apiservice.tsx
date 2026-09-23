import axios from "axios";
import { getData } from "./storeData";
import { checkNetworkConnection } from "./networkStatus";
import { createOfflineError, isEmptyListResponse, parseApiError, toAppApiError } from "./apiError";
import { dedupeAsync } from "./requestDedupe";

function buildApiServiceKey(endpoint: string, options: ApiOptions): string {
  const parts: Record<string, string> = {};
  if (options.includeToken) parts._token = "1";
  Object.entries(options.customData ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object" && "uri" in (value as object)) return;
    parts[key] = String(value);
  });
  const body = Object.keys(parts)
    .sort()
    .map((key) => `${key}=${parts[key]}`)
    .join("&");
  return `${endpoint}|${body}`;
}

export type ApiResponse<T = unknown> = {
  status: boolean;
  data: T;
  message?: string;
  status_code?: number;
};

type ApiOptions = {
  customData?: Record<string, unknown>;
  includeToken?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  skipNetworkCheck?: boolean;
};

const ApiService = async <T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> => {
  const dedupeKey = buildApiServiceKey(endpoint, options);
  return dedupeAsync(dedupeKey, () => performApiRequest<T>(endpoint, options));
};

async function performApiRequest<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  try {
    if (!options.skipNetworkCheck) {
      const isOnline = await checkNetworkConnection();
      if (!isOnline) {
        throw createOfflineError();
      }
    }

    const verify_token = await getData("USERDATA");
    let requestData: FormData | undefined;

    if (options.includeToken || options.customData) {
      requestData = new FormData();

      if (options.includeToken) {
        const token = verify_token?.data?.user?.verify_token;
        if (token) {
          requestData.append("token", String(token));
        }
      }

      Object.entries(options.customData ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (typeof value === "object" && "uri" in (value as object)) {
          requestData!.append(key, value as never);
          return;
        }

        requestData!.append(key, String(value));
      });
    }

    const response = await axios.request<ApiResponse<T>>({
      method: options.method ?? "POST",
      url: endpoint,
      data: requestData,
      timeout: 30000,
      validateStatus: () => true,
      headers: {
        Accept: "application/json",
        ...(requestData ? {} : { "Content-Type": "application/json" }),
      },
    });

    if (response.status >= 400) {
      if (isEmptyListResponse(response.data)) {
        return response.data;
      }
      throw toAppApiError(response.data);
    }

    const body = response.data;
    if (body && typeof body === "object" && "status" in body && body.status === false) {
      if (isEmptyListResponse(body)) {
        return body;
      }
      throw toAppApiError(body);
    }

    return body;
  } catch (error) {
    const parsed = parseApiError(error);
    console.log(`❌ API => ${endpoint} | ERROR =>`, parsed.message);
    throw toAppApiError(error);
  }
}

export default ApiService;
