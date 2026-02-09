import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock, Loader2 } from "lucide-react";
import type { StatusEnum } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StatusEnum;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  PASS: {
    label: "Pass",
    icon: CheckCircle,
    className: "bg-brand-sage/20 text-brand-forest border-brand-sage",
  },
  WARN: {
    label: "Warn",
    icon: AlertTriangle,
    className: "bg-brand-cream text-amber-700 border-amber-200",
  },
  BLOCK: {
    label: "Block",
    icon: XCircle,
    className: "bg-brand-coral/10 text-destructive border-brand-coral/30",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  VALIDATING: {
    label: "Validating…",
    icon: Loader2,
    className: "bg-brand-sky/20 text-blue-700 border-brand-sky/50",
  },
} as const;

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium border",
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn("h-3 w-3", status === "VALIDATING" && "animate-spin")}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

