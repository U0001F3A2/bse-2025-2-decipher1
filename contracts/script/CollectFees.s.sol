// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IndexFund.sol";
import "../src/FundFactory.sol";

/// @notice Fee collection script for index funds
/// @dev Collects management fees for all funds
contract CollectFeesScript is Script {
    /// @notice Collect fees for a specific fund
    /// @param fundAddress Address of the fund
    function collectFundFees(address fundAddress) public {
        require(fundAddress != address(0), "Invalid fund address");
        
        IndexFund fund = IndexFund(fundAddress);
        
        console.log("\nCollecting fees for fund:", fundAddress);
        console.log("Fund name:", fund.name());
        
        uint256 treasuryBalanceBefore = fund.balanceOf(fund.treasury());
        uint256 lastCollection = fund.lastFeeCollection();
        uint256 timeSinceLastCollection = block.timestamp - lastCollection;
        
        console.log("Last fee collection:", lastCollection);
        console.log("Time since last collection:", timeSinceLastCollection, "seconds");
        console.log("Treasury balance before:", treasuryBalanceBefore);
        
        // Collect fees
        fund.collectFees();
        
        uint256 treasuryBalanceAfter = fund.balanceOf(fund.treasury());
        uint256 feesCollected = treasuryBalanceAfter - treasuryBalanceBefore;
        
        console.log("Treasury balance after:", treasuryBalanceAfter);
        console.log("Fees collected:", feesCollected, "shares");
        console.log("Fee collection completed!");
    }
    
    /// @notice Collect fees for all funds in factory
    /// @param factoryAddress Address of the fund factory
    function run(address factoryAddress) external {
        require(factoryAddress != address(0), "Invalid factory address");
        
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(privateKey);
        
        console.log("Collecting fees from all funds...");
        console.log("Admin:", admin);
        console.log("Factory:", factoryAddress);
        
        FundFactory factory = FundFactory(factoryAddress);
        address[] memory funds = factory.getAllFunds();
        
        console.log("Number of funds:", funds.length);
        
        vm.startBroadcast(privateKey);
        
        for (uint256 i = 0; i < funds.length; i++) {
            try this.collectFundFees(funds[i]) {
                console.log("Success for fund", i);
            } catch Error(string memory reason) {
                console.log("Failed for fund", i, ":", reason);
            } catch {
                console.log("Failed for fund", i);
            }
        }
        
        console.log("\n========================================");
        console.log("Fee collection completed for all funds!");
        console.log("========================================");
        
        vm.stopBroadcast();
    }
}

