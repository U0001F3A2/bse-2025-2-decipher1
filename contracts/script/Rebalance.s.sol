// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IndexFund.sol";
import "../src/interfaces/IIndexFund.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

/// @notice Rebalancing script for index funds
/// @dev Calculates required swaps and executes rebalancing
contract RebalanceScript is Script {
    // Base Sepolia addresses
    address constant SWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
    address constant QUOTER = 0xC5290058841028F1614F3A6F0F5816cAd0df5E27;
    
    uint24 constant POOL_FEE = 3000; // 0.3%
    uint256 constant SLIPPAGE_TOLERANCE = 100; // 1% in basis points
    uint256 constant BASIS_POINTS = 10000;
    
    /// @notice Execute rebalancing for a fund
    /// @param fundAddress Address of the fund to rebalance
    function run(address fundAddress) external {
        require(fundAddress != address(0), "Invalid fund address");
        
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(privateKey);
        
        console.log("Rebalancing fund:", fundAddress);
        console.log("Admin:", admin);
        
        IndexFund fund = IndexFund(fundAddress);
        
        // Get current allocations
        IIndexFund.TokenAllocation[] memory allocations = fund.getAllocations();
        console.log("\nCurrent allocations:");
        
        // Calculate total value and current holdings
        uint256 totalValue = fund.totalAssets();
        console.log("Total fund value:", totalValue);
        
        // Prepare swap data
        bytes[] memory swapData = new bytes[](allocations.length);
        
        for (uint256 i = 0; i < allocations.length; i++) {
            address token = allocations[i].token;
            uint256 targetPercentage = allocations[i].targetPercentage;
            uint256 currentBalance = IERC20(token).balanceOf(fundAddress);
            uint256 targetBalance = (totalValue * targetPercentage) / BASIS_POINTS;
            
            console.log("\nToken:", token);
            console.log("Target %:", targetPercentage);
            console.log("Current balance:", currentBalance);
            console.log("Target balance:", targetBalance);
            
            // Determine if we need to buy or sell
            if (currentBalance < targetBalance) {
                // Need to buy more of this token
                uint256 amountToBuy = targetBalance - currentBalance;
                console.log("Need to BUY:", amountToBuy);
                
                // Build swap parameters (example - needs proper token path)
                ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
                    tokenIn: fund.asset(), // Swap from base asset
                    tokenOut: token,
                    fee: POOL_FEE,
                    recipient: fundAddress,
                    deadline: block.timestamp + 300, // 5 minutes
                    amountOut: amountToBuy,
                    amountInMaximum: (amountToBuy * (BASIS_POINTS + SLIPPAGE_TOLERANCE)) / BASIS_POINTS,
                    sqrtPriceLimitX96: 0
                });
                
                swapData[i] = abi.encodeWithSelector(
                    ISwapRouter.exactOutputSingle.selector,
                    params
                );
                
            } else if (currentBalance > targetBalance) {
                // Need to sell some of this token
                uint256 amountToSell = currentBalance - targetBalance;
                console.log("Need to SELL:", amountToSell);
                
                // Build swap parameters
                ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                    tokenIn: token,
                    tokenOut: fund.asset(), // Swap to base asset
                    fee: POOL_FEE,
                    recipient: fundAddress,
                    deadline: block.timestamp + 300,
                    amountIn: amountToSell,
                    amountOutMinimum: (amountToSell * (BASIS_POINTS - SLIPPAGE_TOLERANCE)) / BASIS_POINTS,
                    sqrtPriceLimitX96: 0
                });
                
                swapData[i] = abi.encodeWithSelector(
                    ISwapRouter.exactInputSingle.selector,
                    params
                );
            } else {
                console.log("Already balanced");
                swapData[i] = "";
            }
        }
        
        // Execute rebalancing
        console.log("\n========================================");
        console.log("Executing rebalancing...");
        console.log("========================================");
        
        vm.startBroadcast(privateKey);
        
        fund.rebalance(swapData);
        
        console.log("Rebalancing completed successfully!");
        
        vm.stopBroadcast();
        
        // Print new balances
        console.log("\nNew balances:");
        for (uint256 i = 0; i < allocations.length; i++) {
            address token = allocations[i].token;
            uint256 newBalance = IERC20(token).balanceOf(fundAddress);
            console.log("Token:", token);
            console.log("Balance:", newBalance);
        }
    }
}

