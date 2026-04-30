"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Users2,
  Wallet2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ReferralAdminPayout,
  ReferralAdminSummary,
} from "@/types/domain";
import { referralAdminService } from "@/services/referral-admin.service";

const statusOptions = ["all", "pending", "approved", "process", "done"] as const;
type ReferralStatusFilter = (typeof statusOptions)[number];
type ReferralPayoutStatus = Exclude<ReferralStatusFilter, "all">;

const payoutStatusOrder: Record<ReferralPayoutStatus, number> = {
  pending: 1,
  approved: 2,
  process: 3,
  done: 4,
};

const currency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

export default function ReferralAdminPage() {
  const [summary, setSummary] = useState<ReferralAdminSummary | null>(null);
  const [payouts, setPayouts] = useState<ReferralAdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReferralStatusFilter>("all");
  const [rawReward, setRawReward] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadData = useCallback(async (status: ReferralStatusFilter) => {
    setLoading(true);
    try {
      const [summaryRes, configRes, payoutsRes] = await Promise.all([
        referralAdminService.getDashboard(),
        referralAdminService.getConfig(),
        referralAdminService.getPayouts(status),
      ]);

      if (summaryRes.data.status) setSummary(summaryRes.data.data);
      if (configRes.data.status) {
        setRawReward(configRes.data.data.cfg_value);
      }
      if (payoutsRes.data.status) {
        setPayouts(payoutsRes.data.data || []);
        setNotes(
          Object.fromEntries(
            (payoutsRes.data.data || []).map((item) => [
              item.rp_id,
              item.rp_admin_note || "",
            ]),
          ),
        );
      }
    } catch {
      toast.error("Gagal memuat data referral");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filter);
  }, [filter, loadData]);

  const cards = useMemo(
    () => [
      {
        label: "Reward per Owner",
        value: currency(summary?.reward_per_owner || 0),
        icon: Wallet2,
      },
      {
        label: "Owner Berhasil Direkrut",
        value: `${summary?.total_referrals || 0}`,
        icon: Users2,
      },
      {
        label: "Saldo Referral Terbit",
        value: currency(summary?.total_rewards || 0),
        icon: ArrowRightLeft,
      },
      {
        label: "Payout Menunggu",
        value: `${summary?.pending_count || 0} request`,
        icon: Clock3,
      },
    ],
    [summary],
  );

  const handleSaveConfig = async () => {
    if (!rawReward) return toast.error("Nominal reward wajib diisi");
    setSavingConfig(true);
    try {
      await referralAdminService.updateConfig(rawReward);
      toast.success("Nominal referral berhasil diperbarui");
      await loadData(filter);
    } catch {
      toast.error("Gagal memperbarui nominal referral");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdatePayout = async (id: string, status: ReferralPayoutStatus) => {
    setSavingPayoutId(id);
    try {
      await referralAdminService.updatePayoutStatus(id, {
        status,
        admin_note: notes[id] || undefined,
      });
      toast.success("Status payout berhasil diperbarui");
      await loadData(filter);
    } catch {
      toast.error("Gagal memperbarui payout");
    } finally {
      setSavingPayoutId(null);
    }
  };

  const getNextStatuses = (status: ReferralPayoutStatus) => {
    return (["approved", "process", "done"] as ReferralPayoutStatus[]).filter(
      (item) => payoutStatusOrder[item] > payoutStatusOrder[status],
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
          Referral <span className="text-[#FF4500]">Owner</span>
        </h2>
        <p className="text-xs text-slate-500 font-bold italic ml-1">
          Atur kompensasi referral owner dan proses payout saldo referral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="rounded-[30px] border-slate-100 p-6 shadow-sm"
              >
                <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              </Card>
            ))
          : cards.map((card, index) => (
              <Card
                key={index}
                className="rounded-[30px] border-slate-100 p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {card.label}
                    </span>
                    <card.icon className="h-4 w-4 text-[#FF4500]" />
                  </div>
                  <p className="text-2xl font-black tracking-tight text-slate-800">
                    {card.value}
                  </p>
                </div>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <Card className="rounded-[32px] border-slate-100 p-7 shadow-sm">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Konfigurasi Reward
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-800">
                Saldo per owner baru
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Nominal ini akan masuk ke saldo referral owner pengajak saat
                owner baru berhasil registrasi memakai kode referral.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Nominal Rupiah
              </label>
              <Input
                value={rawReward}
                onChange={(e) =>
                  setRawReward(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="25000"
                className="h-12 rounded-2xl"
              />
              <p className="text-xs font-semibold text-slate-500">
                Preview: {currency(rawReward || 0)}
              </p>
            </div>

            <div className="rounded-3xl bg-orange-50 p-4 text-sm text-slate-600">
              Harga beli koin owner tetap mengikuti config `price_per_coin`.
              Referral cash ini hanya menambah wallet referral, bukan langsung
              koin.
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="h-12 w-full rounded-2xl bg-[#FF4500] hover:bg-[#e63f00]"
            >
              {savingConfig ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Nominal
            </Button>
          </div>
        </Card>

        <Card className="rounded-[32px] border-slate-100 p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Referral Payout
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-800">
                Antrian payout owner
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[10px] font-black uppercase transition-all",
                    filter === item
                      ? "bg-[#FF4500] text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-[28px] bg-slate-100"
                />
              ))
            ) : payouts.length == 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400">
                Belum ada request payout pada filter ini.
              </div>
            ) : (
              payouts.map((item) => (
                <div
                  key={item.rp_id}
                  className="rounded-[28px] border border-slate-100 bg-slate-50/40 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-800">
                          {item.usr_nama}
                        </h4>
                        <Badge className="rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-white uppercase">
                          {item.rp_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{item.usr_email}</p>
                      <p className="text-sm font-bold text-[#FF4500]">
                        {currency(item.rp_amount)}
                      </p>
                      <div className="text-sm text-slate-600">
                        {item.rp_bank_name} • {item.rp_account_number} • a.n{" "}
                        {item.rp_account_name}
                      </div>
                      {item.rp_note ? (
                        <p className="text-sm italic text-slate-500">
                          Catatan owner: {item.rp_note}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                      <Textarea
                        value={notes[item.rp_id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [item.rp_id]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Catatan admin payout"
                        className="rounded-2xl"
                      />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {getNextStatuses(item.rp_status).map((status) => (
                          <Button
                            key={status}
                            type="button"
                            variant={status === "done" ? "default" : "outline"}
                            disabled={savingPayoutId === item.rp_id}
                            onClick={() =>
                              handleUpdatePayout(item.rp_id, status)
                            }
                            className={cn(
                              "rounded-2xl font-black uppercase text-[10px]",
                              status === "done" &&
                                "bg-[#FF4500] hover:bg-[#e63f00]",
                            )}
                          >
                            {savingPayoutId === item.rp_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : status === "done" ? (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            ) : (
                              <Banknote className="mr-2 h-4 w-4" />
                            )}
                            {status}
                          </Button>
                        ))}
                        {getNextStatuses(item.rp_status).length === 0 ? (
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-[10px] font-black uppercase tracking-wide text-emerald-700">
                            Payout selesai diproses
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
