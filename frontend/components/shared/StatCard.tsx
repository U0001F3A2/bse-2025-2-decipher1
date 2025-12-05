"use client";

import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, subtitle, isLoading }: StatCardProps) {
  return (
    <div className="glass-card p-6">
      <p className="text-sm text-foreground-muted">{title}</p>
      {isLoading ? (
        <div className="mt-2 flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent-purple" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}
