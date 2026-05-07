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
    <Card className={cn("p-4 border border-slate-200 rounded-lg bg-white group hover:border-primary/20 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 font-heading group-hover:text-primary transition-colors">
              {value}
            </h3>
            {trend && (
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend.isUp ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:scale-110 transition-all duration-300 border border-slate-100/50">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}
