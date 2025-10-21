# Quick Start (5 Minutes)

## Install (1 min)

```bash
make install && make build
```

## Test (30 sec)

```bash
make test
```

Expected output: `16 tests passed, 0 failed`

## Deploy Locally (1 min)

```bash
# Terminal 1
make anvil

# Terminal 2
make deploy-local
```

## Verify Deployment

```bash
make fund-info
```

Output shows:
- Factory address
- Fund address
- Fund name: "Crypto Index Fund"
- Fund symbol: "CIF"

## Interact

```bash
make collect-fees    # Collect fees (requires time passage)
make help           # View all commands
```

## What's Deployed?

1. **IndexFund** (Implementation)
2. **FundFactory** (UUPS Proxy)
3. **FundGovernance** (UUPS Proxy)
4. **Crypto Index Fund** (60% WETH / 40% USDC)

Addresses saved to: `contracts/deployments/base-sepolia.json`

## Common Commands

```bash
# Development
make test-verbose    # Detailed test output
make format          # Format code
make clean           # Clean artifacts

# Deployment
make deploy-testnet  # Deploy to Base Sepolia (needs .env)

# Testing
make test-gas        # Gas report
make coverage        # Coverage report
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

# Restart
pkill anvil && make anvil
```

For full documentation, see [README.md](README.md)
