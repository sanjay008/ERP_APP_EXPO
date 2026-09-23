import axios, { AxiosError } from "axios";
import i18n from "../translation/i18n";

export type ApiErrorKind = "offline" | "network" | "server" | "auth" | "empty" | "unknown";

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

export function isEmptyDataMessage(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (!lower) return false;
  return (
    lower.includes("not found") ||
    lower.includes("no leave") ||
    lower.includes("no absence") ||
    lower.includes("no data") ||
    lower.includes("no record") ||
    lower.includes("no result") ||
    lower.includes("no items") ||
    lower.includes("niet gevonden") ||
    lower.includes("geen gegevens") ||
    lower.includes("geen data") ||
    lower.includes("geen resultaten") ||
    /^no\s+.+\s+found/.test(lower)
  );
}

export function isEmptyApiBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const payload = body as {
    status?: boolean | string;
    message?: string;
    error?: string;
    data?: unknown;
  };
  const message = String(payload.message || payload.error || "").trim();
  if (message && isEmptyDataMessage(message)) return true;

  const statusFalse = payload.status === false || payload.status === "false";
  if (!statusFalse) return false;
  if (message) return false;

  const data = payload.data;
  if (data == null) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  return false;
}

export function isEmptyParsedError(error?: ParsedApiError | null): boolean {
  if (!error) return false;
  return error.kind === "empty" || isEmptyDataMessage(error.message);
}

function emptyParsedError(statusCode?: number): ParsedApiError {
  return {
    kind: "empty",
    message: i18n.t("No Data Found"),
    statusCode,
  };
}

function finalizeParsedError(parsed: ParsedApiError): ParsedApiError {
  if (parsed.kind === "offline" || parsed.kind === "auth") return parsed;
  if (parsed.statusCode && parsed.statusCode >= 500) return parsed;
  if (parsed.kind === "empty" || isEmptyDataMessage(parsed.message)) {
    return emptyParsedError(parsed.statusCode);
  }
  return parsed;
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
      errors?: Array<string | { message?: string }> | Record<string, unknown>;
    };

    let fieldMessage: string | undefined;
    if (Array.isArray(payload.errors)) {
      const firstError = payload.errors[0];
      if (typeof firstError === "string") fieldMessage = firstError;
      else if (firstError?.message) fieldMessage = firstError.message;
    } else if (payload.errors && typeof payload.errors === "object") {
      const values = Object.values(payload.errors);
      for (const value of values) {
        if (typeof value === "string" && value.trim()) {
          fieldMessage = value.trim();
          break;
        }
        if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
          fieldMessage = value[0].trim();
          break;
        }
      }
    }

    const direct = payload.message || payload.error || "";
    const generic = /^validation\s+(failed|error)/i.test(direct);
    if (fieldMessage && (!direct || generic)) return fieldMessage;
    if (direct) return direct;
    if (fieldMessage) return fieldMessage;
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

  if (isEmptyApiBody(error)) {
    return emptyParsedError();
  }

  if (error instanceof AppApiError) {
    return finalizeParsedError(error.toJSON());
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = readResponseMessage(error.response?.data);
    const statusCode = error.response?.status;

    if (isEmptyApiBody(error.response?.data) && !(statusCode && statusCode >= 500)) {
      return emptyParsedError(statusCode);
    }

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

    return finalizeParsedError({
      kind: statusCode ? "server" : "network",
      message: translateApiMessage(
        responseMessage,
        translateApiMessage(error.message, defaultFallback)
      ),
      statusCode,
    });
  }

  if (error instanceof Error) {
    const offline =
      error.message.toLowerCase().includes("internet") ||
      error.message.toLowerCase().includes("network");

    if (offline) {
      return {
        kind: "offline",
        message: translateApiMessage(error.message, defaultFallback),
      };
    }

    return finalizeParsedError({
      kind: "unknown",
      message: translateApiMessage(error.message, defaultFallback),
    });
  }

  if (typeof error === "string" && error.trim()) {
    return finalizeParsedError({
      kind: "unknown",
      message: translateApiMessage(error, defaultFallback),
    });
  }

  if (error && typeof error === "object") {
    const responseMessage = readResponseMessage(error);
    if (responseMessage) {
      return finalizeParsedError({
        kind: "unknown",
        message: translateApiMessage(responseMessage, defaultFallback),
      });
    }
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

export function isEmptyListResponse(body: unknown): boolean {
  if (isEmptyApiBody(body)) return true;
  if (!body || typeof body !== "object") return false;
  const payload = body as { status?: boolean | string; message?: string };
  const statusFalse = payload.status === false || payload.status === "false";
  if (!statusFalse) return false;
  const message = String(payload.message || "").trim();
  return !message || isEmptyDataMessage(message);
}

export function takeApiList<T>(
  body: { status?: boolean; message?: string; data?: unknown } | undefined,
  pick: (data: unknown) => T[],
  fallbackMessage: string
): T[] {
  if (body?.status) return pick(body.data);
  if (isEmptyListResponse(body)) return [];
  throw toAppApiError({ message: body?.message || fallbackMessage });
}

export function takeApiItem<T>(
  body: { status?: boolean; message?: string; data?: unknown } | undefined,
  pick: (data: unknown) => T | null,
  fallbackMessage: string
): T | null {
  if (body?.status) return pick(body.data);
  if (isEmptyListResponse(body)) return null;
  throw toAppApiError({ message: body?.message || fallbackMessage });
}
