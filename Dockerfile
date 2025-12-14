FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything first
COPY . .

# Install root dependencies
RUN npm install

# Build the client
RUN cd client && npm install && npm run build

# Clean up dev dependencies
RUN npm prune --production && npm cache clean --force

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
