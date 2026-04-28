import api from "@/lib/api-client";

export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await api.get<T>(url);
  return response.data;
}
