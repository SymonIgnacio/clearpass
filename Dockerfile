FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install root dependencies first
COPY package*.json ./
RUN npm install

# Copy client directory contents
COPY client/ ./client/

# Build the client
WORKDIR /app/client
RUN npm install && npm run build

# Go back to root directory
WORKDIR /app

# Remove dev dependencies and clean up
RUN npm prune --production && npm cache clean --force

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
