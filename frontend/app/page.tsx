"use client";

import Link from "next/link";
import { PieChart, Vault, TrendingUp, ArrowRight } from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card p-6">
      <p className="text-sm text-foreground-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
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
          <StatCard title="Total TVL" value="$0.00" subtitle="Across all vaults" />
          <StatCard title="Index Fund TVL" value="$0.00" />
          <StatCard title="LP Vault TVL" value="$0.00" />
          <StatCard title="ETH Price" value="$0.00" />
        </div>
      </section>

      {/* Your Positions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Your Positions</h2>
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
                <td className="px-6 py-4">0 IDX</td>
                <td className="px-6 py-4 text-right">$0.00</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-6 py-4">LP Vault Shares</td>
                <td className="px-6 py-4">0 lpWETH</td>
                <td className="px-6 py-4 text-right">$0.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4">ETH2X Balance</td>
                <td className="px-6 py-4">0 ETH2X</td>
                <td className="px-6 py-4 text-right">$0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
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
