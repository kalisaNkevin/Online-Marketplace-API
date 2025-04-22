FROM node:18-alpine

WORKDIR /usr/src/app

# Add Python and build dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose API port
EXPOSE 3000

# Use shell form to allow environment variables to be passed
CMD npm run start:${NODE_ENV:-prod}