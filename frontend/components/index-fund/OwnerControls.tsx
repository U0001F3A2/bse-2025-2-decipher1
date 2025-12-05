"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import toast from "react-hot-toast";
import { Settings, RefreshCw, Coins } from "lucide-react";
import { TransactionButton } from "@/components/shared/TransactionButton";
import { CONTRACTS } from "@/lib/contracts";
import { INDEX_FUND_ABI } from "@/lib/abis";
import { useIndexFundStats, formatTokenAmount } from "@/hooks";

export function OwnerControls() {
  const { address } = useAccount();
  const { accruedFees, isLoading } = useIndexFundStats();

  // Check if current user is owner (simple check - in production would read owner() from contract)
  const { data: owner } = useReadContract({
    address: CONTRACTS.INDEX_FUND as `0x${string}`,
    abi: parseAbi(["function owner() view returns (address)"]),
    functionName: "owner",
  });

  const isOwner = owner && address && owner.toString().toLowerCase() === address.toLowerCase();

  // Collect Fees
  const {
    writeContract: collectFees,
    isPending: isCollecting,
    data: collectHash,
  } = useWriteContract();

  const { isLoading: isCollectConfirming } = useWaitForTransactionReceipt({
    hash: collectHash,
  });

  // Rebalance
  const {
    writeContract: rebalance,
    isPending: isRebalancing,
    data: rebalanceHash,
  } = useWriteContract();

  const { isLoading: isRebalanceConfirming } = useWaitForTransactionReceipt({
    hash: rebalanceHash,
  });

  const handleCollectFees = async () => {
    try {
      collectFees({
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "collectFees",
      });
      toast.success("Fee collection submitted");
    } catch (error) {
      toast.error("Fee collection failed");
      console.error(error);
    }
  };

  const handleRebalance = async () => {
    try {
      rebalance({
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "rebalance",
      });
      toast.success("Rebalance submitted");
    } catch (error) {
      toast.error("Rebalance failed");
      console.error(error);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-accent-purple" />
        <h3 className="text-lg font-semibold">Owner Controls</h3>
      </div>

      <div className="space-y-4">
        {/* Accrued Fees */}
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Accrued Fees</p>
              <p className="mt-1 text-xl font-bold">
                {formatTokenAmount(accruedFees)} IDX
              </p>
            </div>
            <TransactionButton
              onClick={handleCollectFees}
              isLoading={isCollecting || isCollectConfirming}
              loadingText="Collecting..."
              disabled={!accruedFees || accruedFees === BigInt(0)}
            >
              <Coins className="h-4 w-4" />
              Collect
            </TransactionButton>
          </div>
        </div>

        {/* Rebalance */}
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Portfolio Rebalance</p>
              <p className="mt-1 text-sm">
                Rebalance portfolio to target allocations
              </p>
            </div>
            <TransactionButton
              onClick={handleRebalance}
              isLoading={isRebalancing || isRebalanceConfirming}
              loadingText="Rebalancing..."
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4" />
              Rebalance
            </TransactionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
