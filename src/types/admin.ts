export interface Admin {
  adm_id: string; // Matches your GORM tag column
  adm_nama: string;
  adm_email: string;
  adm_created: string; // ISO string from Go time.Time
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    access_token: string;
    actor_type: "admin";
    user: Admin;
  };
}

export interface AdminCredentials {
  email: string;
  password: string;
}
