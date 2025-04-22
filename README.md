# Online Marketplace API 🛍️

[![codecov](https://codecov.io/gh/kalisaNkevin/Online-Marketplace-API/branch/main/graph/badge.svg?token=WXYRQRJ2SD)](https://codecov.io/gh/kalisaNkevin/Online-Marketplace-API)

An advanced e-commerce platform built with NestJS, featuring real-time order processing, secure payments, and Redis caching.

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Development Setup](#-development-setup)
- [Testing Guide](#-testing-guide)
- [Database & Caching](#-database--caching)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Seller, Shopper)
  - Password reset functionality
  - Refresh token mechanism

- **Product Management**
  - CRUD operations
  - Category organization
  - Image upload with cloud storage
  - Search and filtering
  - Caching for improved performance

- **Order Processing**
  - Real-time order updates
  - Redis-based queue system
  - Email notifications
  - Order status tracking

- **Shopping Experience**
  - Cart management
  - Wishlist functionality
  - Product reviews and ratings
  - Payment processing (PayPack integration)

## 🏗 Architecture Overview

This application follows a modular monolithic architecture:

- **Modular Design**: Each feature is a separate module
- **Shared Infrastructure**: Common database and caching
- **Message Queue**: RabbitMQ for async operations
- **Caching Layer**: Redis for performance optimization

### Key Benefits

- Simplified deployment
- Easier maintenance
- Better resource utilization
- Clear upgrade path

## 🏗 System Architecture

```mermaid
graph TD
    Client[Client Apps] -->|HTTP/REST| API[API Gateway]
    API --> Auth[Authentication]
    API --> PM[Product Management]
    API --> OM[Order Management]
    
    OM -->|Publish| RMQ[RabbitMQ]
    RMQ -->|Consume| OrderWorker[Order Worker]
    RMQ -->|Consume| NotificationWorker[Notification Worker]
    RMQ -->|Consume| PaymentWorker[Payment Worker]
    
    subgraph Database
        PM --> DB[(PostgreSQL)]
        OM --> DB
        Auth --> DB
    end
```

## 🗄 Database Schema

![Database Schema](./docs/assets/database-schema.svg)
<img src="docs/assets/database-schema.svg" alt="Database Schema" width="100%">

## 🛠️ Prerequisites

### Required Software

- Node.js v16+ (`brew install node`)
- PostgreSQL 14+ (`brew install postgresql@14`)
- Redis 6+ (`brew install redis`)
- Git (`brew install git`)
- Docker (optional, for containerization)

### Development Tools

- VS Code with extensions:
  - ESLint
  - Prettier
  - REST Client
  - Docker
  - PostgreSQL

## 📥 Installation Guide

1. **System Setup**

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required software
brew install node postgresql@14 redis git
```

2. **Project Setup**

```bash
# Clone repository
git clone https://github.com/kalisaNkevin/Online-Marketplace-API.git
cd Online-Marketplace-API

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

3. **Database Setup**

```bash
# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb marketplace

# Run migrations
npx prisma generate
npx prisma migrate dev
```

4. **Redis Setup**

```bash
# Start Redis
brew services start redis

# Verify Redis is running
redis-cli ping
```

## 💻 Development Setup

### Environment Configuration

```env
# Required Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

# PayPack Integration
PAYPACK_API_KEY=your_api_key
PAYPACK_SECRET_KEY=your_secret_key
```

### Starting Development Server

```bash
# Development mode
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run build
npm run start:prod
```

## 🧪 Testing Guide

### Prerequisites

- All services (PostgreSQL, Redis) must be running
- Test database should be created
- Environment variables properly configured

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Database Setup

```bash
# Create test database
createdb marketplace_test

# Run migrations on test database
NODE_ENV=test npx prisma migrate deploy
```

## 🗄️ Database & Caching

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

### Redis Commands

```bash
# Monitor Redis
redis-cli monitor

# Clear Redis cache
redis-cli FLUSHALL
```

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables
- [ ] Run production builds
- [ ] Configure SSL certificates
- [ ] Setup database backups
- [ ] Configure monitoring

### Docker Deployment

```bash
# Build image
docker build -t marketplace-api .

# Run container
docker run -p 3000:3000 marketplace-api
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**

```bash
# Check PostgreSQL status
brew services list

# Restart PostgreSQL
brew services restart postgresql@14
```

2. **Redis Connection Issues**

```bash
# Check Redis status
brew services list

# Restart Redis
brew services restart redis
```

3. **Port Conflicts**

```bash
# Check ports in use
lsof -i :3000
lsof -i :5432
```

### Logs

- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## 📚 API Documentation

### Swagger UI Access

- Local Development: `http://localhost:3000/api-docs`
- Production: `https://api.jabocollection.com/api-docs`

### Using Swagger UI

1. Open the Swagger UI URL in your browser
2. Click "Authorize" button to authenticate:

   ```json
   {
     "Authorization": "Bearer your_jwt_token"
   }
   ```

3. Expand any endpoint to see:
   - Required parameters
   - Request body schema
   - Response examples
   - Available response codes

### Authentication in Swagger

1. Login using `/auth/login` endpoint
2. Copy the JWT token from the response
3. Click "Authorize" button at the top
4. Paste your token with format: `Bearer your_token_here`
5. All subsequent requests will include authentication

### Key Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token

#### Products

- `GET /products` - List products
- `POST /products` - Create product (Seller/Admin)
- `GET /products/:id` - Get product details
- `PATCH /products/:id` - Update product (Seller/Admin)

#### Orders

- `POST /checkout` - Create order
- `GET /orders` - List user orders
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status (Seller/Admin)

#### Reviews

- `POST /products/:id/reviews` - Create review
- `GET /products/:id/reviews` - Get product reviews
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

## 🔄 Queue Processing

The application uses Redis for queue processing:

1. **Start Redis** (if not running):

```bash
brew services start redis
```

2. **Monitor queues**:

```bash
redis-cli
> MONITOR
```

## 🔍 Monitoring

- API metrics: `http://localhost:3000/metrics`
- Health check: `http://localhost:3000/health`
- Queue dashboard: `http://localhost:3000/queues`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License. See [LICENSE](LICENSE) for more information.

## 👤 Author

Kalisa Ngabo Kevin

- Twitter: [@Kalisakevin_](https://twitter.com/Kalisakevin_)
- LinkedIn: [Kalisa Kevin](https://www.linkedin.com/in/kalisa-ngabo-kevin-6717781b7)
