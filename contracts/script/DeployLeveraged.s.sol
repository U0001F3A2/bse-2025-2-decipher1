// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LPVault.sol";
import "../src/Leveraged2xToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title DeployLeveraged - Deploy BTC 2x Daily Long ETF
/// @notice Deploys LP Vault + Leveraged Token for 2x BTC exposure
contract DeployLeveragedScript is Script {
    // Base Sepolia addresses
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    // Chainlink Price Feeds on Base Sepolia
    // ETH/USD: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base&page=1
    address constant ETH_USD_FEED = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;

    // For BTC, we'll use ETH as proxy since WBTC isn't common on Base Sepolia
    // In production, you'd use the actual BTC/USD feed

    // Configuration
    uint256 constant LEVERAGE_RATIO = 20000; // 2x leverage
    uint256 constant INTEREST_RATE = 500; // 5% APY for LP vault

    function run() external {
        // Use the private key passed via --private-key flag
        vm.startBroadcast();

        // 1. Deploy LP Vault Implementation
        LPVault vaultImpl = new LPVault();

        // 2. Deploy LP Vault Proxy (LPs deposit WETH to earn yield)
        bytes memory vaultInitData = abi.encodeWithSelector(
            LPVault.initialize.selector,
            WETH, // asset (WETH as underlying)
            "LP WETH Vault",
            "lpWETH",
            INTEREST_RATE
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);
        LPVault vault = LPVault(address(vaultProxy));

        // 3. Deploy Leveraged Token Implementation
        Leveraged2xToken tokenImpl = new Leveraged2xToken();

        // 4. Deploy Leveraged Token Proxy (ETH 2x Daily Long)
        bytes memory tokenInitData = abi.encodeWithSelector(
            Leveraged2xToken.initialize.selector,
            "ETH 2x Daily Long", // name
            "ETH2X", // symbol
            address(vault), // LP vault
            USDC, // collateral (USDC)
            WETH, // underlying (WETH)
            ETH_USD_FEED, // Chainlink oracle
            LEVERAGE_RATIO // 2x
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        Leveraged2xToken leveragedToken = Leveraged2xToken(address(tokenProxy));

        // 5. Authorize leveraged token to borrow from vault
        vault.authorizeBorrower(address(leveragedToken));

        // Ownership is already set to msg.sender in initialize

        vm.stopBroadcast();

        // Log deployment info
        console.log("=== ETH 2x Daily Long ETF Deployed ===");
        console.log("LP Vault (lpWETH):", address(vault));
        console.log("Leveraged Token (ETH2X):", address(leveragedToken));
        console.log("Collateral: USDC", USDC);
        console.log("Underlying: WETH", WETH);
        console.log("Oracle: ETH/USD", ETH_USD_FEED);
        console.log("Leverage: 2x");
        console.log("LP Interest Rate: 5% APY");

        // Save deployment addresses
        string memory json = string(
            abi.encodePacked(
                '{"network":"base-sepolia","lpVault":"',
                vm.toString(address(vault)),
                '","leveragedToken":"',
                vm.toString(address(leveragedToken)),
                '","collateral":"',
                vm.toString(USDC),
                '","underlying":"',
                vm.toString(WETH),
                '","oracle":"',
                vm.toString(ETH_USD_FEED),
                '","leverage":"20000"}'
            )
        );

        vm.writeFile("deployments/leveraged-eth2x.json", json);
    }
}
