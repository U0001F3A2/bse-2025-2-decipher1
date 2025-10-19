// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FundGovernance.sol";
import "../src/IndexFund.sol";
import "../src/FundFactory.sol";
import "../src/interfaces/IIndexFund.sol";
import "../src/interfaces/IFundGovernance.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./helpers/TestHelpers.sol";

contract FundGovernanceTest is Test {
    FundGovernance public governanceImplementation;
    FundGovernance public governance;
    IndexFund public fundImplementation;
    IndexFund public fund;
    FundFactory public factoryImplementation;
    FundFactory public factory;
    
    MockERC20 public usdc;
    MockERC20 public weth;
    MockERC20 public wbtc;
    MockSwapRouter public swapRouter;

    address owner = address(1);
    address treasury = address(2);
    address user1 = address(3);
    address user2 = address(4);

    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant QUORUM = 1000;
    uint256 constant PROPOSAL_THRESHOLD = 100 * 10 ** 18;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock tokens
        usdc = new MockERC20("USDC", "USDC");
        weth = new MockERC20("Wrapped Ether", "WETH");
        wbtc = new MockERC20("Wrapped Bitcoin", "WBTC");
        swapRouter = new MockSwapRouter();
        
        // Deploy implementations
        fundImplementation = new IndexFund();
        factoryImplementation = new FundFactory();
        governanceImplementation = new FundGovernance();
        
        // Deploy factory
        bytes memory factoryInitData = abi.encodeWithSelector(
            FundFactory.initialize.selector,
            address(fundImplementation),
            address(swapRouter),
            treasury
        );
        ERC1967Proxy factoryProxy = new ERC1967Proxy(address(factoryImplementation), factoryInitData);
        factory = FundFactory(address(factoryProxy));
        
        // Deploy governance
        bytes memory govInitData = abi.encodeWithSelector(
            FundGovernance.initialize.selector,
            address(factory),
            VOTING_PERIOD,
            QUORUM,
            PROPOSAL_THRESHOLD
        );
        ERC1967Proxy govProxy = new ERC1967Proxy(address(governanceImplementation), govInitData);
        governance = FundGovernance(address(govProxy));
        
        // Create a fund through factory
        IIndexFund.TokenAllocation[] memory allocations = new IIndexFund.TokenAllocation[](2);
        allocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 6000
        });
        allocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 4000
        });
        
        address fundAddress = factory.createFund(
            "Test Fund",
            "TF",
            address(usdc),
            allocations,
            200
        );
        fund = IndexFund(fundAddress);
        
        // Distribute shares to users by depositing
        usdc.transfer(user1, 10000 * 10 ** 18);
        usdc.transfer(user2, 10000 * 10 ** 18);
        
        vm.stopPrank();
        
        // Users deposit to get shares
        vm.startPrank(user1);
        usdc.approve(address(fund), 1000 * 10 ** 18);
        fund.deposit(1000 * 10 ** 18, user1);
        vm.stopPrank();
        
        vm.startPrank(user2);
        usdc.approve(address(fund), 500 * 10 ** 18);
        fund.deposit(500 * 10 ** 18, user2);
        vm.stopPrank();
    }
    
    function testInitialization() public view {
        assertEq(address(governance.factory()), address(factory));
        assertEq(governance.votingPeriod(), VOTING_PERIOD);
        assertEq(governance.quorumPercentage(), QUORUM);
        assertEq(governance.proposalThreshold(), PROPOSAL_THRESHOLD);
    }
    
    function testCreateProposal() public {
        vm.startPrank(user1);
        
        // Create update allocations proposal
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        
        uint256 proposalId = governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        
        assertEq(proposalId, 1);
        assertEq(governance.proposalCount(), 1);
        
        IFundGovernance.Proposal memory proposal = governance.getProposal(proposalId);
        assertEq(proposal.proposer, user1);
        assertEq(proposal.targetFund, address(fund));
        
        vm.stopPrank();
    }
    
    function testFailCreateProposalInsufficientShares() public {
        address user3 = address(5);
        vm.startPrank(user3);
        
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        
        // Should fail - user3 has no shares
        governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        
        vm.stopPrank();
    }
    
    function testCastVote() public {
        // Create proposal
        vm.startPrank(user1);
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        uint256 proposalId = governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        
        // Vote for
        governance.castVote(proposalId, true);
        vm.stopPrank();
        
        // Check vote recorded
        IFundGovernance.Proposal memory proposal = governance.getProposal(proposalId);
        assertGt(proposal.forVotes, 0);
        assertTrue(governance.hasVoted(proposalId, user1));
    }
    
    function testFailVoteTwice() public {
        // Create proposal
        vm.startPrank(user1);
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        uint256 proposalId = governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        
        governance.castVote(proposalId, true);
        governance.castVote(proposalId, true); // Should fail
        
        vm.stopPrank();
    }
    
    function testProposalStatus() public {
        vm.startPrank(user1);
        
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        uint256 proposalId = governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        
        // Should be active
        assertEq(uint8(governance.getProposalStatus(proposalId)), uint8(IFundGovernance.ProposalStatus.Active));
        
        vm.stopPrank();
    }
    
    function testCancelProposal() public {
        // Create proposal as user
        vm.startPrank(user1);
        IIndexFund.TokenAllocation[] memory newAllocations = new IIndexFund.TokenAllocation[](2);
        newAllocations[0] = IIndexFund.TokenAllocation({
            token: address(weth),
            targetPercentage: 5000
        });
        newAllocations[1] = IIndexFund.TokenAllocation({
            token: address(wbtc),
            targetPercentage: 5000
        });
        
        bytes memory proposalData = abi.encode(newAllocations);
        uint256 proposalId = governance.propose(
            address(fund),
            IFundGovernance.ProposalType.UpdateAllocations,
            proposalData
        );
        vm.stopPrank();
        
        // Cancel as owner
        vm.startPrank(owner);
        governance.cancelProposal(proposalId);
        vm.stopPrank();
        
        // Check status
        assertEq(
            uint8(governance.getProposalStatus(proposalId)),
            uint8(IFundGovernance.ProposalStatus.Cancelled)
        );
    }
}

