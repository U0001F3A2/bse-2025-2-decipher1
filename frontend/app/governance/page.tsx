"use client";

import { useAccount } from "wagmi";
import { StatCard } from "@/components/shared";
import { ProposalList, CreateProposal } from "@/components/governance";
import {
  useGovernanceParams,
  useVotingPower,
  useIndexFundStats,
  formatTokenAmount,
} from "@/hooks";

export default function GovernancePage() {
  const { isConnected } = useAccount();
  const { votingPower, isLoading: votingPowerLoading } = useVotingPower();
  const {
    votingPeriod,
    quorumPercent,
    proposalThreshold,
    proposalCount,
    isLoading: paramsLoading,
  } = useGovernanceParams();
  const { totalSupply } = useIndexFundStats();

  // Calculate voting power percentage
  const votingPowerPercent =
    votingPower && totalSupply && totalSupply > BigInt(0)
      ? (Number(votingPower) / Number(totalSupply)) * 100
      : 0;

  // Format voting period
  const formatDuration = (seconds: bigint | undefined): string => {
    if (!seconds) return "0";
    const s = Number(seconds);
    if (s < 3600) return `${Math.floor(s / 60)} minutes`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours`;
    return `${Math.floor(s / 86400)} days`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Governance</h1>
          <p className="mt-2 text-foreground-muted">
            Participate in protocol decisions with your IDX tokens
          </p>
        </div>
        <CreateProposal />
      </div>

      {/* User Stats */}
      {isConnected && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Voting Power</h2>
          <div className="glass-card p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground-muted">Voting Power</p>
                <p className="mt-1 text-3xl font-bold">
                  {formatTokenAmount(votingPower)} IDX
                </p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {votingPowerPercent.toFixed(2)}% of total supply
                </p>
              </div>
              <div className="h-px w-full bg-white/10 sm:h-16 sm:w-px" />
              <div>
                <p className="text-sm text-foreground-muted">
                  Proposal Threshold
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatTokenAmount(proposalThreshold)} IDX
                </p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Minimum to create proposals
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Governance Parameters */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Governance Parameters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Proposals"
            value={proposalCount?.toString() || "0"}
            isLoading={paramsLoading}
          />
          <StatCard
            title="Voting Period"
            value={formatDuration(votingPeriod)}
            isLoading={paramsLoading}
          />
          <StatCard
            title="Quorum"
            value={`${quorumPercent?.toString() || "0"}%`}
            subtitle="Of total supply"
            isLoading={paramsLoading}
          />
          <StatCard
            title="Proposal Threshold"
            value={formatTokenAmount(proposalThreshold)}
            subtitle="IDX required"
            isLoading={paramsLoading}
          />
        </div>
      </section>

      {/* Proposals List */}
      <ProposalList />

      {/* How it works */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">How Governance Works</h2>
        <div className="glass-card p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/20">
                <span className="text-lg font-bold text-accent-purple">1</span>
              </div>
              <h3 className="font-medium">Hold IDX</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Your voting power equals your IDX token balance in the Index Fund.
              </p>
            </div>

            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-cyan/20">
                <span className="text-lg font-bold text-accent-cyan">2</span>
              </div>
              <h3 className="font-medium">Create Proposals</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Users with enough IDX can create proposals for protocol changes.
              </p>
            </div>

            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/20">
                <span className="text-lg font-bold text-accent-blue">3</span>
              </div>
              <h3 className="font-medium">Vote</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Cast your vote for or against proposals during the voting period.
              </p>
            </div>

            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-pink/20">
                <span className="text-lg font-bold text-accent-pink">4</span>
              </div>
              <h3 className="font-medium">Execute</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Passed proposals can be executed to implement the changes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
