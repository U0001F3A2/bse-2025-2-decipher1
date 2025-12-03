// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IChainlinkAggregator.sol";
import "./utils/ReentrancyGuardUpgradeable.sol";
import "./LPVault.sol";

using SafeERC20 for IERC20;

/// @title Leveraged2xToken - 2x Daily Leveraged Token (e.g., BTC2X)
/// @notice Provides 2x daily leveraged exposure by borrowing from LP vault
/// @dev Users deposit collateral (USDC), contract borrows underlying (WBTC) for 2x exposure
///
/// How it works:
/// 1. User deposits 1000 USDC
/// 2. Contract calculates 2x exposure: $2000 worth of BTC
/// 3. Contract borrows that amount of WBTC from LP vault
/// 4. User receives leveraged token shares
/// 5. Daily rebalance adjusts borrowed amount to maintain 2x
/// 6. On redemption: sell WBTC, repay loan, return USDC +/- P&L
contract Leveraged2xToken is ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice The LP vault we borrow from
    LPVault public lpVault;

    /// @notice Collateral token (e.g., USDC)
    IERC20 public collateralToken;

    /// @notice Underlying token (e.g., WBTC) - what we borrow for exposure
    IERC20 public underlyingToken;

    /// @notice Price oracle for underlying/USD
    IChainlinkAggregator public oracle;

    /// @notice Target leverage ratio (20000 = 2x)
    uint256 public leverageRatio;

    /// @notice NAV per share (scaled by 1e18)
    uint256 public navPerShare;

    /// @notice Reference price at last rebalance
    uint256 public lastRebalancePrice;

    /// @notice Timestamp of last rebalance
    uint256 public lastRebalanceTime;

    /// @notice Total collateral deposited
    uint256 public totalCollateral;

    /// @notice Total underlying borrowed from LP vault
    uint256 public totalBorrowed;

    /// @notice Minimum rebalance interval
    uint256 public constant MIN_REBALANCE_INTERVAL = 20 hours;

    uint256 private constant PRECISION = 1e18;
    uint256 private constant BASIS_POINTS = 10000;

    /// @notice Decimals for underlying token
    uint8 public underlyingDecimals;

    /// @notice Decimals for collateral token
    uint8 public collateralDecimals;

    /// @notice Oracle decimals
    uint8 public oracleDecimals;

    event Minted(address indexed user, uint256 collateral, uint256 shares, uint256 borrowed);
    event Redeemed(address indexed user, uint256 shares, uint256 collateralReturned);
    event Rebalanced(uint256 timestamp, uint256 oldNav, uint256 newNav, uint256 newBorrowed);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the leveraged token
    /// @param _name Token name (e.g., "BTC 2x Daily Long")
    /// @param _symbol Token symbol (e.g., "BTC2X")
    /// @param _lpVault LP vault to borrow from
    /// @param _collateralToken Collateral token (USDC)
    /// @param _underlyingToken Underlying token (WBTC)
    /// @param _oracle Chainlink price feed
    /// @param _leverageRatio Leverage in basis points (20000 = 2x)
    function initialize(
        string memory _name,
        string memory _symbol,
        address _lpVault,
        address _collateralToken,
        address _underlyingToken,
        address _oracle,
        uint256 _leverageRatio
    ) external initializer {
        require(_lpVault != address(0), "Invalid vault");
        require(_collateralToken != address(0), "Invalid collateral");
        require(_underlyingToken != address(0), "Invalid underlying");
        require(_oracle != address(0), "Invalid oracle");
        require(_leverageRatio >= BASIS_POINTS && _leverageRatio <= 50000, "Invalid leverage");

        __ERC20_init(_name, _symbol);
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();

        lpVault = LPVault(_lpVault);
        collateralToken = IERC20(_collateralToken);
        underlyingToken = IERC20(_underlyingToken);
        oracle = IChainlinkAggregator(_oracle);
        leverageRatio = _leverageRatio;

        // Cache decimals
        underlyingDecimals = ERC20Upgradeable(_underlyingToken).decimals();
        collateralDecimals = ERC20Upgradeable(_collateralToken).decimals();
        oracleDecimals = oracle.decimals();

        // Initialize NAV at 1 collateral unit
        navPerShare = 10 ** collateralDecimals;
        lastRebalancePrice = _getPrice();
        lastRebalanceTime = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════════
    //                    USER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /// @notice Mint leveraged tokens by depositing collateral
    /// @param collateralAmount Amount of collateral (USDC) to deposit
    /// @return shares Amount of leveraged token shares minted
    function mint(uint256 collateralAmount) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(collateralAmount > 0, "Zero amount");

        // Transfer collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Calculate shares based on current NAV
        uint256 currentNav = getCurrentNav();
        shares = (collateralAmount * PRECISION) / currentNav;

        // Calculate how much underlying to borrow (2x exposure)
        uint256 price = _getPrice(); // price in USD with oracle decimals
        uint256 exposureUsd = (collateralAmount * leverageRatio) / BASIS_POINTS;

        // Convert USD exposure to underlying tokens
        // underlyingAmount = exposureUsd / price, adjusted for decimals
        uint256 underlyingToBorrow = (exposureUsd * (10 ** underlyingDecimals) * (10 ** oracleDecimals))
            / (price * (10 ** collateralDecimals));

        // Borrow from LP vault
        if (underlyingToBorrow > 0) {
            lpVault.borrow(underlyingToBorrow);
            totalBorrowed += underlyingToBorrow;
        }

        totalCollateral += collateralAmount;
        _mint(msg.sender, shares);

        emit Minted(msg.sender, collateralAmount, shares, underlyingToBorrow);
    }

    /// @notice Redeem leveraged tokens for collateral
    /// @param shares Amount of shares to redeem
    /// @return collateralReturned Amount of collateral returned
    /// @dev Uses NAV-based calculation: value = shares * currentNAV / PRECISION
    function redeem(uint256 shares) external nonReentrant whenNotPaused returns (uint256 collateralReturned) {
        require(shares > 0, "Zero shares");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");

        uint256 supply = totalSupply();
        require(supply > 0, "No supply");

        // Calculate value based on current NAV (simple and accurate)
        uint256 currentNav = getCurrentNav();
        uint256 valueInCollateral = (shares * currentNav) / PRECISION;

        // Calculate proportional borrowed amount to repay
        uint256 proportionalBorrowed = (totalBorrowed * shares) / supply;
        uint256 proportionalCollateral = (totalCollateral * shares) / supply;

        // Repay borrowed amount to LP vault
        if (proportionalBorrowed > 0) {
            // Approve and repay the underlying tokens we borrowed
            underlyingToken.forceApprove(address(lpVault), proportionalBorrowed);
            lpVault.repay(proportionalBorrowed);
            totalBorrowed -= proportionalBorrowed;
        }

        // Update state before transfer
        totalCollateral -= proportionalCollateral;
        _burn(msg.sender, shares);

        // Calculate actual collateral to return (capped at available)
        collateralReturned = valueInCollateral;
        uint256 available = collateralToken.balanceOf(address(this));
        if (collateralReturned > available) {
            collateralReturned = available;
        }

        // Transfer collateral to user
        if (collateralReturned > 0) {
            collateralToken.safeTransfer(msg.sender, collateralReturned);
        }

        emit Redeemed(msg.sender, shares, collateralReturned);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    REBALANCING
    // ═══════════════════════════════════════════════════════════════

    /// @notice Daily rebalance to maintain leverage ratio
    /// @dev Adjusts borrowed amount based on price changes
    function rebalance() external nonReentrant whenNotPaused {
        require(
            block.timestamp >= lastRebalanceTime + MIN_REBALANCE_INTERVAL,
            "Too soon to rebalance"
        );

        uint256 oldNav = navPerShare;
        uint256 currentPrice = _getPrice();

        // Calculate leveraged return
        int256 priceChange = int256(currentPrice) - int256(lastRebalancePrice);
        int256 percentChange = (priceChange * int256(PRECISION)) / int256(lastRebalancePrice);
        int256 leveragedReturn = (int256(leverageRatio) * percentChange) / int256(BASIS_POINTS);

        // Update NAV
        int256 newNavSigned = int256(navPerShare) + (int256(navPerShare) * leveragedReturn) / int256(PRECISION);
        uint256 newNav = newNavSigned > 0 ? uint256(newNavSigned) : 1;

        // Calculate new target borrowed amount to maintain leverage
        uint256 totalValueUsd = (totalSupply() * newNav) / PRECISION;
        uint256 targetExposureUsd = (totalValueUsd * leverageRatio) / BASIS_POINTS;
        uint256 targetBorrowed = (targetExposureUsd * (10 ** underlyingDecimals) * (10 ** oracleDecimals))
            / (currentPrice * (10 ** collateralDecimals));

        // Adjust borrowed amount
        if (targetBorrowed > totalBorrowed) {
            // Need to borrow more
            uint256 toBorrow = targetBorrowed - totalBorrowed;
            lpVault.borrow(toBorrow);
            totalBorrowed = targetBorrowed;
        } else if (targetBorrowed < totalBorrowed) {
            // Need to repay some
            uint256 toRepay = totalBorrowed - targetBorrowed;
            underlyingToken.forceApprove(address(lpVault), toRepay);
            lpVault.repay(toRepay);
            totalBorrowed = targetBorrowed;
        }

        navPerShare = newNav;
        lastRebalancePrice = currentPrice;
        lastRebalanceTime = block.timestamp;

        emit Rebalanced(block.timestamp, oldNav, newNav, totalBorrowed);
    }

    /// @notice Force rebalance (owner only, no time restriction)
    function forceRebalance() external onlyOwner {
        uint256 oldNav = navPerShare;
        uint256 currentPrice = _getPrice();

        int256 priceChange = int256(currentPrice) - int256(lastRebalancePrice);
        int256 percentChange = (priceChange * int256(PRECISION)) / int256(lastRebalancePrice);
        int256 leveragedReturn = (int256(leverageRatio) * percentChange) / int256(BASIS_POINTS);

        int256 newNavSigned = int256(navPerShare) + (int256(navPerShare) * leveragedReturn) / int256(PRECISION);
        uint256 newNav = newNavSigned > 0 ? uint256(newNavSigned) : 1;

        navPerShare = newNav;
        lastRebalancePrice = currentPrice;
        lastRebalanceTime = block.timestamp;

        emit Rebalanced(block.timestamp, oldNav, newNav, totalBorrowed);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /// @notice Get current NAV (includes unrealized gains/losses)
    function getCurrentNav() public view returns (uint256) {
        uint256 currentPrice = _getPrice();

        if (lastRebalancePrice == 0) return navPerShare;

        int256 priceChange = int256(currentPrice) - int256(lastRebalancePrice);
        int256 percentChange = (priceChange * int256(PRECISION)) / int256(lastRebalancePrice);
        int256 leveragedReturn = (int256(leverageRatio) * percentChange) / int256(BASIS_POINTS);

        int256 currentNav = int256(navPerShare) + (int256(navPerShare) * leveragedReturn) / int256(PRECISION);
        return currentNav > 0 ? uint256(currentNav) : 1;
    }

    /// @notice Get current underlying price from oracle
    function _getPrice() internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = oracle.latestRoundData();
        require(answer > 0, "Invalid price");
        require(updatedAt > 0, "Stale price");

        // More lenient staleness check for testnets
        if (block.chainid != 1) {
            require(block.timestamp - updatedAt <= 24 hours, "Price too stale");
        } else {
            require(block.timestamp - updatedAt <= 1 hours, "Price too stale");
        }

        return uint256(answer);
    }

    /// @notice Get current price (public view)
    function getPrice() external view returns (uint256) {
        return _getPrice();
    }

    /// @notice Check if rebalance is needed
    function needsRebalance() external view returns (bool) {
        return block.timestamp >= lastRebalanceTime + MIN_REBALANCE_INTERVAL;
    }

    /// @notice Get fund statistics
    function getStats()
        external
        view
        returns (
            uint256 currentNav,
            uint256 price,
            uint256 collateral,
            uint256 borrowed,
            uint256 supply,
            uint256 lastRebalance
        )
    {
        return (getCurrentNav(), _getPrice(), totalCollateral, totalBorrowed, totalSupply(), lastRebalanceTime);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /// @notice Update leverage ratio
    function setLeverageRatio(uint256 _leverageRatio) external onlyOwner {
        require(_leverageRatio >= BASIS_POINTS && _leverageRatio <= 50000, "Invalid leverage");
        leverageRatio = _leverageRatio;
    }

    /// @notice Update oracle
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        oracle = IChainlinkAggregator(_oracle);
        oracleDecimals = oracle.decimals();
    }

    /// @notice Pause all token operations
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause all token operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
