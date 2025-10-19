// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IFundGovernance.sol";
import "./interfaces/IIndexFund.sol";
import "./IndexFund.sol";
import "./FundFactory.sol";

/// @title FundGovernance
/// @notice Governance system for index funds with share-based voting
/// @dev Each fund's shares represent voting power
contract FundGovernance is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, IFundGovernance {
    // Proposal storage
    mapping(uint256 => Proposal) public proposals;
    
    // Voter tracking: proposalId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Voter vote weight tracking: proposalId => voter => voteWeight
    mapping(uint256 => mapping(address => uint256)) public voterWeight;
    
    // Proposal counter
    uint256 public proposalCount;
    
    // Reference to factory
    FundFactory public factory;
    
    // Voting parameters
    uint256 public votingPeriod; // in seconds
    uint256 public quorumPercentage; // in basis points (e.g., 1000 = 10%)
    uint256 public proposalThreshold; // minimum shares to create proposal
    
    // Constants
    uint256 private constant BASIS_POINTS = 10000;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize governance contract
    /// @param _factory Factory contract address
    /// @param _votingPeriod Duration of voting period
    /// @param _quorumPercentage Quorum required in basis points
    /// @param _proposalThreshold Minimum shares to create proposal
    function initialize(
        address _factory,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _proposalThreshold
    ) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(_factory != address(0), "Invalid factory");
        require(_votingPeriod > 0, "Invalid period");
        require(_quorumPercentage <= BASIS_POINTS, "Invalid quorum");

        factory = FundFactory(_factory);
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        proposalThreshold = _proposalThreshold;
    }

    /// @notice Create a new proposal
    /// @param targetFund Fund to target
    /// @param proposalType Type of proposal
    /// @param proposalData Encoded proposal data
    /// @return proposalId ID of created proposal
    function propose(
        address targetFund,
        ProposalType proposalType,
        bytes calldata proposalData
    ) external override nonReentrant returns (uint256) {
        // Verify proposer has enough shares
        uint256 shares = IndexFund(targetFund).balanceOf(msg.sender);
        require(shares >= proposalThreshold, "Insufficient shares");

        proposalCount++;
        uint256 proposalId = proposalCount;

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

    /// @notice Cast a vote on a proposal
    /// @param proposalId Proposal to vote on
    /// @param support True for yes, false for no
    function castVote(uint256 proposalId, bool support) external override nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Get voter's share balance (voting power)
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

    /// @notice Execute a successful proposal
    /// @param proposalId Proposal to execute
    function executeProposal(uint256 proposalId) external override nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        // Update status
        ProposalStatus status = _calculateProposalStatus(proposalId);
        proposal.status = status;
        
        require(status == ProposalStatus.Succeeded, "Proposal not succeeded");

        proposal.executed = true;

        // Execute based on proposal type
        if (proposal.proposalType == ProposalType.CreateFund) {
            _executeCreateFund(proposal);
        } else if (proposal.proposalType == ProposalType.DelistFund) {
            _executeDelistFund(proposal);
        } else if (proposal.proposalType == ProposalType.UpdateAllocations) {
            _executeUpdateAllocations(proposal);
        }

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel a proposal (owner only)
    /// @param proposalId Proposal to cancel
    function cancelProposal(uint256 proposalId) external override onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal not found");
        require(!proposal.executed, "Already executed");
        
        proposal.status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    /// @notice Get proposal details
    /// @param proposalId Proposal ID
    /// @return Proposal struct
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        return proposals[proposalId];
    }

    /// @notice Get current proposal status
    /// @param proposalId Proposal ID
    /// @return Current status
    function getProposalStatus(uint256 proposalId) external view override returns (ProposalStatus) {
        return _calculateProposalStatus(proposalId);
    }

    /// @notice Calculate proposal status
    /// @param proposalId Proposal ID
    /// @return Calculated status
    function _calculateProposalStatus(uint256 proposalId) internal view returns (ProposalStatus) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.status == ProposalStatus.Cancelled) {
            return ProposalStatus.Cancelled;
        }
        
        if (proposal.executed) {
            return ProposalStatus.Executed;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalStatus.Active;
        }
        
        // Check quorum and majority
        IndexFund fund = IndexFund(proposal.targetFund);
        uint256 totalShares = fund.totalSupply();
        uint256 quorum = (totalShares * quorumPercentage) / BASIS_POINTS;
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        if (totalVotes < quorum) {
            return ProposalStatus.Defeated;
        }
        
        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalStatus.Succeeded;
        }
        
        return ProposalStatus.Defeated;
    }

    /// @notice Execute create fund proposal
    /// @param proposal Proposal to execute
    function _executeCreateFund(Proposal storage proposal) internal {
        // Decode proposal data
        (
            string memory name,
            string memory symbol,
            address asset,
            IIndexFund.TokenAllocation[] memory allocations,
            uint256 managementFee
        ) = abi.decode(
            proposal.proposalData,
            (string, string, address, IIndexFund.TokenAllocation[], uint256)
        );
        
        // Create fund through factory
        factory.createFund(name, symbol, asset, allocations, managementFee);
    }

    /// @notice Execute delist fund proposal
    /// @param proposal Proposal to execute
    function _executeDelistFund(Proposal storage proposal) internal {
        address fundToRemove = abi.decode(proposal.proposalData, (address));
        factory.removeFund(fundToRemove);
    }

    /// @notice Execute update allocations proposal
    /// @param proposal Proposal to execute
    function _executeUpdateAllocations(Proposal storage proposal) internal {
        IIndexFund.TokenAllocation[] memory newAllocations = 
            abi.decode(proposal.proposalData, (IIndexFund.TokenAllocation[]));
        
        IndexFund(proposal.targetFund).updateAllocations(newAllocations);
    }

    /// @notice Update voting parameters
    /// @param _votingPeriod New voting period
    /// @param _quorumPercentage New quorum percentage
    /// @param _proposalThreshold New proposal threshold
    function updateVotingParameters(
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _proposalThreshold
    ) external onlyOwner {
        require(_votingPeriod > 0, "Invalid period");
        require(_quorumPercentage <= BASIS_POINTS, "Invalid quorum");
        
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        proposalThreshold = _proposalThreshold;
    }

    /// @notice Required by UUPS pattern
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

