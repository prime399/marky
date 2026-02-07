import { useQuery } from "@tanstack/react-query";
import { fetchAuthStatus } from "../api/auth";
import { useCloudStore } from "../state/cloudStore";

export const AUTH_STATUS_QUERY_KEY = ["auth", "status"];

export const useAuthStatusQuery = ({ enabled = true } = {}) => {
  const setAuthState = useCloudStore((state) => state.setAuthState);
  const setAuthError = useCloudStore((state) => state.setAuthError);

  return useQuery({
    queryKey: AUTH_STATUS_QUERY_KEY,
    queryFn: fetchAuthStatus,
    enabled,
    onSuccess: (data) => {
      if (data?.error) {
        setAuthError(new Error(data.error));
        return;
      }
      setAuthState(data);
    },
    onError: (error) => {
      setAuthError(error);
    },
  });
};
