// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IndexFund.sol";
import "../src/FundFactory.sol";
import "../src/FundGovernance.sol";
import "../src/interfaces/IIndexFund.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @notice Deployment script for Base Sepolia testnet
/// @dev Set environment variables: PRIVATE_KEY, BASE_SEPOLIA_RPC_URL
contract DeployScript is Script {
    // Base Sepolia addresses
    address constant SWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4; // Uniswap V3 SwapRouter
    
    // Token addresses on Base Sepolia (these are examples - verify actual addresses)
    address constant WETH = 0x4200000000000000000000000000000000000006; // Wrapped ETH on Base
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // USDC on Base Sepolia
    
    // Configuration
    uint256 constant MANAGEMENT_FEE = 200; // 2% annual
    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant QUORUM_PERCENTAGE = 1000; // 10%
    uint256 constant PROPOSAL_THRESHOLD = 100 * 10 ** 18; // 100 shares
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address treasury = deployer; // Use deployer as treasury for now
        
        console.log("Deploying contracts to Base Sepolia...");
        console.log("Deployer:", deployer);
        console.log("Treasury:", treasury);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy implementations
        console.log("\n1. Deploying implementation contracts...");
        
        IndexFund fundImplementation = new IndexFund();
        console.log("IndexFund implementation:", address(fundImplementation));
        
        FundFactory factoryImplementation = new FundFactory();
        console.log("FundFactory implementation:", address(factoryImplementation));
        
        FundGovernance governanceImplementation = new FundGovernance();
        console.log("FundGovernance implementation:", address(governanceImplementation));
        
        // 2. Deploy and initialize Factory
        console.log("\n2. Deploying FundFactory...");
        
        bytes memory factoryInitData = abi.encodeWithSelector(
            FundFactory.initialize.selector,
            address(fundImplementation),
            SWAP_ROUTER,
            treasury
        );
        
        ERC1967Proxy factoryProxy = new ERC1967Proxy(
            address(factoryImplementation),
            factoryInitData
        );
        FundFactory factory = FundFactory(address(factoryProxy));
        console.log("FundFactory proxy:", address(factory));
        
        // 3. Deploy and initialize Governance
        console.log("\n3. Deploying FundGovernance...");
        
        bytes memory govInitData = abi.encodeWithSelector(
            FundGovernance.initialize.selector,
            address(factory),
            VOTING_PERIOD,
            QUORUM_PERCENTAGE,
            PROPOSAL_THRESHOLD
        );
        
        ERC1967Proxy govProxy = new ERC1967Proxy(
            address(governanceImplementation),
            govInitData
        );
        FundGovernance governance = FundGovernance(address(govProxy));
        console.log("FundGovernance proxy:", address(governance));
        
        // 4. Create initial index fund (BTC/ETH example)
        console.log("\n4. Creating initial index fund...");
        
        IIndexFund.TokenAllocation[] memory allocations = new IIndexFund.TokenAllocation[](2);
        allocations[0] = IIndexFund.TokenAllocation({
            token: WETH,
            targetPercentage: 6000 // 60% WETH
        });
        allocations[1] = IIndexFund.TokenAllocation({
            token: USDC,
            targetPercentage: 4000 // 40% USDC (placeholder for WBTC)
        });
        
        address fundAddress = factory.createFund(
            "Crypto Index Fund",
            "CIF",
            USDC, // Base asset for deposits
            allocations,
            MANAGEMENT_FEE
        );
        
        console.log("Index Fund created:", fundAddress);
        
        // 5. Print deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("Network: Base Sepolia");
        console.log("Deployer:", deployer);
        console.log("Treasury:", treasury);
        console.log("----------------------------------------");
        console.log("IndexFund Implementation:", address(fundImplementation));
        console.log("FundFactory Implementation:", address(factoryImplementation));
        console.log("FundGovernance Implementation:", address(governanceImplementation));
        console.log("----------------------------------------");
        console.log("FundFactory Proxy:", address(factory));
        console.log("FundGovernance Proxy:", address(governance));
        console.log("----------------------------------------");
        console.log("Initial Fund:", fundAddress);
        console.log("========================================");
        
        // Save deployment addresses to file
        string memory deploymentInfo = string(
            abi.encodePacked(
                "{\n",
                '  "network": "base-sepolia",\n',
                '  "deployer": "', vm.toString(deployer), '",\n',
                '  "fundImplementation": "', vm.toString(address(fundImplementation)), '",\n',
                '  "factoryImplementation": "', vm.toString(address(factoryImplementation)), '",\n',
                '  "governanceImplementation": "', vm.toString(address(governanceImplementation)), '",\n',
                '  "factory": "', vm.toString(address(factory)), '",\n',
                '  "governance": "', vm.toString(address(governance)), '",\n',
                '  "initialFund": "', vm.toString(fundAddress), '"\n',
                "}"
            )
        );
        
        vm.writeFile("deployments/base-sepolia.json", deploymentInfo);
        console.log("\nDeployment info saved to: deployments/base-sepolia.json");
        
        vm.stopBroadcast();
    }
}

