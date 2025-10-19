# BSU Project TODO

## Project Overview

This is a **decentralized index fund protocol** built on Base Sepolia with:
- **Smart contracts**: Solidity + Foundry (ERC-4626 vault, UUPS upgradeable, Uniswap V3 integration)
- **Frontend**: Next.js/React (currently just boilerplate)
- **Status**: Early prototype phase - contracts functional but not production-ready, frontend non-existent

---

## Priority Work Items

### 🔴 Critical Issues

1. **Price Oracle Integration Missing** - contracts/src/IndexFund.sol:189-199
   - `totalAssets()` sums raw balances (1 WBTC + 1 WETH = 2 wrong!)
   - Need Chainlink price feeds for proper accounting
   - **Estimated effort**: 2-3 days

2. **Frontend Completely Non-Functional** - frontend/app/page.tsx
   - Just Next.js boilerplate (103 lines)
   - No Web3 integration (wagmi/viem)
   - No contract interactions, no wallet connection
   - **Estimated effort**: 2-4 weeks

3. **Unsafe Low-Level Call** - contracts/src/IndexFund.sol:143
   - Using raw `call()` to swap router (security risk)
   - Should use typed interface calls
   - **Estimated effort**: 1 day

4. **No Emergency Pause Mechanism**
   - Can't freeze funds during exploits
   - Should implement OpenZeppelin Pausable
   - **Estimated effort**: 1 day

### 🟡 High Priority

5. **Missing Test Coverage**
   - contracts/test/IndexFund.t.sol:207-216 - rebalance test is empty
   - No actual swap execution tests
   - No edge case tests (0 amounts, rounding errors)
   - **Estimated effort**: 2-3 days

6. **Governance Timelock Missing** - contracts/src/FundGovernance.sol
   - Proposals execute immediately after passing
   - Need 2-7 day delay for security
   - **Estimated effort**: 2 days

7. **Approval Pattern Bug** - contracts/src/IndexFund.sol:136-140
   - `safeIncreaseAllowance()` may fail on repeated calls
   - Should approve full amount or use approve(0) first
   - **Estimated effort**: 1 day

8. **Remove Template Code**
   - contracts/src/Counter.sol + tests/scripts still exist
   - Should be deleted
   - **Estimated effort**: 30 minutes

### 🟢 Nice to Have

9. **Add TypeChain for Frontend**
   - Generate TypeScript types from contract ABIs
   - Type-safe contract interactions
   - **Estimated effort**: 1 day

10. **Version Tracking for Upgrades**
    - UUPS contracts lack version fields
    - Can't verify deployed contract versions
    - **Estimated effort**: 1 day

11. **Gas Optimization Pass**
    - Unoptimized loops in contracts/src/FundFactory.sol:108-114
    - No storage packing
    - **Estimated effort**: 1-2 days

12. **Documentation**
    - No architecture diagrams
    - No deployment guides
    - No API documentation for Web3 integration
    - **Estimated effort**: 3-5 days

---

## Quick Wins (1-2 days each)

- [ ] Delete Counter template files
- [ ] Add `Pausable` pattern to IndexFund
- [ ] Fix approval bug in rebalance function
- [ ] Add version field to upgradeable contracts
- [ ] Add missing events (e.g., executeProposal in FundGovernance.sol:150-171)

## Medium Term (1 week)

- [ ] Implement Chainlink price oracle
- [ ] Create comprehensive test suite
- [ ] Set up TypeChain + contract types
- [ ] Begin frontend Web3 integration

## Long Term (2-4 weeks)

- [ ] Full frontend dashboard (fund creation, deposits, governance UI)
- [ ] Governance timelock implementation
- [ ] Security audit
- [ ] Mainnet preparation

---

## Detailed Issues Reference

### Smart Contract Issues

#### Critical
- **IndexFund.sol:189-199** - No price oracle for multi-token accounting
  ```solidity
  // Current: sums raw token balances
  // Problem: 1 WBTC + 1 WETH = 2 units (wrong!)
  // Should: convert to common denomination
  ```

- **IndexFund.sol:143** - Unsafe low-level call
  ```solidity
  (bool success,) = address(swapRouter).call(swapData[i]);
  require(success, "Swap failed");
  ```
  **Fix**: Use interface calls instead: `ISwapRouter(swapRouter).exactInputSingle(params);`

#### High Priority
- **IndexFund.sol:136-140** - Allowance pattern issue
  ```solidity
  IERC20(alloc.token).safeIncreaseAllowance(
      address(swapRouter),
      currentAmount - targetAmount
  );
  ```
  **Problem**: Only approves for the difference, not the full amount

- **FundGovernance.sol:150-171** - Missing event in executeProposal
  - No event emitted for successful execution
  - Clients can't track execution outcomes

- **FundFactory.sol:108-114** - Inefficient array removal (O(n) linear search)

#### Medium Priority
- **FundGovernance.sol:59-61** - Governance parameters not validated at initialization
- **IndexFund.sol:162-163** - Fee calculation vulnerable to rounding errors
- No emergency pause mechanism
- No withdraw limit or circuit breaker

### Frontend Issues

- **frontend/app/page.tsx** - Completely boilerplate (103 lines)
- Missing Web3 dependencies (wagmi, ethers, viem)
- No contract ABI management
- No components for:
  - Fund dashboard/portfolio view
  - Fund creation form
  - Deposit/withdrawal UI
  - Governance proposal interface
  - Voting interface
  - Transaction history

### Test Gaps

- **IndexFund.t.sol:207-216** - Empty rebalance test
- No integration tests between Factory, Fund, and Governance
- No fuzz testing for allocation percentages
- No stress tests for multiple funds
- No gas profiling
- No reentrancy tests (despite using ReentrancyGuard)

---

## Project Maturity Assessment

| Category | Status | Rating |
|----------|--------|--------|
| **Smart Contracts** | Functional but not production-ready | 6/10 |
| **Contract Tests** | Good basic coverage, gaps in edge cases | 6.5/10 |
| **Frontend** | Non-existent (boilerplate only) | 0.5/10 |
| **Documentation** | Basic README only | 3/10 |
| **Security Practices** | Some issues identified | 5/10 |
| **DevOps/CI-CD** | Basic GitHub Actions CI | 6/10 |
| **Code Quality** | Generally good, some patterns need work | 6.5/10 |
| **Overall Readiness** | Research/prototype phase | 5/10 |

---

## Key File Paths

### Core Contracts
- `/mnt/d/projects/bsu/contracts/src/IndexFund.sol`
- `/mnt/d/projects/bsu/contracts/src/FundFactory.sol`
- `/mnt/d/projects/bsu/contracts/src/FundGovernance.sol`

### Interfaces
- `/mnt/d/projects/bsu/contracts/src/interfaces/IIndexFund.sol`
- `/mnt/d/projects/bsu/contracts/src/interfaces/IFundGovernance.sol`

### Tests
- `/mnt/d/projects/bsu/contracts/test/IndexFund.t.sol`
- `/mnt/d/projects/bsu/contracts/test/FundGovernance.t.sol`

### Scripts
- `/mnt/d/projects/bsu/contracts/script/Deploy.s.sol`
- `/mnt/d/projects/bsu/contracts/script/Rebalance.s.sol`
- `/mnt/d/projects/bsu/contracts/script/CollectFees.s.sol`

### Frontend
- `/mnt/d/projects/bsu/frontend/app/page.tsx`
- `/mnt/d/projects/bsu/frontend/package.json`
