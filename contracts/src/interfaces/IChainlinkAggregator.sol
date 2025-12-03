// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IChainlinkAggregator - Chainlink Price Feed Interface
/// @dev Standard Chainlink V3 Aggregator interface for price oracles
interface IChainlinkAggregator {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

    function getRoundData(uint80 _roundId)
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}
