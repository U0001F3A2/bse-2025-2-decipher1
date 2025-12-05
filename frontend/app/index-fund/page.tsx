"use client";

import { StatCard } from "@/components/shared";
import {
  PortfolioAllocation,
  DepositWithdraw,
  OwnerControls,
} from "@/components/index-fund";
import { useIndexFundStats, formatTokenAmount, formatUSD } from "@/hooks";

export default function IndexFundPage() {
  const {
    totalAssets,
    totalSupply,
    managementFeeRate,
    sharePrice,
    isLoading,
  } = useIndexFundStats();

  // Calculate TVL (assuming assets are in USDC with 6 decimals, normalized to 18)
  const tvl = totalAssets ? Number(totalAssets) / 1e6 : 0;

  // Share price in USDC
  const sharePriceUSD = sharePrice ? Number(sharePrice) / 1e18 : 1;

  // Management fee rate (assuming stored as basis points)
  const feePercent = managementFeeRate
    ? (Number(managementFeeRate) / 100).toFixed(2)
    : "0";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Index Fund</h1>
        <p className="mt-2 text-foreground-muted">
          Diversified multi-token index with automated rebalancing
        </p>
      </div>

      {/* Fund Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Fund Stats</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total TVL"
            value={formatUSD(tvl)}
            isLoading={isLoading}
          />
          <StatCard
            title="Your Shares"
            value={formatTokenAmount(totalSupply)}
            subtitle="IDX tokens"
            isLoading={isLoading}
          />
          <StatCard
            title="Share Price"
            value={formatUSD(sharePriceUSD)}
            subtitle="Per IDX"
            isLoading={isLoading}
          />
          <StatCard
            title="Management Fee"
            value={`${feePercent}%`}
            subtitle="Annual"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Deposit / Withdraw</h2>
            <DepositWithdraw />
          </div>

          {/* Owner Controls (only visible to owner) */}
          <OwnerControls />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Portfolio Allocation</h2>
            <PortfolioAllocation />
          </div>

          {/* How it works */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold">How it works</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-accent-purple">
                  1. Deposit USDC
                </h4>
                <p className="mt-1 text-sm text-foreground-muted">
                  Deposit USDC to receive IDX shares representing your
                  proportional ownership of the fund.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-accent-cyan">
                  2. Diversified Exposure
                </h4>
                <p className="mt-1 text-sm text-foreground-muted">
                  Your deposit is automatically allocated across multiple tokens
                  according to the fund&apos;s target allocation.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-accent-blue">
                  3. Auto-Rebalancing
                </h4>
                <p className="mt-1 text-sm text-foreground-muted">
                  The fund periodically rebalances to maintain target allocations,
                  ensuring consistent diversification.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-accent-pink">
                  4. Withdraw Anytime
                </h4>
                <p className="mt-1 text-sm text-foreground-muted">
                  Redeem your IDX shares for the underlying USDC value at any time.
                </p>
              </div>
            </div>

            {/* Fee Info */}
            <div className="mt-6 rounded-lg bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-medium">Fee Structure</h4>
              <div className="space-y-1 text-sm text-foreground-muted">
                <div className="flex justify-between">
                  <span>Management Fee</span>
                  <span>{feePercent}% annually</span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit Fee</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between">
                  <span>Withdrawal Fee</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
