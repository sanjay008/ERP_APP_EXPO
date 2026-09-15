import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  checkNetworkConnection,
  subscribeToNetworkChanges,
} from "../utils/networkStatus";

type NetworkContextValue = {
  isOnline: boolean;
  /** True once network status has reported at least once. */
  isReady: boolean;
  /** Re-check connectivity (e.g. Retry on offline modal). */
  refreshNetwork: () => Promise<boolean>;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  isReady: false,
  refreshNetwork: async () => true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const handleChange = useCallback((online: boolean) => {
    setIsOnline(online);
    setIsReady(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges(handleChange);
    return unsubscribe;
  }, [handleChange]);

  const refreshNetwork = useCallback(async () => {
    const online = await checkNetworkConnection();
    setIsOnline(online);
    setIsReady(true);
    return online;
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      isReady,
      refreshNetwork,
    }),
    [isOnline, isReady, refreshNetwork]
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
