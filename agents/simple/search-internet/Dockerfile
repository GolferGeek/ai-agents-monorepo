# Use Node.js LTS (Long Term Support) as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 5003
EXPOSE 5003

# Set environment variables
ENV PORT=5003

# Start the application
CMD ["npm", "start"] 