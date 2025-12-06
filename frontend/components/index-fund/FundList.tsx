"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { parseAbi, formatUnits } from "viem";
import { Loader2, ChevronRight, TrendingUp } from "lucide-react";
import { CONTRACTS } from "@/lib/contracts";
import { FUND_FACTORY_ABI, INDEX_FUND_ABI, ERC20_ABI } from "@/lib/abis";

interface FundInfo {
  address: string;
  name: string;
  symbol: string;
  totalAssets: bigint;
  totalSupply: bigint;
}

export function FundList({
  selectedFund,
  onSelectFund,
}: {
  selectedFund: string | null;
  onSelectFund: (address: string) => void;
}) {
  // Get all funds from factory
  const { data: fundsData, isLoading: fundsLoading } = useReadContract({
    address: CONTRACTS.FUND_FACTORY as `0x${string}`,
    abi: parseAbi(FUND_FACTORY_ABI),
    functionName: "getAllFunds",
  });

  const funds = (fundsData as string[]) || [];

  // Build contracts array for fetching fund details
  const fundDetailContracts = funds.flatMap((fundAddress) => [
    {
      address: fundAddress as `0x${string}`,
      abi: parseAbi(ERC20_ABI),
      functionName: "name" as const,
    },
    {
      address: fundAddress as `0x${string}`,
      abi: parseAbi(ERC20_ABI),
      functionName: "symbol" as const,
    },
    {
      address: fundAddress as `0x${string}`,
      abi: parseAbi(INDEX_FUND_ABI),
      functionName: "totalAssets" as const,
    },
    {
      address: fundAddress as `0x${string}`,
      abi: parseAbi(INDEX_FUND_ABI),
      functionName: "totalSupply" as const,
    },
  ]);

  const { data: detailsData, isLoading: detailsLoading } = useReadContracts({
    contracts: fundDetailContracts,
    query: { enabled: funds.length > 0 },
  });

  // Parse fund details
  const fundInfos: FundInfo[] = funds.map((address, index) => {
    const baseIndex = index * 4;
    return {
      address,
      name: (detailsData?.[baseIndex]?.result as string) || "Unknown",
      symbol: (detailsData?.[baseIndex + 1]?.result as string) || "???",
      totalAssets: (detailsData?.[baseIndex + 2]?.result as bigint) || BigInt(0),
      totalSupply: (detailsData?.[baseIndex + 3]?.result as bigint) || BigInt(0),
    };
  });

  const isLoading = fundsLoading || detailsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent-purple" />
      </div>
    );
  }

  if (funds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-foreground-muted" />
        <p className="mt-4 text-foreground-muted">No funds created yet</p>
        <p className="mt-1 text-sm text-foreground-muted">
          Be the first to create an index fund!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fundInfos.map((fund) => {
        const isSelected = selectedFund === fund.address;
        const tvl = Number(fund.totalAssets) / 1e6; // Assuming USDC with 6 decimals

        return (
          <button
            key={fund.address}
            onClick={() => onSelectFund(fund.address)}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? "border-accent-purple bg-accent-purple/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{fund.name}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-foreground-muted">
                    {fund.symbol}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  TVL: ${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {fund.address.slice(0, 6)}...{fund.address.slice(-4)}
                </p>
              </div>
              <ChevronRight
                className={`h-5 w-5 transition-transform ${
                  isSelected ? "text-accent-purple" : "text-foreground-muted"
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
