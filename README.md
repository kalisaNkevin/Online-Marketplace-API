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

[![](https://mermaid.ink/img/pako:eNqtVk1z2jAQ_SsazeRGMoaYAL6loZ1hcigDyaXDRZUW0MSWXFmGEuC_d-UPwJiEkoQDWPueVm-_ZNaUawE0oGD6ks0MiyaK4Oc5AUM2m-trvSZjqw2QgOilSuroTyNwEZA4ZBxO4CNYSFgiYWmkPUV4YMYiPGeI5Wh-YAEPjRYpdww9nYIpHDwwCzNtVnUWzxH5Cjt_JXioeGAhQvaEsjgGZhIi1YSepDt9e7YQIIjVb3B3wU6oAQ5ygSKOmFtkbjb7ABz3N4RazZLCb87P8-r8bqqSuVaWybIUe9rh8Vky8zwZWzo5CGTvI6ddXZHvykq7In2YSiWt1JVar_NnXD0P-kQKMnwsLWNrpJoRiJgMyfOxOWZJstRGHJkVi6A0jXQIxODXEcfA1EAyf9IvoGpQArYCfNPogCkik3tuMe2lvY9pfpIREG4AH8W9rSFpLA6RbbUL34k8s6SYnoEgPx7fibAwCUi4kbHL7RfI2zXQ-do4LfXS1ORsj-flXOyJy1Al-MxcTODqVFqwx8L_yQtwGbGQxEbyHX2gLBEy4TpV9tCGMvhLrRHU-NBcOmQLMGwGI2bx5C-oQj5-FzdJtm1smU0TlO9-joVabVlYGodsFYGyxYb4cFWbtwwbAV6VoDichrHAC4kKvioB2a1yLgk6Y9a6Jc6brQK4qv5JWXYjnWyJeztMDcdbDmpTYezl5fjUGBaX6rlDuSN-PPqPKyxeChcn5U19b1TTyTaVuSqajuvINd2nQqENOjNS0MCaFBo0AoPvG1zSLKwJtXPA-5a6l6mAKUtD696kW9wWM_VL66jcaXQ6m9NgysIEV_lBxT-fHQUUxvbgrhka9Pxu5oMGa_qXBs1u66Z563m9ZufWa3W7Pb9BVzTwbprtXqvT9u46nt_2mu1ua9ugr9m53k3Pv-v5Hd-_85t-C7HtP7zh7lg?type=png)](https://mermaid.live/edit#pako:eNqtVk1z2jAQ_SsazeRGMoaYAL6loZ1hcigDyaXDRZUW0MSWXFmGEuC_d-UPwJiEkoQDWPueVm-_ZNaUawE0oGD6ks0MiyaK4Oc5AUM2m-trvSZjqw2QgOilSuroTyNwEZA4ZBxO4CNYSFgiYWmkPUV4YMYiPGeI5Wh-YAEPjRYpdww9nYIpHDwwCzNtVnUWzxH5Cjt_JXioeGAhQvaEsjgGZhIi1YSepDt9e7YQIIjVb3B3wU6oAQ5ygSKOmFtkbjb7ABz3N4RazZLCb87P8-r8bqqSuVaWybIUe9rh8Vky8zwZWzo5CGTvI6ddXZHvykq7In2YSiWt1JVar_NnXD0P-kQKMnwsLWNrpJoRiJgMyfOxOWZJstRGHJkVi6A0jXQIxODXEcfA1EAyf9IvoGpQArYCfNPogCkik3tuMe2lvY9pfpIREG4AH8W9rSFpLA6RbbUL34k8s6SYnoEgPx7fibAwCUi4kbHL7RfI2zXQ-do4LfXS1ORsj-flXOyJy1Al-MxcTODqVFqwx8L_yQtwGbGQxEbyHX2gLBEy4TpV9tCGMvhLrRHU-NBcOmQLMGwGI2bx5C-oQj5-FzdJtm1smU0TlO9-joVabVlYGodsFYGyxYb4cFWbtwwbAV6VoDichrHAC4kKvioB2a1yLgk6Y9a6Jc6brQK4qv5JWXYjnWyJeztMDcdbDmpTYezl5fjUGBaX6rlDuSN-PPqPKyxeChcn5U19b1TTyTaVuSqajuvINd2nQqENOjNS0MCaFBo0AoPvG1zSLKwJtXPA-5a6l6mAKUtD696kW9wWM_VL66jcaXQ6m9NgysIEV_lBxT-fHQUUxvbgrhka9Pxu5oMGa_qXBs1u66Z563m9ZufWa3W7Pb9BVzTwbprtXqvT9u46nt_2mu1ua9ugr9m53k3Pv-v5Hd-_85t-C7HtP7zh7lg)

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
