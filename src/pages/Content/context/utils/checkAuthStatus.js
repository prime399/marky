import { fetchAuthStatus } from "../../../../core/api/auth";

export const checkAuthStatus = async () => fetchAuthStatus();
