import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<Variant, { bg: string; text: string; icon: string }> = {
  default: { bg: "bg-gray-50", text: "text-gray-900", icon: "text-gray-500" },
  success: { bg: "bg-green-50", text: "text-green-900", icon: "text-green-600" },
  warning: { bg: "bg-amber-50", text: "text-amber-900", icon: "text-amber-600" },
  danger: { bg: "bg-red-50", text: "text-red-900", icon: "text-red-600" },
  info: { bg: "bg-blue-50", text: "text-blue-900", icon: "text-blue-600" },
};

export function KpiCard({
  label,
  value,
  description,
  icon,
  variant = "default",
  className,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const colors = variantClasses[variant];
  return (
    <div className={cn("rounded-xl border border-gray-200 p-5", colors.bg, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          <div className={cn("mt-1 text-3xl font-bold", colors.text)}>{value}</div>
          {description && (
            <div className="mt-1 text-xs text-gray-500">{description}</div>
          )}
        </div>
        {icon && <div className={cn("rounded-lg p-2", colors.icon)}>{icon}</div>}
      </div>
    </div>
  );
}
