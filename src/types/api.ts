export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  status?: boolean;
  message?: string;
}
