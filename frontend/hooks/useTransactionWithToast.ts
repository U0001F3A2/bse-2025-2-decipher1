"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { BaseError, ContractFunctionRevertedError } from "viem";

interface UseTransactionWithToastOptions {
  successMessage?: string;
  onSuccess?: () => void;
}

export function useTransactionWithToast(options: UseTransactionWithToastOptions = {}) {
  const { successMessage = "Transaction confirmed!", onSuccess } = options;

  const {
    writeContract,
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      const message = parseError(writeError);
      toast.error(message, { duration: 5000 });
    }
  }, [writeError]);

  // Handle receipt errors
  useEffect(() => {
    if (receiptError) {
      const message = parseError(receiptError);
      toast.error(message, { duration: 5000 });
    }
  }, [receiptError]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast.success(successMessage);
      onSuccess?.();
    }
  }, [isSuccess, successMessage, onSuccess]);

  return {
    writeContract,
    writeContractAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isLoading: isPending || isConfirming,
    reset,
  };
}

function parseError(error: Error): string {
  // Viem BaseError
  if (error instanceof BaseError) {
    // Contract revert
    const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName) {
        return `Contract error: ${errorName}`;
      }
      return revertError.shortMessage || "Contract execution reverted";
    }

    // User rejected
    if (error.shortMessage?.includes("User rejected")) {
      return "Transaction rejected by user";
    }

    // Insufficient funds
    if (error.shortMessage?.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }

    return error.shortMessage || error.message;
  }

  // Generic error
  if (error.message) {
    // Clean up common error messages
    if (error.message.includes("User rejected")) {
      return "Transaction rejected by user";
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (error.message.includes("execution reverted")) {
      // Try to extract revert reason
      const match = error.message.match(/reason="([^"]+)"/);
      if (match) {
        return `Reverted: ${match[1]}`;
      }
      const match2 = error.message.match(/reverted with reason string '([^']+)'/);
      if (match2) {
        return `Reverted: ${match2[1]}`;
      }
      return "Transaction reverted";
    }

    // Truncate long messages
    if (error.message.length > 100) {
      return error.message.slice(0, 100) + "...";
    }
    return error.message;
  }

  return "Transaction failed";
}

export { parseError };
