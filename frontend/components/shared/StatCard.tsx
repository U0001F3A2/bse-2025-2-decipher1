"use client";

import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, subtitle, isLoading }: StatCardProps) {
  // Determine font size based on value length
  const getValueClass = (val: string) => {
    const len = val.length;
    if (len > 20) return "text-sm font-bold break-all";
    if (len > 14) return "text-base font-bold";
    if (len > 10) return "text-xl font-bold";
    return "text-2xl font-bold";
  };

  return (
    <div className="glass-card p-6">
      <p className="text-sm text-foreground-muted">{title}</p>
      {isLoading ? (
        <div className="mt-2 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent-purple" />
        </div>
      ) : (
        <>
          <p className={`mt-2 ${getValueClass(value)}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}
