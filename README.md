# Banking API

A simple Node.js banking API that handles user balance updates with high concurrency.

## Features

- RESTful API for updating user balances
- Handles concurrent balance updates safely
- Prevents negative balances
- Optimized for high throughput
- Containerized with Docker

## Technology Stack

- **Node.js** with Express
- **PostgreSQL** for data storage
- **Sequelize ORM** for database access
- **Umzug** for database migrations
- **Docker** and Docker Compose for containerization
- **Redis** for potential future caching needs
- **RabbitMQ** for potential future event-driven architecture
- **Jest** for testing

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

## Setup and Running

### Using Docker (Recommended)

1. Clone the repository
2. Run the setup command to create `.env` file:
   ```
   make setup
   ```
3. Start the application:
   ```
   make run-docker
   ```

The API will be available at http://localhost:3000

### Local Development

1. Clone the repository
2. Create `.env` file:
   ```
   cp .env.example .env
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start PostgreSQL (or configure .env to point to your instance)
5. Run migrations:
   ```
   npm run migrate
   ```
6. Start the server:
   ```
   npm run dev
   ```

## Project Structure

```
banking-api/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Express middlewares
│   ├── migrations/     # Database migrations
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Application entry point
├── tests/              # Test files
└── ... other config files
```

## Available Commands

Use the Makefile for common operations:

- `make setup` - Initialize project (create .env)
- `make run-docker` - Start all services using docker-compose
- `make stop-docker` - Stop all running containers
- `make logs` - View logs from all containers
- `make test` - Run all tests
- `make test-integration` - Run integration tests
- `make test-unit` - Run unit tests
- `make lint` - Run code linting
- `make clean` - Remove volumes and reset state

## API Documentation

### Update User Balance

```
PUT /api/users/:userId/balance
```

**Request Body:**
```json
{
  "amount": 100.50
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": 10100.50,
    "updatedAt": "2025-04-01T12:00:00.000Z"
  },
  "message": "Balance updated successfully"
}
```

**Response (Error - Insufficient Funds):**
```json
{
  "success": false,
  "error": {
    "message": "Insufficient funds",
    "code": 400
  }
}
```

### Get User

```
GET /api/users/:userId
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": 10000,
    "createdAt": "2025-04-01T12:00:00.000Z",
    "updatedAt": "2025-04-01T12:00:00.000Z"
  }
}
```

## Load Testing

The application is designed to handle high concurrency. The requirement was to handle 10,000 concurrent requests to withdraw 2 units from a user balance of 10000, with 5,000 successful and the rest failing due to insufficient funds.

You can simulate this load test using a tool like [autocannon](https://github.com/mcollina/autocannon) or [k6](https://k6.io/).

Example test script with k6:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1000, // Virtual Users
  iterations: 10000,
};

export default function() {
  const url = 'http://localhost:3000/api/users/1/balance';
  const payload = JSON.stringify({
    amount: -2
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.put(url, payload, params);
  
  check(res, {
    'Status is either 200 or 400': (r) => r.status === 200 || r.status === 400,
  });
}
```

## Architecture Decisions

### Optimistic Locking

Instead of using row-level database locks, this application uses optimistic locking for balance updates:

1. Read the current balance
2. Calculate the new balance
3. Update the row only if the current balance matches what was read
4. If the update affects zero rows, it means another transaction modified the balance, so retry

This approach provides better scalability and performance compared to pessimistic locking.

### Direct Updates

Balance changes are processed in real-time without queues or deferred tasks, as required by the specifications. The system handles concurrency through the database transaction system.

## Future Improvements

1. Add authentication and authorization
2. Implement rate limiting
3. Add metrics and monitoring
4. Use Redis for caching frequently accessed data
5. Implement event-driven architecture with RabbitMQ for eventual consistency in a microservices environment
6. Add database connection pooling for better performance under high load

## License

MIT