// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IndexFund.sol";
import "../src/FundFactory.sol";

contract CollectFeesScript is Script {
    function run(address factoryAddress) external {
        require(factoryAddress != address(0), "Invalid factory address");

        FundFactory factory = FundFactory(factoryAddress);
        address[] memory funds = factory.getAllFunds();

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        for (uint256 i; i < funds.length; ++i) {
            try IndexFund(funds[i]).collectFees() {} catch {}
        }

        vm.stopBroadcast();
    }
}
