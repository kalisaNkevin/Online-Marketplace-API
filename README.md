# Online Marketplace API

A robust e-commerce platform built with NestJS, featuring real-time order processing, payment integration, and advanced caching.

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

## 🏗 System Architecture

```mermaid
graph TD
    Client[Client Applications] -->|HTTP/REST| API[API Gateway]
    API -->|Auth| Auth[Authentication]
    API -->|Products| PM[Product Management]
    API -->|Orders| OM[Order Management]
    API -->|Users| UM[User Management]
    
    PM -->|Cache| Redis[(Redis Cache)]
    OM -->|Queue| RQ[(Redis Queue)]
    
    PM --> DB[(PostgreSQL)]
    OM --> DB
    UM --> DB
    Auth --> DB
```

## 🗄 Database Schema

[![](https://mermaid.ink/img/pako:eNqtVktz2jAQ_isazeRGMphHAN_S0M4wOZSB5NLhokqL0cSWXFmGEuC_d-UHGExC8-CArf0-rfYtbyjXAqhPwQwlCwyLZorg7ykBQ7bb62u9IVOrDRCf6JVK6uhPI3DhkzhkHM7gE1hKWCFhZaQ9R7hnxiK8YIjlaH5gAY-NFil3DD2fgykU3DMLgTbrOovniHyBvb4SrFo8shAhe0ZZHAMzCZFqRs_SnX0HthAgiNWvcPfOzqgBDnKJRpwwd8jcbg8OOO5vCLUKkkJvzs_j6vRuj03mWlkmy1QcaNXjs2DmcTK2VFJx5KAjp11dke_KSrsmQ5hLJa3UR7ne5O-4ehoNiRRk_FBKptZIFRCImAzJ06k4Zkmy0kaciBWLoBRNdAjE4N8Jx8DcQLJ41M-galAC9gj4plEBU0Qmd9xi2Ev5EMP8KCMg3AC-ijtbQ9JYVJHdcRW-4XkmSTE8I0F-PLzhYSESkHAjYxfbLzBvX0CXc-NsqaemZs7utF8u-Z64CB05n4mLDlyfCwvWWPg_cQEuIxaS2Ei-p4-UJUImXKfKVmVoBn-uFYKaVsWlQrYEwwKYMIsnf0EW8vZ7d5Fk26aW2TRB893j1FCrLQtL4ZitI1C22BBXV7V-y7AJ4KgExeE8jAleSrTgqwKQTZVLQdAZs1YtcV5sR4DL6p-UZRPpbEnc2XFqOE45qHWFse9Px6fasBiqlw7ljvhx7z9uYXEpvDsor9r3Sjad2eaor4qi4zpyRfcpV2iDBkYK6luTQoNGYPC-wSXN3JpRuwCct9RdpgLmLA2tu0l3uC1m6pfWUbnT6DRYUH_OwgRX-UHFl89eip2Dzt27OUN9z-v3Mi3U39C_1L_uNG-aA8_rtrxO-3bQ67YadI20_k3P81rNdq8_aHc7vX5n16Av2cHNm0Gv3-p0e-2ud9vHp7f7B6t07qQ?type=png)](https://mermaid.live/edit#pako:eNqtVktz2jAQ_isazeRGMphHAN_S0M4wOZSB5NLhokqL0cSWXFmGEuC_d-UHGExC8-CArf0-rfYtbyjXAqhPwQwlCwyLZorg7ykBQ7bb62u9IVOrDRCf6JVK6uhPI3DhkzhkHM7gE1hKWCFhZaQ9R7hnxiK8YIjlaH5gAY-NFil3DD2fgykU3DMLgTbrOovniHyBvb4SrFo8shAhe0ZZHAMzCZFqRs_SnX0HthAgiNWvcPfOzqgBDnKJRpwwd8jcbg8OOO5vCLUKkkJvzs_j6vRuj03mWlkmy1QcaNXjs2DmcTK2VFJx5KAjp11dke_KSrsmQ5hLJa3UR7ne5O-4ehoNiRRk_FBKptZIFRCImAzJ06k4Zkmy0kaciBWLoBRNdAjE4N8Jx8DcQLJ41M-galAC9gj4plEBU0Qmd9xi2Ev5EMP8KCMg3AC-ijtbQ9JYVJHdcRW-4XkmSTE8I0F-PLzhYSESkHAjYxfbLzBvX0CXc-NsqaemZs7utF8u-Z64CB05n4mLDlyfCwvWWPg_cQEuIxaS2Ei-p4-UJUImXKfKVmVoBn-uFYKaVsWlQrYEwwKYMIsnf0EW8vZ7d5Fk26aW2TRB893j1FCrLQtL4ZitI1C22BBXV7V-y7AJ4KgExeE8jAleSrTgqwKQTZVLQdAZs1YtcV5sR4DL6p-UZRPpbEnc2XFqOE45qHWFse9Px6fasBiqlw7ljvhx7z9uYXEpvDsor9r3Sjad2eaor4qi4zpyRfcpV2iDBkYK6luTQoNGYPC-wSXN3JpRuwCct9RdpgLmLA2tu0l3uC1m6pfWUbnT6DRYUH_OwgRX-UHFl89eip2Dzt27OUN9z-v3Mi3U39C_1L_uNG-aA8_rtrxO-3bQ67YadI20_k3P81rNdq8_aHc7vX5n16Av2cHNm0Gv3-p0e-2ud9vHp7f7B6t07qQ)

## 🛠 Prerequisites

- Node.js v16 or higher
- PostgreSQL 14+
- Redis 6+
- npm or yarn
- Git

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/online-marketplace-api.git
cd online-marketplace-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

4. **Configure your .env file**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/marketplace"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRATION="1h"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRATION="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"

# PayPack (Payment)
PAYPACK_API_KEY="your-paypack-api-key"
PAYPACK_SECRET_KEY="your-paypack-secret-key"
```

5. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## 🚀 Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Watch mode
npm run start:debug
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 API Documentation

Once running, access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

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
