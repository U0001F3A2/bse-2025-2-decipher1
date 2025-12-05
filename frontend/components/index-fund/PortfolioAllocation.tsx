"use client";

import { useIndexFundAllocations } from "@/hooks";
import { CONTRACTS } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

// Token metadata mapping
const TOKEN_INFO: Record<string, { symbol: string; name: string; color: string }> = {
  [CONTRACTS.WETH.toLowerCase()]: {
    symbol: "WETH",
    name: "Wrapped Ether",
    color: "#627EEA",
  },
  [CONTRACTS.USDC.toLowerCase()]: {
    symbol: "USDC",
    name: "USD Coin",
    color: "#2775CA",
  },
};

function getTokenInfo(address: string) {
  return (
    TOKEN_INFO[address.toLowerCase()] || {
      symbol: address.slice(0, 6) + "...",
      name: "Unknown Token",
      color: "#8b5cf6",
    }
  );
}

export function PortfolioAllocation() {
  const { tokens, weights, isLoading } = useIndexFundAllocations();

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Portfolio Allocation</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent-purple" />
        </div>
      </div>
    );
  }

  // Calculate total weight
  const totalWeight = weights.reduce(
    (sum, w) => sum + Number(w),
    0
  );

  // Build allocation data
  const allocations = tokens.map((token, index) => {
    const info = getTokenInfo(token);
    const weight = weights[index] ? Number(weights[index]) : 0;
    const percentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

    return {
      address: token,
      ...info,
      weight,
      percentage,
    };
  });

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Portfolio Allocation</h3>

      {allocations.length === 0 ? (
        <p className="text-center text-foreground-muted">No allocations set</p>
      ) : (
        <div className="space-y-4">
          {/* Progress Bars */}
          {allocations.map((alloc) => (
            <div key={alloc.address}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: alloc.color }}
                  />
                  <span className="font-medium">{alloc.symbol}</span>
                  <span className="text-sm text-foreground-muted">
                    {alloc.name}
                  </span>
                </div>
                <span className="font-medium">{alloc.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${alloc.percentage}%`,
                    backgroundColor: alloc.color,
                  }}
                />
              </div>
            </div>
          ))}

          {/* Combined Bar */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 text-sm text-foreground-muted">Combined View</p>
            <div className="flex h-4 overflow-hidden rounded-full">
              {allocations.map((alloc, index) => (
                <div
                  key={alloc.address}
                  className="transition-all"
                  style={{
                    width: `${alloc.percentage}%`,
                    backgroundColor: alloc.color,
                  }}
                  title={`${alloc.symbol}: ${alloc.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
