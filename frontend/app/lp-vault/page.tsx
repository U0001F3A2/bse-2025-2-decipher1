"use client";

import { StatCard } from "@/components/shared";
import { LPVaultCard } from "@/components/lp-vault";
import {
  useLPVaultStats,
  useETHPrice,
  formatTokenAmount,
  formatUSD,
  formatPercent,
} from "@/hooks";

export default function LPVaultPage() {
  const {
    totalAssets,
    totalBorrowed,
    availableLiquidity,
    utilizationRate,
    interestRate,
    paused,
    isLoading,
  } = useLPVaultStats();

  const { price: ethPrice, isLoading: ethPriceLoading } = useETHPrice();

  // Calculate TVL in USD
  const tvlUSD =
    totalAssets && ethPrice
      ? (Number(totalAssets) / 1e18) * ethPrice
      : 0;

  // APY calculation (simplified - interest rate is already annualized)
  const apy = interestRate ? Number(interestRate) / 100 : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold gradient-text">LP Vault</h1>
          {paused && (
            <span className="rounded-full bg-error/20 px-3 py-1 text-xs font-medium text-error">
              Paused
            </span>
          )}
        </div>
        <p className="mt-2 text-foreground-muted">
          Earn yield by providing WETH liquidity to leveraged traders
        </p>
      </div>

      {/* Vault Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Vault Stats</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total TVL"
            value={formatUSD(tvlUSD)}
            subtitle={`${formatTokenAmount(totalAssets)} WETH`}
            isLoading={isLoading || ethPriceLoading}
          />
          <StatCard
            title="APY"
            value={`${apy.toFixed(2)}%`}
            subtitle="Variable rate"
            isLoading={isLoading}
          />
          <StatCard
            title="Utilization"
            value={formatPercent(utilizationRate)}
            subtitle={`${formatTokenAmount(totalBorrowed)} borrowed`}
            isLoading={isLoading}
          />
          <StatCard
            title="Available"
            value={`${formatTokenAmount(availableLiquidity)} WETH`}
            subtitle="For borrowing"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deposit/Withdraw Card */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Deposit / Withdraw</h2>
          <LPVaultCard />
        </div>

        {/* Info Card */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">How it works</h2>
          <div className="glass-card space-y-4 p-6">
            <div>
              <h3 className="font-medium text-accent-purple">1. Deposit WETH</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Deposit your WETH into the vault and receive lpWETH shares representing your position.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-accent-cyan">2. Earn Yield</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Your WETH is lent to leveraged traders who pay interest. The yield is automatically compounded.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-accent-blue">3. Withdraw Anytime</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Redeem your lpWETH shares for WETH plus earned interest at any time, subject to available liquidity.
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h4 className="mb-2 text-sm font-medium">Interest Rate Model</h4>
              <p className="text-sm text-foreground-muted">
                Interest rates adjust dynamically based on utilization. Higher utilization means higher rates for lenders.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-foreground-muted">Current Rate: </span>
                  <span className="font-medium text-success">{apy.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-foreground-muted">Utilization: </span>
                  <span className="font-medium">{formatPercent(utilizationRate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
