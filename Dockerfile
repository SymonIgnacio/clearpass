FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the client
RUN npm run build --prefix client

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built client from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy server source code
COPY server/ ./server/

# Copy other necessary files
COPY ai_service/ ./ai_service/
COPY database/ ./database/
COPY .env* ./
COPY *.js ./
COPY *.json ./
COPY *.md ./

# Create necessary directories
RUN mkdir -p uploads server/uploads server/templates

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server/index.js"]
