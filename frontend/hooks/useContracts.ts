"use client";

import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { formatEther, formatUnits, parseAbi } from "viem";
import { CONTRACTS } from "@/lib/contracts";
import {
  LP_VAULT_ABI,
  LEVERAGED_2X_TOKEN_ABI,
  INDEX_FUND_ABI,
  ERC20_ABI,
} from "@/lib/abis";

// LP Vault hooks
export function useLPVaultStats() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "totalAssets",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "totalSupply",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "totalBorrowed",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "availableLiquidity",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "utilizationRate",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "interestRate",
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "paused",
      },
    ],
  });

  return {
    totalAssets: data?.[0]?.result as bigint | undefined,
    totalSupply: data?.[1]?.result as bigint | undefined,
    totalBorrowed: data?.[2]?.result as bigint | undefined,
    availableLiquidity: data?.[3]?.result as bigint | undefined,
    utilizationRate: data?.[4]?.result as bigint | undefined,
    interestRate: data?.[5]?.result as bigint | undefined,
    paused: data?.[6]?.result as boolean | undefined,
    isLoading,
    error,
  };
}

export function useLPVaultUserPosition() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.LP_VAULT as `0x${string}`,
        abi: parseAbi(LP_VAULT_ABI),
        functionName: "convertToAssets",
        args: [BigInt(1e18)], // 1 share
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const shares = data?.[0]?.result as bigint | undefined;
  const sharePrice = data?.[1]?.result as bigint | undefined;
  const assetsValue =
    shares && sharePrice ? (shares * sharePrice) / BigInt(1e18) : undefined;

  return {
    shares,
    sharePrice,
    assetsValue,
    isLoading,
    error,
  };
}

// ETH2X hooks
export function useETH2XStats() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.ETH2X as `0x${string}`,
        abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
        functionName: "totalSupply",
      },
      {
        address: CONTRACTS.ETH2X as `0x${string}`,
        abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
        functionName: "getCurrentNAV",
      },
      {
        address: CONTRACTS.ETH2X as `0x${string}`,
        abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
        functionName: "getLeverageRatio",
      },
      {
        address: CONTRACTS.ETH2X as `0x${string}`,
        abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
        functionName: "needsRebalance",
      },
      {
        address: CONTRACTS.ETH2X as `0x${string}`,
        abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
        functionName: "paused",
      },
    ],
  });

  return {
    totalSupply: data?.[0]?.result as bigint | undefined,
    currentNAV: data?.[1]?.result as bigint | undefined,
    leverageRatio: data?.[2]?.result as bigint | undefined,
    needsRebalance: data?.[3]?.result as boolean | undefined,
    paused: data?.[4]?.result as boolean | undefined,
    isLoading,
    error,
  };
}

export function useETH2XUserPosition() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.ETH2X as `0x${string}`,
    abi: parseAbi(LEVERAGED_2X_TOKEN_ABI),
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Index Fund hooks
export function useIndexFundStats() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "totalAssets",
      },
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "totalSupply",
      },
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "managementFeeRate",
      },
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "convertToAssets",
        args: [BigInt(1e18)], // 1 share price
      },
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "accruedFees",
      },
    ],
  });

  return {
    totalAssets: data?.[0]?.result as bigint | undefined,
    totalSupply: data?.[1]?.result as bigint | undefined,
    managementFeeRate: data?.[2]?.result as bigint | undefined,
    sharePrice: data?.[3]?.result as bigint | undefined,
    accruedFees: data?.[4]?.result as bigint | undefined,
    isLoading,
    error,
  };
}

export function useIndexFundAllocations() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.INDEX_FUND as `0x${string}`,
    abi: parseAbi(INDEX_FUND_ABI),
    functionName: "getAllocations",
  });

  const result = data as [string[], bigint[]] | undefined;

  return {
    tokens: result?.[0] || [],
    weights: result?.[1] || [],
    isLoading,
    error,
  };
}

