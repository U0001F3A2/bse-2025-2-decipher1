// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IFundGovernance.sol";
import "./IndexFund.sol";
import "./FundFactory.sol";

/// @title FundGovernance - Share-based voting governance for index funds
/// @dev Manages proposals for fund creation, delisting, and allocation updates
contract FundGovernance is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, IFundGovernance {
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voterWeight;

    uint256 public proposalCount;
    uint256 public votingPeriod;
    uint256 public quorumPercentage;
    uint256 public proposalThreshold;

    FundFactory public factory;

    uint256 private constant BASIS_POINTS = 10000;

    constructor() {
        _disableInitializers();
    }

    function initialize(address _factory, uint256 _votingPeriod, uint256 _quorumPercentage, uint256 _proposalThreshold)
        external
        initializer
    {
        require(_factory != address(0), "Invalid factory");
        require(_votingPeriod > 0, "Invalid period");
        require(_quorumPercentage <= BASIS_POINTS, "Invalid quorum");

        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();

        factory = FundFactory(_factory);
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        proposalThreshold = _proposalThreshold;
    }

    function propose(address targetFund, ProposalType proposalType, bytes calldata proposalData)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(IndexFund(targetFund).balanceOf(msg.sender) >= proposalThreshold, "Insufficient shares");

        uint256 proposalId = ++proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            targetFund: targetFund,
            proposalType: proposalType,
            status: ProposalStatus.Active,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            proposalData: proposalData,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, targetFund, proposalType);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external override nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = IndexFund(proposal.targetFund).balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        voterWeight[proposalId][msg.sender] = weight;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    function executeProposal(uint256 proposalId) external override nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");

        ProposalStatus status = _calculateProposalStatus(proposalId);
        require(status == ProposalStatus.Succeeded, "Proposal not succeeded");

        proposal.status = status;
        proposal.executed = true;

        if (proposal.proposalType == ProposalType.CreateFund) {
            _executeCreateFund(proposal);
        } else if (proposal.proposalType == ProposalType.DelistFund) {
            _executeDelistFund(proposal);
        } else if (proposal.proposalType == ProposalType.UpdateAllocations) {
            _executeUpdateAllocations(proposal);
        }

        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external override onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(!proposal.executed, "Already executed");

        proposal.status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getProposalStatus(uint256 proposalId) external view override returns (ProposalStatus) {
        return _calculateProposalStatus(proposalId);
    }

    function _calculateProposalStatus(uint256 proposalId) internal view returns (ProposalStatus) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.status == ProposalStatus.Cancelled) return ProposalStatus.Cancelled;
        if (proposal.executed) return ProposalStatus.Executed;
        if (block.timestamp <= proposal.endTime) return ProposalStatus.Active;

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorum = (IndexFund(proposal.targetFund).totalSupply() * quorumPercentage) / BASIS_POINTS;

        if (totalVotes < quorum || proposal.forVotes <= proposal.againstVotes) {
            return ProposalStatus.Defeated;
        }

        return ProposalStatus.Succeeded;
    }

    function _executeCreateFund(Proposal storage proposal) internal {
        (
            string memory name,
            string memory symbol,
            address asset,
            IIndexFund.TokenAllocation[] memory allocations,
            uint256 managementFee
        ) = abi.decode(proposal.proposalData, (string, string, address, IIndexFund.TokenAllocation[], uint256));

        factory.createFund(name, symbol, asset, allocations, managementFee);
    }

    function _executeDelistFund(Proposal storage proposal) internal {
        factory.removeFund(abi.decode(proposal.proposalData, (address)));
    }

    function _executeUpdateAllocations(Proposal storage proposal) internal {
        IndexFund(proposal.targetFund).updateAllocations(
            abi.decode(proposal.proposalData, (IIndexFund.TokenAllocation[]))
        );
    }

    function updateVotingParameters(uint256 _votingPeriod, uint256 _quorumPercentage, uint256 _proposalThreshold)
        external
        onlyOwner
    {
        require(_votingPeriod > 0, "Invalid period");
        require(_quorumPercentage <= BASIS_POINTS, "Invalid quorum");

        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        proposalThreshold = _proposalThreshold;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
