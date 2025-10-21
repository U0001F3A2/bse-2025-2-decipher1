# Quick Start Guide

This guide will get you up and running with the BSU Decentralized Index Fund in minutes.

## Prerequisites

Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Setup (30 seconds)

```bash
# Install dependencies
make install

# Build contracts
make build

# Run tests
make test
```

## Deploy Locally (1 minute)

```bash
# Terminal 1: Start local blockchain
make anvil

# Terminal 2: Deploy contracts
make deploy-local
```

## Interact with Contracts

```bash
# Get fund information
make fund-info

# Collect management fees
make collect-fees

# View all commands
make help
```

## What Was Deployed?

After running `make deploy-local`, you have:

1. **IndexFund Implementation** - The core vault logic
2. **FundFactory** - Factory for creating new funds (upgradeable)
3. **FundGovernance** - Governance system for fund management (upgradeable)
4. **Initial Fund** - "Crypto Index Fund" (CIF) with 60% WETH, 40% USDC allocation

## Contract Addresses

All deployment addresses are saved to:
```
contracts/deployments/base-sepolia.json
```

Example content:
```json
{
  "network": "base-sepolia",
  "factory": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "governance": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  "initialFund": "0xd8058efe0198ae9dD7D563e1b4938Dcbc86A1F81"
}
```

## Key Features Verified

✅ **All 16 tests passing**
- 9 IndexFund tests
- 7 FundGovernance tests

✅ **Deployments working**
- Local Anvil deployment
- Deployment info saved to JSON

✅ **Makefile targets functional**
- build, test, deploy-local
- fund-info, collect-fees
- format, coverage, snapshot

## Next Steps

1. **Deploy to testnet**: Configure `.env` and run `make deploy-testnet`
2. **Create new funds**: Use the FundFactory contract
3. **Manage governance**: Create proposals for fund changes
4. **Integrate frontend**: Use the deployed contract addresses

## Common Commands

```bash
# Development
make test-verbose    # Run tests with detailed output
make test-gas        # View gas usage
make format          # Format Solidity code
make coverage        # Generate coverage report

# Deployment
make deploy-local    # Deploy to Anvil
make deploy-testnet  # Deploy to Base Sepolia

# Interaction
make fund-info       # Get fund details
make collect-fees    # Collect management fees
make rebalance       # Rebalance fund (requires config)
```

## Troubleshooting

**Tests fail?**
```bash
make clean && make build && make test
```

**Can't deploy?**
```bash
# Check Anvil is running
ps aux | grep anvil

# Restart Anvil
pkill anvil
make anvil
```

**Need help?**
```bash
make help
```

For more details, see the full [README.md](README.md)
