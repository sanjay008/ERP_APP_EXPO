import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseApiError, isEmptyParsedError, type ParsedApiError } from "../utils/apiError";

export function useApiErrorState() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);

  const clearApiError = useCallback(() => setApiError(null), []);

  const captureApiError = useCallback(
    (error: unknown) => {
      const parsed = parseApiError(error, t("Something went wrong"));
      if (isEmptyParsedError(parsed)) {
        setApiError(null);
        return;
      }
      setApiError(parsed);
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
