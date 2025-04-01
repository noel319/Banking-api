.PHONY: setup run-docker stop-docker logs test test-integration test-unit lint clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup          - Initialize project (create .env file)"
	@echo "  make run-docker     - Start all services using docker-compose"
	@echo "  make stop-docker    - Stop all running containers"
	@echo "  make logs           - View logs from all containers"
	@echo "  make test           - Run all tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-unit      - Run unit tests"
	@echo "  make lint           - Run code linting"
	@echo "  make clean          - Remove volumes and reset state"

# Setup the project
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from .env.example"; \
	else \
		echo ".env file already exists"; \
	fi

# Start docker services
run-docker:
	docker-compose up -d

# Stop docker services
stop-docker:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Run all tests
test:
	docker-compose exec app npm test

# Run integration tests
test-integration:
	docker-compose exec app npx jest tests/integration

# Run unit tests
test-unit:
	docker-compose exec app npx jest tests/unit

# Run linting
lint:
	docker-compose exec app npm run lint

# Clean up
clean:
	docker-compose down -v
	rm -rf node_modules