"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, parseAbi } from "viem";
import toast from "react-hot-toast";
import { TokenInput } from "@/components/shared/TokenInput";
import { TransactionButton } from "@/components/shared/TransactionButton";
import { CONTRACTS } from "@/lib/contracts";
import { LEVERAGED_2X_TOKEN_ABI, ERC20_ABI } from "@/lib/abis";
import { useETH2XUserPosition, useETH2XStats, formatTokenAmount, parseError } from "@/hooks";

type Tab = "mint" | "redeem";

export function MintRedeemCard() {
  const [activeTab, setActiveTab] = useState<Tab>("mint");
  const [amount, setAmount] = useState("");

  const { address, isConnected } = useAccount();
  const { balance: eth2xBalance } = useETH2XUserPosition();
  const { currentNAV } = useETH2XStats();

  // USDC balance (6 decimals)
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: parseAbi(ERC20_ABI),
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: parseAbi(ERC20_ABI),
    functionName: "allowance",
    args: address ? [address, CONTRACTS.ETH2X as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  // Approve USDC
  const {
    writeContract: approveUsdc,
    isPending: isApproving,
    data: approveHash,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess, error: approveReceiptError } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Mint ETH2X
  const {
    writeContract: mint,
    isPending: isMinting,
    data: mintHash,
    error: mintError,
  } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess, error: mintReceiptError } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Redeem ETH2X
  const {
    writeContract: redeem,
    isPending: isRedeeming,
    data: redeemHash,
    error: redeemError,
  } = useWriteContract();

  const { isLoading: isRedeemConfirming, isSuccess: isRedeemSuccess, error: redeemReceiptError } = useWaitForTransactionReceipt({
    hash: redeemHash,
  });

  // Handle errors
  useEffect(() => {
    if (approveError) {
      toast.error(parseError(approveError), { duration: 5000 });
    }
  }, [approveError]);

  useEffect(() => {
    if (approveReceiptError) {
      toast.error(parseError(approveReceiptError), { duration: 5000 });
    }
  }, [approveReceiptError]);

  useEffect(() => {
    if (mintError) {
      toast.error(parseError(mintError), { duration: 5000 });
    }
  }, [mintError]);

  useEffect(() => {
    if (mintReceiptError) {
      toast.error(parseError(mintReceiptError), { duration: 5000 });
    }
  }, [mintReceiptError]);

  useEffect(() => {
    if (redeemError) {
      toast.error(parseError(redeemError), { duration: 5000 });
    }
  }, [redeemError]);

  useEffect(() => {
    if (redeemReceiptError) {
      toast.error(parseError(redeemReceiptError), { duration: 5000 });
    }
  }, [redeemReceiptError]);

  // Handle success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Approval confirmed!");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isMintSuccess) {
      toast.success("Mint confirmed!");
      setAmount("");
    }
  }, [isMintSuccess]);

  useEffect(() => {
    if (isRedeemSuccess) {
      toast.success("Redeem confirmed!");
      setAmount("");
    }
  }, [isRedeemSuccess]);

  // USDC has 6 decimals
  const parsedAmount =
    activeTab === "mint"
      ? amount
        ? parseUnits(amount, 6)
        : BigInt(0)
      : amount
        ? parseUnits(amount, 18)
        : BigInt(0);

  const needsApproval =
    activeTab === "mint" &&
    usdcAllowance !== undefined &&
    parsedAmount > (usdcAllowance as bigint);

  // Calculate expected ETH2X from mint
  const expectedETH2X =
    activeTab === "mint" && amount && currentNAV && Number(currentNAV) > 0
      ? (parseFloat(amount) * 1e18) / Number(currentNAV)
      : 0;

  // Calculate expected USDC from redeem
  const expectedUSDC =
    activeTab === "redeem" && amount && currentNAV
      ? (parseFloat(amount) * Number(currentNAV)) / 1e18
      : 0;

  const handleApprove = () => {
    approveUsdc({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: parseAbi(ERC20_ABI),
      functionName: "approve",
      args: [CONTRACTS.ETH2X as `0x${string}`, parsedAmount],
    });
  };

  const handleMint = () => {
    if (!address || !parsedAmount) return;

    mint({
      address: CONTRACTS.ETH2X as `0x${string}`,
      abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
      functionName: "mint",
      args: [parsedAmount],
    });
  };

  const handleRedeem = () => {
    if (!address || !parsedAmount) return;

    redeem({
      address: CONTRACTS.ETH2X as `0x${string}`,
      abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
      functionName: "redeem",
      args: [parsedAmount],
    });
  };

  const handleMaxClick = () => {
    if (activeTab === "mint" && usdcBalance) {
      setAmount(formatUnits(usdcBalance as bigint, 6));
    } else if (activeTab === "redeem" && eth2xBalance) {
      setAmount(formatUnits(eth2xBalance, 18));
    }
  };

  const isLoading =
    isApproving ||
    isApproveConfirming ||
    isMinting ||
    isMintConfirming ||
    isRedeeming ||
    isRedeemConfirming;

  return (
    <div className="glass-card p-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-lg bg-white/5 p-1">
        <button
          onClick={() => {
            setActiveTab("mint");
            setAmount("");
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "mint"
              ? "bg-accent-purple text-white"
              : "text-foreground-muted hover:text-white"
          }`}
        >
          Mint
        </button>
        <button
          onClick={() => {
            setActiveTab("redeem");
            setAmount("");
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "redeem"
              ? "bg-accent-purple text-white"
              : "text-foreground-muted hover:text-white"
          }`}
        >
          Redeem
        </button>
      </div>

      {/* Input */}
      <TokenInput
        value={amount}
        onChange={setAmount}
        symbol={activeTab === "mint" ? "USDC" : "ETH2X"}
        balance={
          activeTab === "mint"
            ? formatTokenAmount(usdcBalance as bigint | undefined, 6, 2)
            : formatTokenAmount(eth2xBalance)
        }
        onMax={handleMaxClick}
        disabled={!isConnected}
      />

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="mt-4 rounded-lg bg-white/5 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">You will receive</span>
            <span>
              ~
              {activeTab === "mint"
                ? `${expectedETH2X.toFixed(4)} ETH2X`
                : `${expectedUSDC.toFixed(2)} USDC`}
            </span>
          </div>
          {activeTab === "mint" && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-foreground-muted">Leverage exposure</span>
              <span className="text-accent-cyan">
                ${(parseFloat(amount) * 2).toFixed(2)} worth of ETH
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6">
        {!isConnected ? (
          <div className="rounded-xl bg-white/5 p-4 text-center text-foreground-muted">
            Connect wallet to continue
          </div>
        ) : activeTab === "mint" ? (
          needsApproval ? (
            <TransactionButton
              onClick={handleApprove}
              isLoading={isApproving || isApproveConfirming}
              loadingText="Approving..."
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Approve USDC
            </TransactionButton>
          ) : (
            <TransactionButton
              onClick={handleMint}
              isLoading={isMinting || isMintConfirming}
              loadingText="Minting..."
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Mint ETH2X
            </TransactionButton>
          )
        ) : (
          <TransactionButton
            onClick={handleRedeem}
            isLoading={isRedeeming || isRedeemConfirming}
            loadingText="Redeeming..."
            disabled={!amount || parseFloat(amount) <= 0}
            variant="secondary"
          >
            Redeem
          </TransactionButton>
        )}
      </div>
    </div>
  );
}
