import axios, { AxiosError } from "axios";
import i18n from "../translation/i18n";

export type ApiErrorKind = "offline" | "network" | "server" | "auth" | "unknown";

export type ParsedApiError = {
  kind: ApiErrorKind;
  message: string;
  statusCode?: number;
};

export class AppApiError extends Error {
  kind: ApiErrorKind;
  statusCode?: number;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = "AppApiError";
    this.kind = parsed.kind;
    this.statusCode = parsed.statusCode;
  }

  toJSON(): ParsedApiError {
    return {
      kind: this.kind,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export function createOfflineError(message?: string): AppApiError {
  return new AppApiError({
    kind: "offline",
    message: message ?? i18n.t("No internet connection"),
  });
}

function isTechnicalServerMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("sqlstate") ||
    lower.includes("connection:") ||
    lower.includes("operation not permitted") ||
    lower.includes("sql:") ||
    /select\s+\*\s+from/i.test(message) ||
    lower.includes("pdoexception") ||
    lower.includes("queryexception")
  );
}

function isEmptyDataMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("no leave") ||
    lower.includes("no absence") ||
    lower.includes("no data") ||
    lower.includes("geen")
  );
}

function translateApiMessage(message: string | undefined, fallback: string): string {
  if (!message?.trim()) return fallback;
  const trimmed = message.trim();
  if (isTechnicalServerMessage(trimmed)) {
    return i18n.t("Server error, please try again");
  }
  if (isEmptyDataMessage(trimmed)) {
    return i18n.t("No data found");
  }
  return i18n.t(trimmed);
}

function readResponseMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) return data.trim();

  if (data && typeof data === "object") {
    const payload = data as {
      message?: string;
      error?: string;
      errors?: Array<string | { message?: string }>;
    };

    if (payload.message) return payload.message;
    if (payload.error) return payload.error;

    const firstError = payload.errors?.[0];
    if (typeof firstError === "string") return firstError;
    if (firstError?.message) return firstError.message;
  }

  return undefined;
}

function isLikelyOffline(error: AxiosError): boolean {
  if (!error.response) {
    const code = error.code?.toUpperCase() ?? "";
    return (
      code === "ERR_NETWORK" ||
      code === "ECONNABORTED" ||
      error.message.toLowerCase().includes("network")
    );
  }
  return false;
}

export function parseApiError(error: unknown, fallback?: string): ParsedApiError {
  const defaultFallback = fallback ?? i18n.t("Something went wrong");

  if (error instanceof AppApiError) {
    return error.toJSON();
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = readResponseMessage(error.response?.data);
    const statusCode = error.response?.status;

    if (isLikelyOffline(error)) {
      return {
        kind: "offline",
        message: i18n.t("No internet connection"),
        statusCode,
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        kind: "auth",
        message: translateApiMessage(
          responseMessage,
          i18n.t("Session expired, please login again")
        ),
        statusCode,
      };
    }

    if (
      statusCode === 429 ||
      responseMessage?.toLowerCase().includes("too many attempts")
    ) {
      return {
        kind: "server",
        message: i18n.t("Too many requests, please wait a moment"),
        statusCode: statusCode ?? 429,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        kind: "server",
        message: translateApiMessage(
          responseMessage,
          i18n.t("Server error, please try again")
        ),
        statusCode,
      };
    }

    return {
      kind: statusCode ? "server" : "network",
      message: translateApiMessage(
        responseMessage,
        translateApiMessage(error.message, defaultFallback)
      ),
      statusCode,
    };
  }

  if (error instanceof Error) {
    const offline =
      error.message.toLowerCase().includes("internet") ||
      error.message.toLowerCase().includes("network");

    return {
      kind: offline ? "offline" : "unknown",
      message: translateApiMessage(error.message, defaultFallback),
    };
  }

  if (typeof error === "string" && error.trim()) {
    return { kind: "unknown", message: translateApiMessage(error, defaultFallback) };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message || defaultFallback);
    return { kind: "unknown", message: translateApiMessage(message, defaultFallback) };
  }

  return { kind: "unknown", message: defaultFallback };
}

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  return parseApiError(error, fallback).message;
}

export function isOfflineError(error: unknown): boolean {
  if (error instanceof AppApiError) return error.kind === "offline";
  return parseApiError(error).kind === "offline";
}

export function toAppApiError(error: unknown, fallback?: string): AppApiError {
  if (error instanceof AppApiError) return error;
  return new AppApiError(parseApiError(error, fallback));
}
