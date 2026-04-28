import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "#FF4500",
}: StatCardProps) {
  return (
    <Card className="group overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-100 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </h3>
            {trend && (
              <p className="mt-2 text-[11px] font-medium text-[#FF4500]">
                {trend}
              </p>
            )}
          </div>
          <div
            className="rounded-xl p-3 transition-colors duration-300"
            style={{ backgroundColor: `${color}10`, color: color }}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div
        className="h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </Card>
  );
}
