import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";

type ToastState = {
  top: number;
  text: string;
  type: string;
  visible: boolean;
};

type RegisterBackContextValue = {
  toast: ToastState | null;
  setToast: (toast: ToastState) => void;
  clearToast: () => void;
};

export const RegisterBackContext = createContext<RegisterBackContextValue>({
  toast: null,
  setToast: () => {},
  clearToast: () => {},
});

export function RegisterBackProvider({ children }: { children: ReactNode }) {
  const [toast, setToastState] = useState<ToastState | null>(null);

  const setToast = useCallback((next: ToastState) => {
    setToastState(next);
  }, []);

  const clearToast = useCallback(() => {
    setToastState(null);
  }, []);

  const value = useMemo(
    () => ({
      toast,
      setToast,
      clearToast,
    }),
    [toast, setToast, clearToast]
  );

  return (
    <RegisterBackContext.Provider value={value}>{children}</RegisterBackContext.Provider>
  );
}
