"use client";

import Link from "next/link";
import { PieChart, Vault, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import {
  useLPVaultStats,
  useLPVaultUserPosition,
  useETH2XStats,
  useETH2XUserPosition,
  useIndexFundStats,
  useIndexFundUserPosition,
  useETHPrice,
  formatTokenAmount,
  formatUSD,
} from "@/hooks";

function StatCard({
  title,
  value,
  subtitle,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  isLoading?: boolean;
}) {
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

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="glass-card group flex items-center gap-4 p-6 transition-all hover:border-accent-purple/50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/20">
        <Icon className="h-6 w-6 text-accent-purple" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-foreground-muted transition-transform group-hover:translate-x-1 group-hover:text-accent-purple" />
    </Link>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();

  // Protocol stats
  const lpVaultStats = useLPVaultStats();
  const indexFundStats = useIndexFundStats();
  const eth2xStats = useETH2XStats();
  const { price: ethPrice, isLoading: ethPriceLoading } = useETHPrice();

  // User positions
  const lpVaultPosition = useLPVaultUserPosition();
  const indexFundPosition = useIndexFundUserPosition();
  const eth2xPosition = useETH2XUserPosition();

  // Calculate TVLs in USD
  // LP Vault uses WETH (18 decimals)
  const lpVaultTVL =
    lpVaultStats.totalAssets && ethPrice
      ? (Number(lpVaultStats.totalAssets) / 1e18) * ethPrice
      : 0;

  // Index Fund uses USDC (6 decimals) - totalAssets is in USDC
  const indexFundTVL = indexFundStats.totalAssets
    ? Number(indexFundStats.totalAssets) / 1e6
    : 0;

  const totalTVL = lpVaultTVL + indexFundTVL;

  // Calculate user position values
  // LP Vault uses WETH (18 decimals)
  const lpVaultValue =
    lpVaultPosition.assetsValue && ethPrice
      ? (Number(lpVaultPosition.assetsValue) / 1e18) * ethPrice
      : 0;

  // Index Fund uses USDC (6 decimals)
  const indexFundValue = indexFundPosition.assetsValue
    ? Number(indexFundPosition.assetsValue) / 1e6
    : 0;

  // ETH2X: balance is 18 decimals, NAV is 6 decimals (USDC)
  // value = (balance * nav) / 1e18 / 1e6 = (balance * nav) / 1e24
  const eth2xValue =
    eth2xPosition.balance && eth2xStats.currentNAV
      ? (Number(eth2xPosition.balance) * Number(eth2xStats.currentNAV)) / 1e24
      : 0;

  const isLoading =
    lpVaultStats.isLoading ||
    indexFundStats.isLoading ||
    eth2xStats.isLoading ||
    ethPriceLoading;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="mt-2 text-foreground-muted">
          Overview of your positions and protocol stats
        </p>
      </div>

      {/* Protocol Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Protocol Stats</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total TVL"
            value={formatUSD(totalTVL)}
            subtitle="Across all vaults"
            isLoading={isLoading}
          />
          <StatCard
            title="Index Fund TVL"
            value={formatUSD(indexFundTVL)}
            isLoading={indexFundStats.isLoading}
          />
          <StatCard
            title="LP Vault TVL"
            value={formatUSD(lpVaultTVL)}
            subtitle={`${formatTokenAmount(lpVaultStats.totalAssets)} WETH`}
            isLoading={lpVaultStats.isLoading || ethPriceLoading}
          />
          <StatCard
            title="ETH Price"
            value={formatUSD(ethPrice)}
            isLoading={ethPriceLoading}
          />
        </div>
      </section>

      {/* Your Positions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Your Positions</h2>
        {!isConnected ? (
          <div className="glass-card p-8 text-center">
            <p className="text-foreground-muted">
              Connect your wallet to view your positions
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                    Asset
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground-muted">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-6 py-4">Index Fund Shares</td>
                  <td className="px-6 py-4">
                    {indexFundPosition.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${formatTokenAmount(indexFundPosition.shares)} IDX`
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatUSD(indexFundValue)}
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="px-6 py-4">LP Vault Shares</td>
                  <td className="px-6 py-4">
                    {lpVaultPosition.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${formatTokenAmount(lpVaultPosition.shares)} lpWETH`
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatUSD(lpVaultValue)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4">ETH2X Balance</td>
                  <td className="px-6 py-4">
                    {eth2xPosition.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${formatTokenAmount(eth2xPosition.balance)} ETH2X`
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatUSD(eth2xValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Index Fund"
            description="Invest in a diversified multi-token index"
            href="/index-fund"
            icon={PieChart}
          />
          <QuickActionCard
            title="LP Vault"
            description="Earn yield by providing WETH liquidity"
            href="/lp-vault"
            icon={Vault}
          />
          <QuickActionCard
            title="Leverage"
            description="Get 2x exposure to ETH price"
            href="/leverage"
            icon={TrendingUp}
          />
        </div>
      </section>
    </div>
  );
}
