.PHONY: help install build test clean deploy-local deploy-testnet anvil deploy-factory deploy-fund fund-info collect-fees rebalance

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
help:
	@echo "$(BLUE)BSU Decentralized Index Fund - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup Commands:$(NC)"
	@echo "  make install          - Install dependencies"
	@echo "  make build            - Compile contracts"
	@echo "  make test             - Run all tests"
	@echo "  make test-verbose     - Run tests with verbose output"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Local Development:$(NC)"
	@echo "  make anvil            - Start local Anvil node"
	@echo "  make deploy-local     - Deploy contracts to local Anvil"
	@echo ""
	@echo "$(GREEN)Testnet Deployment:$(NC)"
	@echo "  make deploy-testnet   - Deploy contracts to Base Sepolia testnet"
	@echo ""
	@echo "$(GREEN)Contract Interaction:$(NC)"
	@echo "  make fund-info        - Get information about deployed fund"
	@echo "  make collect-fees     - Collect management fees"
	@echo "  make rebalance        - Rebalance fund allocations"
	@echo ""

# Install dependencies
install:
	@echo "$(YELLOW)Installing Foundry dependencies...$(NC)"
	cd contracts && forge install
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

# Build contracts
build:
	@echo "$(YELLOW)Building contracts...$(NC)"
	cd contracts && forge build
	@echo "$(GREEN)Build completed successfully!$(NC)"

# Run tests
test:
	@echo "$(YELLOW)Running tests...$(NC)"
	cd contracts && forge test
	@echo "$(GREEN)Tests completed!$(NC)"

# Run tests with verbosity
test-verbose:
	@echo "$(YELLOW)Running tests with verbose output...$(NC)"
	cd contracts && forge test -vvv

# Run tests with gas report
test-gas:
	@echo "$(YELLOW)Running tests with gas report...$(NC)"
	cd contracts && forge test --gas-report

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	cd contracts && forge clean
	@echo "$(GREEN)Cleaned successfully!$(NC)"

# Start local Anvil node
anvil:
	@echo "$(GREEN)Starting Anvil local node...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	anvil

# Deploy to local Anvil
deploy-local:
	@echo "$(YELLOW)Deploying contracts to local Anvil...$(NC)"
	@if [ ! -f .env ]; then \
		echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env; \
		echo "$(YELLOW)Created .env file with default Anvil private key$(NC)"; \
	fi
	cd contracts && PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
		forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
	@echo "$(GREEN)Deployment to local network completed!$(NC)"

# Deploy to Base Sepolia testnet
deploy-testnet:
	@echo "$(YELLOW)Deploying contracts to Base Sepolia testnet...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Error: .env file not found. Please create it with PRIVATE_KEY and BASE_SEPOLIA_RPC_URL$(NC)"; \
		exit 1; \
	fi
	cd contracts && source ../.env && forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $$BASE_SEPOLIA_RPC_URL \
		--broadcast \
		--verify
	@echo "$(GREEN)Deployment to Base Sepolia completed!$(NC)"

# Get fund information
fund-info:
	@echo "$(YELLOW)Fetching fund information...$(NC)"
	@if [ ! -f contracts/deployments/base-sepolia.json ]; then \
		echo "$(YELLOW)No deployment found. Please deploy first.$(NC)"; \
		exit 1; \
	fi
	@FACTORY=$$(cat contracts/deployments/base-sepolia.json | grep -o '"factory":"[^"]*"' | cut -d'"' -f4); \
	FUND=$$(cat contracts/deployments/base-sepolia.json | grep -o '"initialFund":"[^"]*"' | cut -d'"' -f4); \
	echo "$(GREEN)Factory Address: $$FACTORY$(NC)"; \
	echo "$(GREEN)Fund Address: $$FUND$(NC)"; \
	echo "$(GREEN)Name: $$(cast call $$FUND "name()(string)" --rpc-url http://localhost:8545)$(NC)"; \
	echo "$(GREEN)Symbol: $$(cast call $$FUND "symbol()(string)" --rpc-url http://localhost:8545)$(NC)"; \
	echo "$(GREEN)Total Supply: $$(cast call $$FUND "totalSupply()(uint256)" --rpc-url http://localhost:8545)$(NC)"; \
	echo "$(GREEN)Management Fee: $$(cast call $$FUND "managementFee()(uint256)" --rpc-url http://localhost:8545) basis points$(NC)"; \
	echo "$(GREEN)Treasury: $$(cast call $$FUND "treasury()(address)" --rpc-url http://localhost:8545)$(NC)"

# Collect fees
collect-fees:
	@echo "$(YELLOW)Collecting management fees...$(NC)"
	@if [ ! -f contracts/deployments/base-sepolia.json ]; then \
		echo "$(YELLOW)No deployment found. Please deploy first.$(NC)"; \
		exit 1; \
	fi
	@FACTORY=$$(cat contracts/deployments/base-sepolia.json | grep -o '"factory":"[^"]*"' | cut -d'"' -f4); \
	cd contracts && PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
		forge script script/CollectFees.s.sol:CollectFeesScript --sig "run(address)" $$FACTORY --rpc-url http://localhost:8545 --broadcast
	@echo "$(GREEN)Fees collected successfully!$(NC)"

# Rebalance fund
rebalance:
	@echo "$(YELLOW)Rebalancing fund...$(NC)"
	@if [ ! -f contracts/deployments/base-sepolia.json ]; then \
		echo "$(YELLOW)No deployment found. Please deploy first.$(NC)"; \
		exit 1; \
	fi
	@FUND=$$(cat contracts/deployments/base-sepolia.json | grep -o '"initialFund":"[^"]*"' | cut -d'"' -f4); \
	echo "$(YELLOW)Rebalancing fund at address: $$FUND$(NC)"; \
	cd contracts && PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
		forge script script/Rebalance.s.sol:RebalanceScript --sig "run(address)" $$FUND --rpc-url http://localhost:8545 --broadcast
	@echo "$(GREEN)Fund rebalanced successfully!$(NC)"

# Format code
format:
	@echo "$(YELLOW)Formatting Solidity code...$(NC)"
	cd contracts && forge fmt
	@echo "$(GREEN)Code formatted!$(NC)"

# Generate coverage report
coverage:
	@echo "$(YELLOW)Generating coverage report...$(NC)"
	cd contracts && forge coverage
	@echo "$(GREEN)Coverage report generated!$(NC)"

# Watch mode for tests
test-watch:
	@echo "$(GREEN)Running tests in watch mode...$(NC)"
	@echo "$(YELLOW)Watching for file changes...$(NC)"
	cd contracts && forge test --watch

# Run specific test
test-contract:
	@echo "$(YELLOW)Running specific test contract...$(NC)"
	@read -p "Enter test contract name (e.g., IndexFundTest): " contract; \
	cd contracts && forge test --match-contract $$contract -vv

# Run specific test function
test-function:
	@echo "$(YELLOW)Running specific test function...$(NC)"
	@read -p "Enter test function name: " func; \
	cd contracts && forge test --match-test $$func -vvv

# Snapshot gas usage
snapshot:
	@echo "$(YELLOW)Taking gas snapshot...$(NC)"
	cd contracts && forge snapshot
	@echo "$(GREEN)Snapshot saved to .gas-snapshot$(NC)"
