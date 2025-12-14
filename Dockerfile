FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy all source files
COPY . .

# Explicitly copy client directory again (Railway caching issue workaround)
COPY client/ ./client/

# Build the client (with explicit working directory changes)
RUN mkdir -p client && cd client && npm install && npm run build && cd ..

# Clean up dev dependencies
RUN npm prune --production && npm cache clean --force

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
