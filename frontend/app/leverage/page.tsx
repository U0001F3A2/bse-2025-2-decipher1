"use client";

import { StatCard } from "@/components/shared";
import { MintRedeemCard, PositionInfo, RebalanceStatus } from "@/components/leverage";
import {
  useETH2XStats,
  useETHPrice,
  formatTokenAmount,
  formatUSD,
} from "@/hooks";

export default function LeveragePage() {
  const {
    totalSupply,
    currentNAV,
    leverageRatio,
    paused,
    isLoading,
  } = useETH2XStats();

  const { price: ethPrice, isLoading: ethPriceLoading } = useETHPrice();

  // Calculate NAV in USD (assuming NAV is in USDC with 6 decimals stored as 18)
  const navUSD = currentNAV ? Number(currentNAV) / 1e18 : 0;

  // Calculate total market cap
  const totalMarketCap =
    totalSupply && currentNAV
      ? (Number(totalSupply) * Number(currentNAV)) / 1e36
      : 0;

  // Current leverage
  const currentLeverage = leverageRatio
    ? (Number(leverageRatio) / 1e18).toFixed(2)
    : "2.00";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold gradient-text">ETH 2x Leveraged Token</h1>
          {paused && (
            <span className="rounded-full bg-error/20 px-3 py-1 text-xs font-medium text-error">
              Paused
            </span>
          )}
        </div>
        <p className="mt-2 text-foreground-muted">
          Get 2x exposure to ETH price movements with automated rebalancing
        </p>
      </div>

      {/* Token Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Token Stats</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current NAV"
            value={formatUSD(navUSD)}
            subtitle="Per ETH2X token"
            isLoading={isLoading}
          />
          <StatCard
            title="Leverage"
            value={`${currentLeverage}x`}
            subtitle="Target: 2.0x"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Supply"
            value={formatTokenAmount(totalSupply)}
            subtitle="ETH2X tokens"
            isLoading={isLoading}
          />
          <StatCard
            title="ETH Price"
            value={formatUSD(ethPrice)}
            isLoading={ethPriceLoading}
          />
        </div>
      </section>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mint/Redeem Card */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Mint / Redeem</h2>
          <MintRedeemCard />
        </div>

        {/* Position & Rebalance Info */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Your Position</h2>
            <PositionInfo />
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold">Rebalance</h2>
            <RebalanceStatus />
          </div>
        </div>
      </div>

      {/* How it works */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">How it works</h2>
        <div className="glass-card p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/20">
                <span className="text-lg font-bold text-accent-purple">1</span>
              </div>
              <h3 className="font-medium">Deposit USDC</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Mint ETH2X tokens using USDC as collateral. Your collateral is used to
                borrow WETH and create 2x leverage.
              </p>
            </div>

            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-cyan/20">
                <span className="text-lg font-bold text-accent-cyan">2</span>
              </div>
              <h3 className="font-medium">Automatic Rebalancing</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                The protocol automatically rebalances to maintain 2x leverage, protecting
                against liquidation and volatility decay.
              </p>
            </div>

            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/20">
                <span className="text-lg font-bold text-accent-blue">3</span>
              </div>
              <h3 className="font-medium">Redeem Anytime</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Redeem your ETH2X tokens for USDC at any time. Your returns reflect 2x
                the ETH price movement (minus fees).
              </p>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="mt-6 rounded-lg bg-warning/10 border border-warning/20 p-4">
            <h4 className="font-medium text-warning">Risk Warning</h4>
            <ul className="mt-2 space-y-1 text-sm text-foreground-muted">
              <li>• 2x leverage amplifies both gains and losses</li>
              <li>• Volatility decay may impact long-term performance</li>
              <li>• Interest costs are incurred on borrowed funds</li>
              <li>• Smart contract risk - use at your own discretion</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
