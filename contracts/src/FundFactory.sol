// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./IndexFund.sol";
import "./interfaces/IIndexFund.sol";

/// @title FundFactory  
/// @notice Factory for creating and managing index funds
/// @dev Deploys funds as UUPS proxies
contract FundFactory is OwnableUpgradeable, UUPSUpgradeable {
    // Fund registry
    address[] public funds;
    mapping(address => bool) public isFund;
    
    // Implementation contracts
    address public fundImplementation;
    
    // Configuration
    address public swapRouter;
    address public treasury;
    
    // Events
    event FundCreated(
        address indexed fund,
        string name,
        string symbol,
        address asset
    );
    event FundRemoved(address indexed fund);
    event ImplementationUpdated(address indexed newImplementation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize factory
    /// @param _fundImplementation Index fund implementation address
    /// @param _swapRouter Uniswap V3 router address
    /// @param _treasury Treasury address for fees
    function initialize(
        address _fundImplementation,
        address _swapRouter,
        address _treasury
    ) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        require(_fundImplementation != address(0), "Invalid implementation");
        require(_swapRouter != address(0), "Invalid router");
        require(_treasury != address(0), "Invalid treasury");

        fundImplementation = _fundImplementation;
        swapRouter = _swapRouter;
        treasury = _treasury;
    }

    /// @notice Create a new index fund
    /// @param name Fund name
    /// @param symbol Fund symbol
    /// @param asset Base asset address
    /// @param allocations Token allocations
    /// @param managementFee Management fee in basis points
    /// @return fund Address of created fund
    function createFund(
        string memory name,
        string memory symbol,
        address asset,
        IIndexFund.TokenAllocation[] memory allocations,
        uint256 managementFee
    ) external onlyOwner returns (address fund) {
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            IndexFund.initialize.selector,
            name,
            symbol,
            asset,
            allocations,
            managementFee,
            swapRouter,
            treasury
        );

        ERC1967Proxy proxy = new ERC1967Proxy(fundImplementation, initData);
        fund = address(proxy);

        // Register fund
        funds.push(fund);
        isFund[fund] = true;

        // Transfer ownership to factory owner
        IndexFund(fund).transferOwnership(owner());

        emit FundCreated(fund, name, symbol, asset);
        return fund;
    }

    /// @notice Remove a fund from registry (doesn't destroy it)
    /// @param fund Fund address to remove
    function removeFund(address fund) external onlyOwner {
        require(isFund[fund], "Not a fund");
        
        isFund[fund] = false;
        
        // Remove from array (swap with last and pop)
        for (uint256 i = 0; i < funds.length; i++) {
            if (funds[i] == fund) {
                funds[i] = funds[funds.length - 1];
                funds.pop();
                break;
            }
        }
        
        emit FundRemoved(fund);
    }

    /// @notice Get all registered funds
    /// @return Array of fund addresses
    function getAllFunds() external view returns (address[] memory) {
        return funds;
    }

    /// @notice Get number of funds
    /// @return Number of funds
    function getFundCount() external view returns (uint256) {
        return funds.length;
    }

    /// @notice Get fund info for all funds
    /// @return Array of fund information
    function getAllFundInfo() external view returns (IIndexFund.FundInfo[] memory) {
        IIndexFund.FundInfo[] memory fundInfos = new IIndexFund.FundInfo[](funds.length);
        
        for (uint256 i = 0; i < funds.length; i++) {
            fundInfos[i] = IndexFund(funds[i]).getFundInfo();
        }
        
        return fundInfos;
    }

    /// @notice Update fund implementation
    /// @param newImplementation New implementation address
    function updateFundImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        fundImplementation = newImplementation;
        emit ImplementationUpdated(newImplementation);
    }

    /// @notice Update swap router
    /// @param _swapRouter New router address
    function updateSwapRouter(address _swapRouter) external onlyOwner {
        require(_swapRouter != address(0), "Invalid router");
        swapRouter = _swapRouter;
    }

    /// @notice Update treasury
    /// @param _treasury New treasury address
    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /// @notice Required by UUPS pattern
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

