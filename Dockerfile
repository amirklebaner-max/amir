FROM node:18-alpine
WORKDIR /app

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy server and pre-built React app
COPY server.js ./
COPY build/ ./build/

EXPOSE 3000
CMD ["node", "server.js"]
