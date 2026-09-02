"use client";

import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Database, Loader2, User } from "lucide-react";
import { aiAnalystService } from "@/services/ai-analyst.service";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  sqls?: string[];
}

const SAMPLES = [
  "Daftar outlet PRO yang pernah transaksi > 5x dan sisa koin < 5",
  "Total pendapatan top up (transfer + midtrans) bulan ini",
  "10 outlet dengan omzet tertinggi bulan ini",
  "Berapa outlet trial yang akan expired 7 hari ke depan?",
];

export default function AIAnalystPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (q?: string) => {
    const message = (q ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await aiAnalystService.ask(message, sessionId);
      setSessionId(res.session_id);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, sqls: res.sqls }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal memproses pertanyaan.";
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-orange-50 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800">AI Analyst</h1>
          <p className="text-xs text-slate-500">Tanya apa saja tentang data. AI akan query database (read-only) dan menjawab.</p>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden border border-slate-200">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="mx-auto mt-8 max-w-lg text-center">
              <p className="mb-3 text-sm font-semibold text-slate-600">Coba tanyakan:</p>
              <div className="flex flex-col gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 hover:bg-white hover:shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-lg bg-orange-50 p-1.5 text-primary">
                  <Sparkles className="h-full w-full" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-white" : "bg-slate-100 text-slate-800"
                )}
              >
                {m.text}
                {m.sqls && m.sqls.length > 0 && (
                  <details className="mt-2 text-[11px] text-slate-500">
                    <summary className="flex cursor-pointer items-center gap-1 font-semibold">
                      <Database className="h-3 w-3" /> {m.sqls.length} query dijalankan
                    </summary>
                    <div className="mt-1 space-y-1">
                      {m.sqls.map((q, j) => (
                        <pre key={j} className="overflow-x-auto rounded bg-slate-800 p-2 text-[10px] text-slate-100">
                          {q}
                        </pre>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              {m.role === "user" && (
                <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-lg bg-slate-200 p-1.5 text-slate-500">
                  <User className="h-full w-full" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> AI sedang menganalisa data...
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Tanyakan tentang data outlet, transaksi, top up..."
              className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} className="h-10 gap-1.5">
              <Send className="h-4 w-4" /> Kirim
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            AI hanya bisa membaca (read-only). Verifikasi angka penting sebelum mengambil keputusan.
          </p>
        </div>
      </Card>
    </div>
  );
}
