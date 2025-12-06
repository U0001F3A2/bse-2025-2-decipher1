// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./IndexFund.sol";
import "./interfaces/IIndexFund.sol";

/// @title FundFactory - Factory for creating and managing index funds
/// @dev Deploys funds as UUPS proxies
contract FundFactory is OwnableUpgradeable, UUPSUpgradeable {
    address[] public funds;
    mapping(address => bool) public isFund;

    address public fundImplementation;
    address public swapRouter;
    address public treasury;

    event FundCreated(address indexed fund, string name, string symbol, address asset);
    event FundRemoved(address indexed fund);
    event ImplementationUpdated(address indexed newImplementation);

    constructor() {
        _disableInitializers();
    }

    function initialize(address _fundImplementation, address _swapRouter, address _treasury) external initializer {
        require(_fundImplementation != address(0), "Invalid implementation");
        require(_swapRouter != address(0), "Invalid router");
        require(_treasury != address(0), "Invalid treasury");

        __Ownable_init(msg.sender);

        fundImplementation = _fundImplementation;
        swapRouter = _swapRouter;
        treasury = _treasury;
    }

    function createFund(
        string memory name,
        string memory symbol,
        address asset,
        IIndexFund.TokenAllocation[] memory allocations,
        uint256 managementFee
    ) external returns (address fund) {
        bytes memory initData = abi.encodeWithSelector(
            IndexFund.initialize.selector, name, symbol, asset, allocations, managementFee, swapRouter, treasury
        );

        fund = address(new ERC1967Proxy(fundImplementation, initData));
        funds.push(fund);
        isFund[fund] = true;
        IndexFund(fund).transferOwnership(msg.sender);

        emit FundCreated(fund, name, symbol, asset);
    }

    function removeFund(address fund) external onlyOwner {
        require(isFund[fund], "Not a fund");
        isFund[fund] = false;

        uint256 len = funds.length;
        for (uint256 i; i < len; ++i) {
            if (funds[i] == fund) {
                funds[i] = funds[len - 1];
                funds.pop();
                break;
            }
        }

        emit FundRemoved(fund);
    }

    function getAllFunds() external view returns (address[] memory) {
        return funds;
    }

    function getFundCount() external view returns (uint256) {
        return funds.length;
    }

    function getAllFundInfo() external view returns (IIndexFund.FundInfo[] memory) {
        uint256 len = funds.length;
        IIndexFund.FundInfo[] memory fundInfos = new IIndexFund.FundInfo[](len);

        for (uint256 i; i < len; ++i) {
            fundInfos[i] = IndexFund(funds[i]).getFundInfo();
        }

        return fundInfos;
    }

    function updateFundImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        fundImplementation = newImplementation;
        emit ImplementationUpdated(newImplementation);
    }

    function updateSwapRouter(address _swapRouter) external onlyOwner {
        require(_swapRouter != address(0), "Invalid router");
        swapRouter = _swapRouter;
    }

    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
