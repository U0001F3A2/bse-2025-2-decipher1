// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IIndexFund.sol";

interface IFundGovernance {
    enum ProposalType {
        CreateFund,
        DelistFund,
        UpdateAllocations
    }

    enum ProposalStatus {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Cancelled
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address targetFund;
        ProposalType proposalType;
        ProposalStatus status;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bytes proposalData;
        bool executed;
    }

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed targetFund,
        ProposalType proposalType
    );
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    function propose(
        address targetFund,
        ProposalType proposalType,
        bytes calldata proposalData
    ) external returns (uint256);

    function castVote(uint256 proposalId, bool support) external;
    function executeProposal(uint256 proposalId) external;
    function cancelProposal(uint256 proposalId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function getProposalStatus(uint256 proposalId) external view returns (ProposalStatus);
}

