"use client";

import { Loader2 } from "lucide-react";

interface TransactionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function TransactionButton({
  onClick,
  disabled,
  isLoading,
  loadingText = "Confirming...",
  children,
  variant = "primary",
}: TransactionButtonProps) {
  const baseClasses =
    "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
      : "bg-white/10 hover:bg-white/20 border border-white/10 text-white";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
