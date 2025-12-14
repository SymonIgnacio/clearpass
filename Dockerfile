FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code (including client for building)
COPY . .

# Install dependencies with dev dependencies for building
RUN npm ci

# Build the client
RUN npm run build --prefix client

# Remove dev dependencies
RUN npm prune --production

# Clean cache
RUN npm cache clean --force

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
