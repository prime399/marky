import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthStatus } from "../api/auth";
import { useCloudStore } from "../state/cloudStore";

export const AUTH_STATUS_QUERY_KEY = ["auth", "status"];

export const useAuthStatusQuery = ({ enabled = true } = {}) => {
  const setAuthState = useCloudStore((state) => state.setAuthState);
  const setAuthError = useCloudStore((state) => state.setAuthError);

  const query = useQuery({
    queryKey: AUTH_STATUS_QUERY_KEY,
    queryFn: fetchAuthStatus,
    enabled,
  });

  useEffect(() => {
    if (query.status === "success") {
      if (query.data?.error) {
        setAuthError(new Error(query.data.error));
        return;
      }
      setAuthState(query.data);
    } else if (query.status === "error") {
      setAuthError(query.error);
    }
  }, [query.status, query.data, query.error, setAuthState, setAuthError]);

  return query;
};
