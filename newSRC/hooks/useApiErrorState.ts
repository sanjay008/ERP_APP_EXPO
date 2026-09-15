import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseApiError, type ParsedApiError } from "../utils/apiError";

export function useApiErrorState() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);

  const clearApiError = useCallback(() => setApiError(null), []);

  const captureApiError = useCallback(
    (error: unknown) => {
      setApiError(parseApiError(error, t("Something went wrong")));
    },
    [t]
  );

  return {
    apiError,
    setApiError,
    clearApiError,
    captureApiError,
  };
}
