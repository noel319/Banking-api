# Banking API (Optimized Version)

A high-performance Node.js banking API that handles user balance updates with high concurrency using Redis caching and RabbitMQ for event-driven architecture.

## Features

- RESTful API for updating user balances
- Handles concurrent balance updates safely
- Prevents negative balances
- Redis caching for high performance
- RabbitMQ for event-driven architecture
- Audit logging and notifications
- Containerized with Docker

## Technology Stack

- **Node.js** with Express
- **PostgreSQL** for data storage
- **Sequelize ORM** for database access
- **Redis** for caching
- **RabbitMQ** for message queuing
- **Umzug** for database migrations
- **Docker** and Docker Compose for containerization
- **Jest** for testing

## Architecture Overview

![Architecture Diagram](https://via.placeholder.com/800x500.png?text=Banking+API+Architecture)

### Components

1. **API Server**: Handles HTTP requests and responses
2. **User Service**: Core business logic with database operations
3. **Redis Cache**: Caches user data to reduce database load
4. **RabbitMQ**: Message broker for event communication
5. **Notification Worker**: Processes user notifications
6. **Audit Worker**: Logs all system events for compliance

### Workflow

1. Client sends a balance update request
2. API validates the request and forwards it to User Service
3. User Service:
   - Checks Redis cache for user data
   - Performs update operation in database
   - Invalidates Redis cache
   - Publishes events to RabbitMQ
4. Notification Worker processes notification events
5. Audit Worker logs all balance update events
6. API returns the updated balance to the client

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
4. Start PostgreSQL, Redis, and RabbitMQ (or configure .env to point to your instances)
5. Run migrations:
   ```
   npm run migrate
   ```
6. Start the server:
   ```
   npm run dev
   ```
7. Start workers (in separate terminals):
   ```
   npm run start:notification-worker
   npm run start:audit-worker
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
│   │   ├── redis.js    # Redis client
│   │   └── rabbitmq.js # RabbitMQ client
│   ├── workers/        # Background workers
│   │   ├── notificationWorker.js
│   │   └── auditWorker.js
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

## Performance Optimizations

### Redis Caching

- User data is cached in Redis to reduce database load
- Cache invalidation occurs when data is updated
- Configurable TTL for cache entries

### RabbitMQ Message Queue

- Decouples core transaction processing from side effects
- Enables asynchronous processing of notifications and audit logs
- Improves main API response time

### Database Optimizations

- Optimistic locking for balance updates
- Proper indexing on frequently queried fields
- Connection pooling for better performance under high load

## Monitoring and Management

### RabbitMQ Management Interface

The RabbitMQ Management Interface is available at http://localhost:15672 with the following credentials:

- Username: `user`
- Password: `password`

You can use this interface to monitor queues, exchanges, and message rates.

## Future Improvements

1. Add authentication and authorization
2. Implement rate limiting
3. Add metrics and monitoring (Prometheus/Grafana)
4. Implement distributed tracing (OpenTelemetry)
5. Add health checks and circuit breakers
6. Implement database read replicas for scaling

## License

MIT