# JABO COLLECTION API

A RESTful API backend for Jabo Collection, an e-commerce platform specialized in premium sneaker sales and collection management.

## Features

- 🔐 Authentication & Authorization
- 👟 Product Management
- 📦 Order Processing
- 🛒 Shopping Cart
- ⭐ Rating & Reviews
- 📸 Image Upload
- 💳 Subscription Management
- 📊 Swagger API Documentation

## Tech Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger/OpenAPI

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL

## Installation

```bash
# Install dependencies
$ yarn install

# Set up environment variables
$ cp .env.example .env
```

## Configuration

Create a `.env` file in the root directory and add:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/jabo_collection
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Running the Application

```bash
# Development mode
$ yarn run start

# Watch mode (recommended for development)
$ yarn run start:dev

# Production mode
$ yarn run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

## Testing

```bash
# Unit tests
$ yarn run test

# E2E tests
$ yarn run test:e2e

# Test coverage
$ yarn run test:cov
```

## API Endpoints

### Auth

- POST /auth/login - User login
- POST /auth/register - User registration

### Products

- GET /products - List all products
- POST /products - Create new product (Admin)
- GET /products/:id - Get product details
- PUT /products/:id - Update product (Admin)
- DELETE /products/:id - Delete product (Admin)

### Cart

- GET /cart - View cart
- POST /cart/items - Add item to cart
- DELETE /cart/items/:id - Remove item from cart

### Orders

- GET /orders - List user orders
- POST /orders - Create new order
- GET /orders/:id - Get order details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Stay in Touch

- Author - [Kalisa Ngabo Kevin](https://kalisangabokevin.com)
- LinkedIn - [Kalisa Kevin](https://www.linkedin.com/in/kalisa-ngabo-kevin-6717781b7)
- Twitter - [@Kalisakevin_](https://twitter.com/Kalisakevin_)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
