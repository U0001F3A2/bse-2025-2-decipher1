# Decentralized Index Fund & Leveraged ETF Protocol

Decentralized multi-token index fund protocol on Base with automated rebalancing, governance, and **2x leveraged ETF products**.

## Quick Start

```bash
# Setup
make install && make build && make test

# Deploy locally
make anvil          # Terminal 1
make deploy-local   # Terminal 2

# Interact
make fund-info
make collect-fees
```

## Features

### Index Fund
- **ERC-4626 Vault**: Standard tokenized vault
- **Multi-Token Support**: Diversified asset portfolios
- **UUPS Upgradeable**: Upgrade without address changes
- **Governance**: Token-weighted voting
- **Auto Fees**: Time-based management fees
- **DEX Integration**: Uniswap V3 rebalancing

### Leveraged ETF (NEW)
- **2x Daily Leverage**: Long exposure with daily rebalancing
- **LP-Backed**: LPs lend tokens, earn yield
- **Chainlink Oracles**: Real-time price feeds
- **Automated Rebalancing**: Maintains leverage ratio daily

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INDEX FUND MODULE                           │
├─────────────────────────────────────────────────────────────────────┤
│  IndexFund      │ ERC-4626 vault for multi-token portfolios        │
│  FundFactory    │ Deploys new index funds via UUPS proxies         │
│  FundGovernance │ Share-based voting for fund decisions            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      LEVERAGED ETF MODULE                           │
├─────────────────────────────────────────────────────────────────────┤
│  LPVault          │ LPs deposit tokens (WETH), earn interest       │
│  Leveraged2xToken │ 2x leveraged token borrowing from LP vault     │
└─────────────────────────────────────────────────────────────────────┘
```

### Leveraged ETF Flow

```
┌─────────────────────────────────────────┐
│         LP Vault (WETH)                 │
│  - LPs deposit WETH                     │
│  - Earn 5% APY from borrowers           │
│  - Simple lending, no delta risk        │
└──────────────────┬──────────────────────┘
                   │ borrows WETH
                   ▼
┌─────────────────────────────────────────┐
│      ETH 2x Daily Long (ETH2X)          │
│  - User deposits USDC collateral        │
│  - Borrows 2x worth of WETH from vault  │
│  - Daily rebalance maintains 2x         │
└─────────────────────────────────────────┘
```

**How 2x Leverage Works:**
1. User deposits 1000 USDC
2. Contract calculates 2x exposure: $2000 worth of ETH
3. Contract borrows WETH from LP vault
4. User receives ETH2X shares
5. Daily rebalance adjusts borrowed amount
6. On redemption: repay loan, return collateral +/- P&L

## Contracts

| Contract | Description |
|----------|-------------|
| `IndexFund.sol` | ERC-4626 multi-token index vault |
| `FundFactory.sol` | Factory for deploying index funds |
| `FundGovernance.sol` | Token-weighted governance |
| `LPVault.sol` | ERC-4626 lending vault for LPs |
| `Leveraged2xToken.sol` | 2x leveraged token with daily rebalancing |

## Commands

### Development
```bash
make test             # Run all tests (39 tests)
make test-verbose     # Detailed test output
make test-gas         # Gas usage report
make format           # Format code
make coverage         # Coverage report
```

### Deployment
```bash
make deploy-local     # Deploy to Anvil
make deploy-testnet   # Deploy to Base Sepolia (requires .env)
```

### Interaction
```bash
make fund-info        # Display fund details
make collect-fees     # Collect management fees
make rebalance        # Rebalance allocations
```

### Deploy Leveraged ETF
```bash
forge script script/DeployLeveraged.s.sol --rpc-url base-sepolia --broadcast
```

## Configuration

Create `.env` for testnet deployment:
```bash
PRIVATE_KEY=0xyour_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_api_key
```

## Contract Addresses (Base Sepolia)

### Infrastructure
- **Uniswap V3 Router**: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- **WETH**: `0x4200000000000000000000000000000000000006`
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **ETH/USD Oracle**: `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`

Deployed addresses: `contracts/deployments/base-sepolia.json`

## Key Mechanisms

### Index Fund Fees
```
feeShares = (supply × feeRate × timeElapsed) / (365 days × 10000)
```

### Leveraged ETF NAV
```
leveragedReturn = priceChange × leverageRatio
newNAV = currentNAV × (1 + leveragedReturn)
```

### LP Vault Interest
```
interest = borrowedAmount × interestRate × timeElapsed / year
```

### Governance Flow
1. Create proposal (requires minimum shares)
2. Vote during voting period (3 days)
3. Execute if quorum reached (10%) and majority approves

## Testing

All 39 tests passing:
- **9 IndexFund tests**: deposits, withdrawals, fees, allocations
- **7 FundGovernance tests**: proposals, voting, execution
- **23 LeveragedETF tests**: LP vault, leveraged tokens, rebalancing, pause

```bash
make test              # Quick test
make test-verbose      # Detailed output
forge test -vvvv       # Full traces
```

## Security Features

- **Pausable**: Emergency pause for all critical operations
- **Reentrancy Guards**: All state-changing functions protected
- **Access Control**: Owner-only for critical operations
- **Safe ERC20**: OpenZeppelin SafeERC20 for all transfers
- **Input Validation**: All public function parameters validated
- **Oracle Staleness Check**: Rejects stale price data
- **Utilization Limits**: LP vault capped at 90% utilization

### Emergency Pause
Both `LPVault` and `Leveraged2xToken` can be paused by the owner in case of emergencies:
```solidity
// Pause all operations
vault.pause();
leveragedToken.pause();

// Resume operations
vault.unpause();
leveragedToken.unpause();
```

## Parameters

### Index Fund
| Parameter | Value |
|-----------|-------|
| Max Management Fee | 10% annual |
| Max Slippage | 1% |

### Leveraged ETF
| Parameter | Value |
|-----------|-------|
| Leverage Ratio | 2x (configurable 1x-5x) |
| Rebalance Interval | 20 hours minimum |
| LP Interest Rate | 5% APY (configurable) |
| Max Utilization | 90% |

## License

MIT
