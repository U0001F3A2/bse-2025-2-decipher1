// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LPVault.sol";
import "../src/Leveraged2xToken.sol";
import "./helpers/TestHelpers.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract LeveragedETFTest is Test {
    LPVault public vault;
    Leveraged2xToken public leveragedToken;
    MockERC20 public weth;
    MockUSDC public usdc;
    MockChainlinkOracle public oracle;

    address public owner = address(this);
    address public lp1 = address(0x1);
    address public lp2 = address(0x2);
    address public trader1 = address(0x3);
    address public trader2 = address(0x4);

    uint256 constant INITIAL_ETH_PRICE = 2000 * 1e8; // $2000 with 8 decimals
    uint256 constant LEVERAGE_RATIO = 20000; // 2x
    uint256 constant INTEREST_RATE = 500; // 5% APY

    function setUp() public {
        // Deploy mock tokens
        weth = new MockERC20("Wrapped ETH", "WETH");
        usdc = new MockUSDC();

        // Deploy mock oracle ($2000 ETH price, 8 decimals)
        oracle = new MockChainlinkOracle(int256(INITIAL_ETH_PRICE), 8);

        // Deploy LP Vault
        LPVault vaultImpl = new LPVault();
        bytes memory vaultInitData = abi.encodeWithSelector(
            LPVault.initialize.selector,
            address(weth),
            "LP WETH Vault",
            "lpWETH",
            INTEREST_RATE
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);
        vault = LPVault(address(vaultProxy));

        // Deploy Leveraged Token
        Leveraged2xToken tokenImpl = new Leveraged2xToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            Leveraged2xToken.initialize.selector,
            "ETH 2x Daily Long",
            "ETH2X",
            address(vault),
            address(usdc),
            address(weth),
            address(oracle),
            LEVERAGE_RATIO
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        leveragedToken = Leveraged2xToken(address(tokenProxy));

        // Authorize leveraged token to borrow
        vault.authorizeBorrower(address(leveragedToken));

        // Fund test accounts
        weth.mint(lp1, 100 ether);
        weth.mint(lp2, 100 ether);
        usdc.mint(trader1, 100000 * 1e6); // 100k USDC
        usdc.mint(trader2, 100000 * 1e6);

        // Approve tokens
        vm.prank(lp1);
        weth.approve(address(vault), type(uint256).max);
        vm.prank(lp2);
        weth.approve(address(vault), type(uint256).max);
        vm.prank(trader1);
        usdc.approve(address(leveragedToken), type(uint256).max);
        vm.prank(trader2);
        usdc.approve(address(leveragedToken), type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    LP VAULT TESTS
    // ═══════════════════════════════════════════════════════════════

    function testVaultInitialization() public view {
        assertEq(vault.name(), "LP WETH Vault");
        assertEq(vault.symbol(), "lpWETH");
        assertEq(vault.asset(), address(weth));
        assertEq(vault.interestRateBps(), INTEREST_RATE);
    }

    function testLPDeposit() public {
        uint256 depositAmount = 10 ether;

        vm.prank(lp1);
        uint256 shares = vault.deposit(depositAmount, lp1);

        assertEq(shares, depositAmount); // 1:1 initially
        assertEq(vault.balanceOf(lp1), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);
    }

    function testLPWithdraw() public {
        // Deposit first
        vm.prank(lp1);
        vault.deposit(10 ether, lp1);

        // Withdraw
        vm.prank(lp1);
        vault.withdraw(5 ether, lp1, lp1);

        assertEq(vault.balanceOf(lp1), 5 ether);
        assertEq(weth.balanceOf(lp1), 95 ether); // 100 - 10 + 5
    }

    function testBorrowFromVault() public {
        // LP deposits
        vm.prank(lp1);
        vault.deposit(10 ether, lp1);

        // Leveraged token borrows (simulate)
        vm.prank(address(leveragedToken));
        vault.borrow(1 ether);

        assertEq(vault.totalBorrowed(), 1 ether);
        assertEq(vault.availableLiquidity(), 9 ether);
        assertEq(weth.balanceOf(address(leveragedToken)), 1 ether);
    }

    function testUtilizationLimit() public {
        vm.prank(lp1);
        vault.deposit(10 ether, lp1);

        // Try to borrow more than 90% - should fail
        vm.prank(address(leveragedToken));
        vm.expectRevert("Exceeds max utilization");
        vault.borrow(9.1 ether);

        // Borrow exactly 90% - should succeed
        vm.prank(address(leveragedToken));
        vault.borrow(9 ether);

        assertEq(vault.utilizationRate(), 9000); // 90%
    }

    function testInterestAccrual() public {
        vm.prank(lp1);
        vault.deposit(10 ether, lp1);

        vm.prank(address(leveragedToken));
        vault.borrow(5 ether);

        // Advance time by 1 year
        vm.warp(block.timestamp + 365 days);
        vault.accrueInterest();

        // Interest = 5 ETH * 5% = 0.25 ETH
        // Total assets should include interest
        assertGt(vault.totalAssets(), 10 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    LEVERAGED TOKEN TESTS
    // ═══════════════════════════════════════════════════════════════

    function testLeveragedTokenInitialization() public view {
        assertEq(leveragedToken.name(), "ETH 2x Daily Long");
        assertEq(leveragedToken.symbol(), "ETH2X");
        assertEq(leveragedToken.leverageRatio(), LEVERAGE_RATIO);
        assertEq(address(leveragedToken.lpVault()), address(vault));
    }

    function testMintLeveragedToken() public {
        // First, LPs need to provide liquidity
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        // Trader mints leveraged tokens
        uint256 collateral = 1000 * 1e6; // 1000 USDC

        vm.prank(trader1);
        uint256 shares = leveragedToken.mint(collateral);

        assertGt(shares, 0);
        assertEq(leveragedToken.balanceOf(trader1), shares);
        assertEq(leveragedToken.totalCollateral(), collateral);

        // Should have borrowed from vault (2x exposure)
        // $1000 USDC * 2 = $2000 exposure
        // At $2000/ETH = 1 ETH borrowed
        assertGt(leveragedToken.totalBorrowed(), 0);
    }

    function testRedeemLeveragedToken() public {
        // Setup: LP deposits, trader mints
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        uint256 shares = leveragedToken.mint(1000 * 1e6);

        // Give leveraged token some WETH for repayment (simulating swap)
        weth.mint(address(leveragedToken), 2 ether);

        // Redeem
        vm.prank(trader1);
        uint256 returned = leveragedToken.redeem(shares);

        assertEq(leveragedToken.balanceOf(trader1), 0);
        assertGt(returned, 0);
    }

    function testLeveragedReturns_PriceUp() public {
        // Setup
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        uint256 navBefore = leveragedToken.getCurrentNav();

        // Price goes up 10%
        oracle.setPrice(int256(INITIAL_ETH_PRICE * 110 / 100));

        uint256 navAfter = leveragedToken.getCurrentNav();

        // With 2x leverage, NAV should increase ~20%
        // navAfter should be ~1.2x navBefore
        assertGt(navAfter, navBefore);
        assertGt(navAfter, navBefore * 115 / 100); // Should be more than 15% increase
    }

    function testLeveragedReturns_PriceDown() public {
        // Setup
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        uint256 navBefore = leveragedToken.getCurrentNav();

        // Price goes down 10%
        oracle.setPrice(int256(INITIAL_ETH_PRICE * 90 / 100));

        uint256 navAfter = leveragedToken.getCurrentNav();

        // With 2x leverage, NAV should decrease ~20%
        assertLt(navAfter, navBefore);
        assertLt(navAfter, navBefore * 85 / 100); // Should be less than 85% of original
    }

    function testDailyRebalance() public {
        // Setup
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        uint256 initialBorrowed = leveragedToken.totalBorrowed();

        // Price goes up 10%
        oracle.setPrice(int256(INITIAL_ETH_PRICE * 110 / 100));

        // Wait for rebalance window
        vm.warp(block.timestamp + 21 hours);

        // Rebalance
        leveragedToken.rebalance();

        // After price increase, should have borrowed more to maintain 2x
        // (NAV increased, so exposure needs to increase)
        uint256 newBorrowed = leveragedToken.totalBorrowed();
        assertGt(newBorrowed, initialBorrowed);
    }

    function testRebalanceTooSoon() public {
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        // Try to rebalance immediately
        vm.expectRevert("Too soon to rebalance");
        leveragedToken.rebalance();
    }

    function testForceRebalance() public {
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        // Owner can force rebalance anytime
        leveragedToken.forceRebalance();
        // Should not revert
    }

    function testNeedsRebalance() public {
        assertFalse(leveragedToken.needsRebalance());

        vm.warp(block.timestamp + 21 hours);

        assertTrue(leveragedToken.needsRebalance());
    }

    function testMultipleTraders() public {
        // Setup
        vm.prank(lp1);
        vault.deposit(100 ether, lp1);

        // Trader 1 mints
        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        // Trader 2 mints
        vm.prank(trader2);
        leveragedToken.mint(2000 * 1e6);

        assertEq(leveragedToken.totalCollateral(), 3000 * 1e6);
        assertGt(leveragedToken.totalBorrowed(), 0);

        // Both should have shares proportional to their deposits
        assertGt(leveragedToken.balanceOf(trader1), 0);
        assertGt(leveragedToken.balanceOf(trader2), 0);
    }

    function testGetStats() public {
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        vm.prank(trader1);
        leveragedToken.mint(1000 * 1e6);

        (
            uint256 nav,
            uint256 price,
            uint256 collateral,
            uint256 borrowed,
            uint256 supply,
            uint256 lastRebalance
        ) = leveragedToken.getStats();

        assertGt(nav, 0);
        assertEq(price, INITIAL_ETH_PRICE);
        assertEq(collateral, 1000 * 1e6);
        assertGt(borrowed, 0);
        assertGt(supply, 0);
        assertGt(lastRebalance, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    EDGE CASE TESTS
    // ═══════════════════════════════════════════════════════════════

    function testCannotBorrowWithoutLiquidity() public {
        // Try to mint without LP liquidity
        vm.prank(trader1);
        vm.expectRevert("Insufficient liquidity");
        leveragedToken.mint(1000 * 1e6);
    }

    function testSetLeverageRatio() public {
        leveragedToken.setLeverageRatio(30000); // 3x
        assertEq(leveragedToken.leverageRatio(), 30000);
    }

    function testInvalidLeverageRatio() public {
        vm.expectRevert("Invalid leverage");
        leveragedToken.setLeverageRatio(60000); // 6x is too high

        vm.expectRevert("Invalid leverage");
        leveragedToken.setLeverageRatio(5000); // 0.5x is too low
    }

    // ═══════════════════════════════════════════════════════════════
    //                    PAUSE TESTS
    // ═══════════════════════════════════════════════════════════════

    function testVaultPause() public {
        // LP deposits first
        vm.prank(lp1);
        vault.deposit(10 ether, lp1);

        // Pause the vault
        vault.pause();

        // Deposit should fail when paused
        vm.prank(lp1);
        vm.expectRevert();
        vault.deposit(1 ether, lp1);

        // Withdraw should fail when paused
        vm.prank(lp1);
        vm.expectRevert();
        vault.withdraw(1 ether, lp1, lp1);

        // Unpause
        vault.unpause();

        // Now operations should work
        vm.prank(lp1);
        vault.deposit(1 ether, lp1);
    }

    function testLeveragedTokenPause() public {
        // Setup: LP deposits
        vm.prank(lp1);
        vault.deposit(50 ether, lp1);

        // Trader mints
        vm.prank(trader1);
        uint256 shares = leveragedToken.mint(1000 * 1e6);

        // Pause the leveraged token
        leveragedToken.pause();

        // Mint should fail when paused
        vm.prank(trader2);
        vm.expectRevert();
        leveragedToken.mint(1000 * 1e6);

        // Redeem should fail when paused
        vm.prank(trader1);
        vm.expectRevert();
        leveragedToken.redeem(shares);

        // Rebalance should fail when paused
        vm.warp(block.timestamp + 21 hours);
        vm.expectRevert();
        leveragedToken.rebalance();

        // Unpause
        leveragedToken.unpause();

        // Now operations should work
        vm.prank(trader2);
        leveragedToken.mint(1000 * 1e6);
    }

    function testOnlyOwnerCanPause() public {
        // Non-owner should not be able to pause
        vm.prank(trader1);
        vm.expectRevert();
        vault.pause();

        vm.prank(trader1);
        vm.expectRevert();
        leveragedToken.pause();
    }
}
