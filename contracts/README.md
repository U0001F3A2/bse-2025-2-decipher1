# Index Fund Contracts

Decentralized index fund smart contracts built with Foundry, OpenZeppelin, and Uniswap V3.

## Overview

This project implements a decentralized index fund platform with:
- **Multi-token index funds** using ERC-4626 standard
- **Share-based governance** for fund management
- **Automated rebalancing** with Uniswap V3
- **Management fees** with continuous accrual
- **UUPS upgradeability** for all contracts

## Contracts

### Core Contracts

- **IndexFund.sol** - ERC-4626 vault holding multiple tokens with target allocations
- **FundFactory.sol** - Factory for deploying and managing index funds
- **FundGovernance.sol** - Governance system with share-based voting

### Key Features

- Multi-token portfolios with configurable allocations
- Deposit/withdraw in base asset (e.g., USDC)
- Admin rebalancing via Uniswap V3
- Management fee collection (e.g., 2% annual)
- Governance proposals for fund creation, delisting, and allocation updates
- UUPS proxy pattern for upgradeability

## Setup

### Prerequisites

- Foundry installed in WSL
- Private key for deployment
- Base Sepolia RPC URL

### Installation

```bash
# Install dependencies (run in WSL)
cd /mnt/d/projects/bsu/contracts
~/.foundry/bin/forge install
```

### Environment Variables

Create a `.env` file:

```bash
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_api_key_here
```

## Testing

```bash
# Run all tests (in WSL)
~/.foundry/bin/forge test

# Run with verbosity
~/.foundry/bin/forge test -vvv

# Run specific test
~/.foundry/bin/forge test --match-test testDeposit
```

## Deployment

### Deploy to Base Sepolia

```bash
# Run deployment script (in WSL)
~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# Deployment addresses saved to: deployments/base-sepolia.json
```

## Admin Operations

### Rebalance Fund

```bash
# Rebalance specific fund
~/.foundry/bin/forge script script/Rebalance.s.sol:RebalanceScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --sig "run(address)" <FUND_ADDRESS>
```

### Collect Fees

```bash
# Collect fees for all funds
~/.foundry/bin/forge script script/CollectFees.s.sol:CollectFeesScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --sig "run(address)" <FACTORY_ADDRESS>
```

## Architecture

### Upgradeability

All contracts use UUPS (Universal Upgradeable Proxy Standard):
- Logic in implementation contract
- State in proxy contract
- Upgrade authorized by owner only

### Token Flow

1. Users deposit base asset (USDC)
2. Fund mints shares (ERC-4626)
3. Admin rebalances to match target allocations
4. Fees accrue continuously
5. Users can withdraw proportional assets

### Governance

1. Share holders create proposals
2. Voting weighted by share ownership
3. Quorum and majority required
4. Successful proposals executed by anyone

## Security

- OpenZeppelin battle-tested contracts
- Reentrancy guards on critical functions
- Access control (Ownable)
- Slippage protection on swaps
- Fee limits (max 10%)

## Base Sepolia Addresses

### Uniswap V3
- SwapRouter: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- Quoter: `0xC5290058841028F1614F3A6F0F5816cAd0df5E27`

### Tokens
- WETH: `0x4200000000000000000000000000000000000006`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## License

MIT
