import apiClient from "@/lib/api-client";
import { LoginResponse, AdminCredentials } from "@/types/admin";

export const authService = {
  login: async (credentials: AdminCredentials) => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/admin/login",
      credentials,
    );
    // We don't set localStorage here anymore.
    // The Login Page will call the Server Action 'setAdminSession' instead.
    return response.data;
  },
};