export function useIndexFundUserPosition() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.INDEX_FUND as `0x${string}`,
        abi: parseAbi(INDEX_FUND_ABI),
        functionName: "convertToAssets",
        args: [BigInt(1e18)], // 1 share
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const shares = data?.[0]?.result as bigint | undefined;
  const sharePrice = data?.[1]?.result as bigint | undefined;
  const assetsValue =
    shares && sharePrice ? (shares * sharePrice) / BigInt(1e18) : undefined;

  return {
    shares,
    sharePrice,
    assetsValue,
    isLoading,
    error,
  };
}

// ETH Price from Oracle
export function useETHPrice() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.ETH_USD_ORACLE as `0x${string}`,
    abi: parseAbi([
      "function latestAnswer() view returns (int256)",
      "function decimals() view returns (uint8)",
    ]),
    functionName: "latestAnswer",
  });

  // Chainlink price feeds typically have 8 decimals
  const price = data ? Number(data) / 1e8 : undefined;

  return {
    price,
    isLoading,
    error,
  };
}

// Format utilities
export function formatTokenAmount(
  amount: bigint | undefined,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (!amount || amount === BigInt(0)) return "0";
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return "0";

  // For small amounts, show enough decimals to display the value
  if (num < 1) {
    const log = Math.floor(Math.log10(Math.abs(num)));
    const neededDecimals = Math.abs(log) + 2;
    // Cap at 18 decimals (max for ETH-like tokens)
    return num.toFixed(Math.min(neededDecimals, 18));
  }

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

export function formatUSD(amount: number | undefined): string {
  if (amount === undefined || amount === 0) return "$0.00";

  // For very small amounts, show more precision
  if (amount > 0 && amount < 0.01) {
    // Find how many decimals we need
    const log = Math.floor(Math.log10(Math.abs(amount)));
    const decimals = Math.min(Math.abs(log) + 2, 10);
    return `$${amount.toFixed(decimals)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(
  bps: bigint | undefined,
  decimals: number = 2
): string {
  if (!bps) return "0%";
  const percent = Number(bps) / 100; // assuming bps (basis points)
  return `${percent.toFixed(decimals)}%`;
}

// Governance hooks
export function useGovernanceParams() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.FUND_GOVERNANCE as `0x${string}`,
        abi: parseAbi([
          "function votingPeriod() view returns (uint256)",
          "function quorumPercent() view returns (uint256)",
          "function proposalThreshold() view returns (uint256)",
          "function getProposalCount() view returns (uint256)",
        ]),
        functionName: "votingPeriod",
      },
      {
        address: CONTRACTS.FUND_GOVERNANCE as `0x${string}`,
        abi: parseAbi([
          "function votingPeriod() view returns (uint256)",
          "function quorumPercent() view returns (uint256)",
          "function proposalThreshold() view returns (uint256)",
          "function getProposalCount() view returns (uint256)",
        ]),
        functionName: "quorumPercent",
      },
      {
        address: CONTRACTS.FUND_GOVERNANCE as `0x${string}`,
        abi: parseAbi([
          "function votingPeriod() view returns (uint256)",
          "function quorumPercent() view returns (uint256)",
          "function proposalThreshold() view returns (uint256)",
          "function getProposalCount() view returns (uint256)",
        ]),
        functionName: "proposalThreshold",
      },
      {
        address: CONTRACTS.FUND_GOVERNANCE as `0x${string}`,
        abi: parseAbi([
          "function votingPeriod() view returns (uint256)",
          "function quorumPercent() view returns (uint256)",
          "function proposalThreshold() view returns (uint256)",
          "function getProposalCount() view returns (uint256)",
        ]),
        functionName: "getProposalCount",
      },
    ],
  });

  return {
    votingPeriod: data?.[0]?.result as bigint | undefined,
    quorumPercent: data?.[1]?.result as bigint | undefined,
    proposalThreshold: data?.[2]?.result as bigint | undefined,
    proposalCount: data?.[3]?.result as bigint | undefined,
    isLoading,
    error,
  };
}

export function useVotingPower() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.FUND_GOVERNANCE as `0x${string}`,
    abi: parseAbi([
      "function getVotingPower(address account) view returns (uint256)",
    ]),
    functionName: "getVotingPower",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    votingPower: data as bigint | undefined,
    isLoading,
    error,
  };
}
