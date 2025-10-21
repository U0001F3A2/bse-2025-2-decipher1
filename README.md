# Decentralized Index Fund

Decentralized multi-token index fund protocol on Base with automated rebalancing and governance.

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

- **ERC-4626 Vault**: Standard tokenized vault
- **Multi-Token Support**: Diversified asset portfolios
- **UUPS Upgradeable**: Upgrade without address changes
- **Governance**: Token-weighted voting
- **Auto Fees**: Time-based management fees
- **DEX Integration**: Uniswap V3 rebalancing

## Architecture

**IndexFund**: ERC-4626 vault managing deposits, withdrawals, and multi-token allocations
**FundFactory**: Deploys new index funds via UUPS proxies
**FundGovernance**: Share-based voting for fund management decisions

## Commands

### Development
```bash
make test             # Run all tests
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

## Configuration

Create `.env` for testnet deployment:
```bash
PRIVATE_KEY=0xyour_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_api_key
```

## Contract Addresses (Base Sepolia)

- **Uniswap V3 Router**: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- **WETH**: `0x4200000000000000000000000000000000000006`
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Deployed addresses: `contracts/deployments/base-sepolia.json`

## Key Mechanisms

**Fee Calculation**: `feeShares = (supply × feeRate × timeElapsed) / (365 days × 10000)`

**Governance Flow**:
1. Create proposal (requires minimum shares)
2. Vote during voting period
3. Execute if quorum reached and majority approves

## Testing

All 16 tests passing:
- 9 IndexFund tests (deposits, withdrawals, fees, allocations)
- 7 FundGovernance tests (proposals, voting, execution)

```bash
make test              # Quick test
make test-verbose      # Detailed output
forge test -vvvv       # Full traces
```

## Security

- Reentrancy protection on all state-changing functions
- Owner-only access for critical operations
- Safe ERC20 operations (OpenZeppelin SafeERC20)
- Input validation on all public functions

## Gas Optimization

- Via-IR compilation enabled
- Unchecked arithmetic where safe
- Minimal proxy storage slots
- Efficient loops

## License

MIT
