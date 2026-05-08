import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5 border-none shadow-soft hover-premium bg-white group", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              {value}
            </h3>
            {trend && (
              <span className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-12 transition-all duration-500 border border-slate-100 shadow-inner">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
