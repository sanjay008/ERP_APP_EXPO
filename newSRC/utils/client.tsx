import axios from "axios";
import { getData } from "./storeData";
import { Keys } from "./Keys";
import { clearAuthSession, isTokenExpiredMessage } from "./authSession";
import { checkNetworkConnection } from "./networkStatus";
import { createOfflineError, parseApiError, toAppApiError } from "./apiError";

export const BASE_URL = "https://app.erpportaal.nl/api/";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const skipNetworkCheck = (config as { skipNetworkCheck?: boolean }).skipNetworkCheck;
      if (!skipNetworkCheck) {
        const isOnline = await checkNetworkConnection();
        if (!isOnline) {
          return Promise.reject(createOfflineError());
        }
      }

      const userData = await getData(Keys.USERDATA);

      const user = userData?.data?.user;
      const relaties = userData?.data?.relaties;

      const defaultRequestData = {
        relaties_id:
          relaties?.id != null ? String(relaties.id) : undefined,
        user_id: user?.id,
        role: user?.role,
        token: user?.verify_token,
      };

      if (config.method?.toLowerCase() === "get") {
        config.params = {
          ...defaultRequestData,
          ...(config.params || {}),
        };
      } else if (
        typeof FormData !== "undefined" &&
        config.data instanceof FormData
      ) {
        Object.entries(defaultRequestData).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (!config.data.has(key)) {
            config.data.append(key, String(value));
          }
        });
        // Let axios set multipart boundary — never force Content-Type.
        if (config.headers) {
          delete (config.headers as Record<string, unknown>)["Content-Type"];
        }
      } else {
        config.data = {
          ...defaultRequestData,
          ...(config.data || {}),
        };
      }

      console.log(
        `🚀 API => ${config.url} | ${config.method?.toUpperCase()} | REQUEST =>`,
        config.method?.toLowerCase() === "get"
          ? config.params
          : config.data
      );

      return config;
    } catch (error) {
      return Promise.reject(toAppApiError(error));
    }
  },
  (error) => Promise.reject(toAppApiError(error))
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API => ${response.config.url} | RESPONSE =>`,
      response.data
    );

    if (isTokenExpiredMessage(response.data?.message)) {
      clearAuthSession().catch(() => undefined);
    }

    return response;
  },
  (error) => {
    const parsed = parseApiError(error);
    console.log(
      `❌ API => ${error.config?.url} | ERROR =>`,
      parsed.message,
      error.response?.data || error.message
    );

    return Promise.reject(toAppApiError(error));
  }
);

export default apiClient;
