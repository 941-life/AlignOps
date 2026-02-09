"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  color?: "emerald" | "amber" | "rose" | "blue" | "slate";
  trend?: {
    value: number;
    label: string;
  };
}

const colorClasses = {
  emerald: "text-emerald-700 bg-brand-cream/40",
  amber: "text-amber-700 bg-brand-cream",
  rose: "text-brand-coral bg-brand-coral/10",
  blue: "text-blue-700 bg-brand-sky/30",
  slate: "text-slate-700 bg-slate-100",
};

export function StatCard({ title, value, icon: Icon, color = "slate", trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-5 w-5", colorClasses[color].split(" ")[0])} aria-hidden="true" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-variant-tabular">{value}</div>
        {trend && (
          <p className="text-xs text-slate-500 mt-1">
            <span className={cn(
              "font-medium",
              trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-rose-600" : ""
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>{" "}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
