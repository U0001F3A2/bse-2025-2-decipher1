// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IndexFund.sol";
import "../src/interfaces/IIndexFund.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

contract RebalanceScript is Script {
    address constant SWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
    uint24 constant POOL_FEE = 3000;
    uint256 constant SLIPPAGE_TOLERANCE = 100;
    uint256 constant BASIS_POINTS = 10000;

    function run(address fundAddress) external {
        require(fundAddress != address(0), "Invalid fund address");

        IndexFund fund = IndexFund(fundAddress);
        IIndexFund.TokenAllocation[] memory allocations = fund.getAllocations();
        uint256 totalValue = fund.totalAssets();
        bytes[] memory swapData = new bytes[](allocations.length);

        for (uint256 i; i < allocations.length; ++i) {
            address token = allocations[i].token;
            uint256 currentBalance = IERC20(token).balanceOf(fundAddress);
            uint256 targetBalance = (totalValue * allocations[i].targetPercentage) / BASIS_POINTS;

            if (currentBalance < targetBalance) {
                swapData[i] = abi.encodeWithSelector(
                    ISwapRouter.exactOutputSingle.selector,
                    ISwapRouter.ExactOutputSingleParams({
                        tokenIn: fund.asset(),
                        tokenOut: token,
                        fee: POOL_FEE,
                        recipient: fundAddress,
                        deadline: block.timestamp + 300,
                        amountOut: targetBalance - currentBalance,
                        amountInMaximum: ((targetBalance - currentBalance) * (BASIS_POINTS + SLIPPAGE_TOLERANCE))
                            / BASIS_POINTS,
                        sqrtPriceLimitX96: 0
                    })
                );
            } else if (currentBalance > targetBalance) {
                swapData[i] = abi.encodeWithSelector(
                    ISwapRouter.exactInputSingle.selector,
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: token,
                        tokenOut: fund.asset(),
                        fee: POOL_FEE,
                        recipient: fundAddress,
                        deadline: block.timestamp + 300,
                        amountIn: currentBalance - targetBalance,
                        amountOutMinimum: ((currentBalance - targetBalance) * (BASIS_POINTS - SLIPPAGE_TOLERANCE))
                            / BASIS_POINTS,
                        sqrtPriceLimitX96: 0
                    })
                );
            }
        }

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        fund.rebalance(swapData);
        vm.stopBroadcast();
    }
}
