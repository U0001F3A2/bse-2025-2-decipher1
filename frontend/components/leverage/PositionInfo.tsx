"use client";

import { useAccount } from "wagmi";
import {
  useETH2XUserPosition,
  useETH2XStats,
  useETHPrice,
  formatTokenAmount,
  formatUSD,
} from "@/hooks";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PositionInfo() {
  const { isConnected } = useAccount();
  const { balance } = useETH2XUserPosition();
  const { currentNAV } = useETH2XStats();
  const { price: ethPrice } = useETHPrice();

  if (!isConnected) {
    return (
      <div className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Your Position</h3>
        <p className="text-center text-foreground-muted">
          Connect wallet to view your position
        </p>
      </div>
    );
  }

  const hasPosition = balance && balance > BigInt(0);

  // Calculate position value
  const positionValue =
    balance && currentNAV
      ? (Number(balance) * Number(currentNAV)) / 1e36
      : 0;

  // Calculate leverage exposure in USD
  const leverageExposure = positionValue * 2;

  // Calculate ETH exposure
  const ethExposure = ethPrice ? leverageExposure / ethPrice : 0;

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Your Position</h3>

      {!hasPosition ? (
        <div className="text-center text-foreground-muted">
          <p>No position yet</p>
          <p className="mt-1 text-sm">Mint ETH2X to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">ETH2X Balance</span>
            <span className="text-xl font-bold">
              {formatTokenAmount(balance)} ETH2X
            </span>
          </div>

          {/* Position Value */}
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Position Value</span>
            <span className="font-medium">{formatUSD(positionValue)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Leverage Exposure */}
          <div className="rounded-lg bg-gradient-to-r from-accent-purple/10 to-accent-cyan/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">
                Leverage Exposure (2x)
              </span>
              <span className="font-bold text-accent-cyan">
                {formatUSD(leverageExposure)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-foreground-muted">ETH Equivalent</span>
              <span>{ethExposure.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="rounded-lg bg-warning/10 p-3">
            <p className="text-xs text-warning">
              2x leverage amplifies both gains and losses. Monitor your position
              regularly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
