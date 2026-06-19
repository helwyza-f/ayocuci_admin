import { TopupStatus } from "@/types/topup";

type TopupStatusUi = {
  label: string;
  className: string;
};

const ACTIONABLE_TOPUP_STATUSES = new Set(["pending", "verification"]);
const SUCCESS_TOPUP_STATUSES = new Set(["success", "completed", "accepted"]);
const REJECTED_TOPUP_STATUSES = new Set(["failed", "rejected"]);

export function normalizeTopupStatus(status?: string | null): string {
  return (status || "").trim().toLowerCase();
}

export function isTopupActionable(status?: string | null): boolean {
  return ACTIONABLE_TOPUP_STATUSES.has(normalizeTopupStatus(status));
}

export function getTopupStatusUi(status?: TopupStatus | string | null): TopupStatusUi {
  const normalized = normalizeTopupStatus(status);

  if (SUCCESS_TOPUP_STATUSES.has(normalized)) {
    return {
      label: "Success / Accepted",
      className: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };
  }

  if (REJECTED_TOPUP_STATUSES.has(normalized)) {
    return {
      label: "Rejected",
      className: "bg-rose-50 text-rose-600 border-rose-100",
    };
  }

  if (normalized === "expired") {
    return {
      label: "Expired",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }

  if (isTopupActionable(normalized)) {
    return {
      label: "Pending Verification",
      className: "bg-amber-50 text-amber-600 border-amber-100",
    };
  }

  return {
    label: normalized || "-",
    className: "bg-slate-50 text-slate-400 border-slate-100",
  };
}
