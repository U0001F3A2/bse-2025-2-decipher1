"use client";

import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";
import { LEVERAGED_2X_TOKEN_ABI } from "@/lib/abis";
import { useETH2XStats } from "@/hooks";

export function RebalanceStatus() {
  const { needsRebalance, leverageRatio, isLoading } = useETH2XStats();

  // Get last rebalance timestamp
  const { data: lastRebalance } = useReadContract({
    address: CONTRACTS.ETH2X as `0x${string}`,
    abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
    functionName: "lastRebalance",
  });

  // Get rebalance interval
  const { data: rebalanceInterval } = useReadContract({
    address: CONTRACTS.ETH2X as `0x${string}`,
    abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
    functionName: "rebalanceInterval",
  });

  // Calculate time since last rebalance
  const lastRebalanceTime = lastRebalance
    ? new Date(Number(lastRebalance) * 1000)
    : null;

  const timeSinceRebalance = lastRebalanceTime
    ? Math.floor((Date.now() - lastRebalanceTime.getTime()) / 1000)
    : 0;

  const formatTimeAgo = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const formatTimeUntil = (seconds: number): string => {
    if (seconds <= 0) return "Now";
    if (seconds < 60) return `in ${seconds} seconds`;
    if (seconds < 3600) return `in ${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `in ${Math.floor(seconds / 3600)} hours`;
    return `in ${Math.floor(seconds / 86400)} days`;
  };

  const nextRebalanceIn = rebalanceInterval
    ? Number(rebalanceInterval) - timeSinceRebalance
    : 0;

  // Calculate actual leverage ratio (assuming 18 decimals, ratio in basis points or similar)
  const currentLeverage = leverageRatio
    ? (Number(leverageRatio) / 1e18).toFixed(2)
    : "2.00";

  const isHealthy = !needsRebalance && Math.abs(Number(currentLeverage) - 2) < 0.2;

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Rebalance Status</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Rebalance Status</h3>

      <div className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          {needsRebalance ? (
            <>
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="font-medium text-warning">Rebalance Needed</span>
            </>
          ) : isHealthy ? (
            <>
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-success">Healthy</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-foreground-muted" />
              <span className="font-medium">Within Range</span>
            </>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground-muted">Current Leverage</span>
            <span
              className={`font-medium ${
                Math.abs(Number(currentLeverage) - 2) < 0.1
                  ? "text-success"
                  : Math.abs(Number(currentLeverage) - 2) < 0.2
                    ? "text-warning"
                    : "text-error"
              }`}
            >
              {currentLeverage}x
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-foreground-muted">Target Leverage</span>
            <span>2.00x</span>
          </div>

          <div className="flex justify-between">
            <span className="text-foreground-muted">Last Rebalance</span>
            <span>{lastRebalanceTime ? formatTimeAgo(timeSinceRebalance) : "Never"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-foreground-muted">Next Rebalance</span>
            <span>{formatTimeUntil(nextRebalanceIn)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-foreground-muted">
            <span>Leverage Range</span>
            <span>1.8x - 2.2x</span>
          </div>
          <div className="relative h-2 rounded-full bg-white/10">
            {/* Safe zone indicator */}
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-cyan"
              style={{
                left: "40%",
                width: "20%",
              }}
            />
            {/* Current position indicator */}
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-bg-card"
              style={{
                left: `${Math.min(Math.max(((Number(currentLeverage) - 1.5) / 1) * 100, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
