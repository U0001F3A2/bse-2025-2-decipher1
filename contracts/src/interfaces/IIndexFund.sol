// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIndexFund {
    struct TokenAllocation {
        address token;
        uint256 targetPercentage; // basis points (10000 = 100%)
    }

    struct FundInfo {
        string name;
        string symbol;
        TokenAllocation[] allocations;
        uint256 totalAssets;
        uint256 totalShares;
        uint256 managementFee; // annual fee in basis points
        uint256 lastFeeCollection;
    }

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    event Rebalanced(address indexed rebalancer, uint256 timestamp);
    event FeeCollected(uint256 amount, uint256 timestamp);
    event AllocationUpdated(address indexed token, uint256 newPercentage);

    function getAllocations() external view returns (TokenAllocation[] memory);
    function updateAllocations(TokenAllocation[] calldata newAllocations) external;
    function rebalance(bytes[] calldata swapData) external;
    function collectFees() external;
    function getFundInfo() external view returns (FundInfo memory);
}

