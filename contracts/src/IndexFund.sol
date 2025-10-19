// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/IIndexFund.sol";

/// @title IndexFund
/// @notice Multi-token index fund implementing ERC-4626 standard
/// @dev Uses UUPS upgradeability pattern
contract IndexFund is ERC4626Upgradeable, OwnableUpgradeable, UUPSUpgradeable, IIndexFund {
    using SafeERC20 for IERC20;

    // Token allocations
    TokenAllocation[] private allocations;
    
    // Mapping to check if token is in allocation
    mapping(address => bool) public isAllocatedToken;
    
    // Management fee (annual in basis points, e.g., 200 = 2%)
    uint256 public managementFee;
    
    // Last fee collection timestamp
    uint256 public lastFeeCollection;
    
    // Uniswap V3 SwapRouter
    ISwapRouter public swapRouter;
    
    // Fee treasury address
    address public treasury;
    
    // Slippage tolerance in basis points (e.g., 100 = 1%)
    uint256 public slippageTolerance;
    
    // Constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the index fund
    /// @param _name Fund name
    /// @param _symbol Fund symbol  
    /// @param _asset Base asset for deposits (e.g., USDC)
    /// @param _allocations Initial token allocations
    /// @param _managementFee Annual management fee in basis points
    /// @param _swapRouter Uniswap V3 SwapRouter address
    /// @param _treasury Treasury address for fee collection
    function initialize(
        string memory _name,
        string memory _symbol,
        address _asset,
        TokenAllocation[] memory _allocations,
        uint256 _managementFee,
        address _swapRouter,
        address _treasury
    ) external initializer {
        __ERC20_init(_name, _symbol);
        __ERC4626_init(IERC20(_asset));
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        require(_managementFee <= 1000, "Fee too high"); // Max 10%
        require(_swapRouter != address(0), "Invalid router");
        require(_treasury != address(0), "Invalid treasury");

        managementFee = _managementFee;
        swapRouter = ISwapRouter(_swapRouter);
        treasury = _treasury;
        lastFeeCollection = block.timestamp;
        slippageTolerance = 100; // 1% default

        _updateAllocations(_allocations);
    }

    /// @notice Get all token allocations
    /// @return Array of token allocations
    function getAllocations() external view override returns (TokenAllocation[] memory) {
        return allocations;
    }

    /// @notice Update token allocations
    /// @param newAllocations New allocation percentages
    function updateAllocations(TokenAllocation[] calldata newAllocations) external override onlyOwner {
        _updateAllocations(newAllocations);
    }

    /// @notice Internal function to update allocations
    /// @param newAllocations New allocation percentages
    function _updateAllocations(TokenAllocation[] memory newAllocations) internal {
        // Clear existing allocations
        for (uint256 i = 0; i < allocations.length; i++) {
            isAllocatedToken[allocations[i].token] = false;
        }
        delete allocations;

        // Validate and set new allocations
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            require(newAllocations[i].token != address(0), "Invalid token");
            require(!isAllocatedToken[newAllocations[i].token], "Duplicate token");
            
            allocations.push(newAllocations[i]);
            isAllocatedToken[newAllocations[i].token] = true;
            totalPercentage += newAllocations[i].targetPercentage;
            
            emit AllocationUpdated(newAllocations[i].token, newAllocations[i].targetPercentage);
        }
        
        require(totalPercentage == BASIS_POINTS, "Total must be 100%");
    }

    /// @notice Rebalance fund to match target allocations
    /// @param swapData Array of swap calldata for Uniswap
    function rebalance(bytes[] calldata swapData) external override onlyOwner {
        uint256 totalValue = totalAssets();
        
        // Calculate target amounts for each token
        for (uint256 i = 0; i < allocations.length; i++) {
            TokenAllocation memory alloc = allocations[i];
            uint256 targetAmount = (totalValue * alloc.targetPercentage) / BASIS_POINTS;
            uint256 currentAmount = IERC20(alloc.token).balanceOf(address(this));
            
            // Execute swaps if provided
            if (i < swapData.length && swapData[i].length > 0) {
                // Approve token for swap if needed
                if (currentAmount > targetAmount) {
                    IERC20(alloc.token).safeIncreaseAllowance(
                        address(swapRouter),
                        currentAmount - targetAmount
                    );
                }
                
                // Execute swap through router
                (bool success,) = address(swapRouter).call(swapData[i]);
                require(success, "Swap failed");
            }
        }
        
        emit Rebalanced(msg.sender, block.timestamp);
    }

    /// @notice Collect management fees
    function collectFees() external override {
        uint256 timeSinceLastCollection = block.timestamp - lastFeeCollection;
        
        if (timeSinceLastCollection == 0) return;
        
        uint256 supply = totalSupply();
        if (supply == 0) return;
        
        // Calculate fee as a percentage of AUM over time
        // fee = totalSupply * managementFee * timeElapsed / (SECONDS_PER_YEAR * BASIS_POINTS)
        uint256 feeShares = (supply * managementFee * timeSinceLastCollection) 
            / (SECONDS_PER_YEAR * BASIS_POINTS);
        
        if (feeShares > 0) {
            _mint(treasury, feeShares);
            emit FeeCollected(feeShares, block.timestamp);
        }
        
        lastFeeCollection = block.timestamp;
    }

    /// @notice Get comprehensive fund information
    /// @return Fund information struct
    function getFundInfo() external view override returns (FundInfo memory) {
        return FundInfo({
            name: name(),
            symbol: symbol(),
            allocations: allocations,
            totalAssets: totalAssets(),
            totalShares: totalSupply(),
            managementFee: managementFee,
            lastFeeCollection: lastFeeCollection
        });
    }

    /// @notice Override totalAssets to sum all token holdings
    /// @return Total assets in base asset terms
    function totalAssets() public view virtual override returns (uint256) {
        // For simplicity, we sum token balances directly
        // In production, you'd convert to a common denomination using price oracles
        uint256 total = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            total += IERC20(allocations[i].token).balanceOf(address(this));
        }
        // Add base asset balance
        total += IERC20(asset()).balanceOf(address(this));
        return total;
    }

    /// @notice Deposit base asset and receive fund shares
    /// @param assets Amount of base asset to deposit
    /// @param receiver Address to receive shares
    /// @return shares Amount of shares minted
    function deposit(uint256 assets, address receiver) 
        public 
        virtual 
        override 
        returns (uint256 shares) 
    {
        shares = super.deposit(assets, receiver);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /// @notice Withdraw assets by burning shares
    /// @param assets Amount of assets to withdraw
    /// @param receiver Address to receive assets
    /// @param owner Address of share owner
    /// @return shares Amount of shares burned
    function withdraw(uint256 assets, address receiver, address owner)
        public
        virtual
        override
        returns (uint256 shares)
    {
        shares = super.withdraw(assets, receiver, owner);
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    /// @notice Set slippage tolerance for swaps
    /// @param _slippageTolerance New slippage tolerance in basis points
    function setSlippageTolerance(uint256 _slippageTolerance) external onlyOwner {
        require(_slippageTolerance <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = _slippageTolerance;
    }

    /// @notice Set treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /// @notice Required by UUPS pattern
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

