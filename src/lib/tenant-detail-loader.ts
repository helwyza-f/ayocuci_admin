type TenantDetailRequests<T, C, P> = {
  getDetail: () => Promise<T>;
  getConfigs: () => Promise<C>;
  getPackages: () => Promise<P>;
  canReadEconomy: boolean;
  canReadPackages: boolean;
};

export async function loadTenantDetailResources<T, C, P>(requests: TenantDetailRequests<T, C, P>) {
  const [detail, configs, packages] = await Promise.allSettled([
    requests.getDetail(),
    requests.canReadEconomy ? requests.getConfigs() : Promise.resolve(null),
    // Package endpoints currently also inherit the economy group's read guard.
    requests.canReadEconomy && requests.canReadPackages ? requests.getPackages() : Promise.resolve(null),
  ]);
  if (detail.status === "rejected") throw detail.reason;
  return {
    detail: detail.value,
    configs: configs.status === "fulfilled" ? configs.value : null,
    packages: packages.status === "fulfilled" ? packages.value : null,
  };
}

export function tenantDetailLoadError(status?: number) {
  if (status === 403) return { title: "Akses Detail Outlet Ditolak", message: "Akun Anda tidak memiliki izin untuk melihat detail outlet ini." };
  if (status === 404) return { title: "Outlet Tidak Ditemukan", message: "Outlet tidak tersedia atau sudah dihapus." };
  return { title: "Detail Outlet Gagal Dimuat", message: "Data belum dapat dimuat. Silakan coba lagi." };
}
