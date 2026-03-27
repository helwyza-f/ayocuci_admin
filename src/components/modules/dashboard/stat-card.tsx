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
    <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-orange-100 hover:shadow-xl transition-all duration-300 rounded-3xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {label}
            </p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {value}
            </h3>
            {trend && (
              <p className="text-[10px] font-bold text-[#FF4500] mt-2 italic">
                {trend}
              </p>
            )}
          </div>
          <div
            className="p-3 rounded-2xl transition-colors duration-300"
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
