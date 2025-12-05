"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import toast from "react-hot-toast";
import { Settings, RefreshCw, Coins } from "lucide-react";
import { TransactionButton } from "@/components/shared/TransactionButton";
import { CONTRACTS } from "@/lib/contracts";
import { INDEX_FUND_ABI } from "@/lib/abis";
import { useIndexFundStats, formatTokenAmount, parseError } from "@/hooks";

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
    error: collectError,
  } = useWriteContract();

  const { isLoading: isCollectConfirming, isSuccess: isCollectSuccess, error: collectReceiptError } = useWaitForTransactionReceipt({
    hash: collectHash,
  });

  // Rebalance
  const {
    writeContract: rebalance,
    isPending: isRebalancing,
    data: rebalanceHash,
    error: rebalanceError,
  } = useWriteContract();

  const { isLoading: isRebalanceConfirming, isSuccess: isRebalanceSuccess, error: rebalanceReceiptError } = useWaitForTransactionReceipt({
    hash: rebalanceHash,
  });

  // Handle errors
  useEffect(() => {
    if (collectError) {
      toast.error(parseError(collectError), { duration: 5000 });
    }
  }, [collectError]);

  useEffect(() => {
    if (collectReceiptError) {
      toast.error(parseError(collectReceiptError), { duration: 5000 });
    }
  }, [collectReceiptError]);

  useEffect(() => {
    if (rebalanceError) {
      toast.error(parseError(rebalanceError), { duration: 5000 });
    }
  }, [rebalanceError]);

  useEffect(() => {
    if (rebalanceReceiptError) {
      toast.error(parseError(rebalanceReceiptError), { duration: 5000 });
    }
  }, [rebalanceReceiptError]);

  // Handle success
  useEffect(() => {
    if (isCollectSuccess) {
      toast.success("Fees collected successfully!");
    }
  }, [isCollectSuccess]);

  useEffect(() => {
    if (isRebalanceSuccess) {
      toast.success("Rebalance completed!");
    }
  }, [isRebalanceSuccess]);

  const handleCollectFees = () => {
    collectFees({
      address: CONTRACTS.INDEX_FUND as `0x${string}`,
      abi: parseAbi(INDEX_FUND_ABI),
      functionName: "collectFees",
    });
  };

  const handleRebalance = () => {
    rebalance({
      address: CONTRACTS.INDEX_FUND as `0x${string}`,
      abi: parseAbi(INDEX_FUND_ABI),
      functionName: "rebalance",
    });
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
