# Use Node.js base image
FROM node:18

# Install yt-dlp
RUN apt-get update && apt-get install -y yt-dlp ffmpeg

# Set working directory
WORKDIR /app

# Copy files
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Expose port
EXPOSE 5000

# Run server
CMD ["node", "server.js"]
