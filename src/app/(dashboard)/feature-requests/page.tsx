"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { ArrowUp, Eye, EyeOff, Filter, Lightbulb, Loader2, MessageSquare, Pin, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { apiFetcher } from "@/lib/fetcher";
import type { ApiResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "SUBMITTED"|"UNDER_REVIEW"|"IN_PROGRESS"|"COMPLETED"|"NOT_PLANNED";
type Visibility = "PENDING_REVIEW"|"PUBLIC"|"HIDDEN"|"ARCHIVED";
type Reply={id:string;author_name:string;body:string;is_public:boolean;created_at:string};
type Request={id:string;creator_name:string;outlet_id:string;title:string;description:string;status:Status;visibility:Visibility;is_pinned:boolean;voting_enabled:boolean;vote_count:number;created_at:string;deleted_at?:string;replies:Reply[];awaiting_admin:boolean;conversation_state:string};
type Page={items:Request[];page:number;limit:number;total:number;total_pages:number};
type Detail={request:Request;audits:{id:string;action:string;reason:string;created_at:string}[]};
const labels:Record<Status,string>={SUBMITTED:"Diajukan",UNDER_REVIEW:"Dipertimbangkan",IN_PROGRESS:"Dikerjakan",COMPLETED:"Selesai",NOT_PLANNED:"Tidak direncanakan"};
const visibilityLabels:Record<Visibility,string>={PENDING_REVIEW:"Perlu ditinjau",PUBLIC:"Publik",HIDDEN:"Disembunyikan",ARCHIVED:"Diarsipkan"};

export default function FeatureRequestsPage(){
 const [page,setPage]=useState(1),[search,setSearch]=useState(""),[query,setQuery]=useState(""),[status,setStatus]=useState("ALL"),[visibility,setVisibility]=useState("ALL"),[selected,setSelected]=useState<string|null>(null),[checked,setChecked]=useState<string[]>([]);
 useEffect(()=>{const t=setTimeout(()=>{setQuery(search);setPage(1)},350);return()=>clearTimeout(t)},[search]);
 const url=`/feature-requests?page=${page}&limit=20&sort=newest&search=${encodeURIComponent(query)}&status=${status}&visibility=${visibility}&include_deleted=true`;
 const {data,isLoading,mutate}=useSWR<ApiResponse<Page>>(url,apiFetcher);
 const {data:detail,mutate:mutateDetail}=useSWR<ApiResponse<Detail>>(selected?`/feature-requests/${selected}`:null,apiFetcher);
 const items=data?.data?.items??[],meta=data?.data;
 const refresh=async()=>{await mutate();if(selected)await mutateDetail()};
 async function act(method:"patch"|"post"|"delete",path:string,body?:unknown){try{if(method==="delete")await api.delete(path,{data:body});else await api[method](path,body);toast.success("Perubahan disimpan");await refresh()}catch{toast.error("Perubahan belum bisa disimpan")}}
 async function bulk(action:string,value:string){if(!checked.length)return;await act("post","/feature-requests/bulk-actions",{ids:checked,action,value});setChecked([])}
 return <div className="space-y-5">
  <header><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Lightbulb className="h-5 w-5 text-primary"/>Request Fitur</h1><p className="text-xs text-slate-500">Tinjau usulan, jawab pengguna, dan kendalikan konten yang tampil di aplikasi.</p></header>
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center">
   <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:bg-white" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari judul, isi, atau outlet..."/></div>
   <div className="flex items-center gap-2 overflow-x-auto"><div className="flex h-9 shrink-0 items-center gap-2 px-2 text-xs font-semibold text-slate-400"><Filter className="h-3.5 w-3.5"/>Filter</div>
   <Select value={status} onValueChange={v=>{setStatus(v);setPage(1)}}><SelectTrigger className="h-9 w-[180px] shrink-0 rounded-xl border-slate-200 bg-white shadow-none"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Semua status</SelectItem>{Object.entries(labels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
   <Select value={visibility} onValueChange={v=>{setVisibility(v);setPage(1)}}><SelectTrigger className="h-9 w-[190px] shrink-0 rounded-xl border-slate-200 bg-white shadow-none"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Semua visibilitas</SelectItem>{Object.entries(visibilityLabels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
  </div>
  <Card className="gap-0 overflow-hidden border-slate-200 py-0 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
   {checked.length>0&&<div className="flex flex-wrap items-center gap-2 border-b border-orange-100 bg-orange-50/70 px-4 py-2.5"><div className="mr-auto flex items-center gap-2"><span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">{checked.length}</span><span className="text-sm font-semibold text-slate-700">usulan dipilih</span></div><Button size="sm" variant="ghost" onClick={()=>bulk("VISIBILITY","PUBLIC")}><Eye className="mr-1 h-4 w-4"/>Publikasikan</Button><Button size="sm" variant="ghost" onClick={()=>bulk("VISIBILITY","HIDDEN")}><EyeOff className="mr-1 h-4 w-4"/>Sembunyikan</Button><Button size="sm" variant="ghost" onClick={()=>bulk("PIN","true")}><Pin className="mr-1 h-4 w-4"/>Pin</Button><span className="mx-1 h-5 w-px bg-orange-200"/><Button size="sm" variant="destructive" onClick={()=>bulk("DELETE","")}><Trash2 className="mr-1 h-4 w-4"/>Hapus</Button><Button size="icon-sm" variant="ghost" aria-label="Batalkan pilihan" onClick={()=>setChecked([])}><X/></Button></div>}
   <div className="border-b px-4 py-3 text-sm font-semibold">Daftar usulan <span className="font-normal text-slate-400">({meta?.total??0})</span></div>
   {isLoading?<div className="grid h-48 place-items-center"><Loader2 className="animate-spin"/></div>:items.length===0?<div className="grid h-48 place-items-center text-sm text-slate-400">Tidak ada usulan yang cocok.</div>:items.map(item=><button key={item.id} onClick={()=>setSelected(item.id)} className="flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-slate-50">
    <span onClick={e=>e.stopPropagation()}><Checkbox checked={checked.includes(item.id)} onCheckedChange={v=>setChecked(v?[...checked,item.id]:checked.filter(x=>x!==item.id))}/></span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{item.title}</h2>{item.is_pinned&&<Pin className="h-3.5 w-3.5 text-primary"/>}<Badge variant="outline">{visibilityLabels[item.visibility]}</Badge><Badge variant="outline">{labels[item.status]}</Badge>{item.awaiting_admin&&<Badge className="border-amber-200 bg-amber-50 text-amber-700">Menunggu tim</Badge>}</div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p><p className="mt-2 text-xs text-slate-400">{item.creator_name} · {new Date(item.created_at).toLocaleDateString("id-ID")}</p></div>
    <div className="flex items-center gap-1 text-sm font-semibold text-primary"><ArrowUp className="h-4 w-4"/>{item.vote_count}</div>
   </button>)}
   <div className="flex items-center justify-between p-3"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(page-1)}>Sebelumnya</Button><span className="text-xs text-slate-500">Halaman {meta?.page??1} dari {meta?.total_pages||1}</span><Button variant="outline" size="sm" disabled={page>=(meta?.total_pages||1)} onClick={()=>setPage(page+1)}>Berikutnya</Button></div>
  </Card>
  {selected&&<DetailDrawer detail={detail?.data} close={()=>setSelected(null)} act={act}/>}
 </div>
}

function DetailDrawer({detail,close,act}:{detail?:Detail;close:()=>void;act:(m:"patch"|"post"|"delete",p:string,b?:unknown)=>Promise<void>}){
 const [reply,setReply]=useState(""),[isPublic,setIsPublic]=useState(true),[status,setStatus]=useState<Status>("SUBMITTED"),[merge,setMerge]=useState("");const r=detail?.request;
 useEffect(()=>{if(r)setStatus(r.status)},[r]);
 return <div className="fixed inset-0 z-50 bg-slate-950/30" onMouseDown={close}><aside onMouseDown={e=>e.stopPropagation()} className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
  <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4"><div><h2 className="font-bold">Detail Usulan</h2><p className="text-xs text-slate-500">Moderasi, jawaban, dan riwayat tindakan</p></div><Button size="icon" variant="ghost" onClick={close}><X/></Button></div>
  {!r?<div className="grid h-60 place-items-center"><Loader2 className="animate-spin"/></div>:<div className="space-y-5 p-5">
   <section><div className="flex flex-wrap gap-2"><Badge>{visibilityLabels[r.visibility]}</Badge><Badge variant="outline">{labels[r.status]}</Badge>{r.is_pinned&&<Badge variant="outline">Dipin</Badge>}</div><h3 className="mt-3 text-lg font-bold">{r.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{r.description}</p><p className="mt-3 text-xs text-slate-400">{r.creator_name} · {r.vote_count} vote</p></section>
   <section className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={()=>act("patch",`/feature-requests/${r.id}/moderation`,{visibility:r.visibility==="PUBLIC"?"HIDDEN":"PUBLIC"})}>{r.visibility==="PUBLIC"?<><EyeOff className="mr-2 h-4 w-4"/>Sembunyikan</>:<><Eye className="mr-2 h-4 w-4"/>Publikasikan</>}</Button><Button variant="outline" onClick={()=>act("patch",`/feature-requests/${r.id}/moderation`,{is_pinned:!r.is_pinned})}><Pin className="mr-2 h-4 w-4"/>{r.is_pinned?"Lepas pin":"Pin usulan"}</Button></section>
   <section className="space-y-2"><h4 className="text-sm font-semibold">Status pengerjaan</h4><div className="flex gap-2"><Select value={status} onValueChange={v=>setStatus(v as Status)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(labels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Button onClick={()=>act("patch",`/feature-requests/${r.id}/status`,{status})}>Simpan</Button></div></section>
   <section className="space-y-2"><h4 className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4"/>Jawaban</h4><div className="space-y-2">{r.replies?.map(x=><div key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="mb-1 flex justify-between text-xs text-slate-400"><span>{x.author_name}</span><span>{x.is_public?"Publik":"Internal"}</span></div>{x.body}</div>)}</div><Textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Tulis jawaban atau catatan internal..."/><label className="flex items-center gap-2 text-xs"><Checkbox checked={isPublic} onCheckedChange={v=>setIsPublic(Boolean(v))}/>Tampilkan kepada pengguna</label><Button disabled={!reply.trim()} onClick={async()=>{await act("post",`/feature-requests/${r.id}/replies`,{body:reply,is_public:isPublic});setReply("")}}>Kirim jawaban</Button></section>
   <section className="space-y-2"><h4 className="text-sm font-semibold">Gabungkan duplikat</h4><div className="flex gap-2"><Input value={merge} onChange={e=>setMerge(e.target.value)} placeholder="ID usulan utama"/><Button variant="outline" disabled={!merge} onClick={()=>act("post",`/feature-requests/${r.id}/merge`,{duplicate_of_id:merge})}>Gabungkan</Button></div></section>
   <section className="space-y-2"><h4 className="text-sm font-semibold">Audit</h4>{detail?.audits?.map(a=><div key={a.id} className="border-l-2 pl-3 text-xs"><b>{a.action}</b><p className="text-slate-400">{new Date(a.created_at).toLocaleString("id-ID")} {a.reason&&`· ${a.reason}`}</p></div>)}</section>
   <div className="flex gap-2 border-t pt-4">{r.deleted_at?<Button variant="outline" onClick={()=>act("post",`/feature-requests/${r.id}/restore`)}><RotateCcw className="mr-2 h-4 w-4"/>Pulihkan</Button>:<Button variant="destructive" onClick={()=>act("delete",`/feature-requests/${r.id}`,{reason:"Dihapus melalui admin"})}><Trash2 className="mr-2 h-4 w-4"/>Hapus</Button>}</div>
  </div>}
 </aside></div>
}
