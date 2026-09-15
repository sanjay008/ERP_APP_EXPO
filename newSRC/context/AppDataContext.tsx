import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import apiClient from "../utils/client";
import { apiConstants } from "../utils/apiConstants";
import { getData } from "../utils/storeData";
import { Keys } from "../utils/Keys";

type FetchOptions = {
  force?: boolean;
};

type AppDataContextValue = {
  permissions: any;
  permissionsLoading: boolean;
  fetchPermissions: (options?: FetchOptions) => Promise<any>;
  clearAppData: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<any>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const permissionsRef = useRef<any>(null);
  const permissionRequestRef = useRef<Promise<any> | null>(null);
  const cacheOwnerRef = useRef("");

  // Cache is scoped to the logged-in user; switching account/company invalidates it.
  const ensureCacheOwner = useCallback(async () => {
    const userData = await getData(Keys.USERDATA);
    const user = userData?.data?.user;
    const relaties = userData?.data?.relaties;
    const ownerKey = `${user?.id ?? ""}:${relaties?.id ?? ""}:${user?.verify_token ?? ""}`;

    if (cacheOwnerRef.current !== ownerKey) {
      cacheOwnerRef.current = ownerKey;
      permissionsRef.current = null;
      permissionRequestRef.current = null;
      setPermissions(null);
    }

    return ownerKey;
  }, []);

  const fetchPermissions = useCallback(
    async ({ force = false }: FetchOptions = {}) => {
      const ownerKey = await ensureCacheOwner();

      if (!force && permissionsRef.current) return permissionsRef.current;
      if (permissionRequestRef.current) return permissionRequestRef.current;

      setPermissionsLoading(true);
      const request = apiClient
        .post(apiConstants.permission)
        .then((response) => {
          const nextPermissions = response?.data?.data ?? response?.data ?? null;
          if (cacheOwnerRef.current === ownerKey) {
            permissionsRef.current = nextPermissions;
            setPermissions(nextPermissions);
          }
          return nextPermissions;
        })
        .finally(() => {
          if (permissionRequestRef.current === request) {
            permissionRequestRef.current = null;
          }
          setPermissionsLoading(false);
        });

      permissionRequestRef.current = request;
      return request;
    },
    [ensureCacheOwner]
  );

  const clearAppData = useCallback(() => {
    cacheOwnerRef.current = "";
    permissionsRef.current = null;
    permissionRequestRef.current = null;
    setPermissions(null);
  }, []);

  const value = useMemo(
    () => ({
      permissions,
      permissionsLoading,
      fetchPermissions,
      clearAppData,
    }),
    [permissions, permissionsLoading, fetchPermissions, clearAppData]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
