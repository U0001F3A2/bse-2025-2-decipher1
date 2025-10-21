# BSU Decentralized Index Fund

A decentralized index fund protocol built on Base that allows users to invest in diversified crypto portfolios with automated rebalancing and governance.

## Features

- **ERC-4626 Vault Standard**: Industry-standard tokenized vault implementation
- **Multi-Token Index Funds**: Support for multiple assets in a single fund
- **UUPS Upgradeable**: Contracts can be upgraded without changing addresses
- **Decentralized Governance**: Token holder voting for fund management decisions
- **Automated Fee Collection**: Management fees collected proportionally over time
- **Flexible Rebalancing**: Fund managers can rebalance allocations via Uniswap V3
- **Factory Pattern**: Easy deployment of new index funds

## Architecture

### Core Contracts

1. **IndexFund.sol**: Main vault contract implementing ERC-4626
   - Manages user deposits/withdrawals
   - Handles multi-token allocations
   - Collects management fees
   - Rebalances portfolio via DEX swaps

2. **FundFactory.sol**: Factory for deploying new index funds
   - Creates UUPS proxy instances
   - Manages fund registry
   - Centralizes fund configuration

3. **FundGovernance.sol**: Governance system for fund management
   - Share-based voting power
   - Proposal creation and execution
   - Supports fund creation, delisting, and allocation updates

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Make (optional, for using Makefile commands)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd bse-2025-2-decipher1

# Install dependencies
make install
# or
cd contracts && forge install
```

## Building

```bash
# Compile contracts
make build
# or
cd contracts && forge build
```

## Testing

```bash
# Run all tests
make test

# Run tests with verbose output
make test-verbose

# Run tests with gas reporting
make test-gas

# Run specific test contract
make test-contract
# Then enter: IndexFundTest

# Run specific test function
make test-function
# Then enter: testDeposit
```

### Test Coverage

The project includes comprehensive test coverage for:
- Fund initialization and configuration
- Deposit and withdrawal functionality
- Allocation management
- Fee collection mechanisms
- Governance proposal lifecycle
- Access control and security

## Deployment

### Local Development (Anvil)

```bash
# Terminal 1: Start local Anvil node
make anvil

# Terminal 2: Deploy contracts
make deploy-local
```

This deploys:
- IndexFund implementation
- FundFactory (upgradeable proxy)
- FundGovernance (upgradeable proxy)
- Initial "Crypto Index Fund" with WETH/USDC allocation

Deployment info saved to: `contracts/deployments/base-sepolia.json`

### Base Sepolia Testnet

1. Create a `.env` file in the project root:

```bash
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

2. Deploy:

```bash
make deploy-testnet
```

## Contract Interaction

### Get Fund Information

```bash
make fund-info
```

Displays:
- Factory address
- Fund address
- Fund name and symbol
- Total assets and shares

### Collect Management Fees

```bash
make collect-fees
```

Collects accrued management fees for all funds managed by the factory.

### Rebalance Fund

```bash
make rebalance
```

Executes rebalancing operations to match target allocations (requires proper swap data configuration).

## Using Cast for Custom Interactions

```bash
# Get fund allocations
cast call <FUND_ADDRESS> "getAllocations()" --rpc-url http://localhost:8545

# Check user balance
cast call <FUND_ADDRESS> "balanceOf(address)(uint256)" <USER_ADDRESS> --rpc-url http://localhost:8545

# Deposit into fund (requires ERC20 approval first)
cast send <FUND_ADDRESS> "deposit(uint256,address)" <AMOUNT> <RECEIVER> \
  --private-key <YOUR_KEY> --rpc-url http://localhost:8545
```

## Development Commands

```bash
# Format code
make format

# Generate coverage report
make coverage

# Take gas snapshot
make snapshot

# Clean build artifacts
make clean

# Watch mode for tests
make test-watch
```

## Contract Addresses

### Base Sepolia (Testnet)

Deployment addresses are stored in `contracts/deployments/base-sepolia.json` after deployment.

**Uniswap V3 Router**: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`

**Test Tokens**:
- WETH: `0x4200000000000000000000000000000000000006`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Architecture Details

### Upgradeable Pattern

All main contracts use UUPS (Universal Upgradeable Proxy Standard):
- Implementation contracts are deployed separately
- Proxies delegate all calls to implementations
- Upgrades controlled by owner via `upgradeToAndCall`

### Fee Mechanism

Management fees accrue continuously based on:
- Annual fee rate (in basis points, e.g., 200 = 2%)
- Time elapsed since last collection
- Current total supply of shares

Formula: `feeShares = (supply * feeRate * timeElapsed) / (secondsPerYear * 10000)`

### Governance Model

1. **Proposal Creation**: Requires minimum share threshold
2. **Voting Period**: Fixed duration for vote casting
3. **Quorum**: Minimum participation required (% of total supply)
4. **Execution**: Successful proposals can be executed after voting ends

## Security Considerations

- All contracts include reentrancy protection
- Access control via Ownable pattern
- Upgrades restricted to owner
- Input validation on all public functions
- Safe ERC20 operations using OpenZeppelin SafeERC20

## Gas Optimization

- Via-IR compilation for better optimization
- Minimal storage slots in proxy contracts
- Efficient loops with unchecked counters where safe
- Packed storage variables

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
make clean
make build
```

### Tests Fail

```bash
# Ensure dependencies are installed
make install

# Run with verbose output to see errors
make test-verbose
```

### Deployment Fails

```bash
# Check Anvil is running
ps aux | grep anvil

# Verify .env file exists with correct keys
cat .env

# Check RPC connectivity
cast block-number --rpc-url http://localhost:8545
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `make test`
6. Format code: `make format`
7. Submit a pull request

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Base Network Docs](https://docs.base.org/)
- [Uniswap V3 Docs](https://docs.uniswap.org/protocol/introduction)
