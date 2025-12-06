"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";
import { FUND_FACTORY_CREATE_ABI } from "@/lib/abis";
import toast from "react-hot-toast";

interface TokenAllocation {
  token: string;
  targetPercentage: number; // basis points (10000 = 100%)
}

const COMMON_TOKENS = [
  { address: CONTRACTS.WETH, symbol: "WETH", name: "Wrapped ETH" },
  { address: CONTRACTS.USDC, symbol: "USDC", name: "USD Coin" },
];

export function CreateFund({ onSuccess }: { onSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [asset, setAsset] = useState<string>(CONTRACTS.USDC); // Deposit asset (USDC)
  const [feeRate, setFeeRate] = useState("200"); // 2% = 200 basis points
  const [allocations, setAllocations] = useState<TokenAllocation[]>([
    { token: CONTRACTS.WETH, targetPercentage: 5000 },
    { token: CONTRACTS.USDC, targetPercentage: 5000 },
  ]);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const totalWeight = allocations.reduce((sum, a) => sum + a.targetPercentage, 0);
  const isValidWeight = totalWeight === 10000; // 100% = 10000 basis points

  const addAllocation = () => {
    setAllocations([...allocations, { token: "", targetPercentage: 0 }]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  const updateAllocation = (index: number, field: keyof TokenAllocation, value: string | number) => {
    const updated = [...allocations];
    if (field === "targetPercentage") {
      // Convert percentage to basis points (50% -> 5000)
      updated[index].targetPercentage = Number(value) * 100;
    } else {
      updated[index].token = value as string;
    }
    setAllocations(updated);
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!name || !symbol) {
      toast.error("Please enter fund name and symbol");
      return;
    }

    if (!isValidWeight) {
      toast.error("Total weight must equal 100%");
      return;
    }

    const invalidAddress = allocations.find(a => !a.token || !a.token.startsWith("0x"));
    if (invalidAddress) {
      toast.error("Please enter valid token addresses");
      return;
    }

    try {
      const allocationTuples = allocations.map(a => ({
        token: a.token as `0x${string}`,
        targetPercentage: BigInt(a.targetPercentage),
      }));

      writeContract({
        address: CONTRACTS.FUND_FACTORY as `0x${string}`,
        abi: FUND_FACTORY_CREATE_ABI,
        functionName: "createFund",
        args: [name, symbol, asset as `0x${string}`, allocationTuples, BigInt(feeRate)],
      });

      toast.loading("Creating fund...", { id: "create-fund" });
    } catch (error) {
      console.error("Create fund error:", error);
      toast.error("Failed to create fund");
    }
  };

  // Handle write error
  useEffect(() => {
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message.slice(0, 100)}`, { id: "create-fund" });
    }
  }, [writeError]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Fund created successfully!", { id: "create-fund" });
      setIsOpen(false);
      setName("");
      setSymbol("");
      setAllocations([
        { token: CONTRACTS.WETH, targetPercentage: 5000 },
        { token: CONTRACTS.USDC, targetPercentage: 5000 },
      ]);
      onSuccess?.();
    }
  }, [isSuccess, hash, onSuccess]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition-all hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
      >
        <Plus className="h-5 w-5" />
        Create New Fund
      </button>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create New Index Fund</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-foreground-muted hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {/* Fund Name & Symbol */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-foreground-muted">Fund Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Index Fund"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-foreground-muted">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MIF"
              maxLength={10}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Deposit Asset */}
        <div>
          <label className="mb-2 block text-sm text-foreground-muted">Deposit Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {COMMON_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        {/* Management Fee */}
        <div>
          <label className="mb-2 block text-sm text-foreground-muted">
            Management Fee (basis points, 100 = 1%)
          </label>
          <input
            type="number"
            value={feeRate}
            onChange={(e) => setFeeRate(e.target.value)}
            placeholder="200"
            min="0"
            max="1000"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-foreground-muted">
            {(Number(feeRate) / 100).toFixed(2)}% annual fee
          </p>
        </div>

        {/* Token Allocations */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-foreground-muted">Token Allocations</label>
            <span className={`text-sm ${isValidWeight ? "text-success" : "text-error"}`}>
              Total: {(totalWeight / 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-3">
            {allocations.map((allocation, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={allocation.token}
                  onChange={(e) => updateAllocation(index, "token", e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select token</option>
                  {COMMON_TOKENS.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={allocation.targetPercentage / 100}
                    onChange={(e) => updateAllocation(index, "targetPercentage", e.target.value)}
                    min="0"
                    max="100"
                    className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-foreground-muted">%</span>
                </div>

                <button
                  onClick={() => removeAllocation(index)}
                  disabled={allocations.length <= 1}
                  className="rounded-lg p-2 text-foreground-muted hover:bg-white/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addAllocation}
            className="mt-3 flex items-center gap-2 text-sm text-accent-purple hover:text-purple-400"
          >
            <Plus className="h-4 w-4" />
            Add Token
          </button>
        </div>

        {/* Validation Warning */}
        {!isValidWeight && (
          <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            Total weight must equal 100%
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isConnected || isPending || isConfirming || !isValidWeight || !name || !symbol}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-semibold text-white transition-all hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Confirm in wallet..." : "Creating fund..."}
            </span>
          ) : (
            "Create Fund"
          )}
        </button>
      </div>
    </div>
  );
}
